import pytest
from app.rag.prompt_builder import PromptBuilder

def test_intent_detection():
    # Heuristics checks
    assert PromptBuilder.detect_intent("What is FOB?") == "quick"
    assert PromptBuilder.detect_intent("Compare FOB and CIF") == "comparison"
    assert PromptBuilder.detect_intent("What is the difference between FOB and CIF?") == "comparison"
    assert PromptBuilder.detect_intent("FOB vs CIF") == "comparison"
    assert PromptBuilder.detect_intent("Give me a deep dive on Bill of Lading") == "detailed"
    assert PromptBuilder.detect_intent("What are the problems with scope creep?") == "detailed"

def test_system_prompt_builder():
    student_system = PromptBuilder.build_system_prompt("student")
    assert "STUDENT" in student_system
    assert "Kaizen Trade Assistant" in student_system
    assert "ICC Incoterms" not in student_system

    professional_system = PromptBuilder.build_system_prompt("professional")
    assert "PROFESSIONAL" in professional_system
    assert "ICC Incoterms" in professional_system

def test_user_prompt_builder():
    query = "What is FOB?"
    context = "Term: FOB\nDefinition: Free on Board."
    
    quick_prompt = PromptBuilder.build_user_prompt(query, context, "quick")
    assert "RESPONSE MODE: Quick Explanation" in quick_prompt
    assert "Operational Tip:" in quick_prompt
    assert "Common Risk:" in quick_prompt
    assert "Recommendation:" in quick_prompt

    detailed_prompt = PromptBuilder.build_user_prompt(query, context, "detailed")
    assert "RESPONSE MODE: Detailed Learning" in detailed_prompt
    assert "What is it?" in detailed_prompt
    assert "Common Problems:" in detailed_prompt
    assert "Operational Insight:" in detailed_prompt

    comparison_prompt = PromptBuilder.build_user_prompt(query, context, "comparison")
    assert "RESPONSE MODE: Comparison Mode" in comparison_prompt
    assert "| Term | Definition | Responsibility |" in comparison_prompt
