import sqlite3
import os
from pathlib import Path
from typing import Optional, Generator
from contextlib import contextmanager

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "aven_persistence.db"

class DatabaseService:
    _instance: Optional["DatabaseService"] = None

    @classmethod
    def get_instance(cls) -> "DatabaseService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    @contextmanager
    def get_db(self) -> Generator[sqlite3.Connection, None, None]:
        conn = self._get_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self):
        with self.get_db() as conn:
            cursor = conn.cursor()
            
            # Users Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                google_id TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                picture TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """)

            # User Sessions Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)

            # Learner Progress Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS learner_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                lecture_id TEXT NOT NULL,
                progress_pct REAL DEFAULT 0.0,
                latest_quiz_score REAL,
                latest_quiz_data TEXT,
                diagnosis_summary TEXT,
                remediation_completed INTEGER DEFAULT 0,
                readiness_score REAL,
                updated_at TEXT NOT NULL,
                UNIQUE(user_id, lecture_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)

            # Interview Results Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS interview_results (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                overall_score REAL NOT NULL,
                evaluation_json TEXT NOT NULL,
                rounds_count INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)
            
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_progress_user_id ON learner_progress(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_interview_user_id ON interview_results(user_id);")
