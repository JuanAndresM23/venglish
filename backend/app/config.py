import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
APP_ENV = os.getenv("APP_ENV", "development")

load_dotenv(BASE_DIR / ".env", override=APP_ENV == "development")


def as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _clean_env(name: str) -> str:
    return os.getenv(name, "").strip().strip('"').strip("'")


class Config:
    APP_ENV = APP_ENV
    DEBUG = APP_ENV == "development"

    SECRET_KEY = os.environ["SECRET_KEY"]
    DATABASE_URL = _clean_env("DATABASE_URL")

    MAX_CONTENT_LENGTH = 1 * 1024 * 1024
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=60)
    SESSION_PERMANENT = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = as_bool(os.getenv("SESSION_COOKIE_SECURE"), False)
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_NAME = "venglish_session"

    # Asistente (chatbot) con la API de Claude
    ANTHROPIC_API_KEY = _clean_env("ANTHROPIC_API_KEY")
    CHATBOT_MODEL = _clean_env("CHATBOT_MODEL") or "claude-haiku-5-5"
    CHATBOT_EFFORT = _clean_env("CHATBOT_EFFORT") or "low"

    FRONTEND_ORIGINS = [
        origin.strip().rstrip("/")
        for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
