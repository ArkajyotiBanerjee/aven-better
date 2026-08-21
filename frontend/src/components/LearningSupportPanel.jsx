import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  Volume2, 
  Square, 
  ArrowLeft, 
  ArrowRight, 
  CheckSquare, 
  Sparkles,
  TrendingUp,
  Scale,
  Lightbulb
} from 'lucide-react';

/**
 * Builds step-by-step chunked learning cards dynamically from StructuredLecture.
 */
function buildLearningSteps(lectureData) {
  if (!lectureData) return [];

  const steps = [];
  const title = lectureData.filename?.includes('sliding_window') || lectureData.filename?.includes('dsa')
    ? 'Sliding Window Algorithm'
    : (lectureData.filename?.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || "Technical Topic");

  // 1. Focus Concept
  const mainConceptObj = lectureData.concepts?.[0];
  const mainConcept = mainConceptObj?.name || title;
  const conceptDesc = mainConceptObj?.description || `Master the foundational principles and methods of ${mainConcept}.`;

  steps.push({
    id: 'step-concept',
    tag: 'FOCUS CONCEPT',
    title: mainConcept,
    subtitle: "Let's learn this core idea step by step.",
    content: (
      <div className="support-step-body">
        <div className="simple-expl-box">
          <span className="expl-tag">Overview</span>
          <p className="expl-text">
            <strong>{mainConcept}</strong>: {conceptDesc}
          </p>
        </div>

        <div className="key-idea-box">
          <span className="idea-tag">
            <Lightbulb size={15} className="inline-icon" aria-hidden="true" />
            <span>Key Idea</span>
          </span>
          <p className="idea-text">
            {lectureData.concepts && lectureData.concepts.length > 1
              ? `Connects foundational building blocks: ${lectureData.concepts.slice(0, 3).map(c => c.name).join(' → ')} to solve computational problems efficiently in linear time.`
              : `Focus on how states, variables, and parameters transform step-by-step to reach the optimal solution.`}
          </p>
        </div>
      </div>
    ),
    spokenText: `${mainConcept}. Overview: ${conceptDesc}. Focus on understanding each transformation step-by-step.`
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
            <span className="simple-label">In Plain Terms:</span>
            <p className="simple-desc">
              {def.definition.length > 120 ? def.definition.slice(0, 120) + '...' : def.definition}
            </p>
          </div>
        </div>
      ),
      spokenText: `Definition of ${def.term}: ${def.definition}.`
    });
  }

  // 3. Mathematical Formula / State Transition / Rule
  if (lectureData.formulas && lectureData.formulas.length > 0) {
    const formula = lectureData.formulas[0];
    const formulaExpr = formula.expression || formula.equation || formula.name || "State Update Rule";
    
    // Parse variables safely
    let varsList = [];
    if (formula.variables) {
      if (typeof formula.variables === 'object' && !Array.isArray(formula.variables)) {
        varsList = Object.entries(formula.variables).map(([k, v]) => ({ symbol: k, name: String(v) }));
      } else if (Array.isArray(formula.variables)) {
        varsList = formula.variables.map(v => typeof v === 'object' ? { symbol: v.symbol || v.name || 'var', name: v.description || v.name || '' } : { symbol: String(v), name: 'Parameter' });
      }
    }

    steps.push({
      id: 'step-formula',
      tag: 'THE GOVERNING RULE / FORMULA',
      title: formulaExpr,
      subtitle: formula.description || "The core logic and state transition.",
      content: (
        <div className="support-step-body">
          <div className="formula-display-box">
            <span className="formula-large">{formulaExpr}</span>
            {formula.description && (
              <span className="formula-words">{formula.description}</span>
            )}
          </div>

          {varsList.length > 0 && (
            <div className="variables-list-support">
              {varsList.map((v, vIdx) => (
                <div key={vIdx} className="var-item">
                  <span className="var-symbol">{v.symbol}</span>
                  <div className="var-info">
                    <strong>{v.name}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      spokenText: `The governing formula or rule is: ${formulaExpr}. ${formula.description || ''}`
    });
  }

  // 4. Step-by-Step Worked Example
  if (lectureData.examples && lectureData.examples.length > 0) {
    const ex = lectureData.examples[0];
    const scenarioText = ex.scenario || ex.topic || "Worked problem demonstration";

    steps.push({
      id: 'step-example',
      tag: 'STEP-BY-STEP WORKED EXAMPLE',
      title: ex.topic || "Practical Problem Walkthrough",
      subtitle: "Let's break the example down into clear, structured steps.",
      content: (
        <div className="support-step-body">
          <div className="example-problem-intro">
            <strong>Scenario:</strong> {scenarioText}
          </div>

          <div className="steps-sequence">
            <div className="seq-step">
              <div className="seq-num">Step 1</div>
              <div className="seq-body">
                <strong>Identify given inputs & constraints:</strong>
                <p>{scenarioText}</p>
              </div>
            </div>

            <div className="seq-step">
              <div className="seq-num">Step 2</div>
              <div className="seq-body">
                <strong>Apply method & state transition:</strong>
                <p>{ex.explanation || "Process inputs systematically using the core formula/algorithm."}</p>
              </div>
            </div>

            {ex.result && (
              <div className="seq-step seq-step-final">
                <div className="seq-num">Step 3</div>
                <div className="seq-body">
                  <strong>Obtain the final outcome:</strong>
                  <p className="final-answer-text"><strong>{ex.result}</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      spokenText: `Step by step worked example. Scenario: ${scenarioText}. Method: ${ex.explanation || 'Process inputs systematically.'} Result: ${ex.result || 'Target computed successfully.'}`
    });
  }

  // 5. Key Principles & Critical Takeaways
  if (lectureData.important_points && lectureData.important_points.length > 0) {
    const points = lectureData.important_points.slice(0, 2);
    steps.push({
      id: 'step-takeaway',
      tag: 'KEY PRINCIPLES',
      title: "Core Takeaways to Remember",
      subtitle: "The foundational rules for solving problems in this topic.",
      content: (
        <div className="support-step-body">
          <div className="rules-grid">
            {points.map((pt, pIdx) => (
              <div key={pIdx} className={`rule-card ${pIdx === 0 ? 'rule-increase' : 'rule-decrease'}`}>
                <div className="rule-icon-wrap" aria-hidden="true">
                  {pIdx === 0 ? <TrendingUp size={22} /> : <Scale size={22} />}
                </div>
                <div className="rule-info">
                  <strong>Key Takeaway {pIdx + 1}</strong>
                  <p>{pt.point || pt.text || JSON.stringify(pt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      spokenText: `Key principles: ${points.map((p, i) => `Point ${i + 1}: ${p.point || p.text}`).join('. ')}`
    });
  }

  // 6. Summary & Check Understanding
  steps.push({
    id: 'step-summary',
    tag: 'SUMMARY & PRACTICE',
    title: "Ready to Test Your Understanding?",
    subtitle: "You have reviewed all key concepts, formulas, and worked examples.",
    content: (
      <div className="support-step-body support-ready-box">
        <div className="ready-icon-wrap" aria-hidden="true">
          <Sparkles size={36} className="sparkle-svg-ready" />
        </div>
        <h3 className="ready-title">Great Progress!</h3>
        <p className="ready-desc">
          You have broken down <strong>{mainConcept}</strong> into simple, manageable steps. When you feel confident, check your understanding with the adaptive assessment.
        </p>
      </div>
    ),
    isFinalStep: true,
    spokenText: `Great progress! You have reviewed all key concepts, rules, and worked examples for ${mainConcept}. You are now ready to test your understanding.`
  });

  return steps;
}

export default function LearningSupportPanel({
  lectureData,
  onOpenQuiz
}) {
  const steps = useMemo(() => buildLearningSteps(lectureData), [lectureData]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState('forward'); // 'forward' | 'backward'
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
    utterance.rate = 0.95; // Clear pacing for learning support
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleGoToStep = (index, forcedDirection = null) => {
    handleStopSpeech();
    if (index >= 0 && index < steps.length) {
      const dir = forcedDirection || (index >= currentStepIndex ? 'forward' : 'backward');
      setDirection(dir);
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
            <div className="support-mode-pill">
              <Brain size={14} aria-hidden="true" />
              <span>COGNITIVE SUPPORT</span>
            </div>
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

        {/* Main Focused Learning Card with Top Read Aloud Action */}
        <article 
          key={`support-step-${currentStepIndex}`}
          className={`support-card anim-slide-${direction}`} 
          aria-labelledby="step-title"
        >
          <div className="support-card-header-row">
            <div className="support-card-header-text">
              <span className="support-tag-pill">{activeStep.tag}</span>
              <h2 id="step-title" className="support-step-title">{activeStep.title}</h2>
              {activeStep.subtitle && (
                <p className="support-step-subtitle">{activeStep.subtitle}</p>
              )}
            </div>

            {/* Read Aloud Action Button placed prominently in header */}
            <button
              type="button"
              className={`btn-support-speak ${isSpeaking ? 'btn-speak-active' : ''}`}
              onClick={() => handleReadAloud(activeStep.spokenText)}
              aria-label={isSpeaking ? "Stop reading aloud" : "Read this step aloud"}
            >
              {isSpeaking ? (
                <>
                  <Square size={13} aria-hidden="true" fill="currentColor" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 size={15} aria-hidden="true" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>
          </div>

          <div className="support-card-content">
            {activeStep.content}
          </div>
        </article>

        {/* Bottom Navigation & Quiz Action */}
        <div className="support-bottom-nav">
          <button
            type="button"
            className="btn-support-nav btn-support-prev"
            onClick={() => handleGoToStep(currentStepIndex - 1, 'backward')}
            disabled={currentStepIndex === 0}
            aria-label="Previous step"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Previous Step</span>
          </button>

          {activeStep.isFinalStep ? (
            <button
              type="button"
              className="btn-support-quiz-cta"
              onClick={onOpenQuiz}
              aria-label="Open adaptive quiz to check understanding"
            >
              <CheckSquare size={16} aria-hidden="true" />
              <span>Test My Understanding ➔</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-support-next"
              onClick={() => handleGoToStep(currentStepIndex + 1, 'forward')}
              aria-label="Next step"
            >
              <span>Next Step</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
