
from fastapi import FastAPI

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
