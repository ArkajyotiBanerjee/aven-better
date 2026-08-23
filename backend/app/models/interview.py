from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InterviewTopicOption(BaseModel):
    id: str
    title: str
    description: str

class StartInterviewRequest(BaseModel):
    topic: str = Field(default="Data Structures & Algorithms", description="Selected technical topic")
    difficulty: str = Field(default="Intermediate", description="Selected difficulty: Foundational, Intermediate, Advanced")
    targeted_role: Optional[str] = Field(default=None, description="Optional targeted career role, e.g. Software Development Engineer")
    resume_context: Optional[str] = Field(default=None, description="Extracted technical summary / project evidence from candidate resume")

class ExtractResumeContextResponse(BaseModel):
    filename: str
    resume_context: str
    targeted_role: Optional[str] = None
    character_count: int

class InterviewQuestion(BaseModel):
    question_id: str = Field(description="Unique question identifier")
    round_number: int = Field(description="Current round (1 to 5)")
    total_rounds: int = Field(default=5, description="Total rounds in interview")
    topic: str = Field(description="Technical topic")
    difficulty: str = Field(description="Difficulty level")
    question_text: str = Field(description="Technical interviewer question text")
    question_type: str = Field(default="conceptual", description="conceptual | application | followup | tradeoff | systematic")

class StartInterviewResponse(BaseModel):
    session_id: str
    topic: str
    difficulty: str
    initial_question: InterviewQuestion
    targeted_role: Optional[str] = None

class InterviewRoundEvaluation(BaseModel):
    correctness: float = Field(ge=0, le=100, description="Correctness score percentage")
    depth: float = Field(ge=0, le=100, description="Technical depth percentage")
    clarity: float = Field(ge=0, le=100, description="Communication clarity percentage")
    reasoning: float = Field(ge=0, le=100, description="Reasoning and problem solving percentage")
    assessment: str = Field(description="Short constructive explanation of the learner's response")
    strengths: List[str] = Field(default_factory=list, description="Key strengths identified in this response")
    gaps: List[str] = Field(default_factory=list, description="Specific gaps or missed nuances in this response")

class ConversationTurn(BaseModel):
    round_number: int
    question: str
    answer: str
    assessment: Optional[str] = None
    strengths: Optional[List[str]] = None
    gaps: Optional[List[str]] = None

class SubmitAnswerRequest(BaseModel):
    session_id: str
    topic: str
    difficulty: str
    current_round: int
    question_text: str
    answer_text: str
    history: List[ConversationTurn] = Field(default_factory=list, description="Previous completed rounds")
    targeted_role: Optional[str] = Field(default=None, description="Optional targeted career role")
    resume_context: Optional[str] = Field(default=None, description="Optional extracted resume context")

class FinalInterviewReport(BaseModel):
    overall_score: float = Field(ge=0, le=100, description="Overall interview readiness percentage")
    technical_understanding: float = Field(ge=0, le=100, description="Technical concept grasp")
    problem_solving: float = Field(ge=0, le=100, description="Algorithmic problem solving and edge-case handling")
    communication: float = Field(ge=0, le=100, description="Communication precision and structure")
    reasoning_depth: float = Field(ge=0, le=100, description="Depth of technical rationale")
    summary: str = Field(description="Executive summary of the candidate's interview performance")
    strengths: List[str] = Field(default_factory=list, description="What held up well")
    gaps: List[str] = Field(default_factory=list, description="Where to improve")
    recommendations: List[str] = Field(default_factory=list, description="Targeted next practice recommendations")
    saved_to_profile: bool = Field(default=False, description="Whether saved to authenticated user profile")

class SubmitAnswerResponse(BaseModel):
    session_id: str
    round_number: int
    evaluation: InterviewRoundEvaluation
    is_final_round: bool
    next_question: Optional[InterviewQuestion] = None
    final_report: Optional[FinalInterviewReport] = None

class SavedInterviewSummary(BaseModel):
    id: str
    topic: str
    difficulty: str
    overall_score: float
    rounds_count: int
    created_at: str
    final_report: Optional[FinalInterviewReport] = None
