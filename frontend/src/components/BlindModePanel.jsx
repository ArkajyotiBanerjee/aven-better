import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  MessageSquare, 
  Send, 
  HelpCircle, 
  Headphones,
  Sparkles
} from 'lucide-react';

const API_BASE_URL = '';

const PRESET_QUESTIONS = [
  "What is the sliding window method?",
  "How does the window sum update?",
  "What is the time complexity of the update?",
  "Can you give an example calculation?"
];

/**
 * Transforms algebraic and algorithmic expressions into clear spoken language for Text-to-Speech.
 */
function formatSpokenMathAndDSA(raw) {
  if (!raw) return '';
  return raw
    .replace(/arr\[(\w+)\]/g, "array at index $1")
    .replace(/arr\[0\]/g, "array at index zero")
    .replace(/arr\[k\]/g, "array at index k")
    .replace(/O\(1\)/gi, "O of 1 constant time")
    .replace(/O\(n\)/gi, "O of N linear time")
    .replace(/O\(N\)/g, "O of N linear time")
    .replace(/O\(k\)/gi, "O of k time")
    .replace(/new_sum\s*=\s*old_sum\s*\+\s*arr\[(\w+)\]\s*-\s*arr\[(\w+)\]/gi, "new sum equals old sum plus array at index $1 minus array at index $2")
    .replace(/sum_new\s*=\s*sum_old\s*\+\s*arr\[(\w+)\]\s*-\s*arr\[(\w+)\]/gi, "new sum equals old sum plus array at index $1 minus array at index $2")
    .replace(/k\s*-\s*1/g, "k minus 1")
    .replace(/k\s*-\s*window_size/gi, "k minus window size")
    .replace(/F\s*=\s*m\s*a/gi, "Force equals mass multiplied by acceleration")
    .replace(/a\s*=\s*F\s*\/\s*m/gi, "acceleration equals force divided by mass")
    .replace(/(\d+)\s*m\/s\^?2/gi, "$1 meters per second squared")
    .replace(/(\d+)\s*kg/gi, "$1 kilograms")
    .replace(/(\d+)\s*N\b/g, "$1 Newtons");
}

/**
 * Transforms StructuredLecture into natural spoken-language audio sections.
 */
function buildAudioSections(lectureData) {
  if (!lectureData) return [];

  const sections = [];

  // 1. Introduction
  const title = lectureData.filename?.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || "Technical Topic";
  sections.push({
    id: 'sec-intro',
    title: 'Introduction & Overview',
    type: 'intro',
    spokenText: `Welcome to the audio lesson on ${title}. In this session, we will cover the core concepts, definitions, governing rules, and worked examples step-by-step.`,
    summary: `Overview of ${title}.`
  });

  // 2. Concepts & Definitions
  if (lectureData.concepts && lectureData.concepts.length > 0) {
    const conceptTexts = lectureData.concepts.map(c => {
      const def = lectureData.definitions?.find(d => d.term?.toLowerCase() === c.name?.toLowerCase());
      const defText = def ? `Definition: ${def.definition}.` : (c.description ? `Description: ${c.description}.` : '');
      return `Key concept: ${c.name}. ${defText}`;
    }).join(' ');

    sections.push({
      id: 'sec-concepts',
      title: 'Key Concepts & Definitions',
      type: 'concept',
      spokenText: conceptTexts || `The main concept in this session is ${title}.`,
      summary: lectureData.concepts.map(c => c.name).join(', ')
    });
  }

  // 3. Formulas & State Transitions
  if (lectureData.formulas && lectureData.formulas.length > 0) {
    const formulaTexts = lectureData.formulas.map(f => {
      let spokenEq = formatSpokenMathAndDSA(f.expression || f.equation || f.name || '');
      let vars = '';
      if (f.variables) {
        if (typeof f.variables === 'object' && !Array.isArray(f.variables)) {
          vars = Object.entries(f.variables).map(([k, v]) => `${k} represents ${v}`).join(', ');
        } else if (Array.isArray(f.variables)) {
          vars = f.variables.map(v => typeof v === 'object' ? `${v.symbol || v.name} represents ${v.description || v.name}` : String(v)).join(', ');
        }
      }
      return `Key rule or formula: ${spokenEq}. ${vars ? `In this equation, ${vars}.` : ''} ${f.description || ''}`;
    }).join(' ');

    sections.push({
      id: 'sec-formulas',
      title: 'Governing Rules & Formulas',
      type: 'formula',
      spokenText: formulaTexts,
      summary: lectureData.formulas.map(f => f.expression || f.equation || f.name).join(', ')
    });
  }

  // 4. Examples
  if (lectureData.examples && lectureData.examples.length > 0) {
    const exampleTexts = lectureData.examples.map(ex => {
      let spokenScenario = formatSpokenMathAndDSA(ex.scenario || ex.topic || '');
      let spokenResult = formatSpokenMathAndDSA(ex.result || '');

      return `Practical example: ${spokenScenario}. ${spokenResult ? `Result: ${spokenResult}.` : ''} ${ex.explanation || ''}`;
    }).join(' ');

    sections.push({
      id: 'sec-examples',
      title: 'Worked Examples & Demonstrations',
      type: 'example',
      spokenText: exampleTexts,
      summary: lectureData.examples.map(e => e.topic || e.scenario).join(' | ')
    });
  }

  // 5. Important Points & Takeaways
  if (lectureData.important_points && lectureData.important_points.length > 0) {
    const pointsTexts = lectureData.important_points.map((p, i) => `Point ${i + 1}: ${formatSpokenMathAndDSA(p.point || p.text || '')}.`).join(' ');
    sections.push({
      id: 'sec-points',
      title: 'Important Points & Principles',
      type: 'points',
      spokenText: pointsTexts,
      summary: `${lectureData.important_points.length} key takeaway principles.`
    });
  }

  // 6. Summary & Conclusion
  sections.push({
    id: 'sec-summary',
    title: 'Lesson Summary & Practice',
    type: 'summary',
    spokenText: `You have completed the audio lesson on ${title}. You can ask any question about this lecture using the interactive assistant below, or test your understanding with the adaptive assessment.`,
    summary: 'Audio lesson completion and next steps.'
  });

  return sections;
}

export default function BlindModePanel({
  lectureData,
  onOpenQuiz
}) {
  const audioSections = useMemo(() => buildAudioSections(lectureData), [lectureData]);

  // Audio Playback State
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Q&A State
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState([]);
  const [activeAnswerPlayingId, setActiveAnswerPlayingId] = useState(null);

  const utteranceRef = useRef(null);

  // Clean up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text, onEndCallback = null) => {
    if (!window.speechSynthesis) {
      alert("Browser Speech Synthesis is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    setIsPlaying(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  // Play a specific section
  const handlePlaySection = (index, continuous = false) => {
    if (index < 0 || index >= audioSections.length) return;

    setCurrentSectionIndex(index);
    const section = audioSections[index];
    const textToRead = `${section.title}. ${section.spokenText}`;

    speakText(textToRead, () => {
      if (continuous && index + 1 < audioSections.length) {
        handlePlaySection(index + 1, true);
      } else {
        setIsPlaying(false);
      }
    });
  };

  // Play / Pause / Resume / Stop full lesson
  const handlePlayFullLesson = () => {
    if (isPaused && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      setAutoAdvance(true);
      handlePlaySection(currentSectionIndex, true);
    }
  };

  const handlePause = () => {
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      const prevIdx = currentSectionIndex - 1;
      setCurrentSectionIndex(prevIdx);
      if (isPlaying) {
        handlePlaySection(prevIdx, autoAdvance);
      }
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < audioSections.length - 1) {
      const nextIdx = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIdx);
      if (isPlaying) {
        handlePlaySection(nextIdx, autoAdvance);
      }
    }
  };

  // Q&A submission
  const handleAskQuestion = async (queryText) => {
    const q = (queryText || questionInput).trim();
    if (!q || !lectureData?.lecture_id) return;

    setIsAsking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lectures/${lectureData.lecture_id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to get answer from lecture assistant.");
      }

      const data = await res.json();
      const newQaItem = {
        id: `qa-${Date.now()}`,
        question: q,
        answer: data.answer,
        sources: data.sources || []
      };

      setQaHistory(prev => [newQaItem, ...prev]);
      setQuestionInput('');
    } catch (e) {
      console.error(e);
      const errorItem = {
        id: `qa-err-${Date.now()}`,
        question: q,
        answer: e.message || 'Could not get an answer right now. Please try again.',
        sources: [],
        isError: true
      };
      setQaHistory(prev => [errorItem, ...prev]);
      setQuestionInput('');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSpeakAnswer = (qaItem) => {
    if (activeAnswerPlayingId === qaItem.id && isPlaying) {
      handleStop();
      setActiveAnswerPlayingId(null);
      return;
    }

    setActiveAnswerPlayingId(qaItem.id);
    speakText(`Answer: ${qaItem.answer}`, () => {
      setActiveAnswerPlayingId(null);
    });
  };

  const activeSection = audioSections[currentSectionIndex] || audioSections[0];

  return (
    <div className="blind-mode-workspace" role="main" aria-label="Audio-first learning mode">
      <div className="blind-mode-grid">
        {/* Left Column: Audio Lesson Player */}
        <section className="audio-player-column" aria-labelledby="player-heading">
          <div className="audio-player-card">
            <div className="player-header">
              <div className="mode-pill-audio">
                <Headphones size={14} aria-hidden="true" />
                <span>AUDIO-FIRST INTELLIGENCE</span>
              </div>
              <span 
                className="section-counter" 
                aria-live="polite"
                aria-atomic="true"
              >
                Section {currentSectionIndex + 1} of {audioSections.length}
              </span>
            </div>

            <h2 id="player-heading" className="active-section-title">
              {activeSection?.title}
            </h2>

            <div className="spoken-text-container" tabIndex="0" aria-label="Current section text content">
              <p className="spoken-text-body">{activeSection?.spokenText}</p>
            </div>

            {/* Main Audio Controls */}
            <div className="player-controls-row" role="toolbar" aria-label="Audio lesson playback controls">
              <button
                type="button"
                className="btn-audio-nav"
                onClick={handlePrevSection}
                disabled={currentSectionIndex === 0}
                aria-label="Previous section"
              >
                <SkipBack size={16} aria-hidden="true" />
                <span>Prev</span>
              </button>

              {!isPlaying ? (
                <button
                  type="button"
                  className="btn-audio-main btn-play"
                  onClick={handlePlayFullLesson}
                  aria-label={isPaused ? "Resume audio lesson" : "Play entire audio lesson"}
                >
                  <Play size={18} aria-hidden="true" fill="currentColor" />
                  <span>{isPaused ? "Resume Lesson" : "Play Lesson"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-audio-main btn-pause"
                  onClick={handlePause}
                  aria-label="Pause audio lesson"
                >
                  <Pause size={18} aria-hidden="true" fill="currentColor" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                className="btn-audio-main btn-stop"
                onClick={handleStop}
                disabled={!isPlaying && !isPaused}
                aria-label="Stop audio"
              >
                <Square size={16} aria-hidden="true" fill="currentColor" />
                <span>Stop</span>
              </button>

              <button
                type="button"
                className="btn-audio-nav"
                onClick={handleNextSection}
                disabled={currentSectionIndex === audioSections.length - 1}
                aria-label="Next section"
              >
                <span>Next</span>
                <SkipForward size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Quick Section Jump List */}
            <div className="sections-nav-list" role="navigation" aria-label="Lesson sections table of contents">
              <h3 className="toc-heading">Lesson Outline</h3>
              <ul className="toc-items-list" role="list">
                {audioSections.map((sec, idx) => {
                  const isCurrent = idx === currentSectionIndex;
                  return (
                    <li key={sec.id} className="toc-item">
                      <button
                        type="button"
                        className={`btn-toc-jump ${isCurrent ? 'active-toc' : ''}`}
                        onClick={() => handlePlaySection(idx, false)}
                        aria-current={isCurrent ? 'true' : undefined}
                        aria-label={`Jump to section ${idx + 1}: ${sec.title}`}
                      >
                        <span className="toc-num">{idx + 1}.</span>
                        <span className="toc-title">{sec.title}</span>
                        {isCurrent && isPlaying && (
                          <Volume2 size={16} className="playing-icon-svg" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* Right Column: Lecture-Grounded Q&A Assistant */}
        <section className="audio-qa-column" aria-labelledby="qa-heading">
          <div className="audio-qa-card">
            <div className="qa-header-group">
              <div className="qa-title-row">
                <MessageSquare size={22} className="qa-title-icon" aria-hidden="true" />
                <h2 id="qa-heading" className="qa-main-title">
                  Ask About This Lecture
                </h2>
              </div>
              <p className="qa-subtitle">
                Ask any question grounded strictly in the lecture concepts, formulas, and examples.
              </p>
            </div>

            {/* Quick Preset Question Buttons */}
            <div className="preset-questions-section" aria-label="Suggested questions">
              <span className="preset-label">Suggested Questions:</span>
              <div className="preset-buttons-group">
                {PRESET_QUESTIONS.map((pq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn-preset-q"
                    onClick={() => handleAskQuestion(pq)}
                    disabled={isAsking}
                    aria-label={`Ask preset question: ${pq}`}
                  >
                    <HelpCircle size={14} aria-hidden="true" />
                    <span>{pq}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Question Form */}
            <form 
              className="qa-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion();
              }}
            >
              <label htmlFor="custom-qa-input" className="sr-only">
                Type your question about the lecture
              </label>
              <input
                id="custom-qa-input"
                type="text"
                className="qa-text-input"
                placeholder="Ask a question about this lecture..."
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                disabled={isAsking}
                aria-label="Ask a question about this lecture"
              />
              <button
                type="submit"
                className="btn-primary btn-qa-submit"
                disabled={!questionInput.trim() || isAsking}
                aria-label="Submit question to lecture assistant"
              >
                {isAsking ? 'Thinking...' : (
                  <>
                    <span>Ask</span>
                    <Send size={15} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Status Announcement for Screen Readers */}
            <div className="sr-only" aria-live="polite">
              {isAsking && "Finding answer from lecture content..."}
            </div>

            {/* Q&A Responses List */}
            <div className="qa-responses-container" aria-label="Lecture question and answer responses">
              {qaHistory.length === 0 ? (
                <div className="qa-empty-state">
                  <p>No questions asked yet. Select a suggested question above or type your own.</p>
                </div>
              ) : (
                qaHistory.map((item) => {
                  const isPlayingThis = activeAnswerPlayingId === item.id;
                  return (
                    <article key={item.id} className={`qa-item-card ${item.isError ? 'qa-item-error' : ''}`} aria-label={`Question: ${item.question}`}>
                      <div className="qa-question-bar">
                        <span className="qa-q-badge" aria-hidden="true">Q:</span>
                        <h3 className="qa-question-text">{item.question}</h3>
                      </div>

                      <div className="qa-answer-box">
                        <p className="qa-answer-text">{item.answer}</p>
                      </div>

                      <div className="qa-item-footer">
                        <button
                          type="button"
                          className={`btn-listen-answer ${isPlayingThis ? 'btn-listening' : ''}`}
                          onClick={() => handleSpeakAnswer(item)}
                          aria-label={isPlayingThis ? "Stop listening to answer" : "Listen to answer read aloud"}
                        >
                          {isPlayingThis ? (
                            <>
                              <Square size={14} aria-hidden="true" fill="currentColor" />
                              <span>Stop Listening</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={15} aria-hidden="true" />
                              <span>Listen to Answer</span>
                            </>
                          )}
                        </button>

                        {item.sources && item.sources.length > 0 && (
                          <div className="qa-sources-wrap">
                            <span className="source-label">Source:</span>
                            {item.sources.map((src, sIdx) => (
                              <span key={sIdx} className="source-tag">
                                {src.section} {src.timestamp !== undefined ? `(${src.timestamp}s)` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
