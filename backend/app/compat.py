"""Compatibility shim: strip the `cache_breakpoint` flag that newer CrewAI versions add to messages.

Groq (and other LiteLLM providers) reject unknown message properties. Patching litellm itself works
for every CrewAI version, whichever code path builds the messages."""

_KEY = "cache_breakpoint"


def _clean(messages):
    if not isinstance(messages, list):
        return messages
    return [{k: v for k, v in m.items() if k != _KEY} if isinstance(m, dict) else m for m in messages]


def patch_litellm() -> bool:
    try:
        import litellm
    except Exception:
        return False
    if getattr(litellm, "_routex_patched", False):
        return True

    def wrap(fn):
        def inner(*args, **kwargs):
            if "messages" in kwargs:
                kwargs["messages"] = _clean(kwargs["messages"])
            elif len(args) > 1:
                args = (args[0], _clean(args[1])) + tuple(args[2:])
            return fn(*args, **kwargs)
        return inner

    litellm.completion = wrap(litellm.completion)
    if hasattr(litellm, "acompletion"):
        orig_async = litellm.acompletion

        async def acompletion(*args, **kwargs):
            if "messages" in kwargs:
                kwargs["messages"] = _clean(kwargs["messages"])
            return await orig_async(*args, **kwargs)

        litellm.acompletion = acompletion
    litellm._routex_patched = True
    return True
