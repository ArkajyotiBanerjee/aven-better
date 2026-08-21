import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from app.services.db_service import DatabaseService
from app.models.user import LearnerProgressModel, LearnerProgressSaveRequest

class ProgressService:
    _instance: Optional["ProgressService"] = None

    @classmethod
    def get_instance(cls) -> "ProgressService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.db = DatabaseService.get_instance()

    def get_user_progress(self, user_id: str, lecture_id: Optional[str] = None) -> List[LearnerProgressModel]:
        with self.db.get_db() as conn:
            cursor = conn.cursor()
            if lecture_id:
                cursor.execute(
                    "SELECT * FROM learner_progress WHERE user_id = ? AND lecture_id = ?",
                    (user_id, lecture_id)
                )
            else:
                cursor.execute(
                    "SELECT * FROM learner_progress WHERE user_id = ? ORDER BY updated_at DESC",
                    (user_id,)
                )
            rows = cursor.fetchall()

            results = []
            for row in rows:
                quiz_data = json.loads(row["latest_quiz_data"]) if row["latest_quiz_data"] else None
                diag_summary = json.loads(row["diagnosis_summary"]) if row["diagnosis_summary"] else None
                
                results.append(LearnerProgressModel(
                    id=row["id"],
                    user_id=row["user_id"],
                    lecture_id=row["lecture_id"],
                    progress_pct=row["progress_pct"],
                    latest_quiz_score=row["latest_quiz_score"],
                    latest_quiz_data=quiz_data,
                    diagnosis_summary=diag_summary,
                    remediation_completed=bool(row["remediation_completed"]),
                    readiness_score=row["readiness_score"],
                    updated_at=row["updated_at"]
                ))
            return results

    def save_user_progress(self, user_id: str, req: LearnerProgressSaveRequest) -> LearnerProgressModel:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        with self.db.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM learner_progress WHERE user_id = ? AND lecture_id = ?",
                (user_id, req.lecture_id)
            )
            row = cursor.fetchone()

            quiz_json = json.dumps(req.latest_quiz_data) if req.latest_quiz_data is not None else None
            diag_json = json.dumps(req.diagnosis_summary) if req.diagnosis_summary is not None else None
            rem_val = 1 if req.remediation_completed else 0 if req.remediation_completed is not None else None

            if row:
                # Merge existing fields if not provided in update
                prog_pct = req.progress_pct if req.progress_pct is not None else row["progress_pct"]
                quiz_score = req.latest_quiz_score if req.latest_quiz_score is not None else row["latest_quiz_score"]
                final_quiz_json = quiz_json if quiz_json is not None else row["latest_quiz_data"]
                final_diag_json = diag_json if diag_json is not None else row["diagnosis_summary"]
                final_rem = rem_val if rem_val is not None else row["remediation_completed"]
                read_score = req.readiness_score if req.readiness_score is not None else row["readiness_score"]
                record_id = row["id"]

                cursor.execute("""
                    UPDATE learner_progress SET
                        progress_pct = ?,
                        latest_quiz_score = ?,
                        latest_quiz_data = ?,
                        diagnosis_summary = ?,
                        remediation_completed = ?,
                        readiness_score = ?,
                        updated_at = ?
                    WHERE id = ?
                """, (prog_pct, quiz_score, final_quiz_json, final_diag_json, final_rem, read_score, now_iso, record_id))
            else:
                record_id = f"prog_{uuid.uuid4().hex[:12]}"
                prog_pct = req.progress_pct if req.progress_pct is not None else 0.0
                quiz_score = req.latest_quiz_score
                final_quiz_json = quiz_json
                final_diag_json = diag_json
                final_rem = rem_val if rem_val is not None else 0
                read_score = req.readiness_score

                cursor.execute("""
                    INSERT INTO learner_progress (
                        id, user_id, lecture_id, progress_pct,
                        latest_quiz_score, latest_quiz_data, diagnosis_summary,
                        remediation_completed, readiness_score, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (record_id, user_id, req.lecture_id, prog_pct, quiz_score, final_quiz_json, final_diag_json, final_rem, read_score, now_iso))

        return self.get_user_progress(user_id, req.lecture_id)[0]
