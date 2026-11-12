"""Minimal Groq client (OpenAI-compatible chat completions) using httpx. Replaces CrewAI + LiteLLM in Lite mode."""
import time

import httpx

from .config import settings


class LLMError(Exception):
    pass


def chat(system: str, user: str) -> str:
    if not settings.groq_api_key:
        raise LLMError("GROQ_API_KEY is not configured on the server.")
    url = settings.groq_base_url.rstrip("/") + "/chat/completions"
    payload = {
        "model": settings.model_id,
        "temperature": settings.temperature,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
    }
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    last = "unknown error"
    for attempt in range(2):
        try:
            r = httpx.post(url, json=payload, headers=headers, timeout=settings.timeout)
        except httpx.HTTPError as exc:
            last = f"network error: {exc}"
        else:
            if r.status_code == 200:
                try:
                    return (r.json()["choices"][0]["message"]["content"] or "").strip()
                except (KeyError, IndexError, ValueError):
                    last = "unexpected response format from Groq"
            elif r.status_code in (429, 500, 502, 503, 504):
                last = f"Groq returned {r.status_code}"
            else:
                raise LLMError(f"Groq error {r.status_code}: {r.text[:200]}")
        if attempt == 0:
            time.sleep(1.2)
    raise LLMError(last)
