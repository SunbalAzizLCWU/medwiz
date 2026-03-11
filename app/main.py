import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import analyze, auth, health, org, reports
from app.workers.job_queue import scheduler

logging.basicConfig(level=logging.INFO)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(application: FastAPI):
    scheduler.start()
    logging.getLogger("auranode").info("APScheduler started.")
    yield
    scheduler.shutdown(wait=False)
    logging.getLogger("auranode").info("APScheduler stopped.")


app = FastAPI(
    title="AuraNode API",
    description="AI-powered medical report analysis platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(org.router, prefix="/api/org", tags=["org"])
