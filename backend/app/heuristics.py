"""Rule-based fallback classifier. Used when the LLM is unavailable or returns bad output."""
import re

_MATH = re.compile(r"(\d+\s*[\+\-\*/\^x×÷%]\s*\d+|\b(solve|calculate|compute|equation|integral|derivative|sqrt|percent|factorial|probability|algebra|sum of)\b)", re.I)
_CODE = re.compile(r"(```|\bdef \w+\(|\b(write|fix|debug)\b.*\b(code|function|script|program|bug|error)\b|\b(python|javascript|java|c\+\+|sql|html|css|regex|api)\b.*\b(code|function|script|query)\b)", re.I | re.S)
_TRANS = re.compile(r"\b(translate|translation|in (urdu|hindi|french|spanish|german|arabic|english|chinese))\b", re.I)
_WRITE = re.compile(r"\b(write|draft|compose|rewrite)\b.*\b(email|e-mail|essay|story|poem|letter|caption|speech|blog|post|paragraph|message)\b", re.I | re.S)
_SUMM = re.compile(r"\b(summari[sz]e|summary|tl;?dr|shorten|key points)\b", re.I)


def classify_heuristic(query: str) -> dict:
    q = query.strip()
    if _TRANS.search(q):
        cat, why = "TRANSLATE", "Detected translation keywords."
    elif _SUMM.search(q):
        cat, why = "SUMMARIZE", "Detected summarization keywords."
    elif _WRITE.search(q):
        cat, why = "WRITE", "Detected a writing or drafting request."
    elif _CODE.search(q):
        cat, why = "CODE", "Detected programming keywords."
    elif _MATH.search(q):
        cat, why = "MATH", "Detected arithmetic or math keywords."
    else:
        cat, why = "EXPLAIN", "No specific pattern matched; defaulting to explanation."
    return {"category": cat, "confidence": 0.6, "reasoning": why + " (rule-based fallback)"}
