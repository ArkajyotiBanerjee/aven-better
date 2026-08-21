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
        self.fallback_models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]

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

        # Derive primary concept from evaluation items
        primary_concept = "Core Concept"
        for item in evaluation.results:
            if not item.is_correct and item.concept:
                primary_concept = item.concept
                break
        if primary_concept == "Core Concept" and evaluation.results and evaluation.results[0].concept:
            primary_concept = evaluation.results[0].concept

        # Check: Good Recall/Comprehension but Low Application
        if app_skill and app_skill["attempted"] > 0:
            app_acc = app_skill["correct"] / app_skill["attempted"]
            rec_acc = (rec_skill["correct"] / rec_skill["attempted"]) if rec_skill and rec_skill["attempted"] > 0 else 1.0
            comp_acc = (comp_skill["correct"] / comp_skill["attempted"]) if comp_skill and comp_skill["attempted"] > 0 else 1.0

            if app_acc < 1.0 and (rec_acc >= 0.75 or comp_acc >= 0.75):
                gaps.append(
                    LearningGap(
                        concept=primary_concept,
                        skill="application",
                        severity="moderate" if app_acc > 0 else "significant",
                        evidence=f"Answered {app_skill['attempted'] - app_skill['correct']} of {app_skill['attempted']} application question(s) incorrectly despite strong conceptual grasp.",
                        diagnosis="You appear comfortable with definitions and rules, but applying them to concrete problem-solving calculations is a great area to practice."
                    )
                )

        # Check: Low Recall
        if rec_skill and rec_skill["attempted"] > 0:
            rec_acc = rec_skill["correct"] / rec_skill["attempted"]
            if rec_acc < 0.7:
                gaps.append(
                    LearningGap(
                        concept=primary_concept,
                        skill="recall",
                        severity="moderate" if rec_acc > 0 else "significant",
                        evidence=f"Answered {rec_skill['attempted'] - rec_skill['correct']} of {rec_skill['attempted']} definition question(s) incorrectly.",
                        diagnosis=f"Reviewing the foundational definition of {primary_concept} will build a solid base for complex problems."
                    )
                )

        # Check: Low Comprehension
        if comp_skill and comp_skill["attempted"] > 0:
            comp_acc = comp_skill["correct"] / comp_skill["attempted"]
            if comp_acc < 0.7:
                gaps.append(
                    LearningGap(
                        concept=primary_concept,
                        skill="comprehension",
                        severity="moderate" if comp_acc > 0 else "significant",
                        evidence=f"Answered {comp_skill['attempted'] - comp_skill['correct']} of {comp_skill['attempted']} comprehension question(s) incorrectly.",
                        diagnosis=f"Strengthening how variables and state transitions interact in {primary_concept} will boost problem-solving clarity."
                    )
                )

        return skill_breakdowns, concept_breakdowns, strengths, gaps, confidence

    def _build_default_remediation(self, lecture_data: StructuredLecture, primary_gap: LearningGap) -> Remediation:
        concept_name = primary_gap.concept or (lecture_data.concepts[0].name if lecture_data.concepts else "Core Topic")
        
        # Check if this is a sliding window / DSA topic
        is_sliding_window = any(
            "window" in c.name.lower() or "subarray" in c.name.lower() or "array" in c.name.lower()
            for c in lecture_data.concepts
        ) or "window" in lecture_data.filename.lower()

        if is_sliding_window:
            practice_q = PracticeQuestion(
                id="prac_1",
                question="Given array [2, 1, 5, 1, 3, 2] and window size k=3 with initial window [2, 1, 5] (sum = 8). When sliding the window to the right, what is the new sum after subtracting index 0 (2) and adding index 3 (1)?",
                options=["7", "9", "6", "8"],
                correct_answer="7",
                explanation="New sum = previous sum + incoming element - outgoing element = 8 + 1 - 2 = 7.",
                difficulty="easy"
            )
            harder_pq = PracticeQuestion(
                id="prac_2",
                question="For array [1, 4, 2, 10, 23, 3, 1, 0, 20] and window size k=4, what is the maximum subarray sum achievable?",
                options=["39", "40", "36", "38"],
                correct_answer="39",
                explanation="The window [4, 2, 10, 23] produces the maximum sum: 4 + 2 + 10 + 23 = 39.",
                difficulty="medium"
            )
            return Remediation(
                concept=concept_name,
                skill=primary_gap.skill,
                title=f"Mastering State Update in {concept_name}",
                explanation="In the sliding window technique, update the running sum by adding the incoming element at index k and subtracting the outgoing element at index (k - window_size) in O(1) time.",
                example="Example: If previous window sum is 12, incoming element is 4, and outgoing element is 3, new sum = 12 + 4 - 3 = 13.",
                practice_question=practice_q,
                harder_practice_question=harder_pq,
                feedback_if_correct="Excellent! You accurately calculated the updated window state.",
                feedback_if_incorrect="Almost! Remember to add the new element and subtract the element that fell outside the window: sum_new = sum_old + arr[k] - arr[0]."
            )
        else:
            first_formula = lecture_data.formulas[0] if lecture_data.formulas else None
            formula_expr = first_formula.expression if first_formula else "the core relationship"
            
            practice_q = PracticeQuestion(
                id="prac_1",
                question=f"When applying {concept_name} to problem solving, which step correctly applies {formula_expr}?",
                options=[
                    f"Substitute the given values into {formula_expr} and compute the target unknown",
                    "Add all variables together regardless of their unit or position",
                    "Assume the output remains constant across all steps",
                    "Invert the formula without adjusting the dependent variables"
                ],
                correct_answer=f"Substitute the given values into {formula_expr} and compute the target unknown",
                explanation=f"Applying {concept_name} requires setting up {formula_expr} and solving for the unknown variable.",
                difficulty="easy"
            )
            harder_pq = PracticeQuestion(
                id="prac_2",
                question=f"If the primary input variable is doubled while constraints remain constant, what is the resulting effect in {concept_name}?",
                options=["Proportional scaling according to the governing rule", "Zero change", "Exponential decay", "Immediate cancellation"],
                correct_answer="Proportional scaling according to the governing rule",
                explanation=f"The governing relationship dictates proportional scaling for {concept_name}.",
                difficulty="medium"
            )
            return Remediation(
                concept=concept_name,
                skill=primary_gap.skill,
                title=f"Strengthening Problem Solving in {concept_name}",
                explanation=f"Review the governing relationship ({formula_expr}) and break the calculation into explicit identification, substitution, and evaluation steps.",
                example=f"Example: Identify known variables, substitute into {formula_expr}, and compute the unknown.",
                practice_question=practice_q,
                harder_practice_question=harder_pq,
                feedback_if_correct=f"Great job! You applied {concept_name} accurately.",
                feedback_if_incorrect="Review the step-by-step substitution and re-verify your computation."
            )

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
                recommended_focus="You have mastered this topic! Ready to explore advanced tracks.",
                remediation=None
            )

        # 2. Build LLM prompt to generate targeted supportive remediation
        primary_gap = gaps[0]
        api_key = self._load_api_key()

        if not api_key:
            # Fallback dynamic deterministic remediation if API key unavailable
            remediation = self._build_default_remediation(lecture_data, primary_gap)

            return DiagnosisResponse(
                lecture_id=lecture_data.lecture_id,
                total_score=evaluation.total_score,
                total_questions=evaluation.total_questions,
                percentage=evaluation.percentage,
                skill_breakdowns=skill_breakdowns,
                concept_breakdowns=concept_breakdowns,
                strengths=strengths or ["Recognizing core principles from the material"],
                learning_gaps=gaps,
                confidence=confidence,
                recommended_focus=f"Practicing {primary_gap.skill} with concrete problem calculations",
                remediation=remediation
            )

        # Generate personalized remediation via Groq
        system_prompt = (
            "You are an expert, encouraging pedagogical tutor. "
            "Your job is to generate a constructive diagnostic summary and a targeted mini-lesson with a practice question grounded in the lecture.\n\n"
            "CRITICAL TONE & SAFETY RULES:\n"
            "1. NEVER use judgmental, negative, or medical language (NEVER say 'disability', 'bad at subject', 'cannot understand').\n"
            "2. Use supportive terms: 'skill to strengthen', 'great area to practice', 'appears comfortable with'.\n"
            "3. Ground all explanations, formulas, calculations, and code logic strictly in the provided lecture content.\n"
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
            '    "example": "step-by-step worked calculation or code example",\n'
            '    "practice_question": {\n'
            '      "id": "prac_1",\n'
            '      "question": "question prompt",\n'
            '      "options": ["opt1", "opt2", "opt3", "opt4"],\n'
            '      "correct_answer": "exact opt",\n'
            '      "explanation": "why this is correct",\n'
            '      "difficulty": "easy"\n'
            '    },\n'
            '    "harder_practice_question": {\n'
            '      "id": "prac_2",\n'
            '      "question": "harder question prompt",\n'
            '      "options": ["opt1", "opt2", "opt3", "opt4"],\n'
            '      "correct_answer": "exact opt",\n'
            '      "explanation": "why this is correct",\n'
            '      "difficulty": "medium"\n'
            '    },\n'
            '    "feedback_if_correct": "encouraging confirmation message",\n'
            '    "feedback_if_incorrect": "supportive hint pointing out how to approach the calculation"\n'
            '  }\n'
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

        last_error = None
        raw_diag_data = None

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
                    response = client.post(self.api_url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        clean_content = self._clean_json_text(content)
                        parsed_json = json.loads(clean_content)
                        if parsed_json.get("remediation") and parsed_json.get("recommended_focus"):
                            raw_diag_data = parsed_json
                            break
                        else:
                            raw_diag_data = parsed_json
                    else:
                        err_msg = f"Model '{model_candidate}' returned status {response.status_code}: {response.text}"
                        print(f"Diagnosis generation warning: {err_msg}")
                        last_error = err_msg
                except Exception as e:
                    err_msg = f"Model '{model_candidate}' failed with exception: {e}"
                    print(f"Diagnosis generation warning: {err_msg}")
                    last_error = err_msg

        rec_focus = f"Practicing {primary_gap.skill} with concrete calculations"
        remediation_obj = None

        default_rem = self._build_default_remediation(lecture_data, primary_gap)

        if raw_diag_data:
            rec_focus = raw_diag_data.get("recommended_focus", rec_focus)
            rem_data = raw_diag_data.get("remediation", {})

            # Primary practice question
            pq_data = rem_data.get("practice_question", {})
            pq_options = pq_data.get("options") or default_rem.practice_question.options
            pq_corr = pq_data.get("correct_answer") or default_rem.practice_question.correct_answer
            if pq_corr not in pq_options and pq_options:
                pq_options[0] = pq_corr
            shuffled_pq_options = list(pq_options)
            random.shuffle(shuffled_pq_options)

            practice_question = PracticeQuestion(
                id=pq_data.get("id", "prac_1"),
                question=pq_data.get("question") or default_rem.practice_question.question,
                options=shuffled_pq_options,
                correct_answer=pq_corr,
                explanation=pq_data.get("explanation") or default_rem.practice_question.explanation,
                difficulty=pq_data.get("difficulty", "easy")
            )

            # Harder follow-up question
            harder_pq = None
            if "harder_practice_question" in rem_data and rem_data["harder_practice_question"]:
                hpq_data = rem_data["harder_practice_question"]
                hpq_options = hpq_data.get("options") or (default_rem.harder_practice_question.options if default_rem.harder_practice_question else ["Option A", "Option B", "Option C", "Option D"])
                hpq_corr = hpq_data.get("correct_answer") or (default_rem.harder_practice_question.correct_answer if default_rem.harder_practice_question else hpq_options[0])
                if hpq_corr not in hpq_options and hpq_options:
                    hpq_options[0] = hpq_corr
                shuffled_hpq_options = list(hpq_options)
                random.shuffle(shuffled_hpq_options)

                harder_pq = PracticeQuestion(
                    id=hpq_data.get("id", "prac_2"),
                    question=hpq_data.get("question") or (default_rem.harder_practice_question.question if default_rem.harder_practice_question else "Advanced follow-up question"),
                    options=shuffled_hpq_options,
                    correct_answer=hpq_corr,
                    explanation=hpq_data.get("explanation") or (default_rem.harder_practice_question.explanation if default_rem.harder_practice_question else "Grounded in lecture concept."),
                    difficulty=hpq_data.get("difficulty", "medium")
                )
            else:
                harder_pq = default_rem.harder_practice_question

            remediation_obj = Remediation(
                concept=rem_data.get("concept", primary_gap.concept),
                skill=rem_data.get("skill", primary_gap.skill),
                title=rem_data.get("title", default_rem.title),
                explanation=rem_data.get("explanation", default_rem.explanation),
                example=rem_data.get("example", default_rem.example),
                practice_question=practice_question,
                harder_practice_question=harder_pq,
                feedback_if_correct=rem_data.get("feedback_if_correct", default_rem.feedback_if_correct),
                feedback_if_incorrect=rem_data.get("feedback_if_incorrect", default_rem.feedback_if_incorrect)
            )
        else:
            remediation_obj = default_rem

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
