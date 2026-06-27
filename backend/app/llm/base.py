from abc import ABC, abstractmethod
from typing import Optional

class BaseLLM(ABC):
    """
    Abstract Base Class for LLM providers.
    Provides a uniform interface to support Ollama, OpenAI, or other local/cloud backends.
    """
    def __init__(self, model_name: str, temperature: float = 0.0):
        self.model_name = model_name
        self.temperature = temperature

    @abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate a textual response given a user prompt and an optional system prompt.
        """
        pass
