import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.models.structured_lecture import StructuredLecture
from app.models.quiz import (
    Quiz,
    QuizSubmissionRequest,
    QuizEvaluationResponse,
    QuestionEvaluation
)
from app.services.quiz_service import QuizService

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXTRACTED_DIR = BASE_DIR / "data" / "extracted"
QUIZZES_DIR = BASE_DIR / "data" / "quizzes"

QUIZZES_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/{lecture_id}/quiz", response_model=Quiz)
def get_or_generate_quiz(lecture_id: str):
    # Check if quiz was already generated and cached on disk
    cached_quiz_file = QUIZZES_DIR / f"{lecture_id}.json"
    if cached_quiz_file.exists():
        try:
            with open(cached_quiz_file, "r", encoding="utf-8") as f:
                quiz_raw = json.load(f)
            return Quiz.model_validate(quiz_raw)
        except Exception as e:
            print(f"Warning: Failed to load cached quiz for {lecture_id}: {e}")

    # Load StructuredLecture to generate new quiz
    extracted_file = EXTRACTED_DIR / f"{lecture_id}.json"
    if not extracted_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Structured lecture data for '{lecture_id}' not found. Please extract educational insights first."
        )

    try:
        with open(extracted_file, "r", encoding="utf-8") as f:
            lecture_raw = json.load(f)
        lecture_data = StructuredLecture.model_validate(lecture_raw)
    except Exception as e:
        print(f"Error loading extracted lecture for {lecture_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load structured lecture for quiz generation"
        )

    service = QuizService.get_instance()
    quiz = service.generate_quiz(lecture_data)

    # Persist generated quiz
    try:
        with open(cached_quiz_file, "w", encoding="utf-8") as f:
            f.write(quiz.model_dump_json(indent=2))
    except Exception as e:
        print(f"Warning: Failed to save quiz JSON for {lecture_id}: {e}")

    return quiz

@router.post("/{lecture_id}/quiz/submit", response_model=QuizEvaluationResponse)
def submit_quiz_answers(lecture_id: str, submission: QuizSubmissionRequest):
    quiz_file = QUIZZES_DIR / f"{lecture_id}.json"
    if not quiz_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Quiz for lecture '{lecture_id}' not found. Please generate quiz first."
        )

    try:
        with open(quiz_file, "r", encoding="utf-8") as f:
            quiz_raw = json.load(f)
        quiz = Quiz.model_validate(quiz_raw)
    except Exception as e:
        print(f"Error loading quiz for evaluation: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load quiz data for evaluation"
        )

    submission_dict = {a.question_id: a.selected_answer for a in submission.answers}
    evaluations = []
    correct_count = 0

    for q in quiz.questions:
        selected = submission_dict.get(q.id, "")
        is_correct = (selected.strip() == q.correct_answer.strip())
        if is_correct:
            correct_count += 1

        evaluations.append(
            QuestionEvaluation(
                question_id=q.id,
                question=q.question,
                is_correct=is_correct,
                selected_answer=selected,
                correct_answer=q.correct_answer,
                concept=q.concept,
                skill=q.skill,
                difficulty=q.difficulty,
                explanation=q.explanation
            )
        )

    total_questions = len(quiz.questions)
    percentage = (correct_count / total_questions * 100.0) if total_questions > 0 else 0.0

    return QuizEvaluationResponse(
        lecture_id=lecture_id,
        total_score=correct_count,
        total_questions=total_questions,
        percentage=round(percentage, 1),
        results=evaluations
    )
