from fastapi import APIRouter, Depends, HTTPException, Request, File, UploadFile, Form
from typing import Optional

from app.models.interview import (
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    SavedInterviewSummary,
    ExtractResumeContextResponse,
)
from app.models.user import UserProfile
from app.services.interview_service import InterviewService
from app.api.auth import get_current_user_optional

router = APIRouter()

@router.post("/extract-context", response_model=ExtractResumeContextResponse)
async def extract_resume_context(
    resume: UploadFile = File(..., description="Candidate PDF resume for interview grounding"),
    targeted_role: Optional[str] = Form(None, description="Optional targeted career role")
):
    """
    Extracts structured technical context and project evidence from a candidate's
    resume to ground the AI Interview session.
    """
    if not resume or not resume.filename:
        raise HTTPException(
            status_code=400,
            detail="A valid PDF resume is required."
        )

    filename_lower = resume.filename.lower()
    if not filename_lower.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF document (.pdf)."
        )

    content_type = (resume.content_type or "").lower()
    if content_type and "pdf" not in content_type and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=400,
            detail="Invalid content type. Uploaded file must be a PDF document."
        )

    file_bytes = await resume.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF file is empty."
        )

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="PDF file size exceeds maximum limit of 10MB."
        )

    service = InterviewService.get_instance()
    extracted_context = service.extract_resume_interview_context(file_bytes, targeted_role)

    return ExtractResumeContextResponse(
        filename=resume.filename,
        resume_context=extracted_context,
        targeted_role=targeted_role.strip() if targeted_role else None,
        character_count=len(extracted_context)
    )

@router.post("/start", response_model=StartInterviewResponse)
def start_interview(body: StartInterviewRequest):
    """
    Initializes a new structured 5-round technical interview session
    and generates the Round 1 question tailored to topic, difficulty, target role, and resume evidence.
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
