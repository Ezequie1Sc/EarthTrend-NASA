
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.climate import router as climate_router
from app.api.routes.analysis import router as analysis_router
from app.core.config import settings


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "EarthTrend NASA API — Earth science data "
        "exploration and climate trend analysis."
    ),
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# CORS configuration for local Angular development.
# Production frontend origins should be configured separately.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

# API routers
app.include_router(health_router)
app.include_router(climate_router)
app.include_router(analysis_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "application": settings.APP_NAME,
        "message": "EarthTrend NASA API is running",
        "status": "ok",
        "version": settings.APP_VERSION,
        "documentation": "/docs",
    }
