from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional

from app.models.interview import (
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    SavedInterviewSummary,
)
from app.models.user import UserProfile
from app.services.interview_service import InterviewService
from app.api.auth import get_current_user_optional

router = APIRouter()

@router.post("/start", response_model=StartInterviewResponse)
def start_interview(body: StartInterviewRequest):
    """
    Initializes a new structured 5-round technical interview session
    and generates the Round 1 question tailored to topic and difficulty.
    """
    service = InterviewService.get_instance()
    return service.start_interview(body)

@router.post("/answer", response_model=SubmitAnswerResponse)
def submit_interview_answer(
    body: SubmitAnswerRequest,
    user: Optional[UserProfile] = Depends(get_current_user_optional),
):
    """
    Evaluates candidate's answer for the current round and adaptively generates
    either the next question (rounds 1-4) or the comprehensive final report (round 5).
    """
    if not body.answer_text or not body.answer_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer text cannot be empty"
        )

    service = InterviewService.get_instance()
    user_id = user.id if user else None
    return service.evaluate_and_next(body, user_id=user_id)

@router.get("/latest", response_model=Optional[SavedInterviewSummary])
def get_latest_interview(user: Optional[UserProfile] = Depends(get_current_user_optional)):
    """
    Retrieves the most recent saved interview evaluation for the authenticated user.
    Returns None for anonymous visitors without raising errors.
    """
    if not user:
        return None
    service = InterviewService.get_instance()
    return service.get_latest_interview(user.id)
