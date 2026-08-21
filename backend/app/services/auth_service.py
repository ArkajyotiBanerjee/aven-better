import os
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Dict, Any
import httpx
from fastapi import HTTPException

from app.services.db_service import DatabaseService
from app.models.user import UserProfile

class AuthService:
    _instance: Optional["AuthService"] = None

    @classmethod
    def get_instance(cls) -> "AuthService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.db = DatabaseService.get_instance()
        self.client_id = self._load_client_id()

    def _load_client_id(self) -> Optional[str]:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if client_id:
            return client_id.strip()

        # Fallback to root .env
        root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
        if root_env.exists():
            try:
                with open(root_env, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            if k.strip() == "GOOGLE_CLIENT_ID":
                                return v.strip().strip('"').strip("'")
            except Exception:
                pass
        return None

    async def verify_google_credential(self, credential: str) -> Dict[str, Any]:
        """
        Verify Google ID token via Google's OAuth2 tokeninfo endpoint.
        """
        if not credential:
            raise HTTPException(status_code=400, detail="Missing Google credential")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": credential}
                )
        except Exception as e:
            print(f"Error contacting Google tokeninfo endpoint: {e}")
            raise HTTPException(status_code=502, detail="Failed to reach Google token verification service")

        if res.status_code != 200:
            error_data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
            detail_msg = error_data.get("error_description", "Invalid or expired Google credential")
            raise HTTPException(status_code=401, detail=f"Google authentication failed: {detail_msg}")

        payload = res.json()

        # Validate audience if client ID is configured
        client_id = self._load_client_id()
        if client_id:
            aud = payload.get("aud")
            if aud != client_id:
                print(f"Warning: Token aud '{aud}' does not match configured client_id '{client_id}'")
                # If they don't match, raise unauthorized
                raise HTTPException(status_code=401, detail="Google token audience mismatch")

        # Validate issuer
        iss = payload.get("iss", "")
        if iss not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(status_code=401, detail="Invalid token issuer")

        return payload

    def upsert_user(self, google_id: str, email: str, name: str, picture: Optional[str]) -> UserProfile:
        now_iso = datetime.now(timezone.utc).isoformat()
        with self.db.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE google_id = ?", (google_id,))
            row = cursor.fetchone()

            if row:
                user_id = row["id"]
                cursor.execute(
                    "UPDATE users SET email = ?, name = ?, picture = ?, updated_at = ? WHERE id = ?",
                    (email, name, picture, now_iso, user_id)
                )
                created_at = row["created_at"]
            else:
                user_id = f"usr_{uuid.uuid4().hex[:12]}"
                cursor.execute(
                    "INSERT INTO users (id, google_id, email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (user_id, google_id, email, name, picture, now_iso, now_iso)
                )
                created_at = now_iso

        return UserProfile(
            id=user_id,
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
            created_at=created_at,
            updated_at=now_iso
        )

    def create_session(self, user_id: str, days: int = 30) -> str:
        token = secrets.token_hex(32)
        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(days=days)).isoformat()
        now_iso = now.isoformat()

        with self.db.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO user_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                (token, user_id, now_iso, expires_at)
            )

        return token

    def get_user_by_session(self, token: Optional[str]) -> Optional[UserProfile]:
        if not token:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        with self.db.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.* FROM users u
                INNER JOIN user_sessions s ON u.id = s.user_id
                WHERE s.token = ? AND s.expires_at > ?
            """, (token, now_iso))
            row = cursor.fetchone()

            if not row:
                return None

            return UserProfile(
                id=row["id"],
                google_id=row["google_id"],
                email=row["email"],
                name=row["name"],
                picture=row["picture"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )

    def delete_session(self, token: Optional[str]):
        if not token:
            return
        with self.db.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
