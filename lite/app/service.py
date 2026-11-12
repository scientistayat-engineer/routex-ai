"""ROUTEX Lite: the same routing logic as backend/app/router_service.py, without CrewAI.
Agents are plain role/goal/backstory prompts sent to the Groq API. Behaviour and response format match the full version."""
import json
import logging
import re
import time
import uuid
from typing import Optional

from .heuristics import classify_heuristic
from .llm import chat
from .meta import AGENT_META, ROUTER_META, public_info
from .config import settings
from .tracing import traceable

CATEGORIES = list(AGENT_META.keys())
logger = logging.getLogger("routex")


def _system(meta: dict) -> str:
    return f"You are a {meta['role']}. {meta['backstory']}\nYour goal: {meta['goal']}"


def _parse_json(text: str) -> dict:
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise ValueError("no json in router output")
    return json.loads(m.group(0))


@traceable(name="router_agent_classify", run_type="chain")
def classify(query: str) -> dict:
    desc = (
        "Classify the user query into exactly ONE category from: " + ", ".join(CATEGORIES)
        + ".\n- MATH: calculations, equations, numeric problems\n- EXPLAIN: concepts, how/why questions\n"
        "- CODE: write/debug/explain code\n- TRANSLATE: translate text between languages\n"
        "- SUMMARIZE: shorten or summarise given text\n"
        "- WRITE: draft emails, essays, stories, posts or other writing\n\n"
        f"User query: {query}\n\n"
        'Reply with ONLY JSON: {"category": "<CATEGORY>", "confidence": <0..1>, "reasoning": "<one short sentence>"}'
    )
    data = _parse_json(chat(_system(ROUTER_META), desc))
    cat = str(data.get("category", "")).upper().strip()
    if cat not in CATEGORIES:
        raise ValueError(f"unknown category {cat}")
    conf = max(0.0, min(1.0, float(data.get("confidence", 0.8))))
    return {"category": cat, "confidence": conf, "reasoning": str(data.get("reasoning", "")).strip()}


@traceable(name="router_batch_item", run_type="chain")
def classify_with_fallback(query: str) -> dict:
    s = time.perf_counter()
    try:
        r, fb = classify(query), False
    except Exception:
        r, fb = classify_heuristic(query), True
    return {**r, "query": query, "used_fallback": fb, "ms": int((time.perf_counter() - s) * 1000)}


@traceable(name="specialist_agent_answer", run_type="chain")
def answer(category: str, query: str, context: str = "") -> str:
    desc = (
        f"{context}Handle this user request as the {AGENT_META[category]['role']}:\n\n{query}\n\n"
        "Formatting rules: reply in plain text with simple markdown only (bold, bullet lists, code blocks). "
        "Write maths in plain text such as 15 × 240 = 3600. Do not use LaTeX (no \\( \\), \\[ \\] or \\boxed)."
    )
    return chat(_system(AGENT_META[category]), desc)


def _context(memory) -> str:
    turns = [m for m in (memory or []) if isinstance(m, dict)][-4:]
    if not turns:
        return ""
    lines = [f"User: {str(t.get('q', ''))[:300]}\nAssistant: {str(t.get('a', ''))[:400]}" for t in turns]
    return "Previous conversation (for context only):\n" + "\n".join(lines) + "\n\nCurrent request follows.\n"


def _run_chain(query: str, chain: list, context: str):
    steps, text = [], query
    for i, cat in enumerate(chain):
        s = time.perf_counter()
        prompt = text if i == 0 else f"Apply your role to the following text and return only the result:\n\n{text}"
        try:
            text, status = answer(cat, prompt, context if i == 0 else ""), "ok"
        except Exception as exc:
            text, status = f"⚠️ The {AGENT_META[cat]['role']} could not finish: {exc}", "error"
        steps.append(dict(step=f"Pipeline step {i + 1}", agent=AGENT_META[cat]["role"], status=status, ms=int((time.perf_counter() - s) * 1000)))
        if status == "error":
            break
    return text, steps


def route_and_answer(query: str, force_agent: Optional[str] = None, chain: Optional[list] = None, memory: Optional[list] = None) -> dict:
    return _route_and_answer(query, force_agent, chain, memory)


@traceable(name="smart_query_router", run_type="chain")
def _route_and_answer(query: str, force_agent, chain, memory) -> dict:
    t0 = time.perf_counter()
    steps, used_fallback = [], False
    forced = bool(force_agent and force_agent.upper() in CATEGORIES)
    context = _context(memory)
    chain = [c.upper() for c in (chain or []) if c.upper() in CATEGORIES][:3]
    if len(chain) >= 2:
        text, steps = _run_chain(query, chain, context)
        cat = chain[-1]
        return dict(
            id=uuid.uuid4().hex[:12], query=query, category=cat, confidence=1.0,
            reasoning="Pipeline: " + " → ".join(AGENT_META[c]["role"] for c in chain), agent=public_info(cat),
            answer=text, steps=steps, total_ms=int((time.perf_counter() - t0) * 1000), model=settings.model_id,
            used_fallback=False, forced=True, chain=chain, engine="lite",
        )
    s = time.perf_counter()
    if forced:
        route = {"category": force_agent.upper(), "confidence": 1.0, "reasoning": "Agent selected manually by the user."}
        status = "skipped"
    else:
        try:
            route, status = classify(query), "ok"
        except Exception as exc:
            logger.warning("Router failed, using rule-based fallback: %s", exc)
            route, used_fallback, status = classify_heuristic(query), True, "fallback"
            route["reasoning"] += f" [LLM error: {str(exc)[:140]}]"
    steps.append(dict(step="Classify query", agent="Query Router", status=status, ms=int((time.perf_counter() - s) * 1000)))
    cat = route["category"]
    s = time.perf_counter()
    try:
        text, status = answer(cat, query, context), "ok"
    except Exception as exc:
        logger.warning("Specialist %s failed: %s", cat, exc)
        text, status = f"⚠️ The {AGENT_META[cat]['role']} could not finish: {exc}", "error"
    steps.append(dict(step="Generate answer", agent=AGENT_META[cat]["role"], status=status, ms=int((time.perf_counter() - s) * 1000)))
    return dict(
        id=uuid.uuid4().hex[:12], query=query, category=cat, confidence=route["confidence"], reasoning=route["reasoning"],
        agent=public_info(cat), answer=text, steps=steps, total_ms=int((time.perf_counter() - t0) * 1000), model=settings.model_id,
        used_fallback=used_fallback, forced=forced, chain=[], engine="lite",
    )
