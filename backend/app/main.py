from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, extract

app = FastAPI(title="AccessLearn API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/lectures", tags=["lectures"])
app.include_router(extract.router, prefix="/api/lectures", tags=["lectures"])

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "accesslearn-backend"
    }

