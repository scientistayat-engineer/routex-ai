"""ROUTEX Lite API (FastAPI). Same endpoints as the full backend, no CrewAI dependency."""
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .heuristics import classify_heuristic
from .meta import AGENT_META, ROUTER_META, public_info
from .schemas import BatchRequest, RouteRequest
from .service import classify_with_fallback, route_and_answer

app = FastAPI(title="ROUTEX Lite - Smart Query Router", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins) or ["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health():
    return {"status": "ok", "engine": "lite", "model": settings.model_id, "groq_key_set": bool(settings.groq_api_key),
            "langsmith": settings.langsmith_enabled, "project": settings.langsmith_project}


@app.get("/api/agents")
def agents():
    return {"router": {**ROUTER_META, "key": "ROUTER"}, "agents": [public_info(k) for k in AGENT_META]}


@app.post("/api/classify")
def classify_only(req: RouteRequest):
    return classify_heuristic(req.query)


@app.post("/api/route")
def route(req: RouteRequest):
    q = req.query.strip()
    if not q:
        raise HTTPException(400, "Query is empty.")
    if len(q) > settings.max_query_chars:
        raise HTTPException(413, f"Query too long (max {settings.max_query_chars} characters).")
    if not settings.groq_api_key:
        raise HTTPException(500, "GROQ_API_KEY is not configured on the server.")
    return route_and_answer(q, req.force_agent, req.chain, req.memory)


@app.post("/api/batch")
def batch(req: BatchRequest):
    if len(req.queries) > 10:
        raise HTTPException(413, "Max 10 queries per batch.")
    if not settings.groq_api_key:
        raise HTTPException(500, "GROQ_API_KEY is not configured on the server.")
    return {"results": [classify_with_fallback(q.strip()[: settings.max_query_chars]) for q in req.queries if q.strip()]}


_frontend = Path(__file__).resolve().parents[1] / "frontend"
if _frontend.exists() and not os.getenv("VERCEL"):
    app.mount("/", StaticFiles(directory=_frontend, html=True), name="frontend")
