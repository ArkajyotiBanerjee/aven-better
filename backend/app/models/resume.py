from typing import List, Optional
from pydantic import BaseModel, Field

class OverallAssessment(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall resume readiness or role alignment score from 0 to 100")
    summary: str = Field(..., description="Concise executive summary of resume readiness and evidence")

class RoleAlignment(BaseModel):
    strengths: List[str] = Field(default_factory=list, description="Demonstrated competencies strongly aligned with target role")
    missing_or_weak: List[str] = Field(default_factory=list, description="Core role requirements with missing or weak evidence")
    analysis: str = Field(..., description="Insightful synthesis of how well the resume supports the targeted direction")

class SkillsBreakdown(BaseModel):
    strong: List[str] = Field(default_factory=list, description="Skills backed by clear, demonstrable project/work evidence")
    moderate: List[str] = Field(default_factory=list, description="Skills mentioned with basic or partial evidence")
    missing_or_unclear: List[str] = Field(default_factory=list, description="Key skills that are only claimed without evidence or absent")

class ExperienceAndEvidence(BaseModel):
    strong_evidence: List[str] = Field(default_factory=list, description="Specific accomplishments with concrete technical details or metrics")
    weak_or_generic: List[str] = Field(default_factory=list, description="Generic claims lacking technical depth or measurable outcomes")
    missing_evidence: List[str] = Field(default_factory=list, description="Areas where experience is asserted but lacking demonstrable evidence")

class ProjectsBreakdown(BaseModel):
    strong: List[str] = Field(default_factory=list, description="Projects with clear technical complexity, architecture, or outcomes")
    needs_improvement: List[str] = Field(default_factory=list, description="Projects described vaguely or without clear technical ownership")

class ResumeQualityMetrics(BaseModel):
    clarity: int = Field(..., ge=0, le=100, description="Readability, structure, and communication clarity score")
    specificity: int = Field(..., ge=0, le=100, description="Depth of concrete technical specifics vs buzzwords")
    impact: int = Field(..., ge=0, le=100, description="Quantified results, scale, or business/engineering outcomes")
    technical_evidence: int = Field(..., ge=0, le=100, description="Ratio of verified evidence to unbacked claims")

class PriorityGap(BaseModel):
    priority: int = Field(..., description="Priority ranking (1, 2, 3, etc.)")
    gap: str = Field(..., description="Specific gap identified in evidence, skills, or projects")
    why_it_matters: str = Field(..., description="Why this gap hinders hiring decisions or role readiness")
    recommended_action: str = Field(..., description="Concrete, actionable step to bridge this gap")

class ActionItem(BaseModel):
    priority: int = Field(..., description="Action priority order")
    action: str = Field(..., description="Specific resume or preparation action to take")
    reason: str = Field(..., description="Rationale for why this action maximizes hiring impact")

class ResumeAnalysis(BaseModel):
    overall_assessment: OverallAssessment
    targeted_role: Optional[str] = None
    role_alignment: RoleAlignment
    skills: SkillsBreakdown
    experience_and_evidence: ExperienceAndEvidence
    projects: ProjectsBreakdown
    resume_quality: ResumeQualityMetrics
    priority_gaps: List[PriorityGap] = Field(default_factory=list)
    action_plan: List[ActionItem] = Field(default_factory=list)
