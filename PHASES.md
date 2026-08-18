# Implementation Phases Roadmap

### Phase 0: Environment and validated transcription
**Status:** DONE
**Objective:** Confirm basic environment and `faster-whisper` functionality.

### Phase 1: Project foundation and backend structure
**Objective:** Set up FastAPI backend and React frontend boilerplates.
**Features:** Folder structures, CORS, basic API routing, React setup.
**Dependencies:** None.

### Phase 2: Lecture ingestion and transcription service
**Objective:** Build an endpoint to upload a video and return a timestamped transcript.
**Features:** File upload handling, integration of the `transcribe.py` logic into a service, returning JSON.
**What NOT to do:** Do not over-engineer file storage (use local disk for MVP).

### Phase 3: Structured educational event extraction
**Objective:** Pass the transcript to an LLM to generate the Central Structured Representation.
**Features:** Prompt engineering, structured JSON extraction (concepts, formulas, timestamps).
**Dependencies:** Phase 2.

### Phase 4: Deaf mode
**Objective:** Build the core UI for the Deaf/Hard-of-Hearing persona.
**Features:** Video player synced with live-style captions, AI learning insight cards populating on timestamps, concept timeline.
**Dependencies:** Phase 3.

### Phase 5: Smart notes
**Objective:** Generate and display structured lecture notes.
**Features:** Note rendering based on the structured representation (Core idea, Key concepts, Examples).
**Dependencies:** Phase 3.

### Phase 6: Blind/audio mode
**Objective:** Build the audio-first learning experience.
**Features:** UI for Blind mode, Text-to-Speech integration for insights, lecture-grounded Q&A chat endpoint.
**Dependencies:** Phase 3.

### Phase 7: Quiz generation
**Objective:** Generate a contextual 5-question quiz.
**Features:** LLM endpoint for quiz generation, React UI for taking the quiz, tracking answers.
**Dependencies:** Phase 3.

### Phase 8: Weakness detection
**Objective:** Implement the core AI diagnosis logic.
**Features:** Endpoint taking quiz results and returning a weakness report with evidence.
**Dependencies:** Phase 7.

### Phase 9: Personalized remediation
**Objective:** Close the learning loop with adaptive teaching.
**Features:** Generating a short intervention based on the weakness report, presenting a follow-up reassessment question.
**Dependencies:** Phase 8.

### Phase 10: Concept map
**Objective:** Visualize relationships between concepts.
**Features:** Simple React Flow or Mermaid diagram generation based on structured relationships.
**What NOT to do:** Do not build a complex knowledge graph algorithm.

### Phase 11: Integration
**Objective:** Connect all pieces into a single coherent flow.
**Features:** Linking upload -> processing -> dashboard -> modes -> quiz loop.

### Phase 12: UI polish
**Objective:** Ensure the application looks premium and accessible.
**Features:** Styling, contrast checks, typography, loading states.

### Phase 13: Demo hardening
**Objective:** Prepare for the final presentation.
**Features:** Pre-loading the demo lecture (e.g., Newton's Second Law) to ensure absolute stability during the presentation. Fix bugs.
