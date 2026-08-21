import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  Lightbulb, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  Brain, 
  Video, 
  Loader2,
  Sparkles
} from 'lucide-react';

const API_BASE_URL = '';
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function DiagnosisPanel({
  lectureId,
  filename,
  evaluationResults,
  onReturnToLecture,
  onReturnToQuiz
}) {
  const [status, setStatus] = useState('loading'); // loading, ready, error
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Remediation Practice State
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [isHarderTier, setIsHarderTier] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null); // { is_correct, feedback, next_step }

  const loadDiagnosis = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/lectures/${lectureId}/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluationResults)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate diagnostic analysis.');
      }

      const data = await res.json();
      setDiagnosisData(data);
      if (data.remediation && data.remediation.practice_question) {
        setActiveQuestion(data.remediation.practice_question);
      }
      setStatus('ready');
    } catch (e) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e.message || 'Error loading diagnosis.');
    }
  };

  useEffect(() => {
    if (lectureId && evaluationResults) {
      loadDiagnosis();
    }
  }, [lectureId, evaluationResults]);

  const handleCheckRemediationAnswer = async () => {
    if (!selectedOption || !activeQuestion) return;

    setIsChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lectures/${lectureId}/remediation/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: activeQuestion.id,
          selected_answer: selectedOption,
          is_harder_tier: isHarderTier
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to submit practice answer.');
      }

      const result = await res.json();
      setSubmissionFeedback(result);
    } catch (e) {
      console.error(e);
      setSubmissionFeedback({
        is_correct: false,
        feedback: e.message || 'Could not check your answer right now. Please try again.',
        next_step: 'error'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleAdvanceToHarder = () => {
    if (submissionFeedback?.next_question) {
      setActiveQuestion(submissionFeedback.next_question);
      setIsHarderTier(true);
      setSelectedOption('');
      setSubmissionFeedback(null);
    }
  };

  return (
    <div className="diagnosis-workspace" role="main">
      {/* Top Navigation */}
      <div className="diagnosis-top-bar">
        <div className="diag-nav-actions">
          <button 
            type="button" 
            className="btn-back"
            onClick={onReturnToQuiz}
            aria-label="Return to quiz results"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Quiz Results</span>
          </button>
          <button 
            type="button" 
            className="btn-secondary btn-sm"
            onClick={onReturnToLecture}
            aria-label="Return to full lecture experience"
          >
            <Video size={14} aria-hidden="true" />
            <span>Return to Lecture</span>
          </button>
        </div>

        <div className="diagnosis-lecture-info">
          <span className="diag-header-title">Personalized Diagnostic Snapshot</span>
          {filename && <span className="diag-filename">({filename})</span>}
        </div>

        <div className="badge-adaptive">
          <Brain size={15} aria-hidden="true" />
          <span>Adaptive Remediation</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="diagnosis-content-body">
        {status === 'loading' && (
          <div className="quiz-loading-state" role="status">
            <Loader2 size={36} className="animated-spinner" aria-hidden="true" />
            <h2 className="loading-title">Analyzing Learning Patterns...</h2>
            <p className="loading-desc">
              Identifying strengths, specific areas to practice, and crafting your targeted mini-lesson.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="quiz-error-state" role="alert">
            <div className="error-icon" aria-hidden="true">
              <AlertTriangle size={32} />
            </div>
            <h2 className="error-title">Diagnosis Unavailable</h2>
            <p className="error-message">{errorMsg}</p>
            <button type="button" className="btn-primary" onClick={loadDiagnosis}>
              Try Again
            </button>
          </div>
        )}

        {status === 'ready' && diagnosisData && (
          <div className="diagnosis-grid">
            {/* Left Column: Learning Snapshot */}
            <div className="diagnosis-column snapshot-column">
              <div className="diag-card snapshot-card">
                <div className="card-badge-header">
                  <span className="card-tag tag-snapshot">YOUR LEARNING SNAPSHOT</span>
                  <span className="snapshot-score">Score: {diagnosisData.total_score} / {diagnosisData.total_questions} ({diagnosisData.percentage}%)</span>
                </div>

                {/* Strengths */}
                <div className="snapshot-section">
                  <h3 className="section-title text-success">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <span>What You're Doing Well</span>
                  </h3>
                  <ul className="strengths-list">
                    {diagnosisData.strengths.map((str, idx) => (
                      <li key={idx} className="strength-item">
                        <CheckCircle2 size={16} className="bullet-check" aria-hidden="true" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Learning Gaps / Areas to Practice */}
                <div className="snapshot-section">
                  <h3 className="section-title text-warning">
                    <AlertTriangle size={18} aria-hidden="true" />
                    <span>Areas to Strengthen</span>
                  </h3>

                  {diagnosisData.learning_gaps.length === 0 ? (
                    <p className="no-gaps-text">
                      No significant learning gaps detected. You have demonstrated comprehensive understanding!
                    </p>
                  ) : (
                    <div className="gaps-list">
                      {diagnosisData.learning_gaps.map((gap, idx) => (
                        <div key={idx} className="gap-item-card">
                          <div className="gap-header">
                            <span className="gap-concept-badge">{gap.concept}</span>
                            <span className="gap-skill-badge">{gap.skill.toUpperCase()}</span>
                            <span className={`gap-severity severity-${gap.severity}`}>{gap.severity}</span>
                          </div>
                          <p className="gap-diagnosis-text">{gap.diagnosis}</p>
                          <div className="gap-evidence-box">
                            <span className="evidence-label">Assessment Evidence:</span>
                            <span className="evidence-text">{gap.evidence}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Focus */}
                <div className="recommended-focus-box">
                  <span className="focus-label">Recommended Focus:</span>
                  <p className="focus-text">{diagnosisData.recommended_focus}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Personalized Remediation Mini-Lesson */}
            <div className="diagnosis-column remediation-column">
              {diagnosisData.remediation ? (
                <div className="diag-card remediation-card">
                  <div className="card-badge-header">
                    <span className="card-tag tag-remediation">
                      <Target size={14} className="tag-icon-inline" aria-hidden="true" />
                      <span>PERSONALIZED MINI-LESSON</span>
                    </span>
                    <span className="remediation-skill-tag">{diagnosisData.remediation.skill.toUpperCase()} PRACTICE</span>
                  </div>

                  <h2 className="remediation-title">{diagnosisData.remediation.title}</h2>
                  <p className="remediation-explanation">{diagnosisData.remediation.explanation}</p>

                  {/* Worked Example */}
                  {diagnosisData.remediation.example && (
                    <div className="worked-example-box">
                      <div className="example-header-tag">
                        <Lightbulb size={16} aria-hidden="true" />
                        <span>STEP-BY-STEP WORKED EXAMPLE</span>
                      </div>
                      <div className="example-content">
                        {diagnosisData.remediation.example}
                      </div>
                    </div>
                  )}

                  {/* Interactive Practice Question */}
                  {activeQuestion && (
                    <div className="practice-problem-section">
                      <div className="practice-section-header">
                        <h3 className="practice-heading">
                          {isHarderTier ? '🔥 Advanced Challenge Problem' : '✏️ Try This Practice Problem'}
                        </h3>
                        <span className={`diff-pill diff-${activeQuestion.difficulty}`}>
                          {activeQuestion.difficulty.toUpperCase()}
                        </span>
                      </div>

                      <p className="practice-question-text">{activeQuestion.question}</p>

                      <div className="practice-options-list" role="radiogroup">
                        {activeQuestion.options.map((opt, oIdx) => {
                          const isSelected = selectedOption === opt;
                          const letter = OPTION_LABELS[oIdx] || `${oIdx + 1}`;

                          return (
                            <div
                              key={oIdx}
                              className={`practice-option-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (!submissionFeedback?.is_correct) {
                                  setSelectedOption(opt);
                                }
                              }}
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex="0"
                            >
                              <span className="option-letter">{letter}</span>
                              <span className="option-text">{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Button */}
                      {!submissionFeedback && (
                        <div className="practice-actions">
                          <button
                            type="button"
                            className="btn-primary btn-check-answer"
                            onClick={handleCheckRemediationAnswer}
                            disabled={!selectedOption || isChecking}
                          >
                            <Sparkles size={16} aria-hidden="true" />
                            <span>{isChecking ? 'Checking...' : 'Check Answer ➔'}</span>
                          </button>
                        </div>
                      )}

                      {/* Feedback Banner */}
                      {submissionFeedback && (
                        <div className={`remediation-feedback-banner ${submissionFeedback.is_correct ? 'feedback-correct' : 'feedback-incorrect'}`}>
                          <div className="feedback-header">
                            <span className="feedback-icon" aria-hidden="true">
                              {submissionFeedback.is_correct ? <CheckCircle2 size={20} /> : <Lightbulb size={20} />}
                            </span>
                            <strong>
                              {submissionFeedback.is_correct ? 'Mastery Confirmed!' : 'Keep Going!'}
                            </strong>
                          </div>
                          <p className="feedback-message">{submissionFeedback.feedback}</p>

                          <div className="feedback-actions">
                            {submissionFeedback.is_correct && submissionFeedback.next_step === 'advance' && (
                              <button
                                type="button"
                                className="btn-primary btn-advance"
                                onClick={handleAdvanceToHarder}
                              >
                                <span>Try a slightly harder problem</span>
                                <ArrowRight size={16} aria-hidden="true" />
                              </button>
                            )}

                            {submissionFeedback.is_correct && submissionFeedback.next_step === 'completed' && (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={onReturnToLecture}
                              >
                                <CheckCircle2 size={16} aria-hidden="true" />
                                <span>Return to Lecture (Mastery Achieved)</span>
                              </button>
                            )}

                            {!submissionFeedback.is_correct && (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setSubmissionFeedback(null)}
                              >
                                <RotateCcw size={15} aria-hidden="true" />
                                <span>Try Again</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="diag-card mastery-celebration-card">
                  <div className="celebration-icon" aria-hidden="true">
                    <Trophy size={48} className="trophy-svg" />
                  </div>
                  <h2 className="celebration-title">Complete Concept & Application Mastery</h2>
                  <p className="celebration-desc">
                    You answered all questions accurately and demonstrated strong problem-solving mastery across every skill domain in this lecture.
                  </p>
                  <button type="button" className="btn-primary" onClick={onReturnToLecture}>
                    Return to Full Lecture Experience
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
