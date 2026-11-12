"""Agent metadata. No CrewAI imports, so the lightweight (serverless) backend can reuse it."""

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


def public_info(key: str) -> dict:
    m = AGENT_META[key]
    return dict(key=key, role=m["role"], goal=m["goal"], color=m["color"], icon=m["icon"])
