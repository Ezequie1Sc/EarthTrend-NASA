
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.climate import (
    TemperatureRecord,
    TemperatureResponse,
)
from app.services.trend_analysis_service import (
    InsufficientDataError,
    analyze_temperature_trend,
)


client = TestClient(app)


def build_climate_data(values):
    return TemperatureResponse(
        latitude=19.845,
        longitude=-90.523,
        start_year=2001,
        end_year=2020,
        records=[
            TemperatureRecord(
                year=2001 + index,
                temperature=value,
            )
            for index, value in enumerate(values)
        ],
    )


def test_warming_trend():
    data = build_climate_data(
        [25.0, 25.3, 25.6, 25.9, 26.2]
    )

    result = analyze_temperature_trend(data)

    assert result.trend == "warming"
    assert result.significant is True
    assert result.slope_celsius_per_decade == pytest.approx(3.0)
    assert result.r_squared == pytest.approx(1.0)


def test_cooling_trend():
    data = build_climate_data(
        [28.0, 27.7, 27.4, 27.1, 26.8]
    )

    result = analyze_temperature_trend(data)

    assert result.trend == "cooling"
    assert result.significant is True


def test_insufficient_data():
    data = build_climate_data([26.0, 26.3])

    with pytest.raises(InsufficientDataError):
        analyze_temperature_trend(data)


def test_analysis_endpoint():
    mock_data = build_climate_data(
        [25.0, 25.3, 25.6, 25.9, 26.2]
    )

    with patch(
        "app.api.routes.analysis.fetch_annual_temperature",
        new_callable=AsyncMock,
        return_value=mock_data,
    ):
        response = client.get(
            "/api/v1/analysis/trends",
            params={
                "latitude": 19.845,
                "longitude": -90.523,
                "start_year": 2001,
                "end_year": 2020,
            },
        )

    assert response.status_code == 200
    assert response.json()["trend"] == "warming"


def test_invalid_analysis_range():
    response = client.get(
        "/api/v1/analysis/trends",
        params={
            "latitude": 19.845,
            "longitude": -90.523,
            "start_year": 2024,
            "end_year": 2020,
        },
    )

    assert response.status_code == 422
