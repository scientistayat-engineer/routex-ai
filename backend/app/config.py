"""Central configuration. Reads .env locally; uses real env vars on Vercel/Render."""
import os
import tempfile
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()

# Serverless-friendly: on Vercel the filesystem is read-only except /tmp. Locally, CrewAI uses its own default.
if os.getenv("VERCEL"):
    os.environ.setdefault("CREWAI_STORAGE_DIR", os.path.join(tempfile.gettempdir(), "crewai"))
os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true")
os.environ.setdefault("OTEL_SDK_DISABLED", "true")


@dataclass(frozen=True)
class Settings:
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "groq/openai/gpt-oss-120b")
    temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    max_query_chars: int = int(os.getenv("MAX_QUERY_CHARS", "2000"))
    allowed_origins: tuple = tuple(
        o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()
    )
    langsmith_enabled: bool = os.getenv("LANGSMITH_TRACING", "false").lower() == "true"
    langsmith_project: str = os.getenv("LANGSMITH_PROJECT", "smart-query-router")


settings = Settings()
