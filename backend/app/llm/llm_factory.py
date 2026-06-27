from app.config import settings
from app.llm.base import BaseLLM
from app.llm.ollama_llm import OllamaLLM
from app.llm.openai_llm import OpenAILLM

class LLMFactory:
    """
    Factory class to instantiate LLM wrappers dynamically based on settings.
    """
    @staticmethod
    def get_llm(provider: str = None, model_name: str = None, temperature: float = 0.0) -> BaseLLM:
        active_provider = (provider or settings.LLM_PROVIDER).lower().strip()
        active_model = model_name or settings.LLM_MODEL
        
        if active_provider == "ollama":
            return OllamaLLM(
                model_name=active_model,
                base_url=settings.ollama_endpoint,
                temperature=temperature
            )
        elif active_provider == "openai":
            return OpenAILLM(
                model_name=active_model,
                api_key=settings.OPENAI_API_KEY,
                api_base=settings.OPENAI_API_BASE,
                temperature=temperature
            )
        else:
            # Default fallback to Ollama
            return OllamaLLM(
                model_name=active_model,
                base_url=settings.ollama_endpoint,
                temperature=temperature
            )
