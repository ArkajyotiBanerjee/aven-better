import os
import json
import re
import random
from pathlib import Path
from typing import Optional, List, Dict, Tuple
import httpx
from fastapi import HTTPException

from app.models.structured_lecture import StructuredLecture
from app.models.quiz import QuizEvaluationResponse, QuestionEvaluation
from app.models.diagnosis import (
    SkillBreakdown,
    ConceptBreakdown,
    LearningGap,
    PracticeQuestion,
    Remediation,
    DiagnosisResponse
)

class DiagnosisService:
    _instance: Optional["DiagnosisService"] = None

    @classmethod
    def get_instance(cls) -> "DiagnosisService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.primary_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        self.fallback_models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]

    def _load_api_key(self) -> Optional[str]:
        key = os.getenv("GROQ_API_KEY")
        if key:
            return key
            
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

    def _clean_json_text(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
            text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        return text.strip()

    def analyze_performance_deterministically(
        self, evaluation: QuizEvaluationResponse
    ) -> Tuple[List[SkillBreakdown], List[ConceptBreakdown], List[str], List[LearningGap], str]:
        """
        Performs strict arithmetic aggregation and rule-based diagnostic analysis.
        """
        # 1. Group by skill
        skill_stats: Dict[str, Dict[str, int]] = {}
        # 2. Group by concept
        concept_stats: Dict[str, Dict[str, int]] = {}

        for item in evaluation.results:
            skill = (item.skill or "comprehension").lower()
            concept = item.concept or "Core Concept"

            if skill not in skill_stats:
                skill_stats[skill] = {"attempted": 0, "correct": 0}
            skill_stats[skill]["attempted"] += 1
            if item.is_correct:
                skill_stats[skill]["correct"] += 1

            if concept not in concept_stats:
                concept_stats[concept] = {"attempted": 0, "correct": 0}
            concept_stats[concept]["attempted"] += 1
            if item.is_correct:
                concept_stats[concept]["correct"] += 1

        skill_breakdowns = [
            SkillBreakdown(
                skill=s,
                attempted=data["attempted"],
                correct=data["correct"],
                accuracy=round((data["correct"] / data["attempted"] * 100.0), 1) if data["attempted"] > 0 else 0.0
            )
            for s, data in skill_stats.items()
        ]

        concept_breakdowns = [
            ConceptBreakdown(
                concept=c,
                attempted=data["attempted"],
                correct=data["correct"],
                accuracy=round((data["correct"] / data["attempted"] * 100.0), 1) if data["attempted"] > 0 else 0.0
            )
            for c, data in concept_stats.items()
        ]

        # Identify strengths
        strengths: List[str] = []
        for sb in skill_breakdowns:
            if sb.accuracy == 100.0:
                if sb.skill == "recall":
                    strengths.append("Accurate recall of definitions and core principles")
                elif sb.skill == "comprehension":
                    strengths.append("Strong comprehension of formula variables and relationships")
                elif sb.skill == "application":
                    strengths.append("Proficient in calculating and applying formulas to scenarios")

        # Deterministic Gap Identification
        gaps: List[LearningGap] = []
        app_skill = skill_stats.get("application")
        rec_skill = skill_stats.get("recall")
        comp_skill = skill_stats.get("comprehension")

        if evaluation.total_questions < 2:
            confidence = "low"
        else:
            confidence = "high" if evaluation.total_questions >= 4 else "medium"

        # Check: Good Recall/Comprehension but Low Application
        if app_skill and app_skill["attempted"] > 0:
            app_acc = app_skill["correct"] / app_skill["attempted"]
            rec_acc = (rec_skill["correct"] / rec_skill["attempted"]) if rec_skill and rec_skill["attempted"] > 0 else 1.0
            comp_acc = (comp_skill["correct"] / comp_skill["attempted"]) if comp_skill and comp_skill["attempted"] > 0 else 1.0

            if app_acc < 1.0 and (rec_acc >= 0.75 or comp_acc >= 0.75):
                gaps.append(
                    LearningGap(
                        concept="Newton's Second Law",
                        skill="application",
                        severity="moderate" if app_acc > 0 else "significant",
                        evidence=f"Answered {app_skill['attempted'] - app_skill['correct']} of {app_skill['attempted']} application question(s) incorrectly despite strong conceptual grasp.",
                        diagnosis="You appear comfortable with the definitions and formula, but applying the formula to new numerical situations is a great area to practice."
                    )
                )

        # Check: Low Recall
        if rec_skill and rec_skill["attempted"] > 0:
            rec_acc = rec_skill["correct"] / rec_skill["attempted"]
            if rec_acc < 0.7:
                gaps.append(
                    LearningGap(
                        concept="Newton's Second Law",
                        skill="recall",
                        severity="moderate" if rec_acc > 0 else "significant",
                        evidence=f"Answered {rec_skill['attempted'] - rec_skill['correct']} of {rec_skill['attempted']} definition question(s) incorrectly.",
                        diagnosis="Reviewing the foundational definition will build a solid base for complex problems."
                    )
                )

        # Check: Low Comprehension
        if comp_skill and comp_skill["attempted"] > 0:
            comp_acc = comp_skill["correct"] / comp_skill["attempted"]
            if comp_acc < 0.7:
                gaps.append(
                    LearningGap(
                        concept="Newton's Second Law",
                        skill="comprehension",
                        severity="moderate" if comp_acc > 0 else "significant",
                        evidence=f"Answered {comp_skill['attempted'] - comp_skill['correct']} of {comp_skill['attempted']} comprehension question(s) incorrectly.",
                        diagnosis="Strengthening how force, mass, and acceleration influence one another will boost problem-solving clarity."
                    )
                )

        return skill_breakdowns, concept_breakdowns, strengths, gaps, confidence

    def diagnose_and_remediate(
        self,
        lecture_data: StructuredLecture,
        evaluation: QuizEvaluationResponse
    ) -> DiagnosisResponse:
        # 1. Deterministic Analysis
        skill_breakdowns, concept_breakdowns, strengths, gaps, confidence = self.analyze_performance_deterministically(evaluation)

        # If 100% perfect score, no gaps or remediation needed
        if evaluation.percentage == 100.0 or len(gaps) == 0:
            return DiagnosisResponse(
                lecture_id=lecture_data.lecture_id,
                total_score=evaluation.total_score,
                total_questions=evaluation.total_questions,
                percentage=evaluation.percentage,
                skill_breakdowns=skill_breakdowns,
                concept_breakdowns=concept_breakdowns,
                strengths=strengths or ["Demonstrated comprehensive mastery across all lecture concepts and applications."],
                learning_gaps=[],
                confidence="high",
                recommended_focus="You have mastered this lecture! Ready to explore advanced topics.",
                remediation=None
            )

        # 2. Build LLM prompt to generate targeted supportive remediation
        primary_gap = gaps[0]
        api_key = self._load_api_key()

        if not api_key:
            # Fallback deterministic remediation if API key unavailable
            practice_q = PracticeQuestion(
                id="prac_1",
                question="A 6 kg cart experiences a net force of 18 N. What is its acceleration?",
                options=["2 m/s²", "3 m/s²", "6 m/s²", "108 m/s²"],
                correct_answer="3 m/s²",
                explanation="Using a = F/m gives a = 18 N / 6 kg = 3 m/s².",
                difficulty="easy"
            )
            remediation = Remediation(
                concept=primary_gap.concept,
                skill=primary_gap.skill,
                title="Strengthening Formula Application: F = ma",
                explanation="To find acceleration when force and mass are known, rearrange F = ma into a = F/m. Always divide the force (in Newtons) by mass (in kilograms).",
                example="Example: A 10 kg cart experiences 30 N of force. Calculate a = F/m = 30 / 10 = 3 m/s².",
                practice_question=practice_q,
                harder_practice_question=PracticeQuestion(
                    id="prac_2",
                    question="If a 4 kg object accelerates at 5 m/s², what net force was applied to it?",
                    options=["0.8 N", "1.25 N", "20 N", "9 N"],
                    correct_answer="20 N",
                    explanation="Using F = ma gives F = 4 kg * 5 m/s² = 20 N.",
                    difficulty="medium"
                ),
                feedback_if_correct="Excellent! You calculated acceleration using a = F/m accurately.",
                feedback_if_incorrect="Almost! Remember that acceleration is force divided by mass (a = F/m)."
            )

            return DiagnosisResponse(
                lecture_id=lecture_data.lecture_id,
                total_score=evaluation.total_score,
                total_questions=evaluation.total_questions,
                percentage=evaluation.percentage,
                skill_breakdowns=skill_breakdowns,
                concept_breakdowns=concept_breakdowns,
                strengths=strengths or ["Recognizing core principles from the lecture"],
                learning_gaps=gaps,
                confidence=confidence,
                recommended_focus=f"Practicing {primary_gap.skill} with numerical calculations",
                remediation=remediation
            )

        # Generate personalized remediation via Groq
        system_prompt = (
            "You are an expert, encouraging pedagogical tutor. "
            "Your job is to generate a constructive diagnostic summary and a targeted mini-lesson with a practice question grounded in the lecture.\n\n"
            "CRITICAL TONE & SAFETY RULES:\n"
            "1. NEVER use judgmental, negative, or medical language (NEVER say 'disability', 'bad at physics', 'cannot understand').\n"
            "2. Use supportive terms: 'skill to strengthen', 'great area to practice', 'appears comfortable with'.\n"
            "3. Ground all explanations and numbers in the lecture content (Newton's Second Law: F = ma).\n"
            "4. Keep the mini-lesson concise (30-60 second read).\n"
            "5. Provide 1 primary practice question (4 options) and 1 slightly harder follow-up question (4 options).\n"
            "6. Output ONLY a valid JSON object matching the schema."
        )

        user_prompt = (
            f"Lecture: {lecture_data.filename}\n"
            f"Score: {evaluation.total_score}/{evaluation.total_questions} ({evaluation.percentage}%)\n"
            f"Identified Learning Gap: Concept='{primary_gap.concept}', Skill='{primary_gap.skill}'\n"
            f"Evidence: {primary_gap.evidence}\n\n"
            "Generate the JSON diagnosis and remediation matching this schema:\n"
            "{\n"
            '  "recommended_focus": "string summary of focus area",\n'
            '  "remediation": {\n'
            '    "concept": "concept name",\n'
            '    "skill": "application" | "recall" | "comprehension",\n'
            '    "title": "short mini-lesson title",\n'
            '    "explanation": "concise 2-3 sentence explanation of the method",\n'
            '    "example": "step-by-step worked calculation example",\n'
            '    "practice_question": {\n'
            '      "id": "prac_1",\n'
            '      "question": "question prompt",\n'
            '      "options": ["opt1", "opt2", "opt3", "opt4"],\n'
            '      "correct_answer": "exact opt",\n'
            '      "explanation": "why this is correct",\n'
            '      "difficulty": "easy"\n'
            "    },\n"
            '    "harder_practice_question": {\n'
            '      "id": "prac_2",\n'
            '      "question": "slightly harder question prompt",\n'
            '      "options": ["opt1", "opt2", "opt3", "opt4"],\n'
            '      "correct_answer": "exact opt",\n'
            '      "explanation": "why this is correct",\n'
            '      "difficulty": "medium"\n'
            "    },\n"
            '    "feedback_if_correct": "encouraging feedback",\n'
            '    "feedback_if_incorrect": "supportive hint on the specific step"\n'
            "  }\n"
            "}"
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        models_to_try = [self.primary_model]
        for m in self.fallback_models:
            if m not in models_to_try:
                models_to_try.append(m)

        raw_diagnosis = None
        with httpx.Client(timeout=60.0) as client:
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
                    res = client.post(self.api_url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        content = data["choices"][0]["message"]["content"]
                        clean_content = self._clean_json_text(content)
                        raw_diagnosis = json.loads(clean_content)
                        if "remediation" in raw_diagnosis:
                            break
                except Exception as e:
                    print(f"Diagnosis generation warning ({model_candidate}): {e}")

        remediation_obj = None
        rec_focus = f"Strengthening {primary_gap.skill} through step-by-step practice"

        if raw_diagnosis and "remediation" in raw_diagnosis:
            rem_data = raw_diagnosis["remediation"]
            rec_focus = raw_diagnosis.get("recommended_focus", rec_focus)

            # Shuffle options safely for primary practice question
            pq_data = rem_data.get("practice_question", {})
            pq_options = pq_data.get("options", ["2 m/s²", "3 m/s²", "6 m/s²", "108 m/s²"])
            pq_corr = pq_data.get("correct_answer", "3 m/s²")
            if pq_corr not in pq_options and pq_options:
                pq_options[0] = pq_corr
            shuffled_pq_options = list(pq_options)
            random.shuffle(shuffled_pq_options)

            practice_question = PracticeQuestion(
                id=pq_data.get("id", "prac_1"),
                question=pq_data.get("question", "A 6 kg cart experiences a net force of 18 N. What is its acceleration?"),
                options=shuffled_pq_options,
                correct_answer=pq_corr,
                explanation=pq_data.get("explanation", "a = F / m = 18 / 6 = 3 m/s²."),
                difficulty=pq_data.get("difficulty", "easy")
            )

            # Harder follow-up question
            harder_pq = None
            if "harder_practice_question" in rem_data and rem_data["harder_practice_question"]:
                hpq_data = rem_data["harder_practice_question"]
                hpq_options = hpq_data.get("options", ["0.8 N", "1.25 N", "20 N", "9 N"])
                hpq_corr = hpq_data.get("correct_answer", "20 N")
                if hpq_corr not in hpq_options and hpq_options:
                    hpq_options[0] = hpq_corr
                shuffled_hpq_options = list(hpq_options)
                random.shuffle(shuffled_hpq_options)

                harder_pq = PracticeQuestion(
                    id=hpq_data.get("id", "prac_2"),
                    question=hpq_data.get("question", "If a 4 kg object accelerates at 5 m/s², what net force was applied?"),
                    options=shuffled_hpq_options,
                    correct_answer=hpq_corr,
                    explanation=hpq_data.get("explanation", "F = ma = 4 * 5 = 20 N."),
                    difficulty=hpq_data.get("difficulty", "medium")
                )

            remediation_obj = Remediation(
                concept=rem_data.get("concept", primary_gap.concept),
                skill=rem_data.get("skill", primary_gap.skill),
                title=rem_data.get("title", f"Strengthening {primary_gap.concept} {primary_gap.skill.capitalize()}"),
                explanation=rem_data.get("explanation", "Rearrange F = ma into a = F/m to solve for acceleration."),
                example=rem_data.get("example", "Example: Force = 30 N, Mass = 10 kg -> a = 30 / 10 = 3 m/s²."),
                practice_question=practice_question,
                harder_practice_question=harder_pq,
                feedback_if_correct=rem_data.get("feedback_if_correct", "Great job! You calculated acceleration accurately."),
                feedback_if_incorrect=rem_data.get("feedback_if_incorrect", "Almost! Remember that acceleration is force divided by mass (a = F/m).")
            )

        return DiagnosisResponse(
            lecture_id=lecture_data.lecture_id,
            total_score=evaluation.total_score,
            total_questions=evaluation.total_questions,
            percentage=evaluation.percentage,
            skill_breakdowns=skill_breakdowns,
            concept_breakdowns=concept_breakdowns,
            strengths=strengths or ["Understanding fundamental principles taught in the lecture"],
            learning_gaps=gaps,
            confidence=confidence,
            recommended_focus=rec_focus,
            remediation=remediation_obj
        )
