import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.models.structured_lecture import StructuredLecture
from app.models.qa import QuestionRequest, QuestionResponse
from app.services.qa_service import QAService

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXTRACTED_DIR = BASE_DIR / "data" / "extracted"

@router.post("/{lecture_id}/ask", response_model=QuestionResponse)
def ask_lecture_question(lecture_id: str, payload: QuestionRequest):
    if not payload.question or not payload.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question string cannot be empty."
        )

    extracted_file = EXTRACTED_DIR / f"{lecture_id}.json"
    if not extracted_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Structured lecture data for '{lecture_id}' not found."
        )

    try:
        with open(extracted_file, "r", encoding="utf-8") as f:
            lecture_raw = json.load(f)
        lecture_data = StructuredLecture.model_validate(lecture_raw)
    except Exception as e:
        print(f"Error loading lecture for Q&A: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load structured lecture for Q&A"
        )

    service = QAService.get_instance()
    response = service.answer_question(lecture_data, payload.question.strip())
    return response
