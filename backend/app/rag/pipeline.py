from pip._internal.models import selection_prefs
import time
import logging
from typing import List, Dict, Any, Optional
from app.rag.retriever import Retriever
from app.rag.prompt_builder import PromptBuilder
from app.llm.base import BaseLLM
from app.rag.query_processor import QueryProcessor

logger = logging.getLogger("uvicorn.error")

class RAGPipeline:
    """
    RAG Pipeline coordinator.
    Orchestrates the entire query-to-response generation flow.
    """
    def __init__(self, retriever: Retriever, llm: BaseLLM, analytics_service: Any):
        self.retriever = retriever
        self.llm = llm
        self.analytics_service = analytics_service
        self.fallback_msg = "I don't have enough verified information on this topic."
        self.cache = {} # In-memory caching for repeated queries

    def run(self, question: str) -> Dict[str, Any]:
        start_time = time.time()
        from app.config import settings
        
        # Cache Check
        cache_key = (question.lower().strip())
        if cache_key in self.cache:
            logger.info(f"RAG Cache Hit: Query='{question}'")
            cached_res = self.cache[cache_key]
            # Log hit in analytics
            self.analytics_service.log_query(
                question=question,
                mode="auto",
                is_unresolved=is_unresolved,
                execution_time=execution_time,
                matched_terms=terms_to_log
            )
            return cached_res

        logger.info(f"RAG Pipeline Run: Query='{question}'")
        
        # 2. Retrieve Relevant Documents
        # For comparison mode, retrieve up to max(TOP_K, 4) items. For others, retrieve TOP_K.
        limit = settings.TOP_K
        analysis = QueryProcessor.process(question)

        docs = self.retriever.retrieve(
            analysis.search_query,
            limit=analysis.top_k
        )
        
        # 3. Determine Confidence and Handle Empty Database/Matches
        if not docs:
            logger.warning(f"No relevant documents retrieved for query: {question}")
            self.analytics_service.log_query(question, is_unresolved=True, execution_time=time.time() - start_time, matched_terms=[])
            no_match_res = {
                "answer": self.fallback_msg,
                "sources": [],
                "confidence": "None",
                "related_topics": self._get_default_related_topics()
            }
            # Cache the failure response to avoid repeated failed lookups
            self.cache[cache_key] = no_match_res
            return no_match_res
            
        # Top match similarity score
        top_score = docs[0].get("score", 0.0)
        
        # Map similarity score to Confidence Level string
        if top_score >= 0.70:
            confidence = "High"
        elif top_score >= 0.45:
            confidence = "Medium"
        else:
            confidence = "Low"
            
        # 4. Formulate Context String
        context_blocks = []
        matched_terms = []
        for doc in docs:
            term_name = doc["term"]
            matched_terms.append(term_name)
            context_blocks.append(
                f"Term: {term_name}\n"
                f"Definition: {doc['definition']}\n"
                f"Created By: {doc['created_by']}\n"
                f"Used By: {doc['used_by']}\n"
                f"Purpose: {doc['purpose']}\n"
                f"Common Problems: {doc['common_problems']}\n"
                f"---"
            )
        context_str = "\n".join(context_blocks)
        
        # 5. Build Prompts
        system_prompt = PromptBuilder.build_system_prompt()
        user_prompt = PromptBuilder.build_user_prompt(
            question,
            context_str,
            analysis.intent
        )

        logger.info("=" * 60)
        logger.info("Calling LLM...")
        logger.info(f"System Prompt Length : {len(system_prompt)} characters")
        logger.info(f"User Prompt Length   : {len(user_prompt)} characters")
        logger.info(f"Retrieved Documents  : {len(docs)}")
        
        # 6. Call LLM
        try:
            llm_start = time.time()

            answer = self.llm.generate(
                user_prompt,
                system_prompt=system_prompt
            )

            logger.info(
                f"LLM completed in {time.time() - llm_start:.2f} seconds"
            )

            answer = answer.strip()

        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            return {
                "answer": "LLM is unavailable. Please try again.",
                "sources": [],
                "confidence": "Low",
                "related_topics": self._get_default_related_topics()
            }

            return {
                "answer": f"LLM Connection Error: {str(e)}",
                "sources": [],
                "confidence": "Low",
                "related_topics": self._get_default_related_topics()
            }

        # 7. Check if LLM response indicates lack of info
        is_unresolved = self.fallback_msg.lower() in answer.lower() or "not enough information" in answer.lower()
        
        if is_unresolved:
            answer = self.fallback_msg
            sources = []
            confidence = "None"
            related_topics = self._get_default_related_topics()
        else:
            sources = [
                {
                    "term": doc["term"],
                    "definition": doc["definition"],
                    "created_by": doc["created_by"],
                    "used_by": doc["used_by"],
                    "purpose": doc["purpose"],
                    "common_problems": doc["common_problems"],
                    "score": round(doc["score"], 3)
                }
                for doc in docs
            ]
            
            # Select related topics from candidates 2+ in retrieved docs
            related_topics = []
            primary_term = docs[0]["term"].lower()
            for doc in docs[1:]:
                if doc["term"].lower() != primary_term:
                    related_topics.append(doc["term"])
            
            # Dedup and pad suggestions
            related_topics = list(set(related_topics))
            if len(related_topics) < 2:
                defaults = self._get_default_related_topics()
                for item in defaults:
                    if item.lower() != primary_term and item not in related_topics:
                        related_topics.append(item)
            related_topics = related_topics[:3]

        # 8. Record Analytics
        execution_time = time.time() - start_time
        terms_to_log = [s["term"] for s in sources] if not is_unresolved else []
        self.analytics_service.log_query(
            question=question,
            is_unresolved=is_unresolved,
            execution_time=execution_time,
            matched_terms=terms_to_log
        )
        
        response_payload = {
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "related_topics": related_topics
        }
        self.cache[cache_key] = response_payload
        return response_payload

    def _get_default_related_topics(self) -> List[str]:
        # Return a list of basic topics
        return ["Bill of Lading", "FOB (Free on Board)", "CIF (Cost, Insurance, and Freight)", "Incoterms"]
