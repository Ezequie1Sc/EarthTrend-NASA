
from typing import Literal

from pydantic import BaseModel, Field


class TrendAnalysisResponse(BaseModel):
    latitude: float
    longitude: float
    start_year: int
    end_year: int
    observations: int

    slope_celsius_per_year: float
    slope_celsius_per_decade: float

    intercept: float
    r_squared: float
    p_value: float

    significant: bool
    trend: Literal["warming", "cooling", "stable"]

    confidence_level: float = 0.95
    source: str = "NASA POWER"

    years: list[int] = Field(default_factory=list)
    temperatures: list[float] = Field(default_factory=list)
