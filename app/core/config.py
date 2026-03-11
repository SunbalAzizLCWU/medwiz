from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ONNX model
    ONNX_MODEL_URL: str = ""
    MODEL_CACHE_PATH: str = "/tmp/xray_model.onnx"

    # Groq
    GROQ_API_KEY: str = ""

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 30

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
