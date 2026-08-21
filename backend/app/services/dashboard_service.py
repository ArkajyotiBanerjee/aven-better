import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.models.dashboard import (
    LearnerProfile,
    ReadinessDimension,
    ReadinessSummary,
    ActiveGap,
    Mission,
    Achievement,
    RecentActivity,
    DashboardOverviewResponse,
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
EXTRACTED_DIR = DATA_DIR / "extracted"
DIAGNOSES_DIR = DATA_DIR / "diagnoses"
QUIZZES_DIR = DATA_DIR / "quizzes"
TRANSCRIPTS_DIR = DATA_DIR / "transcripts"


def compute_grade(score: float) -> str:
    if score >= 90.0:
        return "A"
    elif score >= 80.0:
        return "B+"
    elif score >= 70.0:
        return "B"
    elif score >= 60.0:
        return "C+"
    elif score >= 50.0:
        return "C"
    else:
        return "D"


def compute_dimension_status(score: float) -> str:
    if score >= 85.0:
        return "Mastered"
    elif score >= 70.0:
        return "Proficient"
    elif score >= 50.0:
        return "Needs Practice"
    else:
        return "Emerging"


def compute_readiness_status(score: float) -> str:
    if score >= 85.0:
        return "Career Ready"
    elif score >= 70.0:
        return "Proficient"
    elif score >= 50.0:
        return "Developing"
    else:
        return "Foundation Stage"


class DashboardService:
    _instance: Optional["DashboardService"] = None

    @classmethod
    def get_instance(cls) -> "DashboardService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _read_json_safe(self, filepath: Path) -> Optional[Dict[str, Any]]:
        if not filepath.exists():
            return None
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to read JSON file {filepath}: {e}")
            return None

    def get_dashboard_overview(self, user: Optional[Any] = None) -> DashboardOverviewResponse:
        # 1. Gather all extracted lectures
        extracted_lectures: Dict[str, Dict[str, Any]] = {}
        if EXTRACTED_DIR.exists():
            for f in EXTRACTED_DIR.glob("*.json"):
                data = self._read_json_safe(f)
                if data and "lecture_id" in data:
                    extracted_lectures[data["lecture_id"]] = data

        # 2. Gather all completed diagnoses
        diagnoses: Dict[str, Dict[str, Any]] = {}
        if DIAGNOSES_DIR.exists():
            for f in DIAGNOSES_DIR.glob("*.json"):
                data = self._read_json_safe(f)
                if data and "lecture_id" in data:
                    diagnoses[data["lecture_id"]] = data

        # 3. Gather all quizzes
        quizzes: Dict[str, Dict[str, Any]] = {}
        if QUIZZES_DIR.exists():
            for f in QUIZZES_DIR.glob("*.json"):
                data = self._read_json_safe(f)
                if data and "lecture_id" in data:
                    quizzes[data["lecture_id"]] = data

        # 4. Gather transcripts to calculate duration / study time
        total_duration_sec = 0.0
        if TRANSCRIPTS_DIR.exists():
            for f in TRANSCRIPTS_DIR.glob("*.json"):
                data = self._read_json_safe(f)
                if data and "segments" in data and isinstance(data["segments"], list) and len(data["segments"]) > 0:
                    max_end = max((s.get("end", 0.0) for s in data["segments"]), default=0.0)
                    total_duration_sec += max_end

        total_lectures_count = max(len(extracted_lectures), 1)
        completed_lectures_count = len(diagnoses)

        # Baseline study time: lecture duration + 10 mins per completed assessment
        study_time_minutes = int(total_duration_sec / 60.0) + (completed_lectures_count * 10)
        if study_time_minutes < 15 and completed_lectures_count > 0:
            study_time_minutes = 25  # Sensible minimum for verified session

        # Derive track name dynamically from concepts or filename across all lectures
        track_name = "Data Structures & Algorithms"
        has_dsa = False
        has_system_design = False
        has_stem = False
        
        for lec in extracted_lectures.values():
            concepts_text = " ".join([c.get("name", "") for c in lec.get("concepts", [])]).lower()
            filename_text = lec.get("filename", "").lower()
            combined_text = f"{concepts_text} {filename_text}"
            
            if any(k in combined_text for k in ["window", "array", "tree", "graph", "algorithm", "dsa", "sliding", "subarray", "pointer", "stack", "queue"]):
                has_dsa = True
            elif any(k in combined_text for k in ["system", "distributed", "database", "sql", "architecture"]):
                has_system_design = True
            elif any(k in combined_text for k in ["physics", "mechanics", "force", "newton"]):
                has_stem = True

        if has_dsa:
            track_name = "Data Structures & Algorithms"
        elif has_system_design:
            track_name = "System Design & Engineering"
        elif has_stem:
            track_name = "Classical Mechanics & STEM"

        learner_name = user.name if (user and hasattr(user, "name") and user.name) else "Alex Mercer"

        profile = LearnerProfile(
            name=learner_name,
            track=track_name,
            total_lectures=total_lectures_count,
            completed_lectures=completed_lectures_count,
            total_study_time_minutes=study_time_minutes,
        )

        # 5. Calculate Dimensional Readiness Metrics
        # Collect skill accuracy totals across all diagnoses
        recall_correct, recall_att = 0, 0
        comprehension_correct, comprehension_att = 0, 0
        application_correct, application_att = 0, 0
        score_percentages: List[float] = []

        for diag in diagnoses.values():
            if "percentage" in diag:
                score_percentages.append(float(diag["percentage"]))

            for sb in diag.get("skill_breakdowns", []):
                skill_name = sb.get("skill", "").lower()
                att = sb.get("attempted", 0)
                corr = sb.get("correct", 0)

                if "recall" in skill_name:
                    recall_att += att
                    recall_correct += corr
                elif "comprehension" in skill_name:
                    comprehension_att += att
                    comprehension_correct += corr
                elif "application" in skill_name:
                    application_att += att
                    application_correct += corr

        # Fallback baselines
        recall_score = round((recall_correct / recall_att * 100.0), 1) if recall_att > 0 else 85.0
        comp_score = round((comprehension_correct / comprehension_att * 100.0), 1) if comprehension_att > 0 else 80.0
        app_score = round((application_correct / application_att * 100.0), 1) if application_att > 0 else 45.0

        avg_score = (sum(score_percentages) / len(score_percentages)) if score_percentages else 70.0
        retention_score = round(min(100.0, max(40.0, avg_score * 0.95 + min(study_time_minutes * 0.2, 10.0))), 1)

        dimensions = [
            ReadinessDimension(
                name="Conceptual Understanding",
                score=comp_score,
                grade=compute_grade(comp_score),
                status=compute_dimension_status(comp_score),
            ),
            ReadinessDimension(
                name="Formula & Pattern Recall",
                score=recall_score,
                grade=compute_grade(recall_score),
                status=compute_dimension_status(recall_score),
            ),
            ReadinessDimension(
                name="Problem-Solving Application",
                score=app_score,
                grade=compute_grade(app_score),
                status=compute_dimension_status(app_score),
            ),
            ReadinessDimension(
                name="Topic Comprehension & Retention",
                score=retention_score,
                grade=compute_grade(retention_score),
                status=compute_dimension_status(retention_score),
            ),
        ]

        # Overall score: weighted composite
        # 30% conceptual, 25% recall, 30% application, 15% retention
        overall_score = round(
            (comp_score * 0.30) + (recall_score * 0.25) + (app_score * 0.30) + (retention_score * 0.15),
            1,
        )

        readiness = ReadinessSummary(
            overall_score=overall_score,
            status=compute_readiness_status(overall_score),
            trend="+12% this week",
            dimensions=dimensions,
        )

        # 6. Extract Active Gaps from Diagnoses
        active_gaps: List[ActiveGap] = []
        gap_counter = 1

        for lecture_id, diag in diagnoses.items():
            lecture_info = extracted_lectures.get(lecture_id, {})
            filename = lecture_info.get("filename", "Learning Session")
            lecture_title = filename.replace(".mp4", "").replace(".webm", "").replace("_", " ").title()
            if "concepts" in lecture_info and len(lecture_info["concepts"]) > 0:
                first_concept = lecture_info["concepts"][0].get("name", "")
                if first_concept:
                    lecture_title = first_concept

            remediation_ready = bool(diag.get("remediation"))

            for gap in diag.get("learning_gaps", []):
                active_gaps.append(
                    ActiveGap(
                        gap_id=f"gap-{lecture_id[:8]}-{gap_counter}",
                        lecture_id=lecture_id,
                        lecture_title=lecture_title,
                        concept=gap.get("concept", "Core Concept"),
                        skill=gap.get("skill", "application"),
                        severity=gap.get("severity", "moderate"),
                        diagnosis=gap.get(
                            "diagnosis",
                            "Identified area for problem-solving practice and calculation accuracy.",
                        ),
                        evidence=gap.get("evidence", "Assessment answer pattern analysis."),
                        remediation_available=remediation_ready,
                    )
                )
                gap_counter += 1

        # 7. Generate Actionable Missions
        missions: List[Mission] = []

        # Mission 1: Targeted Remediation for active gap
        if active_gaps:
            first_gap = active_gaps[0]
            missions.append(
                Mission(
                    id="m-remediation-01",
                    title=f"Master {first_gap.concept} Calculations",
                    description=f"Complete the targeted mini-lesson and practice problem to resolve your {first_gap.skill} gap.",
                    xp_reward=150,
                    completed=False,
                    action_type="open_remediation",
                    lecture_id=first_gap.lecture_id,
                )
            )

        # Mission 2: Multi-modal accessibility exploration
        missions.append(
            Mission(
                id="m-accessibility-02",
                title="Explore Multi-Modal Learning Pathways",
                description="Experience Visual Captions, Spoken Math (Blind Mode), and Chunked Learning Support.",
                xp_reward=100,
                completed=True,
                action_type="open_mode",
                lecture_id=list(extracted_lectures.keys())[0] if extracted_lectures else None,
            )
        )

        # Mission 3: Adaptive assessment completion
        has_completed_quiz = len(diagnoses) > 0
        missions.append(
            Mission(
                id="m-quiz-03",
                title="Complete Adaptive Knowledge Assessment",
                description="Demonstrate comprehension across definitions, formulas, and real-world applications.",
                xp_reward=120,
                completed=has_completed_quiz,
                action_type="open_quiz",
                lecture_id=list(extracted_lectures.keys())[0] if extracted_lectures else None,
            )
        )

        # Mission 4: High mastery goal
        is_high_mastery = overall_score >= 80.0
        missions.append(
            Mission(
                id="m-mastery-04",
                title="Reach 80%+ Career Readiness Score",
                description="Strengthen application skills to achieve Career Ready certification status.",
                xp_reward=200,
                completed=is_high_mastery,
                action_type="open_quiz",
                lecture_id=list(extracted_lectures.keys())[0] if extracted_lectures else None,
            )
        )

        # 8. Generate Achievements & Badges
        achievements = [
            Achievement(
                id="ach-first-assessment",
                title="Diagnostic Pioneer",
                description="Completed your first adaptive lecture diagnostic assessment",
                icon="Target",
                unlocked=len(diagnoses) > 0,
                progress_pct=100 if len(diagnoses) > 0 else 0,
            ),
            Achievement(
                id="ach-multimodal",
                title="Multi-Modal Scholar",
                description="Unlocked Visual, Spoken Math, and Cognitive Support learning modes",
                icon="Compass",
                unlocked=True,
                progress_pct=100,
            ),
            Achievement(
                id="ach-concept-scholar",
                title="Concept Scholar",
                description="Achieved 85%+ accuracy in conceptual understanding and definitions",
                icon="Brain",
                unlocked=(comp_score >= 85.0),
                progress_pct=int(min(comp_score, 100.0)),
            ),
            Achievement(
                id="ach-application-master",
                title="Application Master",
                description="Demonstrated proficiency in algorithmic problem solving and practical calculations",
                icon="Trophy",
                unlocked=(app_score >= 80.0),
                progress_pct=int(min(app_score, 100.0)),
            ),
            Achievement(
                id="ach-remediation",
                title="Remediation Champion",
                description="Completed targeted remediation and solved second-chance practice problems",
                icon="Award",
                unlocked=len(diagnoses) > 0,
                progress_pct=100 if len(diagnoses) > 0 else 0,
            ),
        ]

        # 9. Recent Activity Timeline
        user_progress_map = {}
        if user and hasattr(user, "id"):
            try:
                from app.services.progress_service import ProgressService
                progs = ProgressService.get_instance().get_user_progress(user.id)
                for p in progs:
                    user_progress_map[p.lecture_id] = p
            except Exception as e:
                print(f"Warning: Failed to load user progress for dashboard: {e}")

        recent_activity: List[RecentActivity] = []
        for lecture_id, lec in extracted_lectures.items():
            filename = lec.get("filename", "Lecture")
            title = filename.replace(".mp4", "").replace(".webm", "").replace("_", " ").title()
            if "concepts" in lec and len(lec["concepts"]) > 0:
                first_concept = lec["concepts"][0].get("name", "")
                if first_concept:
                    title = first_concept

            user_prog = user_progress_map.get(lecture_id)
            diag = diagnoses.get(lecture_id)

            if user_prog and user_prog.latest_quiz_score is not None:
                last_score = float(user_prog.latest_quiz_score)
                status = "Completed" if last_score >= 80 else "Remediation In Progress"
                ts = user_prog.updated_at
            elif diag:
                last_score = float(diag.get("percentage", 75.0))
                status = "Remediation In Progress" if diag.get("learning_gaps") else "Completed"
                ts = datetime.now(timezone.utc).isoformat()
            else:
                last_score = 0.0
                status = "Assessment Pending"
                ts = datetime.now(timezone.utc).isoformat()

            # Use current ISO timestamp or mock recent date
            recent_activity.append(
                RecentActivity(
                    lecture_id=lecture_id,
                    title=title,
                    last_score=last_score,
                    status=status,
                    timestamp=ts,
                )
            )

        return DashboardOverviewResponse(
            profile=profile,
            readiness=readiness,
            active_gaps=active_gaps,
            missions=missions,
            achievements=achievements,
            recent_activity=recent_activity,
        )
