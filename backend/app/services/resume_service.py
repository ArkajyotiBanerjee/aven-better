import os
import io
import json
import re
from pathlib import Path
from typing import Optional, Dict, Any, List
import httpx
from pypdf import PdfReader
from fastapi import HTTPException

from app.models.resume import (
    ResumeAnalysis,
    OverallAssessment,
    RoleAlignment,
    SkillsBreakdown,
    ExperienceAndEvidence,
    ProjectsBreakdown,
    ResumeQualityMetrics,
    PriorityGap,
    ActionItem,
)

class ResumeService:
    _instance: Optional["ResumeService"] = None

    @classmethod
    def get_instance(cls) -> "ResumeService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.primary_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        self.fallback_models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]

    def _load_api_key(self) -> Optional[str]:
        # Check environment first
        key = os.getenv("GROQ_API_KEY")
        if key:
            return key
            
        # Fallback to reading project root .env
        root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
        if root_env.exists():
            try:
                with open(root_env, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            if k.strip() == "GROQ_API_KEY":
                                return v.strip().strip('"').strip("'")
            except Exception:
                pass
        return None

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        if not pdf_bytes or len(pdf_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF file is empty."
            )

        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            pages_text = []
            for page_idx, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            
            combined_text = "\n".join(pages_text).strip()
            
            # Check if readable text is found (at least 30 meaningful characters)
            alpha_chars = sum(1 for c in combined_text if c.isalnum())
            if not combined_text or alpha_chars < 30:
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract readable text from this PDF. Please upload a text-based PDF."
                )

            return combined_text

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse PDF document: {str(e)}"
            )

    def _clean_json_text(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
            text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        return text.strip()

    def _call_groq_json(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        api_key = self._load_api_key()
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY is not configured in server environment"
            )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        models_to_try = [self.primary_model]
        for m in self.fallback_models:
            if m not in models_to_try:
                models_to_try.append(m)

        with httpx.Client(timeout=45.0) as client:
            last_error = None
            for model_candidate in models_to_try:
                payload = {
                    "model": model_candidate,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }

                try:
                    response = client.post(self.api_url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        clean_content = self._clean_json_text(content)
                        return json.loads(clean_content)
                    else:
                        last_error = f"Model {model_candidate} returned status {response.status_code}: {response.text}"
                except Exception as e:
                    last_error = str(e)
                    continue

        raise HTTPException(
            status_code=502,
            detail=f"Failed to communicate with Groq AI model: {last_error}"
        )

    def analyze_resume(self, pdf_bytes: bytes, targeted_role: Optional[str] = None) -> ResumeAnalysis:
        # 1. Extract text from PDF
        resume_text = self.extract_text_from_pdf(pdf_bytes)

        # 2. Validate targeted role
        clean_role = None
        if targeted_role and targeted_role.strip():
            clean_role = targeted_role.strip()
            if len(clean_role) > 120:
                raise HTTPException(
                    status_code=400,
                    detail="Targeted role must be 120 characters or fewer."
                )

        # 3. Construct System Prompt & Instructions
        system_prompt = (
            "You are an elite, objective technical career intelligence analyst for Aven.better. "
            "Your purpose is to deeply evaluate technical resumes based on EVIDENCE vs CLAIM. "
            "You distinguish between superficial buzzwords and demonstrable engineering proof. "
            "You MUST NEVER invent facts, hallucinate technologies/metrics, or fabricate experience not in the resume. "
            "If something is absent, state that it is not demonstrated in the resume. "
            "Output MUST be strict, valid JSON matching the exact schema requested."
        )

        role_instruction = ""
        if clean_role:
            role_instruction = (
                f"TARGETED ROLE SPECIFIED: '{clean_role}'.\n"
                f"1. Evaluate role alignment specifically for '{clean_role}'. Analyze how convincing the resume is for hiring managers for this specific role.\n"
                f"2. Identify specific technologies, architecture patterns, scale, or domain competencies expected for '{clean_role}' that are strong, weak, or missing in the resume.\n"
                f"3. Prioritize gaps and next action steps directly relevant to advancing toward '{clean_role}'.\n"
            )
        else:
            role_instruction = (
                "NO TARGETED ROLE SPECIFIED (General Technical Resume Analysis).\n"
                "1. Evaluate general technical rigor, clarity, project evidence, and engineering communication.\n"
                "2. 'role_alignment.analysis' should synthesize general market readiness across core software/technical patterns.\n"
                "3. Prioritize foundational gaps in project depth, impact quantification, and technical specificity.\n"
            )

        user_prompt = (
            f"{role_instruction}\n"
            "CRITICAL ANALYSIS RULES:\n"
            "- CLAIM vs EVIDENCE: An unbacked claim (e.g. 'Strong in DSA', 'Skilled in React') without code context, architecture details, or metrics is WEAK. Concrete outcomes (e.g. 'Built sliding window rate limiter in Go handling 5k req/sec') are STRONG EVIDENCE.\n"
            "- METRICS (0-100):\n"
            "  * overall_assessment.score: Realistic evaluation score (0-100) reflecting demonstrated evidence and readiness.\n"
            "  * resume_quality.clarity: Structure, formatting, readability (0-100).\n"
            "  * resume_quality.specificity: Deep technical details vs generic descriptions (0-100).\n"
            "  * resume_quality.impact: Measurable engineering/business outcomes (0-100).\n"
            "  * resume_quality.technical_evidence: Ratio of verified proof to unbacked claims (0-100).\n\n"
            "RESUME TEXT:\n"
            "\"\"\"\n"
            f"{resume_text[:12000]}\n"
            "\"\"\"\n\n"
            "Return JSON adhering strictly to this format:\n"
            "{\n"
            '  "overall_assessment": {\n'
            '    "score": 78,\n'
            '    "summary": "Concise 2-3 sentence executive assessment of resume strength and primary bottleneck."\n'
            '  },\n'
            f'  "targeted_role": {json.dumps(clean_role)},\n'
            '  "role_alignment": {\n'
            '    "strengths": ["Demonstrated competency 1 with evidence", "Demonstrated competency 2"],\n'
            '    "missing_or_weak": ["Expected role competency lacking proof 1", "Lacking proof 2"],\n'
            '    "analysis": "Insightful synthesis of role readiness and positioning."\n'
            '  },\n'
            '  "skills": {\n'
            '    "strong": ["Skill backed by clear project context"],\n'
            '    "moderate": ["Skill with basic mention"],\n'
            '    "missing_or_unclear": ["Claimed without evidence or noticeably absent for role"]\n'
            '  },\n'
            '  "experience_and_evidence": {\n'
            '    "strong_evidence": ["Specific accomplishment with concrete tech and outcomes"],\n'
            '    "weak_or_generic": ["Vague claim that needs technical depth"],\n'
            '    "missing_evidence": ["Asserted experience where proof is absent"]\n'
            '  },\n'
            '  "projects": {\n'
            '    "strong": ["Project name/focus with good technical evidence"],\n'
            '    "needs_improvement": ["Project name/focus lacking complexity or clarity"]\n'
            '  },\n'
            '  "resume_quality": {\n'
            '    "clarity": 80,\n'
            '    "specificity": 65,\n'
            '    "impact": 55,\n'
            '    "technical_evidence": 70\n'
            '  },\n'
            '  "priority_gaps": [\n'
            '    {\n'
            '      "priority": 1,\n'
            '      "gap": "Concise description of the #1 gap",\n'
            '      "why_it_matters": "Why recruiters/interviewers penalize this gap",\n'
            '      "recommended_action": "Exact concrete step to fix this on the resume or in preparation"\n'
            '    }\n'
            '  ],\n'
            '  "action_plan": [\n'
            '    {\n'
            '      "priority": 1,\n'
            '      "action": "Immediate tactical resume rewrite or proof-building action",\n'
            '      "reason": "Why this change delivers the highest ROI"\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        raw_json = self._call_groq_json(system_prompt, user_prompt)

        # 4. Validate and construct Pydantic model
        try:
            return ResumeAnalysis.model_validate(raw_json)
        except Exception as e:
            # Fallback reconstruction in case of minor field naming deviation
            try:
                oa = raw_json.get("overall_assessment", {})
                ra = raw_json.get("role_alignment", {})
                sk = raw_json.get("skills", {})
                ee = raw_json.get("experience_and_evidence", {})
                pj = raw_json.get("projects", {})
                rq = raw_json.get("resume_quality", {})
                gaps = raw_json.get("priority_gaps", [])
                plan = raw_json.get("action_plan", [])

                return ResumeAnalysis(
                    overall_assessment=OverallAssessment(
                        score=int(oa.get("score", 70)),
                        summary=str(oa.get("summary", "Resume evaluated."))
                    ),
                    targeted_role=clean_role,
                    role_alignment=RoleAlignment(
                        strengths=list(ra.get("strengths", [])),
                        missing_or_weak=list(ra.get("missing_or_weak", [])),
                        analysis=str(ra.get("analysis", "Role alignment analyzed."))
                    ),
                    skills=SkillsBreakdown(
                        strong=list(sk.get("strong", [])),
                        moderate=list(sk.get("moderate", [])),
                        missing_or_unclear=list(sk.get("missing_or_unclear", []))
                    ),
                    experience_and_evidence=ExperienceAndEvidence(
                        strong_evidence=list(ee.get("strong_evidence", [])),
                        weak_or_generic=list(ee.get("weak_or_generic", [])),
                        missing_evidence=list(ee.get("missing_evidence", []))
                    ),
                    projects=ProjectsBreakdown(
                        strong=list(pj.get("strong", [])),
                        needs_improvement=list(pj.get("needs_improvement", []))
                    ),
                    resume_quality=ResumeQualityMetrics(
                        clarity=int(rq.get("clarity", 70)),
                        specificity=int(rq.get("specificity", 65)),
                        impact=int(rq.get("impact", 60)),
                        technical_evidence=int(rq.get("technical_evidence", 65))
                    ),
                    priority_gaps=[
                        PriorityGap(
                            priority=int(g.get("priority", idx + 1)),
                            gap=str(g.get("gap", "")),
                            why_it_matters=str(g.get("why_it_matters", "")),
                            recommended_action=str(g.get("recommended_action", ""))
                        )
                        for idx, g in enumerate(gaps) if isinstance(g, dict)
                    ],
                    action_plan=[
                        ActionItem(
                            priority=int(p.get("priority", idx + 1)),
                            action=str(p.get("action", "")),
                            reason=str(p.get("reason", ""))
                        )
                        for idx, p in enumerate(plan) if isinstance(p, dict)
                    ]
                )
            except Exception as nested_err:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to parse structured resume analysis from AI provider: {str(e)} | {str(nested_err)}"
                )
