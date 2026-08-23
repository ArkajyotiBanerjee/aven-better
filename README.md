# Aven.better

### AI-Powered Centralized Placement Preparation System

Aven.better brings learning, resume analysis, adaptive technical interviews, assessment, and learner progress into one unified platform.

> **Learn → Diagnose → Improve → Prove**

## 🚀 Live Demo

**[Open Aven.better](https://aven-better.vercel.app)**

**[GitHub Repository](https://github.com/ArkajyotiBanerjee/aven-better)**

---

## ✨ Key Features

### 🎙 AI Interview 2.0
- Resume- and role-grounded technical interviews
- Adaptive follow-up questions based on previous answers
- Camera + microphone preflight
- AI interviewer speaks questions aloud
- Candidate can answer by **voice or typing**
- Live editable speech transcript
- Context-aware handling of speech-recognition errors
- Final technical evaluation with strengths, gaps and recommendations

### 📄 Resume Intelligence
- Upload a technical PDF resume
- Optional targeted-role analysis
- Evidence vs. generic claims
- Project and technical-depth analysis
- Role alignment and priority gaps
- Actionable improvement plan

### 🎥 Learning Studio
- Technical video ingestion
- Whisper-powered transcription
- Structured learning experience
- Captions, insights and accessibility support
- Assessment, diagnosis and remediation workflows

### 📊 Centralized Dashboard
A single workspace connecting:
**Learning • Interviews • Resume • Assessment • Progress**

---

## 🛠 Tech Stack

**Frontend:** React, Vite, JavaScript, CSS  
**Backend:** Python, FastAPI, Pydantic  
**AI:** Groq LLMs  
**Speech:** Browser SpeechRecognition + SpeechSynthesis  
**Video:** Whisper transcription  
**Database:** SQLite  
**Resume Processing:** pypdf  
**Deployment:** Vercel + Railway

---

## 🏗 Architecture

```text
React / Vite
     │
     ▼
 FastAPI Backend
     │
 ┌───┼───────────────┐
 ▼   ▼               ▼
Groq SQLite       Whisper
 │     │              │
 ▼     ▼              ▼
AI    Learner       Video
      Data        → Learning
