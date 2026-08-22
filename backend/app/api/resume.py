from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from app.models.resume import ResumeAnalysis
from app.services.resume_service import ResumeService

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit for MVP

@router.post(
    "/analyze",
    response_model=ResumeAnalysis,
    summary="Analyze a PDF resume with optional targeted role"
)
async def analyze_resume(
    resume: UploadFile = File(..., description="PDF resume file to analyze"),
    targeted_role: Optional[str] = Form(None, description="Optional targeted career role, e.g., 'Software Development Engineer'")
) -> ResumeAnalysis:
    # 1. Validate file existence and filename
    if not resume or not resume.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid PDF resume file is required."
        )

    # 2. Validate file extension and MIME type
    filename_lower = resume.filename.lower()
    if not filename_lower.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF (.pdf) documents are supported."
        )

    content_type = (resume.content_type or "").lower()
    if content_type and "pdf" not in content_type and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Uploaded file must be a PDF document."
        )

    # 3. Read file safely in memory with size threshold
    try:
        file_bytes = await resume.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF file is empty."
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PDF file size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )

    # 4. Process and perform AI analysis
    service = ResumeService.get_instance()
    analysis = service.analyze_resume(file_bytes, targeted_role=targeted_role)
    return analysis
