from app.rag.query_processor import QueryProcessor
from app.rag.prompt_builder import PromptBuilder


def test_query_processor_quick():

    result = QueryProcessor.process("What is FOB?")

    assert result.intent == "quick"


def test_query_processor_comparison():

    result = QueryProcessor.process("Compare FOB vs CIF")

    assert result.intent == "comparison"


def test_query_processor_detailed():

    result = QueryProcessor.process(
        "Explain Bill of Lading in detail"
    )

    assert result.intent == "detailed"


def test_system_prompt():

    prompt = PromptBuilder.build_system_prompt()

    assert isinstance(prompt, str)

    assert len(prompt) > 100


def test_user_prompt():

    context = (
        "Term: FOB\n"
        "Definition: Free On Board"
    )

    prompt = PromptBuilder.build_user_prompt(
        "What is FOB?",
        context,
        "quick",
    )

    assert "USER QUESTION" in prompt
    assert "RETRIEVED CONTEXT" in prompt
    assert "TASK" in prompt
    assert "FOB" in prompt


def test_user_prompt_comparison():

    context = (
        "Term: FOB\n"
        "Definition: Free On Board"
    )

    prompt = PromptBuilder.build_user_prompt(
        "Compare FOB vs CIF",
        context,
        "comparison",
    )

    assert "USER QUESTION" in prompt
    assert "RETRIEVED CONTEXT" in prompt
    assert "Compare FOB vs CIF" in prompt


def test_user_prompt_detailed():

    context = (
        "Term: Bill of Lading\n"
        "Definition: Shipping document"
    )

    prompt = PromptBuilder.build_user_prompt(
        "Explain Bill of Lading",
        context,
        "detailed",
    )

    assert "USER QUESTION" in prompt
    assert "RETRIEVED CONTEXT" in prompt
    assert "Bill of Lading" in prompt