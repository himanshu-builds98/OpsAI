import requests
import logging
from typing import Optional
from app.llm.base import BaseLLM

logger = logging.getLogger("uvicorn.error")

class OpenAILLM(BaseLLM):
    """
    LLM wrapper for OpenAI and OpenAI-compatible API endpoints (vLLM, Groq, OpenRouter, etc.).
    """
    def __init__(self, model_name: str, api_key: str, api_base: str = "https://api.openai.com/v1", temperature: float = 0.0):
        super().__init__(model_name, temperature)
        self.api_key = api_key
        self.api_base = api_base.rstrip('/')
        self.chat_endpoint = f"{self.api_base}/chat/completions"

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": self.temperature,
            "stream": False
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            logger.info(f"OpenAI-Compatible Request: Model={self.model_name}, Endpoint={self.chat_endpoint}")
            response = requests.post(self.chat_endpoint, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            choices = result.get("choices", [])
            if choices:
                message_content = choices[0].get("message", {}).get("content", "")
                return message_content.strip()
            return ""
            
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenAI-Compatible API request failed: {str(e)}")
            raise RuntimeError(f"OpenAI-compatible provider endpoint failed for model '{self.model_name}': {str(e)}")
