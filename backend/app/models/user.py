from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class UserProfile(BaseModel):
    id: str = Field(description="Unique user ID")
    google_id: str = Field(description="Google subject ID")
    email: str = Field(description="User email address")
    name: str = Field(description="User display name")
    picture: Optional[str] = Field(default=None, description="Profile avatar URL")
    created_at: str = Field(description="ISO creation timestamp")
    updated_at: str = Field(description="ISO update timestamp")

class GoogleAuthRequest(BaseModel):
    credential: str = Field(description="Google ID Token JWT returned by Google Identity Services")

class AuthResponse(BaseModel):
    user: UserProfile
    token: str

class LearnerProgressModel(BaseModel):
    id: str
    user_id: str
    lecture_id: str
    progress_pct: float = 0.0
    latest_quiz_score: Optional[float] = None
    latest_quiz_data: Optional[Dict[str, Any]] = None
    diagnosis_summary: Optional[Dict[str, Any]] = None
    remediation_completed: bool = False
    readiness_score: Optional[float] = None
    updated_at: str

class LearnerProgressSaveRequest(BaseModel):
    lecture_id: str
    progress_pct: Optional[float] = None
    latest_quiz_score: Optional[float] = None
    latest_quiz_data: Optional[Dict[str, Any]] = None
    diagnosis_summary: Optional[Dict[str, Any]] = None
    remediation_completed: Optional[bool] = None
    readiness_score: Optional[float] = None
