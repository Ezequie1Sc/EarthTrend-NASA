from datetime import date
from fastapi import APIRouter, HTTPException, Query, Response
from starlette.concurrency import run_in_threadpool
from app.schemas.thermal import ThermalGrid, ThermalSource, Provider
from app.services.thermal_service import ThermalService, ThermalError

router = APIRouter(prefix='/api/v1/thermal', tags=['Global air temperature'])
service = ThermalService()

@router.get('/sources', response_model=list[ThermalSource])
async def sources():
    """Available archives and locally imported MERRA-2 dates (UTC)."""
    return await run_in_threadpool(service.sources)

@router.get('/grid', response_model=ThermalGrid, responses={404: {'description': 'Day unavailable'}, 502: {'description': 'Invalid upstream data'}, 504: {'description': 'Upstream timeout'}})
async def grid(response: Response, date: date = Query(description='UTC date, YYYY-MM-DD'), provider: Provider = 'noaa'):
    """Native global daily mean at 2 m, °C. Flat values[row * width + column].

    Latitudes descend north→south, longitudes ascend -180→180 (exclusive).
    Missing cells are null. Requests subset one day and use a bounded disk cache.
    """
    try:
        result = await service.get_grid(date, provider)
        response.headers['Cache-Control'] = 'public, max-age=86400'
        return result
    except ThermalError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc
