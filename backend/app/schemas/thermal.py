"""Wire contract: native grid nodes, north to south and west to east."""
from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, model_validator

Provider = Literal['noaa', 'merra2']

class ThermalGrid(BaseModel):
    schema_version: Literal[1] = 1
    provider: Provider
    date: date
    source: str
    source_url: str
    source_sha256: str
    retrieved_at: str
    variable: Literal['air_temperature_2m'] = 'air_temperature_2m'
    statistic: Literal['daily_mean'] = 'daily_mean'
    unit: Literal['°C'] = '°C'
    resolution: str
    latitudes: list[float]
    longitudes: list[float]
    values: list[float | None]
    width: int
    height: int
    valid_cells: int
    minimum: float
    maximum: float
    notes: list[str] = Field(default_factory=list)

    @model_validator(mode='after')
    def shape(self):
        if self.width != len(self.longitudes) or self.height != len(self.latitudes):
            raise ValueError('Coordinate dimensions do not match grid')
        if len(self.values) != self.width * self.height:
            raise ValueError('Invalid row-major grid length')
        if any(a <= b for a, b in zip(self.latitudes, self.latitudes[1:])):
            raise ValueError('Latitudes must be strictly north to south')
        if any(a >= b for a, b in zip(self.longitudes, self.longitudes[1:])):
            raise ValueError('Longitudes must be strictly west to east')
        import math
        if not all(math.isfinite(x) and -90 <= x <= 90 for x in self.latitudes):
            raise ValueError('Invalid latitudes')
        if not all(math.isfinite(x) and -180 <= x < 180 for x in self.longitudes):
            raise ValueError('Invalid longitudes')
        valid = [v for v in self.values if v is not None]
        if not valid or len(valid) != self.valid_cells or not all(math.isfinite(v) for v in valid):
            raise ValueError('Invalid temperature cells')
        if min(valid) != self.minimum or max(valid) != self.maximum:
            raise ValueError('Invalid temperature range')
        return self

class ThermalSource(BaseModel):
    id: Provider
    name: str
    resolution: str
    start: date | None
    end: date | None
    dates: list[date] | None = None
    available: bool
    note: str
