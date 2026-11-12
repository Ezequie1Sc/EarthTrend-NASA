
from pydantic import BaseModel, Field


class TemperatureRecord(BaseModel):
    year: int
    temperature: float


class TemperatureResponse(BaseModel):
    parameter: str = "T2M"
    unit: str = "C"
    latitude: float
    longitude: float
    start_year: int
    end_year: int
    records: list[TemperatureRecord] = Field(default_factory=list)
    source: str = "NASA POWER"
