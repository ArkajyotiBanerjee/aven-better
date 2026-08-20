import os
import json
import re
import random
from pathlib import Path
from typing import Optional, List
import httpx
from fastapi import HTTPException

from app.models.structured_lecture import StructuredLecture
from app.models.quiz import Quiz, Question

class QuizService:
    _instance: Optional["QuizService"] = None

    @classmethod
    def get_instance(cls) -> "QuizService":
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

    def generate_quiz(self, lecture_data: StructuredLecture) -> Quiz:
        api_key = self._load_api_key()
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY is not configured in server environment or .env"
            )

        # Build educational context summary from StructuredLecture
        lecture_summary = {
            "title": lecture_data.filename,
            "concepts": [c.model_dump() for c in lecture_data.concepts],
            "definitions": [d.model_dump() for d in lecture_data.definitions],
            "formulas": [f.model_dump() for f in lecture_data.formulas],
            "examples": [e.model_dump() for e in lecture_data.examples],
            "important_points": [p.model_dump() for p in lecture_data.important_points],
            "relationships": [r.model_dump() for r in lecture_data.relationships]
        }
        structured_context_json = json.dumps(lecture_summary, indent=2)

        system_prompt = (
            "You are an expert educational assessment creator. "
            "You MUST generate a complete 5-question multiple-choice assessment grounded STRICTLY in the provided Structured Lecture.\n\n"
            "Mandatory Rules:\n"
            "1. Output exactly 5 questions (q1, q2, q3, q4, q5).\n"
            "2. Ensure a balanced pedagogical distribution:\n"
            "   - Question 1 (recall): Definition / core statement of the concept\n"
            "   - Question 2 (comprehension): Formula structure and meaning of variables\n"
            "   - Question 3 (application): Numerical calculation using the formula/example taught in the lecture\n"
            "   - Question 4 (comprehension/relation): Relationship between the variables (e.g. what happens if force doubles?)\n"
            "   - Question 5 (application): Scenario-based application question testing problem-solving\n"
            "3. Ground all questions directly in the lecture. Do not invent external physics facts.\n"
            "4. Each question must have exactly 4 distinct plausible options.\n"
            "5. 'correct_answer' must be the exact string of the correct option.\n"
            "6. 'explanation' must explain why the answer is correct referencing the lecture.\n"
            "7. Diagnostic metadata per question:\n"
            "   - 'concept': Name of the concept tested\n"
            "   - 'skill': 'recall' | 'comprehension' | 'application'\n"
            "   - 'difficulty': 'easy' | 'medium' | 'hard'\n"
            "   - 'source_timestamp': float timestamp in seconds where covered in lecture\n"
            "8. Respond ONLY with a valid JSON object matching the required schema."
        )

        user_prompt = (
            "Generate the 5-question diagnostic quiz now from this Structured Lecture data as JSON.\n\n"
            f"Structured Lecture:\n{structured_context_json}\n\n"
            "Required JSON Schema:\n"
            "{\n"
            '  "questions": [\n'
            '    {"id": "q1", "question": "string", "type": "definition", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "exact opt", "explanation": "explanation", "concept": "name", "skill": "recall", "difficulty": "easy", "source_timestamp": 0.0},\n'
            '    {"id": "q2", "question": "string", "type": "formula", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "exact opt", "explanation": "explanation", "concept": "name", "skill": "comprehension", "difficulty": "medium", "source_timestamp": 9.4},\n'
            '    {"id": "q3", "question": "string", "type": "application", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "exact opt", "explanation": "explanation", "concept": "name", "skill": "application", "difficulty": "medium", "source_timestamp": 19.6},\n'
            '    {"id": "q4", "question": "string", "type": "concept", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "exact opt", "explanation": "explanation", "concept": "name", "skill": "comprehension", "difficulty": "medium", "source_timestamp": 9.4},\n'
            '    {"id": "q5", "question": "string", "type": "application", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "exact opt", "explanation": "explanation", "concept": "name", "skill": "application", "difficulty": "hard", "source_timestamp": 19.6}\n'
            "  ]\n"
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
        raw_quiz_data = None

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
                        if parsed_json.get("questions") and len(parsed_json["questions"]) >= 4:
                            raw_quiz_data = parsed_json
                            break
                        else:
                            print(f"Model '{model_candidate}' returned fewer than 4 questions ({len(parsed_json.get('questions', []))}). Trying next model...")
                            raw_quiz_data = parsed_json
                    else:
                        err_msg = f"Model '{model_candidate}' returned status {response.status_code}: {response.text}"
                        print(f"Quiz generation warning: {err_msg}")
                        last_error = err_msg
                except Exception as e:
                    err_msg = f"Model '{model_candidate}' failed with exception: {e}"
                    print(f"Quiz generation warning: {err_msg}")
                    last_error = err_msg

        if not raw_quiz_data or "questions" not in raw_quiz_data or len(raw_quiz_data["questions"]) == 0:
            print(f"All quiz generation candidates failed. Last error: {last_error}")
            raise HTTPException(
                status_code=502,
                detail="Failed to generate structured quiz from lecture"
            )

        # Process, validate, and safely randomize options for each question
        processed_questions: List[Question] = []
        for i, q in enumerate(raw_quiz_data.get("questions", [])):
            q_id = q.get("id") or f"q{i+1}"
            options = q.get("options", [])
            correct_ans = q.get("correct_answer")

            # Ensure correct answer is present in options
            if correct_ans not in options and options:
                options[0] = correct_ans

            # Shuffle options to avoid static placement while preserving correct answer
            shuffled_options = list(options)
            random.shuffle(shuffled_options)

            question_obj = Question(
                id=q_id,
                question=q.get("question", f"Question {i+1}"),
                type=q.get("type", "concept") if q.get("type") in ["concept", "application", "definition", "formula"] else "concept",
                options=shuffled_options,
                correct_answer=correct_ans,
                explanation=q.get("explanation", "Grounded in lecture content."),
                concept=q.get("concept", "Newton's Second Law"),
                skill=q.get("skill", "comprehension") if q.get("skill") in ["recall", "comprehension", "application"] else "comprehension",
                difficulty=q.get("difficulty", "medium") if q.get("difficulty") in ["easy", "medium", "hard"] else "medium",
                source_timestamp=q.get("source_timestamp")
            )
            processed_questions.append(question_obj)

        return Quiz(
            lecture_id=lecture_data.lecture_id,
            questions=processed_questions
        )
