import React from 'react';

export default function QuizResults({
  resultsData,
  onReturnToLecture,
  onRetakeQuiz,
  onViewDiagnosis
}) {
  const { total_score, total_questions, percentage, results = [] } = resultsData;

  const isHighPass = percentage >= 80;
  const isPass = percentage >= 60;

  return (
    <div className="quiz-results-container" role="region" aria-labelledby="results-heading">
      {/* Score Summary Card */}
      <div className="results-summary-card">
        <div className="score-circle-wrap">
          <div className={`score-badge ${isHighPass ? 'score-high' : isPass ? 'score-med' : 'score-low'}`}>
            <span className="score-number">{total_score}</span>
            <span className="score-divider">/</span>
            <span className="score-total">{total_questions}</span>
          </div>
        </div>

        <h2 id="results-heading" className="results-title">
          {isHighPass ? 'Outstanding Understanding!' : isPass ? 'Good Comprehension!' : 'Review & Practice Recommended'}
        </h2>
        <p className="results-subtitle">
          You scored <strong>{percentage}%</strong> on this lecture-grounded assessment.
        </p>

        <div className="results-actions">
          {onViewDiagnosis && (
            <button
              type="button"
              className="btn-primary btn-diagnosis-cta"
              onClick={onViewDiagnosis}
            >
              🔍 See What I Need to Practice ➔
            </button>
          )}
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onReturnToLecture}
          >
            ← Return to Lecture Insights
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onRetakeQuiz}
          >
            ⟲ Retake Assessment
          </button>
        </div>
      </div>

      {/* Question Breakdown List */}
      <div className="question-review-section">
        <h3 className="review-heading">Question-by-Question Diagnostic Review</h3>

        <div className="review-list">
          {results.map((item, idx) => {
            return (
              <div 
                key={item.question_id || idx}
                className={`review-card ${item.is_correct ? 'review-correct' : 'review-incorrect'}`}
              >
                <div className="review-card-header">
                  <div className="review-status-wrap">
                    <span className={`status-icon-badge ${item.is_correct ? 'icon-correct' : 'icon-incorrect'}`}>
                      {item.is_correct ? '✓' : '✗'}
                    </span>
                    <span className="review-question-num">Question {idx + 1}</span>
                  </div>

                  <div className="review-meta-tags">
                    {item.concept && (
                      <span className="review-tag tag-concept">
                        {item.concept}
                      </span>
                    )}
                    {item.skill && (
                      <span className="review-tag tag-skill">
                        {item.skill.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="review-question-text">{item.question}</h4>

                <div className="review-answers-box">
                  <div className="answer-row">
                    <span className="answer-label">Your Answer:</span>
                    <span className={`answer-value ${item.is_correct ? 'ans-correct' : 'ans-incorrect'}`}>
                      {item.selected_answer || '(No answer provided)'}
                    </span>
                  </div>

                  {!item.is_correct && (
                    <div className="answer-row">
                      <span className="answer-label">Correct Answer:</span>
                      <span className="answer-value ans-correct-target">
                        {item.correct_answer}
                      </span>
                    </div>
                  )}
                </div>

                {item.explanation && (
                  <div className="review-explanation">
                    <span className="explanation-label">Lecture Explanation:</span>
                    <p className="explanation-text">{item.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
