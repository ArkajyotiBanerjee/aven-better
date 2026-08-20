from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class SkillBreakdown(BaseModel):
    skill: str = Field(description="Cognitive skill name, e.g. recall, comprehension, application")
    attempted: int = Field(description="Number of questions attempted in this skill")
    correct: int = Field(description="Number of questions answered correctly")
    accuracy: float = Field(description="Accuracy percentage for this skill (0.0 to 100.0)")

class ConceptBreakdown(BaseModel):
    concept: str = Field(description="Concept name")
    attempted: int = Field(description="Number of questions attempted")
    correct: int = Field(description="Number of questions answered correctly")
    accuracy: float = Field(description="Accuracy percentage (0.0 to 100.0)")

class LearningGap(BaseModel):
    concept: str = Field(description="Concept related to the gap")
    skill: str = Field(description="Specific skill needing practice, e.g. application")
    severity: Literal["mild", "moderate", "significant"] = Field(
        default="moderate",
        description="Estimated severity of the learning gap"
    )
    evidence: str = Field(description="Grounding evidence from quiz performance")
    diagnosis: str = Field(description="Constructive, supportive diagnosis statement")

class PracticeQuestion(BaseModel):
    id: str = Field(description="Unique practice question identifier")
    question: str = Field(description="Practice question prompt")
    options: List[str] = Field(description="4 multiple-choice options")
    correct_answer: str = Field(description="Exact string of correct option")
    explanation: str = Field(description="Educational solution explanation")
    difficulty: Literal["easy", "medium", "hard"] = Field(default="easy")

class Remediation(BaseModel):
    concept: str = Field(description="Concept being remediated")
    skill: str = Field(description="Skill being strengthened, e.g. application")
    title: str = Field(description="Short title for mini-lesson, e.g. 'Mastering Acceleration Calculations'")
    explanation: str = Field(description="Concise 30-60 second educational refresher")
    example: str = Field(description="Step-by-step worked example")
    practice_question: PracticeQuestion = Field(description="Targeted follow-up problem")
    harder_practice_question: Optional[PracticeQuestion] = Field(
        default=None,
        description="Optional follow-up problem of higher difficulty"
    )
    feedback_if_correct: str = Field(
        default="Great job! You applied the relationship accurately.",
        description="Encouraging feedback when student answers correctly"
    )
    feedback_if_incorrect: str = Field(
        default="Almost! Let's check the calculation steps.",
        description="Supportive feedback when student makes a mistake"
    )

class DiagnosisResponse(BaseModel):
    lecture_id: str
    total_score: int
    total_questions: int
    percentage: float
    skill_breakdowns: List[SkillBreakdown] = Field(default_factory=list)
    concept_breakdowns: List[ConceptBreakdown] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    learning_gaps: List[LearningGap] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = Field(default="medium")
    recommended_focus: str = Field(description="Primary suggested area to practice")
    remediation: Optional[Remediation] = Field(
        default=None,
        description="Personalized mini-lesson if learning gap exists"
    )

class RemediationSubmissionRequest(BaseModel):
    question_id: str
    selected_answer: str
    is_harder_tier: bool = False

class RemediationSubmissionResponse(BaseModel):
    is_correct: bool
    feedback: str
    next_step: Literal["advance", "support", "completed"]
    next_question: Optional[PracticeQuestion] = None
