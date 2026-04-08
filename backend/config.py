import os
from typing import Optional

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/petal"
    SUPABASE_URL: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_ANON_KEY: str = ""
    GEMINI_API_KEY: str = Field(
        default="",
        validation_alias=AliasChoices("GEMINI_API_KEY", "GOOGLE_API_KEY"),
    )
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GOOGLE_CLOUD_PROJECT: str = "local"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GMAIL_MCP_URL: Optional[str] = None
    GCAL_MCP_URL: Optional[str] = None
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5173"
    )
    JWT_SECRET: str = Field(
        default="petal-dev-secret-key-change-in-production",
        validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"),
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if v is None:
            return "http://localhost:5173"

        if isinstance(v, str):
            raw = v.strip()
            if not raw:
                return "http://localhost:5173"
            # Keep as comma-separated string for now
            return raw

        if isinstance(v, (list, tuple, set)):
            return ",".join(str(origin).strip() for origin in v if str(origin).strip())

        return str(v)
    
    def get_allowed_origins(self) -> list[str]:
        """Convert comma-separated origins string to list."""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
