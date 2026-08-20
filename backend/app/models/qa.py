from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionRequest(BaseModel):
    question: str = Field(description="Student's question about the lecture")

class SourceReference(BaseModel):
    section: str = Field(description="Lecture section or insight category")
    timestamp: Optional[float] = Field(default=None, description="Start timestamp in seconds if available")
    text_snippet: Optional[str] = Field(default=None, description="Brief relevant text quote")

class QuestionResponse(BaseModel):
    lecture_id: str
    question: str
    answer: str = Field(description="Grounded, clear, conversational response")
    sources: List[SourceReference] = Field(default_factory=list, description="Grounding source references")
