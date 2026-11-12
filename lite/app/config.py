"""Settings for ROUTEX Lite (no CrewAI). Reads environment variables; .env is loaded locally if python-dotenv exists."""
import os
from dataclasses import dataclass

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover
    pass


@dataclass(frozen=True)
class Settings:
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    groq_base_url: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    timeout: float = float(os.getenv("LLM_TIMEOUT", "25"))
    max_query_chars: int = int(os.getenv("MAX_QUERY_CHARS", "2000"))
    allowed_origins: tuple = tuple(o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip())
    langsmith_enabled: bool = os.getenv("LANGSMITH_TRACING", "false").lower() == "true"
    langsmith_project: str = os.getenv("LANGSMITH_PROJECT", "smart-query-router")

    @property
    def model_id(self) -> str:
        # The CrewAI/LiteLLM form is "groq/<model>"; the Groq API itself wants just "<model>".
        m = self.groq_model
        return m[len("groq/"):] if m.startswith("groq/") else m


settings = Settings()
