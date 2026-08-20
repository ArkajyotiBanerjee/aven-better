import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000';
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
      alert(e.message || 'Failed to check answer.');
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
            ← Back to Quiz Results
          </button>
          <button 
            type="button" 
            className="btn-secondary btn-sm"
            onClick={onReturnToLecture}
            aria-label="Return to full lecture experience"
          >
            📹 Return to Lecture
          </button>
        </div>

        <div className="diagnosis-lecture-info">
          <span className="diag-header-title">Personalized Diagnostic Snapshot</span>
          {filename && <span className="diag-filename">({filename})</span>}
        </div>

        <span className="badge-adaptive">🧠 Adaptive Remediation</span>
      </div>

      {/* Main Body */}
      <div className="diagnosis-content-body">
        {status === 'loading' && (
          <div className="quiz-loading-state" role="status">
            <div className="animated-spinner" aria-hidden="true" />
            <h2 className="loading-title">Analyzing Learning Patterns...</h2>
            <p className="loading-desc">
              Identifying strengths, specific areas to practice, and crafting your targeted mini-lesson.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="quiz-error-state" role="alert">
            <div className="error-icon" aria-hidden="true">⚠️</div>
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
                    <span aria-hidden="true">✓</span> What You're Doing Well
                  </h3>
                  <ul className="strengths-list">
                    {diagnosisData.strengths.map((str, idx) => (
                      <li key={idx} className="strength-item">
                        <span className="bullet-check" aria-hidden="true">✔</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Learning Gaps / Areas to Practice */}
                <div className="snapshot-section">
                  <h3 className="section-title text-warning">
                    <span aria-hidden="true">⚠</span> Areas to Strengthen
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
                    <span className="card-tag tag-remediation">🎯 PERSONALIZED MINI-LESSON</span>
                    <span className="remediation-skill-tag">{diagnosisData.remediation.skill.toUpperCase()} PRACTICE</span>
                  </div>

                  <h2 className="remediation-title">{diagnosisData.remediation.title}</h2>
                  <p className="remediation-explanation">{diagnosisData.remediation.explanation}</p>

                  {/* Worked Example */}
                  {diagnosisData.remediation.example && (
                    <div className="worked-example-box">
                      <div className="example-header-tag">
                        <span aria-hidden="true">💡</span> STEP-BY-STEP WORKED EXAMPLE
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
                            {isChecking ? 'Checking...' : 'Check Answer ➔'}
                          </button>
                        </div>
                      )}

                      {/* Feedback Banner */}
                      {submissionFeedback && (
                        <div className={`remediation-feedback-banner ${submissionFeedback.is_correct ? 'feedback-correct' : 'feedback-incorrect'}`}>
                          <div className="feedback-header">
                            <span className="feedback-icon" aria-hidden="true">
                              {submissionFeedback.is_correct ? '🎉' : '💡'}
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
                                Try a slightly harder problem ➔
                              </button>
                            )}

                            {submissionFeedback.is_correct && submissionFeedback.next_step === 'completed' && (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={onReturnToLecture}
                              >
                                ✓ Return to Lecture (Mastery Achieved)
                              </button>
                            )}

                            {!submissionFeedback.is_correct && (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setSubmissionFeedback(null)}
                              >
                                ⟲ Try Again
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
                  <div className="celebration-icon">🏆</div>
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
