from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, extract, quiz, diagnosis, qa, dashboard, auth, progress

app = FastAPI(title="AccessLearn API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(progress.router, prefix="/api/user/progress", tags=["progress"])
app.include_router(upload.router, prefix="/api/lectures", tags=["lectures"])
app.include_router(extract.router, prefix="/api/lectures", tags=["lectures"])
app.include_router(quiz.router, prefix="/api/lectures", tags=["lectures"])
app.include_router(diagnosis.router, prefix="/api/lectures", tags=["lectures"])
app.include_router(qa.router, prefix="/api/lectures", tags=["lectures"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "accesslearn-backend"
    }



