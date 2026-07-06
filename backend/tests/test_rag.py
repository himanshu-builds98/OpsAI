"""
Tests for PromptBuilder and QueryProcessor.

Note: This file previously tested a `PromptBuilder.detect_intent(...)`
API and a `build_system_prompt(profile)` signature that do not exist in
the current codebase (intent detection lives in QueryProcessor, and
build_system_prompt() takes no arguments). Those tests were already
failing against the current code prior to the Sprint 2 response_engine
refactor. This file replaces them with tests against the APIs that
actually exist today; PromptBuilder's prompt text itself was NOT
modified by the Sprint 2 refactor (only its call site moved into
LLMFormatter).
"""
from app.rag.prompt_builder import PromptBuilder
from app.rag.query_processor import QueryProcessor


def test_intent_detection():
    assert QueryProcessor.process("What is FOB?").intent == "quick"
    assert QueryProcessor.process("Compare FOB and CIF").intent == "comparison"
    assert QueryProcessor.process(
        "What is the difference between FOB and CIF?"
    ).intent == "comparison"
    assert QueryProcessor.process("FOB vs CIF").intent == "comparison"
    assert QueryProcessor.process(
        "Give me a deep dive on Bill of Lading"
    ).intent == "detailed"
    assert QueryProcessor.process(
        "What is the complete workflow for a Letter of Credit?"
    ).intent == "workflow"


def test_system_prompt_builder():
    system_prompt = PromptBuilder.build_system_prompt()
    assert "Kaizen Trade Assistant" in system_prompt
    assert "CRITICAL RULES" in system_prompt
    assert "I don't have enough verified information on this topic." in system_prompt


def test_user_prompt_builder_includes_query_and_context():
    query = "What is FOB?"
    context = "Term: FOB\nDefinition: Free on Board."

    prompt = PromptBuilder.build_user_prompt(query, context, "quick")

    assert query in prompt
    assert context in prompt
    assert "RESPONSE GUIDELINES" in prompt


def test_user_prompt_builder_same_for_all_intents():
    # The current PromptBuilder auto-detects style guidance within a single
    # user-prompt template rather than branching per intent; verify the
    # guidance section is present regardless of the intent passed in.
    for intent in ("quick", "detailed", "comparison", "workflow"):
        prompt = PromptBuilder.build_user_prompt("What is FOB?", "context", intent)
        assert "Determine the most appropriate response style automatically" in prompt
