import requests
import logging
from typing import Optional
from app.llm.base import BaseLLM

logger = logging.getLogger("uvicorn.error")

class OllamaLLM(BaseLLM):
    """
    LLM wrapper for local Ollama instances.
    """
    def __init__(self, model_name: str, base_url: str = "http://localhost:11434", temperature: float = 0.0):
        super().__init__(model_name, temperature)
        self.base_url = base_url.rstrip('/')
        self.chat_endpoint = f"{self.base_url}/api/chat"

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature
            }
        }

        try:
            logger.info(f"Ollama Request: Model={self.model_name}, Endpoint={self.chat_endpoint}")
            response = requests.post(self.chat_endpoint, json=payload, timeout=180)
            response.raise_for_status()
            
            result = response.json()
            message_content = result.get("message", {}).get("content", "")
            return message_content.strip()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama API request failed: {str(e)}")
            # Return fallback or raise
            raise RuntimeError(f"Ollama model '{self.model_name}' could not be reached. Ensure Ollama is running locally at {self.base_url} and the model is pulled using 'ollama pull {self.model_name}'. Detail: {str(e)}")
