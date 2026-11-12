
from scipy.stats import linregress

from app.schemas.analysis import TrendAnalysisResponse
from app.schemas.climate import TemperatureResponse


class InsufficientDataError(ValueError):
    pass


def analyze_temperature_trend(
    climate_data: TemperatureResponse,
) -> TrendAnalysisResponse:
    records = sorted(
        climate_data.records,
        key=lambda record: record.year,
    )

    if len(records) < 3:
        raise InsufficientDataError(
            "At least 3 annual observations are required."
        )

    years = [record.year for record in records]
    temperatures = [
        record.temperature for record in records
    ]

    if len(set(years)) != len(years):
        raise ValueError(
            "Duplicate years are not allowed."
        )

    if len(set(temperatures)) == 1:
        raise ValueError(
            "Regression requires temperature variability."
        )

    result = linregress(years, temperatures)

    slope = float(result.slope)
    p_value = float(result.pvalue)
    significant = p_value < 0.05

    if not significant:
        trend = "stable"
    elif slope > 0:
        trend = "warming"
    elif slope < 0:
        trend = "cooling"
    else:
        trend = "stable"

    return TrendAnalysisResponse(
        latitude=climate_data.latitude,
        longitude=climate_data.longitude,
        start_year=climate_data.start_year,
        end_year=climate_data.end_year,
        observations=len(records),
        slope_celsius_per_year=round(slope, 6),
        slope_celsius_per_decade=round(slope * 10, 4),
        intercept=round(float(result.intercept), 6),
        r_squared=round(float(result.rvalue ** 2), 6),
        p_value=round(p_value, 8),
        significant=significant,
        trend=trend,
        years=years,
        temperatures=temperatures,
    )
