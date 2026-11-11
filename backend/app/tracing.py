"""LangSmith tracing helper. Falls back to a no-op decorator if langsmith is missing."""
try:
    from langsmith import traceable  # type: ignore
except Exception:  # pragma: no cover
    def traceable(*dargs, **dkwargs):
        def wrap(fn):
            return fn
        if dargs and callable(dargs[0]):
            return dargs[0]
        return wrap

__all__ = ["traceable"]
