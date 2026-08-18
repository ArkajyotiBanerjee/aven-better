# Product Design & UX Specification

## 1. Design Principles
* **Modern & Trustworthy:** Clean lines, professional feel, communicating reliability.
* **Accessible:** High contrast, legible typography, clear visual hierarchy.
* **Educational & Calm:** Minimal distractions, focusing the user's attention on the learning material.
* **Technically Sophisticated:** Smart use of space and micro-interactions, avoiding a "generic AI dashboard" look.

## 2. Visual Identity
* **Color Direction:** 
  * Background: Soft, off-white or light gray to reduce eye strain.
  * Primary Accent: A calming but distinct color (e.g., deep cerulean blue or soft indigo).
  * Semantic Colors: Subtle greens for success/correct, soft ambers for warnings/remediation.
* **Typography:**
  * Modern sans-serif (e.g., Inter, Roboto, or Outfit).
  * Large, legible base font size (min 16px).
  * High contrast between text and background.
* **Spacing:** Generous padding and margins to prevent cognitive overload.

## 3. UI Components
* **Cards:** Soft shadows, slightly rounded corners. Used for grouping concepts, questions, and insights.
* **Buttons:** Distinct primary and secondary states. Clear hover effects. Sufficient tap targets.
* **Status Indicators:** Clear visual cues for loading, processing (e.g., "Extracting Concepts..."), and success.
* **Insight Tags:** Small pill-shaped badges for identifying types of information (e.g., `[🆕 Concept]`, `[🧮 Formula]`).

## 4. Main Lecture Screen Layout (Deaf Mode & General View)
The primary layout prioritizes information hierarchy:

```text
┌─────────────────────────────────────────────┐
│                  ACCESSLEARN                │
├──────────────────┬──────────────────────────┤
│                  │                          │
│      VIDEO       │      AI INSIGHTS         │
│      PLAYER      │                          │
│                  │  🆕 NEW CONCEPT          │
│                  │  Newton's Second Law     │
│                  │                          │
│                  │  🧮 KEY FORMULA          │
│                  │  F = ma                  │
│                  │                          │
├──────────────────┴──────────────────────────┤
│ LIVE CAPTIONS                               │
│ "Force is equal to mass multiplied..."      │
└─────────────────────────────────────────────┘
```

* **Video Player:** Prominent positioning.
* **AI Insights Panel:** Dynamically updates based on the current timestamp. Displays visual cues synchronized with the lecture.
* **Live Captions:** Large, readable, centered below the video.

## 5. View Modes

### 5.1. Blind Mode Interface
* High-contrast, extremely simplified layout.
* Large, screen-reader optimized buttons for "Play Lecture", "Pause", "Ask Question".
* Focus indicator highlights for keyboard navigation.

### 5.2. Notes & Concept Map Screen
* Two-column layout or toggleable tabs.
* **Notes:** Structured markdown-style rendering (Core idea -> Concepts -> Examples).
* **Concept Map:** Clean, interactive node graph using a library like React Flow.

### 5.3. Quiz & Remediation Screen
* Single question presented at a time to maintain focus.
* Clear selection states for multiple-choice options.
* **Diagnosis Panel:** When a weakness is detected, it appears as a supportive, encouraging card, seamlessly flowing into the personalized remediation lesson.

## 6. Responsive Behavior
* Ensure the video and insights stack vertically on smaller screens, keeping the captions locked to the viewport if necessary.
* For the hackathon MVP, prioritize desktop/tablet landscape view as it is the most likely demo environment.
