from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LearnerProfile(BaseModel):
    name: str = Field(default="Alex Mercer", description="Learner full name")
    track: str = Field(default="Physics & STEM Foundation", description="Career or educational track")
    total_lectures: int = Field(default=0, description="Total lectures available or uploaded")
    completed_lectures: int = Field(default=0, description="Total lectures assessed or completed")
    total_study_time_minutes: int = Field(default=0, description="Estimated total study time in minutes")

class ReadinessDimension(BaseModel):
    name: str = Field(description="Skill or competency dimension name")
    score: float = Field(description="Score percentage between 0 and 100")
    grade: str = Field(description="Letter grade, e.g. A, B+, C")
    status: str = Field(description="Descriptive status, e.g. Mastered, Proficient, Needs Practice, Emerging")

class ReadinessSummary(BaseModel):
    overall_score: float = Field(description="Overall career/learning readiness score (0-100)")
    status: str = Field(description="Readiness band, e.g. Career Ready, Proficient, Developing, Foundation Stage")
    trend: str = Field(default="+12% this week", description="Performance trend summary")
    dimensions: List[ReadinessDimension] = Field(default_factory=list, description="Dimensional breakdown")

class ActiveGap(BaseModel):
    gap_id: str = Field(description="Unique learning gap identifier")
    lecture_id: str = Field(description="Associated lecture ID")
    lecture_title: str = Field(description="Human-readable lecture title")
    concept: str = Field(description="Concept name")
    skill: str = Field(description="Skill domain, e.g. application, recall, comprehension")
    severity: str = Field(description="Severity level: mild, moderate, significant")
    diagnosis: str = Field(description="Constructive diagnosis message")
    evidence: str = Field(description="Grounded assessment evidence")
    remediation_available: bool = Field(default=True, description="Whether targeted remediation mini-lesson is ready")

class Mission(BaseModel):
    id: str = Field(description="Unique mission identifier")
    title: str = Field(description="Mission action title")
    description: str = Field(description="Actionable goal description")
    xp_reward: int = Field(default=100, description="XP reward points upon completion")
    completed: bool = Field(default=False, description="Whether mission is completed")
    action_type: str = Field(default="open_remediation", description="Route action type, e.g. open_remediation, open_quiz, open_mode")
    lecture_id: Optional[str] = Field(default=None, description="Optional target lecture ID")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Optional extra action metadata")

class Achievement(BaseModel):
    id: str = Field(description="Unique achievement identifier")
    title: str = Field(description="Achievement badge title")
    description: str = Field(description="Badge unlock criteria description")
    icon: str = Field(default="Trophy", description="Lucide icon identifier, e.g. Trophy, Target, Brain, Award, Compass")
    unlocked: bool = Field(default=False, description="Whether badge is unlocked")
    progress_pct: int = Field(default=0, description="Progress percentage towards unlocking (0-100)")

class RecentActivity(BaseModel):
    lecture_id: str = Field(description="Associated lecture ID")
    title: str = Field(description="Lecture title")
    last_score: float = Field(description="Score percentage on most recent assessment")
    status: str = Field(description="Study status, e.g. Completed, Remediation In Progress, Assessment Pending")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp of activity")

class DashboardOverviewResponse(BaseModel):
    profile: LearnerProfile
    readiness: ReadinessSummary
    active_gaps: List[ActiveGap] = Field(default_factory=list)
    missions: List[Mission] = Field(default_factory=list)
    achievements: List[Achievement] = Field(default_factory=list)
    recent_activity: List[RecentActivity] = Field(default_factory=list)
