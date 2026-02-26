"""
Application configuration and secrets management.

Loads environment variables from .env file (gitignored). The GROQ_API_KEY
is never committed to version control. All modules should import from here
to access the API key.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load .env from backend directory or project root (before Settings reads env)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    groq_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


def get_groq_api_key(request_key: str | None = None) -> str | None:
    """
    Return the Groq API key to use for requests.

    Priority: request_key (from client) > GROQ_API_KEY env var.
    Returns None if neither is set.
    """
    if request_key and request_key.strip():
        return request_key.strip()
    settings = get_settings()
    return settings.groq_api_key


def has_server_api_key() -> bool:
    """Return True if the server has a configured Groq API key."""
    return bool(get_settings().groq_api_key)
