"""
NEUROVAULT — LLM Inference Engine v2.0
Kết nối Ollama (local) để chạy Gemma 4 E4B.
100% local inference, KHÔNG gọi API bên ngoài.

Tính năng v2.0:
- Gemma 4 Thinking Mode (step-by-step reasoning)
- Function Calling native
- Streaming SSE (Server-Sent Events)
- JSON mode cho structured output
- Production-grade error handling
- Bilingual EN/VI support
"""

import json
import re
import time
import httpx
from typing import Optional, Dict, List, Any, Generator


class LLMEngine:
    """
    Local LLM Inference qua Ollama HTTP API.
    Hỗ trợ: generate, chat, streaming, thinking mode, function calling, JSON mode.
    """

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:11434",
        model: str = "gemma4:e4b",
        timeout: float = 120.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self._client = httpx.Client(timeout=timeout)
        self._async_client = None  # Lazy init cho async streaming

    def _get_async_client(self) -> httpx.AsyncClient:
        """Lazy initialization cho async client (dùng cho streaming)."""
        if self._async_client is None:
            self._async_client = httpx.AsyncClient(timeout=self.timeout)
        return self._async_client

    # ──── Core: Generate ────

    def generate(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        thinking: bool = False,
        json_mode: bool = False,
    ) -> str:
        """
        Generate response từ LLM.

        Args:
            prompt: User prompt
            system: System prompt
            temperature: Creativity (0-2)
            max_tokens: Max output tokens
            thinking: Bật Gemma 4 Thinking Mode (step-by-step reasoning)
            json_mode: Yêu cầu output JSON format

        Returns:
            Generated text (đã strip thinking blocks nếu có)
        """
        # Nếu bật thinking mode, thêm token trigger
        if thinking:
            prompt = f"<|think|>\n{prompt}"

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

        if json_mode:
            payload["format"] = "json"

        try:
            resp = self._client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            raw_response = data.get("response", "")

            # Parse thinking blocks nếu có
            if thinking:
                return self._strip_thinking(raw_response)
            return raw_response

        except httpx.ConnectError:
            return "[ERROR] Ollama server chưa chạy. Khởi động: ollama serve"
        except httpx.TimeoutException:
            return "[ERROR] LLM inference timeout. Model có thể đang tải lần đầu."
        except httpx.HTTPStatusError as e:
            return f"[ERROR] LLM HTTP error {e.response.status_code}: {e.response.text}"
        except Exception as e:
            return f"[ERROR] LLM inference failed: {str(e)}"

    # ──── Core: Chat ────

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        thinking: bool = False,
        json_mode: bool = False,
        tools: Optional[List[Dict]] = None,
    ) -> str:
        """
        Multi-turn chat với LLM.

        Args:
            messages: [{"role": "user/assistant/system", "content": "..."}]
            temperature: Creativity (0-2)
            max_tokens: Max output tokens
            thinking: Bật Thinking Mode
            json_mode: Yêu cầu JSON output
            tools: Function definitions cho function calling

        Returns:
            Response text (đã strip thinking nếu cần)
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

        if json_mode:
            payload["format"] = "json"

        if tools:
            payload["tools"] = tools

        try:
            resp = self._client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()

            message = data.get("message", {})

            # Kiểm tra function call response
            if message.get("tool_calls"):
                return json.dumps({
                    "type": "tool_calls",
                    "tool_calls": message["tool_calls"],
                    "content": message.get("content", ""),
                })

            raw_content = message.get("content", "")
            if thinking:
                return self._strip_thinking(raw_content)
            return raw_content

        except httpx.ConnectError:
            return "[ERROR] Ollama server chưa chạy. Khởi động: ollama serve"
        except httpx.TimeoutException:
            return "[ERROR] Chat timeout. Thử giảm max_tokens hoặc kiểm tra model."
        except httpx.HTTPStatusError as e:
            return f"[ERROR] Chat HTTP error {e.response.status_code}: {e.response.text}"
        except Exception as e:
            return f"[ERROR] Chat failed: {str(e)}"

    # ──── Streaming: Chat Stream ────

    def chat_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> Generator[str, None, None]:
        """
        Streaming chat — yield từng token.
        Dùng cho real-time chat UI qua SSE.

        Yields:
            Từng token text khi LLM generate
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
            "stream": True,
        }

        try:
            with self._client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout,
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        token = data.get("message", {}).get("content", "")
                        if token:
                            yield token
                        # Kết thúc stream
                        if data.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue

        except httpx.ConnectError:
            yield "[ERROR] Ollama server chưa chạy."
        except httpx.TimeoutException:
            yield "[ERROR] Streaming timeout."
        except Exception as e:
            yield f"[ERROR] Stream failed: {str(e)}"

    def generate_stream(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> Generator[str, None, None]:
        """
        Streaming generate — yield từng token.

        Yields:
            Từng token text
        """
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
            "stream": True,
        }

        try:
            with self._client.stream(
                "POST",
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout,
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        token = data.get("response", "")
                        if token:
                            yield token
                        if data.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue

        except httpx.ConnectError:
            yield "[ERROR] Ollama server chưa chạy."
        except Exception as e:
            yield f"[ERROR] Generate stream failed: {str(e)}"

    # ──── Thinking Mode Helpers ────

    def think_and_answer(
        self,
        question: str,
        context: str = "",
        system: str = "",
        temperature: float = 0.3,
    ) -> Dict[str, str]:
        """
        Gemma 4 Thinking Mode: LLM suy luận step-by-step rồi trả lời.
        Trả về cả thinking process và final answer.

        Returns:
            {"thinking": "...", "answer": "...", "full_response": "..."}
        """
        prompt = f"<|think|>\n"
        if context:
            prompt += f"Context:\n{context}\n\n"
        prompt += f"Question: {question}"

        raw = self.generate(
            prompt=prompt,
            system=system or "You are a careful, step-by-step reasoning assistant.",
            temperature=temperature,
            max_tokens=4096,
            thinking=False,  # Đã thêm token manually
        )

        return self._parse_thinking_response(raw)

    def _strip_thinking(self, text: str) -> str:
        """Loại bỏ thinking blocks, chỉ giữ final answer."""
        # Pattern: <think>...</think> hoặc <|think|>...</|think|>
        patterns = [
            r"<think>.*?</think>",
            r"<\|think\|>.*?<\|/think\|>",
            r"\[thinking\].*?\[/thinking\]",
        ]
        result = text
        for pattern in patterns:
            result = re.sub(pattern, "", result, flags=re.DOTALL)
        return result.strip()

    def _parse_thinking_response(self, text: str) -> Dict[str, str]:
        """Parse response chứa thinking blocks → tách thinking và answer."""
        thinking = ""
        answer = text

        # Tìm thinking blocks
        think_patterns = [
            (r"<think>(.*?)</think>", r"<think>.*?</think>"),
            (r"<\|think\|>(.*?)<\|/think\|>", r"<\|think\|>.*?<\|/think\|>"),
        ]

        for extract_pattern, strip_pattern in think_patterns:
            matches = re.findall(extract_pattern, text, re.DOTALL)
            if matches:
                thinking = "\n".join(m.strip() for m in matches)
                answer = re.sub(strip_pattern, "", text, flags=re.DOTALL).strip()
                break

        return {
            "thinking": thinking,
            "answer": answer,
            "full_response": text,
        }

    # ──── JSON Mode ────

    def generate_json(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> Optional[Dict]:
        """
        Generate JSON output từ LLM.
        Parse và validate JSON trước khi trả về.

        Returns:
            Parsed dict hoặc None nếu invalid JSON
        """
        raw = self.generate(
            prompt=prompt,
            system=system,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=True,
        )

        if raw.startswith("[ERROR]"):
            return None

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Thử extract JSON từ response
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
            return None

    # ──── Function Calling ────

    def call_with_tools(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]],
        temperature: float = 0.3,
    ) -> Dict[str, Any]:
        """
        Function calling với Gemma 4.
        Truyền tool definitions → model quyết định gọi function nào.

        Args:
            messages: Chat messages
            tools: Tool/function definitions theo Ollama format
            temperature: Lower = more deterministic tool selection

        Returns:
            {"type": "text"|"tool_calls", "content": str, "tool_calls": list}
        """
        raw = self.chat(
            messages=messages,
            temperature=temperature,
            tools=tools,
        )

        # Check if response contains tool calls
        if raw.startswith("[ERROR]"):
            return {"type": "error", "content": raw, "tool_calls": []}

        try:
            parsed = json.loads(raw)
            if parsed.get("type") == "tool_calls":
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass

        return {"type": "text", "content": raw, "tool_calls": []}

    # ──── Status & Info ────

    def is_available(self) -> bool:
        """Kiểm tra Ollama server có đang chạy không."""
        try:
            resp = self._client.get(f"{self.base_url}/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False

    def is_model_loaded(self) -> bool:
        """Kiểm tra model đã được pull và sẵn sàng chưa."""
        try:
            models = self.list_models()
            return any(self.model in m for m in models)
        except Exception:
            return False

    def list_models(self) -> List[str]:
        """Liệt kê tất cả models đã pull trong Ollama."""
        try:
            resp = self._client.get(f"{self.base_url}/api/tags", timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                return [m["name"] for m in data.get("models", [])]
        except Exception:
            pass
        return []

    def get_model_info(self) -> Optional[Dict]:
        """Lấy thông tin chi tiết về model hiện tại."""
        try:
            resp = self._client.post(
                f"{self.base_url}/api/show",
                json={"name": self.model},
                timeout=10.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "name": self.model,
                    "size": data.get("size", 0),
                    "parameter_size": data.get("details", {}).get("parameter_size", "unknown"),
                    "quantization": data.get("details", {}).get("quantization_level", "unknown"),
                    "family": data.get("details", {}).get("family", "unknown"),
                    "format": data.get("details", {}).get("format", "unknown"),
                }
        except Exception:
            pass
        return None

    def pull_model(self, model_name: str) -> bool:
        """Pull model từ Ollama registry."""
        try:
            resp = self._client.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name},
                timeout=600.0,
            )
            return resp.status_code == 200
        except Exception:
            return False

    def health_check(self) -> Dict[str, Any]:
        """Full health check — trả về trạng thái chi tiết."""
        server_ok = self.is_available()
        model_ok = self.is_model_loaded() if server_ok else False
        model_info = self.get_model_info() if model_ok else None

        return {
            "server_running": server_ok,
            "model_available": model_ok,
            "model": self.model,
            "base_url": self.base_url,
            "model_info": model_info,
            "status": "ready" if (server_ok and model_ok) else "offline",
        }

    def __del__(self):
        """Cleanup HTTP clients khi destroy."""
        try:
            self._client.close()
            if self._async_client:
                # Note: async client cần được close trong async context
                pass
        except Exception:
            pass
