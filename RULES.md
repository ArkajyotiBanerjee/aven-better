# Project Rules

## 1. Engineering Rules
* **Protect MVP Scope:** The hackathon is 48 hours. Prioritize reliability, educational impact, and demo quality over technical complexity.
* **Keep It Simple:** Prefer straightforward implementations. Do not over-engineer.
* **Modular Architecture:** Keep backend and frontend responsibilities clear. Do not mix data extraction logic with API routing.
* **No Unnecessary Dependencies:** Evaluate every new package. If a built-in library or simple function can do the job, use it.
* **Do Not Rewrite Working Code:** Treat the existing `transcribe.py` as a validated POC. Build around it or adapt it gently, but avoid full rewrites unless strictly required.
* **Secrets Management:** Never hardcode API keys. Always use `.env` files and keep environment configuration separate from source code.

## 2. AI Rules
* **No Custom Training:** Use existing models (open-weights/open-source) via local inference or API. We are not training models for this MVP.
* **Grounding:** All AI answers, smart notes, and generated content must be strictly grounded in the transcribed lecture content.
* **Structured Output:** Rely on JSON/Pydantic structured outputs for LLM tasks to ensure reliable downstream processing.
* **Explainability:** AI-generated weakness detection must provide evidence (e.g., "Based on your answers to questions 2 and 4...").
* **No Medical Diagnoses:** Never claim certainty about student weaknesses and NEVER claim to diagnose disabilities or learning disorders. Frame everything as "identifying difficulty with a specific concept based on interaction."

## 3. Product Rules
* **Accessibility is First-Class:** It is the core of the product, not a decorative feature.
* **Core Learning Loop:** Every feature built must serve the core loop: Lecture -> Accessibility -> Quiz -> Diagnosis -> Remediation.
* **User Control:** The teacher and student must always remain in control of the experience.
* **Avoid AI Gimmicks:** If a feature sounds impressive but has a poor impact-to-development-time ratio, cut it. Do not add RAG merely because it sounds technically impressive.

## 4. UX & Design Rules
* **Clear States:** Provide clear loading and processing states during transcription and LLM generation.
* **Accessible Typography:** Use highly readable fonts, appropriate contrast, and logical spacing.
* **No Excessive Animations:** Keep transitions clean and purposeful.
* **Visual Integrity:** Never use accessibility features as a visual gimmick. They must provide real educational value.
