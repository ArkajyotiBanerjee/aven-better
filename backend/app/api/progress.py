from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional

from app.models.user import UserProfile, LearnerProgressModel, LearnerProgressSaveRequest
from app.services.progress_service import ProgressService
from app.api.auth import get_current_user_required

router = APIRouter()

@router.get("", response_model=List[LearnerProgressModel])
def get_all_user_progress(current_user: UserProfile = Depends(get_current_user_required)):
    service = ProgressService.get_instance()
    return service.get_user_progress(current_user.id)

@router.get("/{lecture_id}", response_model=Optional[LearnerProgressModel])
def get_lecture_progress(lecture_id: str, current_user: UserProfile = Depends(get_current_user_required)):
    service = ProgressService.get_instance()
    results = service.get_user_progress(current_user.id, lecture_id)
    return results[0] if results else None

@router.post("", response_model=LearnerProgressModel)
def save_user_progress(body: LearnerProgressSaveRequest, current_user: UserProfile = Depends(get_current_user_required)):
    service = ProgressService.get_instance()
    return service.save_user_progress(current_user.id, body)
