
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.climate import (
    TemperatureRecord,
    TemperatureResponse,
)

client = TestClient(app)


def test_invalid_latitude():
    response = client.get(
        "/api/v1/climate/temperature",
        params={
            "latitude": 100,
            "longitude": -90,
            "start_year": 2020,
            "end_year": 2022,
        },
    )

    assert response.status_code == 422


def test_invalid_year_range():
    response = client.get(
        "/api/v1/climate/temperature",
        params={
            "latitude": 19.8,
            "longitude": -90.5,
            "start_year": 2024,
            "end_year": 2020,
        },
    )

    assert response.status_code == 422


def test_temperature_success():
    mock_result = TemperatureResponse(
        latitude=19.8,
        longitude=-90.5,
        start_year=2020,
        end_year=2021,
        records=[
            TemperatureRecord(
                year=2020,
                temperature=27.1,
            ),
            TemperatureRecord(
                year=2021,
                temperature=27.4,
            ),
        ],
    )

    with patch(
        "app.api.routes.climate.fetch_annual_temperature",
        new_callable=AsyncMock,
        return_value=mock_result,
    ):
        response = client.get(
            "/api/v1/climate/temperature",
            params={
                "latitude": 19.8,
                "longitude": -90.5,
                "start_year": 2020,
                "end_year": 2021,
            },
        )

    assert response.status_code == 200
    assert len(response.json()["records"]) == 2
    assert response.json()["records"][0]["year"] == 2020
