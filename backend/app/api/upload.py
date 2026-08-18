from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import uuid
import shutil
from pathlib import Path
from app.services.transcription_service import TranscriptionService
from app.models.transcription import TranscriptionResponse

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
TRANSCRIPTS_DIR = BASE_DIR / "data" / "transcripts"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_FORMATS = [".mp4", ".webm", ".mov"]

@router.post("/upload", response_model=TranscriptionResponse)
def upload_lecture(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No upload file sent")
        
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format. Supported formats: {', '.join(SUPPORTED_FORMATS)}"
        )
        
    lecture_id = str(uuid.uuid4())
    safe_filename = f"{lecture_id}{ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")
        
    try:
        # Transcribe
        service = TranscriptionService.get_instance()
        segments, language = service.transcribe(str(file_path))
        
        response = TranscriptionResponse(
            lecture_id=lecture_id,
            filename=file.filename or safe_filename,
            language=language,
            segments=segments
        )

        # Persist structured transcript JSON
        transcript_path = TRANSCRIPTS_DIR / f"{lecture_id}.json"
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(response.model_dump_json(indent=2))

        return response
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")

