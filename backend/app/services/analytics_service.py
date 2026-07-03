import os
import json
import logging
from threading import Lock
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger("uvicorn.error")

class AnalyticsService:
    """
    Service to track user query statistics and persist them to a simple JSON database.
    Includes thread safety for concurrent request writes.
    """
    def __init__(self, filepath: str = None):
        self.filepath = filepath or settings.ANALYTICS_FILE
        self.lock = Lock()
        self._init_file()

    def _init_file(self):
        with self.lock:
            os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
            if not os.path.exists(self.filepath):
                with open(self.filepath, 'w', encoding='utf-8') as f:
                    json.dump({
                        "total_queries": 0,
                        "mode_distribution": {"quick": 0, "detailed": 0, "comparison": 0},
                        "popular_terms": {},
                        "unresolved_queries": [],
                        "total_execution_time": 0.0
                    }, f, indent=2)

    def log_query(
        self,
        question: str,
        intent: str,
        is_unresolved: bool,
        execution_time: float,
        matched_terms: List[str]
    ):
        """
        Logs a single query entry into the analytics record.
        """
        with self.lock:
            try:
                data = {}
                # Load current data
                if os.path.exists(self.filepath):
                    with open(self.filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                
                # Check for structure consistency
                if "total_queries" not in data:
                    data = {
                        "total_queries": 0,
                        "mode_distribution": {"quick": 0, "detailed": 0, "comparison": 0},
                        "popular_terms": {},
                        "unresolved_queries": [],
                        "total_execution_time": 0.0
                    }

                # Update stats
                data["total_queries"] += 1
                data["total_execution_time"] += execution_time
                
                # Intent distribution tracking
                intent_key = intent.lower().strip()

                if intent_key not in data["mode_distribution"]:
                    data["mode_distribution"][intent_key] = 0

                data["mode_distribution"][intent_key] += 1

                # Popular terms tracking
                for term in matched_terms:
                    data["popular_terms"][term] = data["popular_terms"].get(term, 0) + 1

                # Failed/Unresolved searches tracking
                if is_unresolved:
                    data["unresolved_queries"].append({
                        "query": question,
                        "timestamp": time_string()
                    })
                    # Cap failed queries log to the last 100 entries
                    if len(data["unresolved_queries"]) > 100:
                        data["unresolved_queries"].pop(0)

                # Save updated registry back to disk
                with open(self.filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                    
            except Exception as e:
                logger.error(f"Failed to record analytics query: {str(e)}")

    def get_analytics(self) -> Dict[str, Any]:
        """
        Loads statistics and returns computed averages and sorted aggregates.
        """
        with self.lock:
            try:
                if not os.path.exists(self.filepath):
                    return self._empty_stats()
                
                with open(self.filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                total = data.get("total_queries", 0)
                total_time = data.get("total_execution_time", 0.0)
                avg_time = total_time / total if total > 0 else 0.0

                # Sort popular terms list
                pop_terms = [{"term": k, "count": v} for k, v in data.get("popular_terms", {}).items()]
                pop_terms = sorted(pop_terms, key=lambda x: x["count"], reverse=True)[:10]

                return {
                    "total_questions": total,
                    "mode_distribution": data.get("mode_distribution", {}),
                    "popular_terms": pop_terms,
                    "failed_searches_count": len(data.get("unresolved_queries", [])),
                    "recent_failed_searches": [item["query"] for item in data.get("unresolved_queries", [])[-10:]],
                    "average_response_time": round(avg_time, 3)
                }
            except Exception as e:
                logger.error(f"Failed to fetch analytics: {str(e)}")
                return self._empty_stats()

    def _empty_stats(self) -> Dict[str, Any]:
        return {
            "total_questions": 0,
            "mode_distribution": {"quick": 0, "detailed": 0, "comparison": 0},
            "popular_terms": [],
            "failed_searches_count": 0,
            "recent_failed_searches": [],
            "average_response_time": 0.0
        }

def time_string() -> str:
    import time
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
