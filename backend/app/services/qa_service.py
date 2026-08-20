import os
import json
import re
from pathlib import Path
from typing import Optional, List
import httpx
from fastapi import HTTPException

from app.models.structured_lecture import StructuredLecture
from app.models.qa import QuestionRequest, QuestionResponse, SourceReference

class QAService:
    _instance: Optional["QAService"] = None

    @classmethod
    def get_instance(cls) -> "QAService":
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

    def answer_question(self, lecture_data: StructuredLecture, question: str) -> QuestionResponse:
        api_key = self._load_api_key()
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY is not configured in environment or .env"
            )

        lecture_summary = {
            "title": lecture_data.filename,
            "concepts": [c.model_dump() for c in lecture_data.concepts],
            "definitions": [d.model_dump() for d in lecture_data.definitions],
            "formulas": [f.model_dump() for f in lecture_data.formulas],
            "examples": [e.model_dump() for e in lecture_data.examples],
            "important_points": [p.model_dump() for p in lecture_data.important_points],
            "transcript_summary": " ".join([s.text for s in lecture_data.transcript[:10]])
        }
        structured_context_json = json.dumps(lecture_summary, indent=2)

        system_prompt = (
            "You are an accessible, audio-first educational assistant for the AccessLearn platform. "
            "You answer student questions strictly and accurately based on the provided Structured Lecture.\n\n"
            "STRICT GROUNDING RULES:\n"
            "1. Answer ONLY using the facts, definitions, formulas, and examples present in the Structured Lecture.\n"
            "2. If the user asks about a topic not discussed in the lecture (e.g. quantum physics, biology, unrelated topics), politely state that this lecture does not cover that topic and briefly remind them of the lecture's actual topic.\n"
            "3. Format explanations for spoken clarity: write clean, natural sentences that sound natural when read aloud by Text-to-Speech (e.g. write 'force equals mass multiplied by acceleration' or 'F equals m a').\n"
            "4. Keep explanations concise, clear, and focused (2 to 4 sentences).\n"
            "5. Cite the grounding sources (section name and timestamp if available).\n"
            "6. Respond ONLY with a valid JSON object matching the schema."
        )

        user_prompt = (
            f"Structured Lecture Context:\n{structured_context_json}\n\n"
            f"Student Question: {question}\n\n"
            "Respond in JSON matching this schema:\n"
            "{\n"
            '  "answer": "string explanation suitable for speech",\n'
            '  "sources": [\n'
            '    {"section": "concept" | "definition" | "formula" | "example", "timestamp": 0.0, "text_snippet": "snippet"}\n'
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

        raw_qa = None
        last_error = None

        with httpx.Client(timeout=45.0) as client:
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
                        raw_qa = json.loads(clean_content)
                        if "answer" in raw_qa:
                            break
                    else:
                        last_error = f"Model {model_candidate} returned status {response.status_code}: {response.text}"
                except Exception as e:
                    last_error = str(e)

        if not raw_qa or "answer" not in raw_qa:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to generate lecture-grounded answer. Last error: {last_error}"
            )

        sources_list: List[SourceReference] = []
        for s in raw_qa.get("sources", []):
            sources_list.append(
                SourceReference(
                    section=s.get("section", "lecture"),
                    timestamp=s.get("timestamp"),
                    text_snippet=s.get("text_snippet")
                )
            )

        return QuestionResponse(
            lecture_id=lecture_data.lecture_id,
            question=question,
            answer=raw_qa.get("answer", "No answer could be generated."),
            sources=sources_list
        )
