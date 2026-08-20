import React from 'react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizQuestion({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onSelectOption,
  onNext,
  onSubmit,
  isSubmitting
}) {
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasSelected = Boolean(selectedAnswer);

  return (
    <div className="quiz-card" role="region" aria-labelledby="question-text">
      {/* Progress header */}
      <div className="quiz-progress-bar-wrap">
        <div 
          className="quiz-progress-bar-fill" 
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="quiz-card-header">
        <span className="quiz-step-badge">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <div className="quiz-meta-tags">
          {question.type && (
            <span className={`quiz-tag tag-type-${question.type}`}>
              {question.type.toUpperCase()}
            </span>
          )}
          {question.difficulty && (
            <span className={`quiz-tag tag-diff-${question.difficulty}`}>
              {question.difficulty.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <h2 id="question-text" className="quiz-question-prompt">
        {question.question}
      </h2>

      {/* Options List */}
      <div 
        className="quiz-options-grid" 
        role="radiogroup" 
        aria-labelledby="question-text"
      >
        {question.options.map((opt, idx) => {
          const isSelected = selectedAnswer === opt;
          const letter = OPTION_LABELS[idx] || `${idx + 1}`;

          return (
            <div
              key={idx}
              className={`quiz-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectOption(opt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectOption(opt);
                }
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex="0"
            >
              <span className="option-letter-badge">{letter}</span>
              <span className="option-text">{opt}</span>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="quiz-footer">
        <div className="quiz-instruction">
          {!hasSelected && <span>Please select an option to proceed.</span>}
        </div>

        {isLastQuestion ? (
          <button
            type="button"
            className="btn-primary btn-submit-quiz"
            onClick={onSubmit}
            disabled={!hasSelected || isSubmitting}
          >
            {isSubmitting ? 'Evaluating Answers...' : 'Submit Assessment ➔'}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary btn-next-quiz"
            onClick={onNext}
            disabled={!hasSelected}
          >
            Next Question ➔
          </button>
        )}
      </div>
    </div>
  );
}
