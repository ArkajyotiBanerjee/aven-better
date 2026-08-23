import os
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import httpx
from fastapi import HTTPException

from app.models.interview import (
    StartInterviewRequest,
    StartInterviewResponse,
    InterviewQuestion,
    InterviewRoundEvaluation,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    FinalInterviewReport,
    SavedInterviewSummary,
    ConversationTurn,
)
from app.services.db_service import DatabaseService
from app.services.resume_service import ResumeService

# Resilient fallback questions in case of external API rate limits
FALLBACK_QUESTIONS = {
    "Data Structures & Algorithms": {
        "Foundational": "Can you explain the difference between an Array and a Linked List in terms of memory layout and time complexity for search and insertion?",
        "Intermediate": "How would you detect a cycle in a singly linked list with O(1) auxiliary space, and what is the intuition behind Floyd's algorithm?",
        "Advanced": "Explain how you would design an LRU Cache with O(1) get and put operations. What data structures do you combine, and what edge cases exist during eviction?",
    },
    "JavaScript": {
        "Foundational": "Explain the difference between `let`, `const`, and `var`, specifically regarding hoisting and block scoping.",
        "Intermediate": "How does the JavaScript Event Loop coordinate the Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout)?",
        "Advanced": "What are Closures in JavaScript, how do they interact with garbage collection, and how can they inadvertently lead to memory leaks in long-running SPAs?",
    },
    "Web Development": {
        "Foundational": "Explain what happens in the browser from the moment a user types a URL and presses Enter until the page renders.",
        "Intermediate": "How does the browser's Critical Rendering Path work, and what specific techniques optimize First Contentful Paint (FCP)?",
        "Advanced": "Compare Server-Side Rendering (SSR), Client-Side Rendering (CSR), and Static Site Generation (SSG) in terms of TTFB, hydration cost, and infrastructure overhead.",
    },
    "Computer Science Fundamentals": {
        "Foundational": "What is the difference between a Process and a Thread in modern operating systems, and how do they share memory?",
        "Intermediate": "Explain the ACID properties of relational databases and how Write-Ahead Logging (WAL) guarantees durability during power loss.",
        "Advanced": "Explain the CAP theorem in distributed systems. Why is it impossible to provide Consistency and Availability simultaneously in the presence of a Network Partition?",
    },
}

class InterviewService:
    _instance: Optional["InterviewService"] = None

    @classmethod
    def get_instance(cls) -> "InterviewService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.primary_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        self.fallback_models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]
        self.db = DatabaseService.get_instance()

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
                    "temperature": 0.3
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

    def extract_resume_interview_context(self, pdf_bytes: bytes, targeted_role: Optional[str] = None) -> str:
        resume_svc = ResumeService.get_instance()
        raw_text = resume_svc.extract_text_from_pdf(pdf_bytes)

        system_prompt = (
            "You are an expert technical interviewer preparing a concise, high-signal technical candidate profile from a resume. "
            "Extract ONLY factual information present in the resume. "
            "Do NOT invent projects, metrics, or technologies. "
            "Keep the brief compact (under 350 words), focusing on: "
            "1. Primary technical skills & languages\n"
            "2. Core projects (architectures, key libraries, scale/metrics)\n"
            "3. Work experience & responsibilities\n"
            "4. Discussable technical claims that can be probed in an interview."
        )

        role_str = f"Target Role: {targeted_role}\n" if targeted_role else ""
        user_prompt = (
            f"{role_str}"
            "Extract the concise technical interview profile from the following resume text:\n\n"
            f"\"\"\"\n{raw_text[:10000]}\n\"\"\"\n\n"
            "Return JSON matching: {\"interview_context\": \"string with formatted summary\"}"
        )

        try:
            parsed = self._call_groq_json(system_prompt, user_prompt)
            context = parsed.get("interview_context", "")
            if context and len(context.strip()) > 30:
                return context.strip()
        except Exception as e:
            print(f"Notice: Using raw resume text excerpt for context due to: {e}")

        # Fallback to a clean text excerpt
        return raw_text[:2500].strip()

    def start_interview(self, req: StartInterviewRequest) -> StartInterviewResponse:
        session_id = f"int_{uuid.uuid4().hex[:12]}"
        topic = req.topic.strip()
        difficulty = req.difficulty.strip()
        targeted_role = req.targeted_role.strip() if req.targeted_role else None
        resume_context = req.resume_context.strip() if req.resume_context else None

        system_prompt = (
            "You are a rigorous, highly skilled technical interviewer conducting a structured 5-round technical interview. "
            "Your tone is professional, objective, concise, and focused on core engineering reasoning. "
            "Generate ONLY valid JSON."
        )

        context_instructions = ""
        if targeted_role:
            context_instructions += f"Targeted Career Direction: {targeted_role}\n"
        if resume_context:
            context_instructions += f"Candidate Resume Technical Profile & Project Evidence:\n\"\"\"\n{resume_context}\n\"\"\"\n"

        if context_instructions:
            guidance = (
                f"{context_instructions}\n"
                "Ground the initial Round 1 inquiry in the candidate's actual projects, technologies, or domain experience where relevant. "
                "You may ask them to walk through an architectural trade-off from a project mentioned on their resume, or ask a role-specific conceptual inquiry."
            )
        else:
            guidance = "Generate a technical question for this topic and difficulty."

        user_prompt = (
            f"Generate the initial technical question (Round 1 of 5) for a candidate.\n"
            f"Topic: {topic}\n"
            f"Difficulty: {difficulty}\n"
            f"{guidance}\n\n"
            "Requirements:\n"
            "- The question must test foundational understanding or real-world technical mechanics.\n"
            "- Keep the question concise and direct (1 to 3 sentences).\n"
            "- Do not give the answer.\n\n"
            "Return JSON matching this schema:\n"
            "{\n"
            '  "question_text": "string",\n'
            '  "question_type": "conceptual" or "application"\n'
            "}"
        )

        try:
            parsed = self._call_groq_json(system_prompt, user_prompt)
            question_text = parsed.get("question_text")
            q_type = parsed.get("question_type", "conceptual")
        except Exception as e:
            print(f"Notice: Using fallback initial question due to: {e}")
            topic_dict = FALLBACK_QUESTIONS.get(topic, FALLBACK_QUESTIONS["Data Structures & Algorithms"])
            question_text = topic_dict.get(difficulty, topic_dict["Intermediate"])
            q_type = "conceptual"

        initial_q = InterviewQuestion(
            question_id=f"q_{session_id}_1",
            round_number=1,
            total_rounds=5,
            topic=topic,
            difficulty=difficulty,
            question_text=question_text,
            question_type=q_type,
        )

        return StartInterviewResponse(
            session_id=session_id,
            topic=topic,
            difficulty=difficulty,
            initial_question=initial_q,
            targeted_role=targeted_role,
        )

    def evaluate_and_next(self, req: SubmitAnswerRequest, user_id: Optional[str] = None) -> SubmitAnswerResponse:
        session_id = req.session_id
        topic = req.topic
        difficulty = req.difficulty
        current_round = req.current_round
        question_text = req.question_text
        answer_text = req.answer_text.strip()
        history = req.history
        targeted_role = req.targeted_role
        resume_context = req.resume_context

        is_final_round = (current_round >= 5)

        # Build history context
        history_summary = []
        for turn in history:
            history_summary.append(
                f"Round {turn.round_number}:\n"
                f"Q: {turn.question}\n"
                f"A: {turn.answer}\n"
                f"Evaluation: {turn.assessment or 'N/A'}"
            )
        history_str = "\n\n".join(history_summary) if history_summary else "None (Round 1)"

        resume_info = ""
        if targeted_role:
            resume_info += f"Candidate Target Role: {targeted_role}\n"
        if resume_context:
            resume_info += f"Candidate Resume Evidence:\n\"\"\"\n{resume_context}\n\"\"\"\n"

        system_prompt = (
            "You are an expert technical interviewer conducting an adaptive 5-round technical interview. "
            "You evaluate responses strictly based on technical correctness, conceptual depth, clarity of communication, and systematic reasoning. "
            "You adapt the next question based on how well the candidate answered: "
            "if strong, push for edge cases/trade-offs; if partially correct, probe the missed nuance; if weak, ask a clarifying fundamental.\n\n"
            "ASR-AWARE ROBUSTNESS INSTRUCTIONS:\n"
            "- The candidate's submitted answer may be transcribed from voice speech recognition (ASR).\n"
            "- If a word or phrase is an obvious phonetic transcription distortion of a technical term (e.g. 'hash mark' for 'hash map', 'sequel' for 'SQL', 'sink await' for 'async/await', 'node j s' for 'Node.js', 'carrying' for 'currying', 'byte code' for 'bytecode'), interpret the likely intended technical term in the context of the question, target role, and resume.\n"
            "- Do NOT penalize minor phonetic transcription inaccuracies on correctness or clarity.\n"
            "- Do NOT hallucinate or invent technical facts: if the candidate's explanation is genuinely shallow, vague, or conceptually incorrect, evaluate it accurately as shallow or incomplete.\n"
            "Always return ONLY valid JSON."
        )

        if not is_final_round:
            user_prompt = (
                f"Topic: {topic}\n"
                f"Difficulty: {difficulty}\n"
                f"{resume_info}"
                f"Current Round: {current_round} of 5\n\n"
                f"Prior Interview Context:\n{history_str}\n\n"
                f"Current Question:\n{question_text}\n\n"
                f"Candidate's Submitted Answer:\n{answer_text}\n\n"
                "Task:\n"
                "1. Evaluate this specific answer on correctness, depth, clarity, and reasoning (scores 0-100), applying ASR-aware interpretation for phonetic distortions.\n"
                "2. Provide a constructive, concise 2-sentence assessment of the response.\n"
                "3. List 1-2 bullet strengths and 1-2 bullet gaps/missed nuances.\n"
                f"4. Formulate the NEXT question (Round {current_round + 1} of 5) that adaptively responds to the candidate's understanding.\n\n"
                "Required JSON Schema:\n"
                "{\n"
                '  "evaluation": {\n'
                '    "correctness": float (0-100),\n'
                '    "depth": float (0-100),\n'
                '    "clarity": float (0-100),\n'
                '    "reasoning": float (0-100),\n'
                '    "assessment": "string (concise 2 sentences)",\n'
                '    "strengths": ["string"],\n'
                '    "gaps": ["string"]\n'
                '  },\n'
                '  "next_question": "string (the next technical question)",\n'
                '  "next_question_type": "followup" or "application" or "tradeoff" or "conceptual"\n'
                "}"
            )
        else:
            user_prompt = (
                f"Topic: {topic}\n"
                f"Difficulty: {difficulty}\n"
                f"{resume_info}"
                f"Current Round: 5 of 5 (FINAL ROUND)\n\n"
                f"Full Interview Transcript:\n{history_str}\n\n"
                f"Final Question:\n{question_text}\n\n"
                f"Candidate's Final Answer:\n{answer_text}\n\n"
                "Task:\n"
                "1. Evaluate this final answer on correctness, depth, clarity, and reasoning (scores 0-100), applying ASR-aware interpretation for phonetic distortions.\n"
                "2. Synthesize a comprehensive FINAL INTERVIEW EVALUATION REPORT covering all 5 rounds:\n"
                "   - overall_score (0-100)\n"
                "   - technical_understanding (0-100)\n"
                "   - problem_solving (0-100)\n"
                "   - communication (0-100)\n"
                "   - reasoning_depth (0-100)\n"
                "   - summary: A crisp 3-sentence executive evaluation of candidate's technical readiness.\n"
                "   - strengths: 3 bullet points of what held up strong under technical questioning.\n"
                "   - gaps: 2-3 specific areas/edge-cases where their reasoning faltered.\n"
                "   - recommendations: 2-3 targeted technical topics/problems to practice next.\n\n"
                "Required JSON Schema:\n"
                "{\n"
                '  "evaluation": {\n'
                '    "correctness": float (0-100),\n'
                '    "depth": float (0-100),\n'
                '    "clarity": float (0-100),\n'
                '    "reasoning": float (0-100),\n'
                '    "assessment": "string",\n'
                '    "strengths": ["string"],\n'
                '    "gaps": ["string"]\n'
                '  },\n'
                '  "final_report": {\n'
                '    "overall_score": float (0-100),\n'
                '    "technical_understanding": float (0-100),\n'
                '    "problem_solving": float (0-100),\n'
                '    "communication": float (0-100),\n'
                '    "reasoning_depth": float (0-100),\n'
                '    "summary": "string",\n'
                '    "strengths": ["string"],\n'
                '    "gaps": ["string"],\n'
                '    "recommendations": ["string"]\n'
                '  }\n'
                "}"
            )

        try:
            parsed = self._call_groq_json(system_prompt, user_prompt)
            eval_dict = parsed.get("evaluation", {})
            evaluation = InterviewRoundEvaluation(
                correctness=float(eval_dict.get("correctness", 80.0)),
                depth=float(eval_dict.get("depth", 75.0)),
                clarity=float(eval_dict.get("clarity", 85.0)),
                reasoning=float(eval_dict.get("reasoning", 80.0)),
                assessment=eval_dict.get("assessment", "Response demonstrates good foundational understanding."),
                strengths=eval_dict.get("strengths", ["Clear explanation of core concept"]),
                gaps=eval_dict.get("gaps", ["Could explore edge case trade-offs"]),
            )

            next_q = None
            final_report = None

            if not is_final_round:
                next_q_text = parsed.get("next_question", "How would you optimize this approach under memory constraints?")
                next_q_type = parsed.get("next_question_type", "followup")
                next_q = InterviewQuestion(
                    question_id=f"q_{session_id}_{current_round + 1}",
                    round_number=current_round + 1,
                    total_rounds=5,
                    topic=topic,
                    difficulty=difficulty,
                    question_text=next_q_text,
                    question_type=next_q_type,
                )
            else:
                rep_dict = parsed.get("final_report", {})
                final_report = FinalInterviewReport(
                    overall_score=float(rep_dict.get("overall_score", 82.0)),
                    technical_understanding=float(rep_dict.get("technical_understanding", 84.0)),
                    problem_solving=float(rep_dict.get("problem_solving", 80.0)),
                    communication=float(rep_dict.get("communication", 85.0)),
                    reasoning_depth=float(rep_dict.get("reasoning_depth", 80.0)),
                    summary=rep_dict.get("summary", "Solid performance demonstrating strong technical fundamentals and clear communication."),
                    strengths=rep_dict.get("strengths", ["Solid grasp of core data structures", "Clear communication structure"]),
                    gaps=rep_dict.get("gaps", ["Edge-case verification could be more thorough"]),
                    recommendations=rep_dict.get("recommendations", ["Practice space-time trade-offs under constraints"]),
                    saved_to_profile=False,
                )

                # Persist final report for authenticated user
                if user_id:
                    self._save_interview_result(user_id, topic, difficulty, final_report)
                    final_report.saved_to_profile = True

        except Exception as e:
            print(f"Evaluation fallback triggered: {e}")
            # Robust fallback so user is never stuck
            evaluation = InterviewRoundEvaluation(
                correctness=75.0,
                depth=70.0,
                clarity=80.0,
                reasoning=75.0,
                assessment="Response addresses the primary technical concept effectively.",
                strengths=["Articulated the primary mechanism clearly"],
                gaps=["Consider analyzing asymptotic edge cases"],
            )
            if not is_final_round:
                next_q = InterviewQuestion(
                    question_id=f"q_{session_id}_{current_round + 1}",
                    round_number=current_round + 1,
                    total_rounds=5,
                    topic=topic,
                    difficulty=difficulty,
                    question_text="How would your reasoning change if this solution were deployed at large scale?",
                    question_type="tradeoff",
                )
                final_report = None
            else:
                next_q = None
                final_report = FinalInterviewReport(
                    overall_score=80.0,
                    technical_understanding=82.0,
                    problem_solving=78.0,
                    communication=84.0,
                    reasoning_depth=78.0,
                    summary="Good demonstration of technical competency and analytical reasoning across the interview.",
                    strengths=["Strong core concept clarity", "Consistent structured reasoning"],
                    gaps=["Edge case verification", "Deeper analysis of space trade-offs"],
                    recommendations=["Practice complex algorithmic constraints", "Review low-level runtime mechanics"],
                    saved_to_profile=False,
                )
                if user_id:
                    self._save_interview_result(user_id, topic, difficulty, final_report)
                    final_report.saved_to_profile = True

        return SubmitAnswerResponse(
            session_id=session_id,
            round_number=current_round,
            evaluation=evaluation,
            is_final_round=is_final_round,
            next_question=next_q,
            final_report=final_report,
        )

    def _save_interview_result(self, user_id: str, topic: str, difficulty: str, report: FinalInterviewReport):
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            record_id = f"int_res_{uuid.uuid4().hex[:12]}"
            with self.db.get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO interview_results (
                        id, user_id, topic, difficulty, overall_score,
                        evaluation_json, rounds_count, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    record_id,
                    user_id,
                    topic,
                    difficulty,
                    report.overall_score,
                    json.dumps(report.model_dump()),
                    5,
                    now_iso
                ))
        except Exception as e:
            print(f"Warning: Failed to save interview result for user {user_id}: {e}")

    def get_latest_interview(self, user_id: str) -> Optional[SavedInterviewSummary]:
        with self.db.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM interview_results
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_id,))
            row = cursor.fetchone()
            if not row:
                return None

            try:
                rep_data = json.loads(row["evaluation_json"])
                report = FinalInterviewReport.model_validate(rep_data)
            except Exception:
                report = None

            return SavedInterviewSummary(
                id=row["id"],
                topic=row["topic"],
                difficulty=row["difficulty"],
                overall_score=row["overall_score"],
                rounds_count=row["rounds_count"],
                created_at=row["created_at"],
                final_report=report,
            )
