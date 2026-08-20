import React, { useState, useEffect } from 'react';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';

const API_BASE_URL = 'http://localhost:8000';

export default function QuizPanel({
  lectureId,
  filename,
  onReturnToLecture,
  onViewDiagnosis
}) {
  const [status, setStatus] = useState('loading'); // loading, taking, submitting, results, error
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [question_id]: string }
  const [resultsData, setResultsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load or generate quiz
  const loadQuiz = async () => {
    setStatus('loading');
    setErrorMsg('');
    setCurrentIndex(0);
    setSelectedAnswers({});
    setResultsData(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/lectures/${lectureId}/quiz`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate adaptive assessment.');
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No quiz questions were returned for this lecture.');
      }

      setQuizData(data);
      setStatus('taking');
    } catch (e) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e.message || 'Error generating assessment.');
    }
  };

  useEffect(() => {
    if (lectureId) {
      loadQuiz();
    }
  }, [lectureId]);

  const handleSelectOption = (optionText) => {
    const currentQ = quizData.questions[currentIndex];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionText
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex < quizData.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setStatus('submitting');
    setErrorMsg('');

    const submissionPayload = {
      answers: Object.entries(selectedAnswers).map(([qid, ans]) => ({
        question_id: qid,
        selected_answer: ans
      }))
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/lectures/${lectureId}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionPayload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to evaluate quiz submission.');
      }

      const evaluation = await res.json();
      setResultsData(evaluation);
      setStatus('results');
    } catch (e) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e.message || 'Error submitting assessment.');
    }
  };

  return (
    <div className="quiz-workspace" role="main">
      {/* Quiz Top Navigation Bar */}
      <div className="quiz-top-bar">
        <button 
          type="button" 
          className="btn-back"
          onClick={onReturnToLecture}
          aria-label="Return to lecture mode"
        >
          ← Return to Lecture
        </button>

        <div className="quiz-lecture-info">
          <span className="quiz-header-title">Adaptive Lecture Assessment</span>
          {filename && <span className="quiz-filename">({filename})</span>}
        </div>

        <div className="quiz-badge-wrap">
          <span className="badge-adaptive">🎯 Diagnostic Mode</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="quiz-content-body">
        {status === 'loading' && (
          <div className="quiz-loading-state" role="status">
            <div className="animated-spinner" aria-hidden="true" />
            <h2 className="loading-title">Generating Lecture Assessment...</h2>
            <p className="loading-desc">
              Analyzing concepts, formulas, and examples to create a personalized diagnostic quiz.
            </p>
          </div>
        )}

        {status === 'submitting' && (
          <div className="quiz-loading-state" role="status">
            <div className="animated-spinner" aria-hidden="true" />
            <h2 className="loading-title">Evaluating Answers...</h2>
            <p className="loading-desc">Comparing your responses against grounded lecture principles.</p>
          </div>
        )}

        {status === 'taking' && quizData && (
          <QuizQuestion
            question={quizData.questions[currentIndex]}
            currentIndex={currentIndex}
            totalQuestions={quizData.questions.length}
            selectedAnswer={selectedAnswers[quizData.questions[currentIndex].id]}
            onSelectOption={handleSelectOption}
            onNext={handleNextQuestion}
            onSubmit={handleSubmitQuiz}
            isSubmitting={status === 'submitting'}
          />
        )}

        {status === 'results' && resultsData && (
          <QuizResults
            resultsData={resultsData}
            onReturnToLecture={onReturnToLecture}
            onRetakeQuiz={loadQuiz}
            onViewDiagnosis={() => onViewDiagnosis && onViewDiagnosis(resultsData)}
          />
        )}

        {status === 'error' && (
          <div className="quiz-error-state" role="alert">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h2 className="error-title">Assessment Error</h2>
            <p className="error-message">{errorMsg}</p>
            <div className="error-actions">
              <button type="button" className="btn-primary" onClick={loadQuiz}>
                Try Again
              </button>
              <button type="button" className="btn-secondary" onClick={onReturnToLecture}>
                Return to Lecture
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
