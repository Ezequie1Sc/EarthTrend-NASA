from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "EarthTrend NASA API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    NASA_POWER_BASE_URL: str = (
        "https://power.larc.nasa.gov/api/temporal"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
