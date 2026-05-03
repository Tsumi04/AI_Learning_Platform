"""
NEUROVAULT — LLM Inference Engine
Kết nối Ollama (local) để chạy Gemma4 / Qwen.
100% local inference, không gọi API bên ngoài.
"""

import json
import httpx
from typing import Optional, Dict, List, AsyncGenerator


class LLMEngine:
    """
    Local LLM Inference qua Ollama HTTP API.
    Hỗ trợ: generate, chat, streaming.
    """

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:11434",
        model: str = "gemma3",
        timeout: float = 120.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self._client = httpx.Client(timeout=timeout)

    def generate(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> str:
        """
        Generate response from LLM.
        
        Args:
            prompt: User prompt
            system: System prompt
            temperature: Creativity (0-2)
            max_tokens: Max output tokens
            stream: Whether to stream
            
        Returns:
            Generated text
        """
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
            "stream": False,
        }

        try:
            resp = self._client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")
        except httpx.ConnectError:
            return "[ERROR] Ollama server not running. Please start Ollama with: ollama serve"
        except Exception as e:
            return f"[ERROR] LLM inference failed: {str(e)}"

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """
        Multi-turn chat with LLM.
        
        Args:
            messages: [{"role": "user/assistant/system", "content": "..."}]
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
            "stream": False,
        }

        try:
            resp = self._client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "")
        except httpx.ConnectError:
            return "[ERROR] Ollama server not running. Start with: ollama serve"
        except Exception as e:
            return f"[ERROR] Chat failed: {str(e)}"

    def is_available(self) -> bool:
        """Check if Ollama server is running."""
        try:
            resp = self._client.get(f"{self.base_url}/api/tags")
            return resp.status_code == 200
        except Exception:
            return False

    def list_models(self) -> List[str]:
        """List available models."""
        try:
            resp = self._client.get(f"{self.base_url}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                return [m["name"] for m in data.get("models", [])]
        except Exception:
            pass
        return []

    def pull_model(self, model_name: str) -> bool:
        """Pull a model from Ollama registry."""
        try:
            resp = self._client.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name},
                timeout=600.0,
            )
            return resp.status_code == 200
        except Exception:
            return False
