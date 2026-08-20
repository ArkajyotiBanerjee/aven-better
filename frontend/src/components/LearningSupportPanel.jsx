import React, { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Builds step-by-step chunked learning cards from StructuredLecture.
 */
function buildLearningSteps(lectureData) {
  if (!lectureData) return [];

  const steps = [];
  const title = lectureData.filename?.replace(/\.[^/.]+$/, "") || "Physics Topic";

  // 1. Focus Concept
  const mainConcept = lectureData.concepts?.[0]?.name || title;
  const conceptDesc = lectureData.concepts?.[0]?.description || 
    (lectureData.definitions?.[0]?.definition || "Describes the physical relationship connecting force, mass, and acceleration.");

  steps.push({
    id: 'step-concept',
    tag: 'FOCUS CONCEPT',
    title: mainConcept,
    subtitle: "Let's learn this core idea step by step.",
    content: (
      <div className="support-step-body">
        <div className="simple-expl-box">
          <span className="expl-tag">Simple Explanation</span>
          <p className="expl-text">
            <strong>{mainConcept}</strong> explains how <strong>force</strong>, <strong>mass</strong>, and <strong>acceleration</strong> are connected in the physical world.
          </p>
        </div>

        <div className="key-idea-box">
          <span className="idea-tag">💡 Key Idea</span>
          <p className="idea-text">
            When you push or pull an object (force), it speeds up (accelerates). How fast it speeds up depends on how heavy it is (mass).
          </p>
        </div>
      </div>
    ),
    spokenText: `${mainConcept}. Simple explanation: ${mainConcept} explains how force, mass, and acceleration are connected. Key idea: When you push or pull an object, it speeds up. How fast it speeds up depends on its mass.`
  });

  // 2. Core Definition
  if (lectureData.definitions && lectureData.definitions.length > 0) {
    const def = lectureData.definitions[0];
    steps.push({
      id: 'step-def',
      tag: 'CORE DEFINITION',
      title: def.term || mainConcept,
      subtitle: "The formal statement in simple words.",
      content: (
        <div className="support-step-body">
          <div className="definition-card-support">
            <span className="def-term-label">{def.term}:</span>
            <p className="def-text">{def.definition}</p>
          </div>

          <div className="simple-words-box">
            <span className="simple-label">In Plain English:</span>
            <p className="simple-desc">
              Force is what causes motion to change. A heavier object needs a bigger push to change speed.
            </p>
          </div>
        </div>
      ),
      spokenText: `Definition of ${def.term}: ${def.definition}. In plain English: Force is what causes motion to change. A heavier object needs a bigger push to change speed.`
    });
  }

  // 3. Mathematical Formula
  if (lectureData.formulas && lectureData.formulas.length > 0) {
    const formula = lectureData.formulas[0];
    steps.push({
      id: 'step-formula',
      tag: 'THE FORMULA',
      title: formula.equation || "F = ma",
      subtitle: "The math connecting these three parts.",
      content: (
        <div className="support-step-body">
          <div className="formula-display-box">
            <span className="formula-large">{formula.equation}</span>
            <span className="formula-words">Force = Mass × Acceleration</span>
          </div>

          <div className="variables-list-support">
            <div className="var-item">
              <span className="var-symbol">F</span>
              <div className="var-info">
                <strong>Force</strong> (measured in Newtons, N)
                <span className="var-note">The push or pull applied to the object.</span>
              </div>
            </div>

            <div className="var-item">
              <span className="var-symbol">m</span>
              <div className="var-info">
                <strong>Mass</strong> (measured in kilograms, kg)
                <span className="var-note">How much matter/weight the object has.</span>
              </div>
            </div>

            <div className="var-item">
              <span className="var-symbol">a</span>
              <div className="var-info">
                <strong>Acceleration</strong> (measured in m/s²)
                <span className="var-note">How quickly the speed is changing.</span>
              </div>
            </div>
          </div>
        </div>
      ),
      spokenText: `The formula is F equals m a, meaning Force equals mass multiplied by acceleration. F is Force in Newtons, m is mass in kilograms, and a is acceleration in meters per second squared.`
    });
  }

  // 4. Step-by-Step Worked Example
  if (lectureData.examples && lectureData.examples.length > 0) {
    const ex = lectureData.examples[0];
    steps.push({
      id: 'step-example',
      tag: 'STEP-BY-STEP EXAMPLE',
      title: "Solving a Problem Together",
      subtitle: "Let's break the teacher's example down one step at a time.",
      content: (
        <div className="support-step-body">
          <div className="example-problem-intro">
            <strong>Problem:</strong> {ex.scenario || "A 5 kg object experiences a force of 20 N. What is its acceleration?"}
          </div>

          <div className="steps-sequence">
            <div className="seq-step">
              <div className="seq-num">Step 1</div>
              <div className="seq-body">
                <strong>Identify what we know:</strong>
                <p>Mass (<span className="math-mono">m</span>) = 5 kg | Force (<span className="math-mono">F</span>) = 20 N</p>
              </div>
            </div>

            <div className="seq-step">
              <div className="seq-num">Step 2</div>
              <div className="seq-body">
                <strong>Choose the formula:</strong>
                <p><span className="math-mono">F = m × a</span> → Rearrange to find acceleration: <span className="math-mono">a = F / m</span></p>
              </div>
            </div>

            <div className="seq-step">
              <div className="seq-num">Step 3</div>
              <div className="seq-body">
                <strong>Substitute our numbers:</strong>
                <p><span className="math-mono">a = 20 / 5</span></p>
              </div>
            </div>

            <div className="seq-step seq-step-final">
              <div className="seq-num">Step 4</div>
              <div className="seq-body">
                <strong>Calculate the final answer:</strong>
                <p className="final-answer-text"><strong>a = 4 m/s²</strong> (4 meters per second squared)</p>
              </div>
            </div>
          </div>
        </div>
      ),
      spokenText: `Step by step example. Problem: A 5 kilogram object experiences a force of 20 Newtons. Step 1: Identify that mass is 5 kilograms and force is 20 Newtons. Step 2: Use acceleration equals force divided by mass. Step 3: Divide 20 by 5. Step 4: Acceleration equals 4 meters per second squared.`
    });
  }

  // 5. Key Principles & Proportionality
  if (lectureData.important_points && lectureData.important_points.length > 0) {
    steps.push({
      id: 'step-takeaway',
      tag: 'KEY PRINCIPLES',
      title: "What Happens When Things Change?",
      subtitle: "The two rules to always remember.",
      content: (
        <div className="support-step-body">
          <div className="rules-grid">
            <div className="rule-card rule-increase">
              <div className="rule-icon">⬆️</div>
              <div className="rule-info">
                <strong>More Force = More Speed Change</strong>
                <p>If you push twice as hard (double the force), the object accelerates twice as fast.</p>
              </div>
            </div>

            <div className="rule-card rule-decrease">
              <div className="rule-icon">⚖️</div>
              <div className="rule-info">
                <strong>More Mass = Less Acceleration</strong>
                <p>A heavier object is harder to accelerate with the same push.</p>
              </div>
            </div>
          </div>
        </div>
      ),
      spokenText: `Key principles: First, more force equals more acceleration. If you double the force, acceleration doubles. Second, more mass equals less acceleration. A heavier object is harder to accelerate.`
    });
  }

  // 6. Summary & Check Understanding
  steps.push({
    id: 'step-summary',
    tag: 'SUMMARY & PRACTICE',
    title: "Ready to Test Your Understanding?",
    subtitle: "You have reviewed all key concepts, the formula, and the worked example.",
    content: (
      <div className="support-step-body support-ready-box">
        <div className="ready-icon-wrap">🌟</div>
        <h3 className="ready-title">Great Progress!</h3>
        <p className="ready-desc">
          You have broken down <strong>{mainConcept}</strong> into simple, manageable steps. When you feel confident, check your understanding with a short practice assessment.
        </p>
      </div>
    ),
    isFinalStep: true,
    spokenText: `Great progress! You have reviewed all key concepts, formulas, and worked examples for ${mainConcept}. You are now ready to test your understanding.`
  });

  return steps;
}

export default function LearningSupportPanel({
  lectureData,
  onOpenQuiz
}) {
  const steps = useMemo(() => buildLearningSteps(lectureData), [lectureData]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech when step changes or component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleReadAloud = (text) => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      handleStopSpeech();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower, clearer pacing for learning support
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleGoToStep = (index) => {
    handleStopSpeech();
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  };

  const activeStep = steps[currentStepIndex] || steps[0];
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="support-workspace" role="main" aria-label="Learning Support Mode">
      <div className="support-container">
        {/* Top Focus Header Bar */}
        <div className="support-top-bar">
          <div className="support-badge-group">
            <span className="support-mode-pill">🧠 LEARNING SUPPORT</span>
            <span className="support-step-counter" aria-live="polite">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          <div className="support-progress-track" aria-hidden="true">
            <div 
              className="support-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Navigation Dots */}
        <nav className="support-dots-nav" aria-label="Learning steps navigation">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`support-dot-btn ${idx === currentStepIndex ? 'dot-active' : idx < currentStepIndex ? 'dot-completed' : ''}`}
              onClick={() => handleGoToStep(idx)}
              aria-label={`Jump to step ${idx + 1}: ${s.tag}`}
              aria-current={idx === currentStepIndex ? 'step' : undefined}
            >
              {idx + 1}
            </button>
          ))}
        </nav>

        {/* Main Focused Learning Card */}
        <article className="support-card" aria-labelledby="step-title">
          <div className="support-card-header">
            <span className="support-tag-pill">{activeStep.tag}</span>
            <h2 id="step-title" className="support-step-title">{activeStep.title}</h2>
            {activeStep.subtitle && (
              <p className="support-step-subtitle">{activeStep.subtitle}</p>
            )}
          </div>

          <div className="support-card-content">
            {activeStep.content}
          </div>

          {/* Read Aloud Action Button */}
          <div className="support-read-aloud-wrap">
            <button
              type="button"
              className={`btn-support-speak ${isSpeaking ? 'btn-speak-active' : ''}`}
              onClick={() => handleReadAloud(activeStep.spokenText)}
              aria-label={isSpeaking ? "Stop reading aloud" : "Read this step aloud"}
            >
              {isSpeaking ? '■ Stop Reading' : '🔊 Read Aloud'}
            </button>
          </div>
        </article>

        {/* Bottom Navigation & Quiz Action */}
        <div className="support-bottom-nav">
          <button
            type="button"
            className="btn-support-nav btn-support-prev"
            onClick={() => handleGoToStep(currentStepIndex - 1)}
            disabled={currentStepIndex === 0}
            aria-label="Previous step"
          >
            ← Previous Step
          </button>

          {activeStep.isFinalStep ? (
            <button
              type="button"
              className="btn-primary btn-support-quiz-cta"
              onClick={onOpenQuiz}
              aria-label="Open adaptive quiz to check understanding"
            >
              📝 Test My Understanding ➔
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary btn-support-next"
              onClick={() => handleGoToStep(currentStepIndex + 1)}
              aria-label="Next step"
            >
              Next Step ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
