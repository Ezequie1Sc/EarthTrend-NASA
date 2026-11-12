
from fastapi import FastAPI

from app.api.routes.health import router as health_router

app = FastAPI(
    title="EarthTrend NASA API",
    description="NASA Earth science trend analysis platform.",
    version="0.1.0",
)

app.include_router(health_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "EarthTrend NASA API is running",
        "status": "ok",
        "documentation": "/docs",
    }
