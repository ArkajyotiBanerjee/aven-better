from fastapi import APIRouter, HTTPException, Depends, Request, Response
from typing import Optional

from app.models.user import UserProfile, GoogleAuthRequest, AuthResponse
from app.services.auth_service import AuthService

router = APIRouter()

def get_session_token_from_request(request: Request) -> Optional[str]:
    # 1. Check HTTP-only cookie
    token = request.cookies.get("aven_session")
    if token:
        return token
        
    # 2. Fallback to Authorization Header
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
        
    return None

def get_current_user_optional(request: Request) -> Optional[UserProfile]:
    token = get_session_token_from_request(request)
    if not token:
        return None
    auth_service = AuthService.get_instance()
    return auth_service.get_user_by_session(token)

def get_current_user_required(request: Request) -> UserProfile:
    user = get_current_user_optional(request)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to perform this action"
        )
    return user

@router.post("/google", response_model=AuthResponse)
async def authenticate_google(body: GoogleAuthRequest, response: Response):
    auth_service = AuthService.get_instance()
    
    # 1. Verify credential token with Google
    token_payload = await auth_service.verify_google_credential(body.credential)
    
    google_id = token_payload.get("sub")
    email = token_payload.get("email")
    name = token_payload.get("name", email.split("@")[0] if email else "Learner")
    picture = token_payload.get("picture")
    
    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Incomplete Google user profile")
        
    # 2. Upsert user record
    user = auth_service.upsert_user(
        google_id=google_id,
        email=email,
        name=name,
        picture=picture
    )
    
    # 3. Create persistent session token
    session_token = auth_service.create_session(user.id, days=30)
    
    # 4. Set secure HTTP-only cookie
    response.set_cookie(
        key="aven_session",
        value=session_token,
        max_age=30 * 24 * 60 * 60, # 30 days
        httponly=True,
        samesite="lax",
        secure=False, # Allows local development + ngrok
        path="/"
    )
    
    return AuthResponse(user=user, token=session_token)

@router.get("/me")
def get_current_authenticated_user(user: Optional[UserProfile] = Depends(get_current_user_optional)):
    return {"user": user}

@router.post("/logout")
def logout(request: Request, response: Response):
    token = get_session_token_from_request(request)
    if token:
        auth_service = AuthService.get_instance()
        auth_service.delete_session(token)
        
    response.delete_cookie(key="aven_session", path="/")
    return {"status": "ok", "message": "Signed out successfully"}
