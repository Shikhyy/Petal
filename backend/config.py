from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import field_validator
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/petal"
    SUPABASE_URL: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_ANON_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GOOGLE_CLOUD_PROJECT: str = "local"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GMAIL_MCP_URL: Optional[str] = None
    GCAL_MCP_URL: Optional[str] = None
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    JWT_SECRET: str = "petal-dev-secret-key-change-in-production"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return v
        return ",".join(v)

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
