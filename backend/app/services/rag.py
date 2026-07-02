from app.rag.pipeline import RAGPipeline


class RAGPipeline:
    """
    Backward compatibility wrapper used by legacy tests.
    """

    def __init__(self, vector_store, llm):
        self.vector_store = vector_store
        self.llm = llm

    def run(self, question: str, requested_mode="quick", user_level="student"):
        """
        This method should never be called directly in tests because
        FastAPI dependency overrides replace the real dependency.
        """
        raise NotImplementedError(
            "Legacy RAGPipeline wrapper is only provided for compatibility."
        )