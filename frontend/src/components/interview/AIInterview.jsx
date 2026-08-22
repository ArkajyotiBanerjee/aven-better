import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Brain,
  Terminal,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  Layers,
  Code2,
  Globe,
  Cpu
} from 'lucide-react';

const API_BASE_URL = '';

const TOPICS = [
  {
    id: 'Data Structures & Algorithms',
    title: 'Data Structures & Algorithms',
    desc: 'Arrays, pointers, trees, graphs, space-time complexity, and algorithmic trade-offs.',
    icon: Layers,
  },
  {
    id: 'JavaScript',
    title: 'JavaScript & Web Runtimes',
    desc: 'Event loop, closures, prototypes, asynchronous concurrency, and memory management.',
    icon: Code2,
  },
  {
    id: 'Web Development',
    title: 'Full-Stack Web Architecture',
    desc: 'Critical rendering path, caching, SSR vs CSR, browser security, and HTTP protocols.',
    icon: Globe,
  },
  {
    id: 'Computer Science Fundamentals',
    title: 'Computer Science Fundamentals',
    desc: 'Operating systems, threads/processes, ACID transactions, and distributed consensus.',
    icon: Cpu,
  },
];

const DIFFICULTIES = [
  { id: 'Foundational', label: 'Foundational', desc: 'Core definitions, basic mechanics & direct comparisons' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Real-world problem solving, trade-offs & edge cases' },
  { id: 'Advanced', label: 'Advanced', desc: 'System-level constraints, scale anomalies & architectural reasoning' },
];

export default function AIInterview({ onNavigateDashboard, user }) {
  // Setup & flow state: 'setup' | 'interview' | 'report'
  const [stage, setStage] = useState('setup');
  const [selectedTopic, setSelectedTopic] = useState('Data Structures & Algorithms');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate');
  
  // Active interview state
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [latestEvaluation, setLatestEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

  // Status & loading indicators
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const responseInputRef = useRef(null);

  // Auto-focus response box on question change
  useEffect(() => {
    if (stage === 'interview' && !loading && responseInputRef.current) {
      responseInputRef.current.focus();
    }
  }, [stage, roundNumber, loading]);

  // Start new interview
  const handleStartInterview = async () => {
    setLoading(true);
    setLoadingMsg('Initializing technical interview chamber & generating Round 1 inquiry...');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: selectedDifficulty,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to start interview.');
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setCurrentQuestion(data.initial_question);
      setRoundNumber(1);
      setUserAnswer('');
      setLatestEvaluation(null);
      setHistory([]);
      setFinalReport(null);
      setStage('interview');
    } catch (e) {
      console.error('Start interview error:', e);
      setErrorMsg(e.message || 'Could not initiate interview session.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Submit response for current round
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      setErrorMsg('Please type your response before submitting.');
      return;
    }

    setLoading(true);
    setLoadingMsg(
      roundNumber === 5
        ? 'Evaluating final round & synthesizing comprehensive interview readiness report...'
        : 'Evaluating reasoning depth & preparing adaptive follow-up...'
    );
    setErrorMsg('');

    try {
      const payload = {
        session_id: sessionId,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        current_round: roundNumber,
        question_text: currentQuestion.question_text,
        answer_text: userAnswer.trim(),
        history: history,
      };

      const res = await fetch(`${API_BASE_URL}/api/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to evaluate response.');
      }

      const data = await res.json();
      const evalData = data.evaluation;

      // Append completed turn to history
      const newTurn = {
        round_number: roundNumber,
        question: currentQuestion.question_text,
        answer: userAnswer.trim(),
        assessment: evalData?.assessment,
        strengths: evalData?.strengths,
        gaps: evalData?.gaps,
      };
      setHistory((prev) => [...prev, newTurn]);
      setLatestEvaluation(evalData);

      if (data.is_final_round && data.final_report) {
        setFinalReport(data.final_report);
        setStage('report');
      } else if (data.next_question) {
        setCurrentQuestion(data.next_question);
        setRoundNumber(data.next_question.round_number);
        setUserAnswer('');
      }
    } catch (e) {
      console.error('Submit answer error:', e);
      setErrorMsg(e.message || 'Could not submit answer. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Handle Ctrl+Enter / Cmd+Enter to submit
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading) {
        handleSubmitAnswer();
      }
    }
  };

  // Reset to setup
  const handleResetToSetup = () => {
    setStage('setup');
    setUserAnswer('');
    setLatestEvaluation(null);
    setHistory([]);
    setFinalReport(null);
    setErrorMsg('');
  };

  return (
    <div className="interview-page-container">
      {/* =========================================================================
          STAGE 1: SETUP & LANDING
          ========================================================================= */}
      {stage === 'setup' && (
        <div className="interview-setup-wrapper animate-fadeIn">
          {/* Header section */}
          <div className="interview-hero-header">
            <div className="interview-hero-badge">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Technical Interview Simulator</span>
            </div>
            <h1 className="interview-hero-title">
              Think out loud. <span className="title-accent">Let your understanding hold up.</span>
            </h1>
            <p className="interview-hero-sub">
              Aven.better conducts a structured, adaptive 5-round technical interview. 
              The interviewer evaluates your explanations in real-time for conceptual correctness, reasoning depth, and edge-case handling.
            </p>
          </div>

          {/* Configuration Form */}
          <div className="interview-config-card">
            {/* Step 1: Select Topic */}
            <div className="config-section">
              <label className="config-label">
                <span className="config-step-num">1</span>
                <span>Select Technical Domain</span>
              </label>
              <div className="topic-grid">
                {TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      className={`topic-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedTopic(topic.id)}
                      aria-pressed={isSelected}
                    >
                      <div className="topic-card-icon">
                        <Icon size={20} />
                      </div>
                      <div className="topic-card-body">
                        <div className="topic-card-title">{topic.title}</div>
                        <div className="topic-card-desc">{topic.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Difficulty */}
            <div className="config-section">
              <label className="config-label">
                <span className="config-step-num">2</span>
                <span>Select Interview Rigor</span>
              </label>
              <div className="difficulty-grid">
                {DIFFICULTIES.map((diff) => {
                  const isSelected = selectedDifficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      className={`difficulty-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDifficulty(diff.id)}
                      aria-pressed={isSelected}
                    >
                      <div className="diff-name">{diff.label}</div>
                      <div className="diff-desc">{diff.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="interview-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="config-action-bar">
              <div className="config-specs-meta">
                <ShieldCheck size={16} className="meta-icon" />
                <span>5 Adaptive Rounds · Structured Evaluation · Text-Based Reasoning</span>
              </div>
              <button
                type="button"
                className="btn-start-interview"
                onClick={handleStartInterview}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    <span>{loadingMsg || 'Preparing Chamber...'}</span>
                  </>
                ) : (
                  <>
                    <span>Start Interview</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: ACTIVE 5-ROUND INTERVIEW SESSION
          ========================================================================= */}
      {stage === 'interview' && currentQuestion && (
        <div className="interview-session-wrapper animate-fadeIn">
          {/* Top Session Progress Bar */}
          <div className="interview-session-header">
            <div className="session-meta-left">
              <span className="session-topic-badge">{selectedTopic}</span>
              <span className="session-diff-badge">{selectedDifficulty}</span>
            </div>

            <div className="session-round-tracker">
              <span className="round-label">Question</span>
              <span className="round-number">0{roundNumber}</span>
              <span className="round-total">/ 05</span>
            </div>
          </div>

          {/* Visual Progress Steps */}
          <div className="round-progress-track">
            {[1, 2, 3, 4, 5].map((step) => {
              const isDone = step < roundNumber;
              const isCurrent = step === roundNumber;
              return (
                <div
                  key={step}
                  className={`track-segment ${isDone ? 'completed' : isCurrent ? 'current' : ''}`}
                >
                  <div className="track-fill" />
                </div>
              );
            })}
          </div>

          {/* Previous Round Feedback (if available) */}
          {latestEvaluation && roundNumber > 1 && (
            <div className="interviewer-eval-banner animate-slideDown">
              <div className="eval-banner-header">
                <Brain size={16} className="eval-icon" />
                <span>Interviewer Evaluation · Previous Round (0{roundNumber - 1})</span>
              </div>
              <p className="eval-banner-assessment">{latestEvaluation.assessment}</p>
              
              <div className="eval-mini-grid">
                {latestEvaluation.strengths && latestEvaluation.strengths.length > 0 && (
                  <div className="eval-mini-col strengths">
                    <span className="mini-col-title">What Held Up:</span>
                    <ul>
                      {latestEvaluation.strengths.map((s, idx) => (
                        <li key={idx}>+ {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {latestEvaluation.gaps && latestEvaluation.gaps.length > 0 && (
                  <div className="eval-mini-col gaps">
                    <span className="mini-col-title">Nuances To Deepen:</span>
                    <ul>
                      {latestEvaluation.gaps.map((g, idx) => (
                        <li key={idx}>· {g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interviewer Question Card */}
          <div className="interviewer-question-card">
            <div className="card-interviewer-tag">
              <Terminal size={15} />
              <span>Interviewer Inquiry</span>
              <span className="tag-type">({currentQuestion.question_type || 'technical'})</span>
            </div>
            <div className="question-text-content">
              {currentQuestion.question_text}
            </div>
          </div>

          {/* Candidate Response Workspace */}
          <div className="candidate-response-card">
            <div className="response-card-header">
              <label htmlFor="interview-response-input" className="response-label">
                Your Technical Response
              </label>
              <span className="response-hint">
                Evaluated for correctness, reasoning depth, clarity & edge-case awareness
              </span>
            </div>

            <textarea
              id="interview-response-input"
              ref={responseInputRef}
              className="interview-textarea"
              placeholder="Explain your approach, the underlying mechanism, trade-offs, and how you would handle potential constraints..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={7}
            />

            {errorMsg && (
              <div className="interview-error-banner inline" role="alert">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="response-action-bar">
              <span className="shortcut-hint">
                Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
              </span>

              <button
                type="button"
                className="btn-submit-answer"
                onClick={handleSubmitAnswer}
                disabled={loading || !userAnswer.trim()}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    <span>{loadingMsg || 'Analyzing reasoning...'}</span>
                  </>
                ) : (
                  <>
                    <span>{roundNumber === 5 ? 'Complete Final Round' : 'Submit Answer'}</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 3: FINAL COMPREHENSIVE INTERVIEW REPORT
          ========================================================================= */}
      {stage === 'report' && finalReport && (
        <div className="interview-report-wrapper animate-fadeIn">
          {/* Hero Outcome Header */}
          <div className="report-hero-card">
            <div className="report-hero-top">
              <div className="report-badge">
                <CheckCircle2 size={16} />
                <span>AI Interview Completed</span>
              </div>
              <div className="report-topic-meta">
                {selectedTopic} · {selectedDifficulty} · 5 Rounds
              </div>
            </div>

            <div className="report-score-hero">
              <div className="score-number-wrapper">
                <span className="score-big">{Math.round(finalReport.overall_score)}</span>
                <span className="score-percent">%</span>
              </div>
              <div className="score-details-wrapper">
                <div className="score-headline">
                  {finalReport.overall_score >= 85
                    ? 'Senior Technical Readiness'
                    : finalReport.overall_score >= 70
                    ? 'Career Ready Competency'
                    : 'Foundation Stage — Practice Recommended'}
                </div>
                <p className="score-summary-text">{finalReport.summary}</p>
                {finalReport.saved_to_profile && (
                  <div className="saved-badge">
                    <ShieldCheck size={14} />
                    <span>Persisted to your learner career record</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Multi-Dimensional Competency Breakdown */}
          <div className="report-dimensions-grid">
            <div className="dimension-bar-card">
              <div className="dimension-title-row">
                <span className="dim-name">Technical Concept Grasp</span>
                <span className="dim-score">{Math.round(finalReport.technical_understanding)}%</span>
              </div>
              <div className="dim-bar-track">
                <div
                  className="dim-bar-fill"
                  style={{ width: `${finalReport.technical_understanding}%` }}
                />
              </div>
            </div>

            <div className="dimension-bar-card">
              <div className="dimension-title-row">
                <span className="dim-name">Problem Solving & Edge Cases</span>
                <span className="dim-score">{Math.round(finalReport.problem_solving)}%</span>
              </div>
              <div className="dim-bar-track">
                <div
                  className="dim-bar-fill"
                  style={{ width: `${finalReport.problem_solving}%` }}
                />
              </div>
            </div>

            <div className="dimension-bar-card">
              <div className="dimension-title-row">
                <span className="dim-name">Communication Clarity</span>
                <span className="dim-score">{Math.round(finalReport.communication)}%</span>
              </div>
              <div className="dim-bar-track">
                <div
                  className="dim-bar-fill"
                  style={{ width: `${finalReport.communication}%` }}
                />
              </div>
            </div>

            <div className="dimension-bar-card">
              <div className="dimension-title-row">
                <span className="dim-name">Reasoning Depth</span>
                <span className="dim-score">{Math.round(finalReport.reasoning_depth)}%</span>
              </div>
              <div className="dim-bar-track">
                <div
                  className="dim-bar-fill"
                  style={{ width: `${finalReport.reasoning_depth}%` }}
                />
              </div>
            </div>
          </div>

          {/* Detailed Strengths & Gaps Analysis Grid */}
          <div className="report-feedback-columns">
            {/* What Held Up */}
            <div className="report-col-card strengths">
              <div className="col-card-header">
                <CheckCircle2 size={18} className="col-icon" />
                <h3>What Held Up</h3>
              </div>
              <ul className="feedback-item-list">
                {finalReport.strengths && finalReport.strengths.map((item, idx) => (
                  <li key={idx}>
                    <span className="bullet-point">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Where to Improve */}
            <div className="report-col-card gaps">
              <div className="col-card-header">
                <AlertCircle size={18} className="col-icon" />
                <h3>Where to Deepen</h3>
              </div>
              <ul className="feedback-item-list">
                {finalReport.gaps && finalReport.gaps.map((item, idx) => (
                  <li key={idx}>
                    <span className="bullet-point">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Practice Recommendations */}
          {finalReport.recommendations && finalReport.recommendations.length > 0 && (
            <div className="report-recommendations-card">
              <div className="rec-header">
                <Brain size={18} />
                <h3>Targeted Next Practice Recommendations</h3>
              </div>
              <div className="rec-items-grid">
                {finalReport.recommendations.map((rec, idx) => (
                  <div key={idx} className="rec-item">
                    <span className="rec-index">0{idx + 1}</span>
                    <span className="rec-text">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="report-action-footer">
            <button
              type="button"
              className="btn-report-secondary"
              onClick={handleResetToSetup}
            >
              <RotateCcw size={16} />
              <span>Start Another Interview</span>
            </button>

            <button
              type="button"
              className="btn-report-primary"
              onClick={onNavigateDashboard}
            >
              <LayoutDashboard size={16} />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
