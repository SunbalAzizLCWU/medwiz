from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analyze, auth, health, org, reports
from app.core.config import settings
from app.core.logging_config import logger, setup_logging
from app.workers.job_queue import init_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    init_scheduler()
    logger.info("AuraNode API started")
    yield
    shutdown_scheduler()
    logger.info("AuraNode API stopped")


app = FastAPI(
    title="AuraNode API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/health")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(reports.router, prefix="/api/reports")
app.include_router(analyze.router, prefix="/api/analyze")
app.include_router(org.router, prefix="/api/org")


@app.get("/")
async def root() -> dict:
    return {"message": "AuraNode API", "status": "running", "version": "1.0.0"}
