import re
from typing import Optional, List, Dict, Any, Tuple

class PromptBuilder:
    """
    Constructs LLM prompts dynamically based on response modes and user levels.
    """
    @staticmethod
    def detect_intent(query: str, requested_mode: Optional[str] = None) -> str:
        query_lower = query.lower().strip()

        # Respect explicit API mode
        if requested_mode in ("quick", "detailed", "comparison"):
            return requested_mode

        comparison_patterns = [
            r"\bvs\b",
            r"\bversus\b",
            r"\bcompare\b",
            r"\bdifference\b",
            r"\bdifferences\b",
            r"\bdistinguish\b",
        ]

        if any(re.search(pattern, query_lower) for pattern in comparison_patterns):
            return "comparison"

        detailed_patterns = [
            r"\bdetail\b",
            r"\bdetailed\b",
            r"\bdeep dive\b",
            r"\bexplain in detail\b",
            r"\bproblems\b",
            r"\bissues\b",
            r"\bexam\b",
            r"\bstudy\b",
            r"\bpurpose\b",
        ]

        if any(re.search(pattern, query_lower) for pattern in detailed_patterns):
            return "detailed"

        return "quick"
        
    @staticmethod
    def build_system_prompt(user_level: str) -> str:
        """
        Builds the system prompt that locks in personality and constraints.
        """
        level = "student" if user_level.lower() == "student" else "professional"
        
        system = (
            "You are the \"Kaizen Trade Assistant\", a professional, industry-focused, and student-friendly logistics mentor.\n"
            "Your job is to explain complex import-export, supply chain, logistics, and trade compliance topics.\n\n"
            "CRITICAL RULES:\n"
            "1. Always prioritize the retrieved knowledge in the CONTEXT. Do not hallucinate or make up facts.\n"
            "2. Never create fake legal or compliance information.\n"
            "3. If the context does not contain enough verified information to address the query, you MUST reply exactly with:\n"
            "\"I don't have enough verified information on this topic.\"\n"
            "Do not attempt to answer using general pre-trained knowledge if the context is empty or unrelated.\n"
            f"4. Target your explanations to a user level of: {level.upper()}.\n"
            "5. DO NOT COPY exact verbatim sentences or long phrases from the CONTEXT. You must summarize, synthesize, and rephrase the retrieved facts in your own words. Keep the output factual but change the phrasing to ensure it is not a direct copy-paste.\n"
        )
        
        if level == "student":
            system += (
                "- Explain concepts in simple language, explain trade acronyms (e.g. explain that CIF stands for Cost, Insurance, and Freight).\n"
                "- Use helpful everyday analogies and keep the language accessible.\n"
                "- Break down complex workflows into simple step-by-step points.\n"
            )
        else: # professional
            system += (
                "- Focus on commercial operations, risk mitigation, and operational efficiency.\n"
                "- Use standard industry terminology and refer to compliance frameworks (like ICC Incoterms) accurately.\n"
                "- Provide brief, direct, and actionable summaries.\n"
            )
            
        return system

    @staticmethod
    def build_user_prompt(query: str, context: str, mode: str) -> str:
        """
        Builds the formatting template prompt for the LLM.
        """
        if mode == "quick":
            return (
                f"USER QUESTION: {query}\n\n"
                f"CONTEXT:\n{context}\n\n"
                f"RESPONSE MODE: Quick Explanation\n"
                f"Format your response exactly as follows (fill in the brackets and delete the brackets themselves):\n"
                f"Term: [Term Name]\n"
                f"Explanation: [1-2 sentences simple explanation from the context]\n"
                f"Used By: [Who receives or uses this term/document]\n"
                f"Operational Tip: [A short operational tip or check]\n"
                f"Operational Insight: [An actionable operational intelligence insight]\n"
                f"Common Risk: [Common trade or logistics risk associated with this]\n"
                f"Recommendation: [A direct recommendation to avoid the risk]\n\n"
                f"Remember, if the context doesn't contain information about the query, reply exactly with: "
                f"I don't have enough verified information on this topic."
            )
        elif mode == "detailed":
            return (
                f"USER QUESTION: {query}\n\n"
                f"CONTEXT:\n{context}\n\n"
                f"RESPONSE MODE: Detailed Learning\n"
                f"Format your response exactly as follows (fill in the brackets, use double blank lines to separate sections):\n"
                f"Term: [Term Name]\n\n"
                f"What is it?\n[Detailed explanation of the term from context]\n\n"
                f"Created By:\n[Who creates/sends this document/term]\n\n"
                f"Used By:\n[Who receives/uses this document/term]\n\n"
                f"Purpose:\n[The operational purpose of this document/term]\n\n"
                f"Common Problems:\n[Common problems associated with it]\n\n"
                f"Operational Insight:\n[An actionable operational intelligence insight]\n\n"
                f"Common Risk:\n[Common trade or logistics risk associated with this]\n\n"
                f"Recommendation:\n[A direct recommendation to avoid the risk]\n\n"
                f"Remember, if the context doesn't contain information about the query, reply exactly with: "
                f"I don't have enough verified information on this topic."
            )
        elif mode == "comparison":
            return (
                f"USER QUESTION: {query}\n\n"
                f"CONTEXT:\n{context}\n\n"
                f"RESPONSE MODE: Comparison Mode\n"
                f"Generate a Markdown table comparing the retrieved terms.\n"
                f"The table MUST have exactly these columns:\n"
                f"| Term | Definition | Responsibility | Risk Transfer | Cost | Best Use Case |\n\n"
                f"Ensure each row represents one of the terms being compared. Write brief, accurate descriptions for each column based on the context.\n\n"
                f"Follow the table with these exact sections:\n"
                f"Operational Insight: [Actionable comparison insight]\n"
                f"Common Risk: [Risk differences between these terms]\n"
                f"Recommendation: [Operational recommendation for choosing between them]\n\n"
                f"Remember, if the context doesn't contain information about the terms, reply exactly with: "
                f"I don't have enough verified information on this topic."
            )
        return ""
