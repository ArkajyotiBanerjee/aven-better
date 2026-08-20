import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Target
} from 'lucide-react';

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

        {/* Primary Climax CTA: View Diagnostic Learning Plan */}
        {onViewDiagnosis && (
          <div className="diagnosis-cta-container">
            <button
              type="button"
              className="btn-diagnosis-primary-banner"
              onClick={onViewDiagnosis}
              aria-label="See what I need to practice and view personalized learning plan"
            >
              <div className="cta-icon-glow" aria-hidden="true">
                <Target size={26} />
              </div>
              <div className="cta-text-group">
                <span className="cta-headline">See What I Need to Practice</span>
                <span className="cta-subheadline">Turn your answers into a personalized mini-lesson & practice plan</span>
              </div>
              <div className="cta-arrow-badge" aria-hidden="true">
                <ArrowRight size={20} />
              </div>
            </button>
          </div>
        )}

        <div className="results-secondary-actions">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onReturnToLecture}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Return to Lecture Insights</span>
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onRetakeQuiz}
          >
            <RotateCcw size={16} aria-hidden="true" />
            <span>Retake Assessment</span>
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
                      {item.is_correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
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
