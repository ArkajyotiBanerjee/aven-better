from pydantic import BaseModel
from typing import List, Optional

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str

class TranscriptionResponse(BaseModel):
    lecture_id: str
    filename: str
    language: Optional[str] = None
    segments: List[TranscriptSegment]
