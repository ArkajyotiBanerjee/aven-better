from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class Question(BaseModel):
    id: str = Field(description="Unique question identifier, e.g. q1, q2")
    question: str = Field(description="The question prompt")
    type: Literal["concept", "application", "definition", "formula"] = Field(
        default="concept",
        description="The type of question"
    )
    options: List[str] = Field(description="List of 4 multiple-choice options")
    correct_answer: str = Field(description="The exact text of the correct option")
    explanation: str = Field(description="Educational explanation for why this answer is correct grounded in lecture")
    concept: str = Field(description="The specific concept being tested, e.g. 'Newton's Second Law'")
    skill: Literal["recall", "comprehension", "application"] = Field(
        default="comprehension",
        description="The cognitive skill level tested"
    )
    difficulty: Literal["easy", "medium", "hard"] = Field(
        default="medium",
        description="Difficulty level of the question"
    )
    source_timestamp: Optional[float] = Field(
        default=None,
        description="Timestamp in seconds where the concept/example appears in the lecture"
    )

class Quiz(BaseModel):
    lecture_id: str
    questions: List[Question] = Field(default_factory=list)

class AnswerSubmission(BaseModel):
    question_id: str
    selected_answer: str

class QuizSubmissionRequest(BaseModel):
    answers: List[AnswerSubmission]

class QuestionEvaluation(BaseModel):
    question_id: str
    question: str
    is_correct: bool
    selected_answer: str
    correct_answer: str
    concept: str
    skill: str
    difficulty: str
    explanation: str

class QuizEvaluationResponse(BaseModel):
    lecture_id: str
    total_score: int
    total_questions: int
    percentage: float
    results: List[QuestionEvaluation]
