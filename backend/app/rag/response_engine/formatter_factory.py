from app.rag.response_engine.formatter import ResponseFormatter
from app.rag.response_engine.verbatim_formatter import VerbatimFormatter

class FormatterFactory:
    @staticmethod
    def create(llm=None) -> ResponseFormatter:
        return VerbatimFormatter()