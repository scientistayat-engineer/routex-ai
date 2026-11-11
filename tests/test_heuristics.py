from backend.app.heuristics import classify_heuristic


def test_math():
    assert classify_heuristic("What is 25 * 4?")["category"] == "MATH"


def test_translate():
    assert classify_heuristic("Translate hello to French")["category"] == "TRANSLATE"


def test_summarize():
    assert classify_heuristic("Summarize this paragraph")["category"] == "SUMMARIZE"


def test_explain_default():
    assert classify_heuristic("Why is the sky blue?")["category"] == "EXPLAIN"


def test_write():
    assert classify_heuristic("Write a polite email asking for an extension")["category"] == "WRITE"


def test_code_not_write():
    assert classify_heuristic("write a python function to sort a list")["category"] == "CODE"
