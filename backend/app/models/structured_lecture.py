from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.transcription import TranscriptSegment

class Concept(BaseModel):
    name: str = Field(description="Name of the concept")
    description: str = Field(description="Brief explanation of the concept grounded in the lecture")
    timestamp_start: float = Field(description="Start time in seconds where concept is discussed")
    timestamp_end: float = Field(description="End time in seconds where concept is discussed")
    evidence: str = Field(description="Transcript text supporting this concept")

class Definition(BaseModel):
    concept: str = Field(description="The concept being defined")
    definition: str = Field(description="The formal or working definition provided in the lecture")
    timestamp_start: float = Field(description="Start time in seconds")
    timestamp_end: float = Field(description="End time in seconds")
    evidence: str = Field(description="Transcript text containing the definition")

class Formula(BaseModel):
    name: str = Field(description="Name or title of the formula")
    expression: str = Field(description="Mathematical expression, e.g., F = ma")
    variables: List[str] = Field(default_factory=list, description="Variables in the formula, e.g., ['F', 'm', 'a']")
    timestamp_start: float = Field(description="Start time in seconds")
    timestamp_end: float = Field(description="End time in seconds")
    evidence: str = Field(description="Transcript text referencing the formula")

class Example(BaseModel):
    topic: str = Field(description="Topic or concept the example illustrates")
    description: str = Field(description="Description of the scenario, values, or setup")
    result: str = Field(description="Outcome, calculation, or conclusion of the example")
    timestamp_start: float = Field(description="Start time in seconds")
    timestamp_end: float = Field(description="End time in seconds")
    evidence: str = Field(description="Transcript text of the example")

class ImportantPoint(BaseModel):
    point: str = Field(description="Key teaching point emphasized by instructor")
    importance_reason: str = Field(description="Why this point is significant")
    timestamp_start: float = Field(description="Start time in seconds")
    timestamp_end: float = Field(description="End time in seconds")
    evidence: str = Field(description="Transcript text emphasizing this point")

class Relationship(BaseModel):
    source: str = Field(description="Source concept")
    relationship: str = Field(description="Nature of relationship, e.g., 'determines', 'proportional to', 'applies to'")
    target: str = Field(description="Target concept")
    evidence: str = Field(description="Transcript text supporting this relationship")

class EducationalExtraction(BaseModel):
    concepts: List[Concept] = Field(default_factory=list)
    definitions: List[Definition] = Field(default_factory=list)
    formulas: List[Formula] = Field(default_factory=list)
    examples: List[Example] = Field(default_factory=list)
    important_points: List[ImportantPoint] = Field(default_factory=list)
    relationships: List[Relationship] = Field(default_factory=list)

class StructuredLecture(BaseModel):
    lecture_id: str
    filename: str
    language: Optional[str] = None
    transcript: List[TranscriptSegment] = Field(default_factory=list)
    concepts: List[Concept] = Field(default_factory=list)
    definitions: List[Definition] = Field(default_factory=list)
    formulas: List[Formula] = Field(default_factory=list)
    examples: List[Example] = Field(default_factory=list)
    important_points: List[ImportantPoint] = Field(default_factory=list)
    relationships: List[Relationship] = Field(default_factory=list)
