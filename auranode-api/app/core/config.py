from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    GROQ_API_KEY: str
    ONNX_MODEL_URL: str
    JWT_SECRET: str
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: list[str] = ["*"]
    MODEL_CACHE_PATH: str = "/tmp/auranode_model.onnx"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        # If Render passes a comma-separated string, convert it to a list safely
        if isinstance(v, str):
            if v.startswith("["):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",")]
        return v

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
