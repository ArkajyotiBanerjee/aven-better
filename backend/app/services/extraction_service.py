import os
import json
import re
from pathlib import Path
from typing import Optional, List
import httpx
from fastapi import HTTPException

from app.models.transcription import TranscriptionResponse
from app.models.structured_lecture import (
    EducationalExtraction,
    StructuredLecture
)

class ExtractionService:
    _instance: Optional["ExtractionService"] = None

    @classmethod
    def get_instance(cls) -> "ExtractionService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.primary_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        # Fallback model in case the primary encounters temporary JSON schema validation issues on Groq
        self.fallback_models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]

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

    def _clean_json_text(self, text: str) -> str:
        text = text.strip()
        # Remove markdown code block fences if present
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
            text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        return text.strip()

    def extract(self, transcript_data: TranscriptionResponse) -> StructuredLecture:
        api_key = self._load_api_key()
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY is not configured in server environment or .env"
            )

        # Format transcript segments for the LLM
        formatted_segments = []
        for seg in transcript_data.segments:
            formatted_segments.append(
                f"[{seg.start:.2f}s - {seg.end:.2f}s] {seg.text}"
            )
        transcript_text = "\n".join(formatted_segments)

        system_prompt = (
            "You are an expert educational content extraction system. "
            "Your task is to analyze the lecture transcript and output a structured JSON summary.\n\n"
            "Extraction Rules:\n"
            "1. Ground all items strictly in the lecture transcript. Do not hallucinate outside information.\n"
            "2. Do not convert general sentences into concepts. Keep concept names concise (e.g. 'Newton's Second Law').\n"
            "3. Separate definitions, formulas, examples, and important points.\n"
            "4. Preserve timestamps: 'timestamp_start' and 'timestamp_end' (numbers in seconds) matching the segment where discussed.\n"
            "5. Provide 'evidence': exact or near-exact transcript quote.\n"
            "6. Avoid duplicate concepts: list each concept once.\n"
            "7. Extract relationships between concepts (e.g. source, relationship, target) when taught.\n"
            "8. If a category has no items (e.g. no formulas), return an empty array [].\n"
            "9. You MUST output ONLY a valid JSON object matching the requested schema."
        )

        user_prompt = (
            "Extract the educational representation from this lecture transcript as JSON.\n\n"
            f"Transcript:\n{transcript_text}\n\n"
            "Required JSON Schema:\n"
            "{\n"
            '  "concepts": [{"name": "string", "description": "string", "timestamp_start": float, "timestamp_end": float, "evidence": "string"}],\n'
            '  "definitions": [{"concept": "string", "definition": "string", "timestamp_start": float, "timestamp_end": float, "evidence": "string"}],\n'
            '  "formulas": [{"name": "string", "expression": "string", "variables": ["string"], "timestamp_start": float, "timestamp_end": float, "evidence": "string"}],\n'
            '  "examples": [{"topic": "string", "description": "string", "result": "string", "timestamp_start": float, "timestamp_end": float, "evidence": "string"}],\n'
            '  "important_points": [{"point": "string", "importance_reason": "string", "timestamp_start": float, "timestamp_end": float, "evidence": "string"}],\n'
            '  "relationships": [{"source": "string", "relationship": "string", "target": "string", "evidence": "string"}]\n'
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
        extracted_data = None

        with httpx.Client(timeout=60.0) as client:
            for model_candidate in models_to_try:
                payload = {
                    "model": model_candidate,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.1
                }

                try:
                    response = client.post(self.api_url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        clean_content = self._clean_json_text(content)
                        parsed_json = json.loads(clean_content)
                        extracted_data = EducationalExtraction.model_validate(parsed_json)
                        break
                    else:
                        err_msg = f"Model '{model_candidate}' returned status {response.status_code}: {response.text}"
                        print(f"Extraction warning: {err_msg}")
                        last_error = err_msg
                except Exception as e:
                    err_msg = f"Model '{model_candidate}' failed with exception: {e}"
                    print(f"Extraction warning: {err_msg}")
                    last_error = err_msg

        if not extracted_data:
            print(f"All LLM extraction candidates failed. Last error: {last_error}")
            raise HTTPException(
                status_code=502,
                detail="Failed to extract structured educational data from LLM"
            )

        return StructuredLecture(
            lecture_id=transcript_data.lecture_id,
            filename=transcript_data.filename,
            language=transcript_data.language,
            transcript=transcript_data.segments,
            concepts=extracted_data.concepts,
            definitions=extracted_data.definitions,
            formulas=extracted_data.formulas,
            examples=extracted_data.examples,
            important_points=extracted_data.important_points,
            relationships=extracted_data.relationships
        )
