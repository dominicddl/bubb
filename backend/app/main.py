from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import explain, health, notes, topics

app = FastAPI(title="bubb API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(notes.router, prefix="/api", tags=["notes"])
app.include_router(topics.router, prefix="/api", tags=["topics"])
