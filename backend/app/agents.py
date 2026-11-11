"""Agent registry: one router agent + six specialist agents (CrewAI)."""
from crewai import Agent, LLM

from .compat import patch_litellm
from .config import settings

patch_litellm()

# Static metadata used by the API and the frontend visualizer.
AGENT_META = {
    "MATH": dict(
        role="Math Expert",
        goal="Solve mathematical problems accurately, showing clear steps and a final answer.",
        backstory="You are a precise mathematician. You verify every calculation before answering.",
        color="#ffb454", icon="∑",
    ),
    "EXPLAIN": dict(
        role="Teacher",
        goal="Explain concepts simply with analogies and short examples.",
        backstory="You are a patient teacher who makes hard ideas easy for beginners.",
        color="#4ee1c1", icon="◉",
    ),
    "CODE": dict(
        role="Code Assistant",
        goal="Write, debug and explain clean, correct code with brief comments.",
        backstory="You are a senior software engineer who writes production-quality code.",
        color="#b48cff", icon="</>",
    ),
    "TRANSLATE": dict(
        role="Translator",
        goal="Translate text faithfully, preserving tone and meaning.",
        backstory="You are a professional multilingual translator.",
        color="#ff7eb6", icon="文",
    ),
    "SUMMARIZE": dict(
        role="Summarizer",
        goal="Condense text into a short, accurate summary with key points.",
        backstory="You are an editor who captures the essence of any text in few words.",
        color="#6ad1ff", icon="≡",
    ),
    "WRITE": dict(
        role="Writer",
        goal="Draft clear, polished emails, essays, posts and stories in the requested tone.",
        backstory="You are a professional writer and editor who adapts tone and structure to the audience.",
        color="#a3e635", icon="✎",
    ),
}

ROUTER_META = dict(
    role="Query Router",
    goal="Classify every user query into exactly one category: " + ", ".join(AGENT_META) + ".",
    backstory="You are a fast, reliable dispatcher. You never answer the query yourself - you only route it.",
    color="#7c9cff", icon="⇄",
)


class SafeLLM(LLM):
    """CrewAI 1.15.x marks messages with a `cache_breakpoint` flag that LiteLLM providers such as Groq reject.
    Strip it before the request is built. Older CrewAI versions never add the flag, so this is harmless there."""

    def _format_messages_for_provider(self, messages):
        cleaned = [{k: v for k, v in m.items() if k != "cache_breakpoint"} if isinstance(m, dict) else m for m in messages]
        return super()._format_messages_for_provider(cleaned)


def get_llm() -> LLM:
    return SafeLLM(model=settings.groq_model, api_key=settings.groq_api_key, temperature=settings.temperature)


def build_router_agent(llm: LLM) -> Agent:
    return Agent(
        role=ROUTER_META["role"], goal=ROUTER_META["goal"], backstory=ROUTER_META["backstory"],
        llm=llm, allow_delegation=False, verbose=False,
    )


def build_specialist(key: str, llm: LLM) -> Agent:
    m = AGENT_META[key]
    return Agent(
        role=m["role"], goal=m["goal"], backstory=m["backstory"],
        llm=llm, allow_delegation=False, verbose=False,
    )


def public_info(key: str) -> dict:
    m = AGENT_META[key]
    return dict(key=key, role=m["role"], goal=m["goal"], color=m["color"], icon=m["icon"])
