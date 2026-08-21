import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.models.transcription import TranscriptionResponse
from app.models.structured_lecture import StructuredLecture
from app.services.extraction_service import ExtractionService

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TRANSCRIPTS_DIR = BASE_DIR / "data" / "transcripts"
EXTRACTED_DIR = BASE_DIR / "data" / "extracted"

EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/{lecture_id}/extract", response_model=StructuredLecture)
def extract_lecture_content(lecture_id: str):
    extracted_file = EXTRACTED_DIR / f"{lecture_id}.json"
    if extracted_file.exists():
        try:
            with open(extracted_file, "r", encoding="utf-8") as f:
                lecture_raw = json.load(f)
            return StructuredLecture.model_validate(lecture_raw)
        except Exception as e:
            print(f"Warning: Failed to read cached extraction for {lecture_id}: {e}")

    transcript_file = TRANSCRIPTS_DIR / f"{lecture_id}.json"
    
    if not transcript_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Transcript for lecture '{lecture_id}' not found. Please upload and transcribe first."
        )

    try:
        with open(transcript_file, "r", encoding="utf-8") as f:
            transcript_raw = json.load(f)
        transcript_data = TranscriptionResponse.model_validate(transcript_raw)
    except Exception as e:
        print(f"Error loading transcript file for {lecture_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load transcript data for extraction"
        )

    # Perform educational extraction via LLM
    service = ExtractionService.get_instance()
    structured_lecture = service.extract(transcript_data)

    # Persist structured extracted JSON
    extracted_file = EXTRACTED_DIR / f"{lecture_id}.json"
    try:
        with open(extracted_file, "w", encoding="utf-8") as f:
            f.write(structured_lecture.model_dump_json(indent=2))
    except Exception as e:
        print(f"Warning: Failed to save extracted JSON for {lecture_id}: {e}")

    return structured_lecture
