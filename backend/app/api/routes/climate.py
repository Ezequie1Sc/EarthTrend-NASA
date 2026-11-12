
from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.schemas.climate import TemperatureResponse
from app.services.nasa_power_service import (
    NASAPowerError,
    fetch_annual_temperature,
)

router = APIRouter(
    prefix="/api/v1/climate",
    tags=["Climate"],
)


@router.get(
    "/temperature",
    response_model=TemperatureResponse,
)
async def get_temperature(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    start_year: int = Query(ge=1981),
    end_year: int = Query(ge=1981),
):
    if end_year < start_year:
        raise HTTPException(
            status_code=422,
            detail="end_year must be >= start_year",
        )

    if end_year > date.today().year - 1:
        raise HTTPException(
            status_code=422,
            detail="Only completed historical years are supported.",
        )

    try:
        return await fetch_annual_temperature(
            latitude=latitude,
            longitude=longitude,
            start_year=start_year,
            end_year=end_year,
        )
    except NASAPowerError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc
