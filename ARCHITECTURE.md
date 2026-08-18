# Architecture Specification

## 1. Core Architectural Principle
AccessLearn revolves around a **central structured representation of the lecture**. We do not build separate pipelines for every feature. 
`Lecture -> Speech-to-Text -> Structured Educational Representation -> [UI Modes & Quizzes]`

## 2. High-Level Architecture
The MVP uses a **Modular Monolith** pattern suitable for a 48-hour hackathon. 

* **Frontend:** React (SPA or Next.js, keeping it simple).
* **Backend:** Python + FastAPI.
* **AI/ML Layer:** Managed within the Python backend, calling local models or APIs.

## 3. Component Breakdown

### 3.1. Frontend
* Responsible for rendering the adaptive UI, managing the video player, syncing captions via timestamps, and handling user inputs for quizzes and Q&A.
* Libraries: React, React Flow/Mermaid (for simple concept maps).

### 3.2. Backend (FastAPI)
* Exposes REST endpoints for lecture upload, transcript retrieval, structured data extraction, quiz generation, and answer evaluation.
* Manages the workflow orchestration between AI components.

### 3.3. AI/ML Layer
* **Speech-to-Text (STT):** `faster-whisper` (Currently validated in `backend/transcribe.py`).
* **Main LLM:** Open-weight models (e.g., Qwen, Llama, Mistral) via local inference or API based on hardware constraints. Handles extracting insights, generating quizzes, and analyzing weaknesses.
* **Embeddings & RAG:** Sentence Transformers with a simple vector store (e.g., FAISS or Chroma) *only if* strictly necessary for lecture-grounded Q&A in Blind mode.
* **Text-to-Speech (TTS):** Existing open-source TTS or simple browser API integration for MVP Blind mode audio.

## 4. Structured Lecture Representation (Schema Design)
The backbone of the system. Extracted via LLM using structured output (JSON/Pydantic).

```json
{
  "lecture_metadata": {
    "title": "string",
    "duration_seconds": "number"
  },
  "transcript": [
    { "start": 0.0, "end": 9.4, "text": "Today we learn..." }
  ],
  "educational_events": [
    {
      "type": "concept | formula | definition | example | important_point",
      "content": "string",
      "timestamp_start": "number",
      "timestamp_end": "number"
    }
  ],
  "relationships": [
    { "source": "concept_A", "target": "concept_B", "relation_type": "string" }
  ]
}
```

## 5. Quiz & Diagnosis Pipeline
1. **Generation:** LLM generates 5 questions referencing the `educational_events`.
2. **Schema:** `[ { question, options, correct_answer, explanation, concept_tested, skill_level } ]`
3. **Evaluation:** Student answers are passed back to the LLM.
4. **Diagnosis:** LLM analyzes the `[ { question, user_answer, is_correct, concept_tested, skill_level } ]` array to identify patterns and outputs a `WeaknessReport` with evidence and recommended remediation text.

## 6. Data Flow & API Boundaries
* `POST /api/lectures` -> Uploads MP4, triggers transcription, returns job ID.
* `GET /api/lectures/{id}/status` -> Polling endpoint for processing status.
* `GET /api/lectures/{id}` -> Returns the complete Structured Lecture Data.
* `POST /api/lectures/{id}/quiz/evaluate` -> Submits answers, returns weakness diagnosis and remediation.
* `POST /api/lectures/{id}/chat` -> Processes Q&A for Blind Mode based on lecture context.

## 7. Model Abstraction Strategy
Keep model prompts and inference calls encapsulated in service classes (e.g., `ExtractionService`, `QuizService`) so underlying models can be swapped easily during the hackathon if hardware limits are hit.

## 8. Development Architecture
* Standard Python virtual environment (`.venv`) for the backend.
* `.env` for configuration and API keys.
* File system for temporary storage of uploaded videos and JSON outputs to minimize database setup overhead for the MVP.
