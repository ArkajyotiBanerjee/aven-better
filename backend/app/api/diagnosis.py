import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.models.structured_lecture import StructuredLecture
from app.models.quiz import QuizEvaluationResponse
from app.models.diagnosis import (
    DiagnosisResponse,
    RemediationSubmissionRequest,
    RemediationSubmissionResponse
)
from app.services.diagnosis_service import DiagnosisService

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXTRACTED_DIR = BASE_DIR / "data" / "extracted"
DIAGNOSES_DIR = BASE_DIR / "data" / "diagnoses"

DIAGNOSES_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/{lecture_id}/diagnose", response_model=DiagnosisResponse)
def diagnose_student_performance(lecture_id: str, evaluation: QuizEvaluationResponse):
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
        print(f"Error loading lecture for diagnosis: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load structured lecture for diagnosis"
        )

    service = DiagnosisService.get_instance()
    diagnosis_response = service.diagnose_and_remediate(lecture_data, evaluation)

    # Persist diagnosis JSON
    cached_diag_file = DIAGNOSES_DIR / f"{lecture_id}.json"
    try:
        with open(cached_diag_file, "w", encoding="utf-8") as f:
            f.write(diagnosis_response.model_dump_json(indent=2))
    except Exception as e:
        print(f"Warning: Failed to save diagnosis JSON for {lecture_id}: {e}")

    return diagnosis_response

@router.post("/{lecture_id}/remediation/submit", response_model=RemediationSubmissionResponse)
def submit_remediation_answer(lecture_id: str, submission: RemediationSubmissionRequest):
    diag_file = DIAGNOSES_DIR / f"{lecture_id}.json"
    if not diag_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Diagnosis data for lecture '{lecture_id}' not found. Please run diagnosis first."
        )

    try:
        with open(diag_file, "r", encoding="utf-8") as f:
            diag_raw = json.load(f)
        diagnosis = DiagnosisResponse.model_validate(diag_raw)
    except Exception as e:
        print(f"Error loading diagnosis data: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load diagnosis data for remediation submission"
        )

    if not diagnosis.remediation:
        return RemediationSubmissionResponse(
            is_correct=True,
            feedback="Mastery already achieved. Excellent job!",
            next_step="completed",
            next_question=None
        )

    rem = diagnosis.remediation
    target_q = rem.harder_practice_question if submission.is_harder_tier and rem.harder_practice_question else rem.practice_question

    is_correct = (submission.selected_answer.strip() == target_q.correct_answer.strip())

    if is_correct:
        if not submission.is_harder_tier and rem.harder_practice_question:
            # Advance to harder follow-up problem
            return RemediationSubmissionResponse(
                is_correct=True,
                feedback=rem.feedback_if_correct,
                next_step="advance",
                next_question=rem.harder_practice_question
            )
        else:
            return RemediationSubmissionResponse(
                is_correct=True,
                feedback=rem.feedback_if_correct,
                next_step="completed",
                next_question=None
            )
    else:
        return RemediationSubmissionResponse(
            is_correct=False,
            feedback=f"{rem.feedback_if_incorrect} (Explanation: {target_q.explanation})",
            next_step="support",
            next_question=None
        )
