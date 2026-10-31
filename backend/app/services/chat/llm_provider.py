"""Proveedor de IA del chatbot (Strategy + Adapter).

`ChatService` solo conoce `LLMProvider`; para usar otro modelo (por ejemplo Gemini) basta
con escribir otra subclase que devuelva el mismo `LLMTurn`.
"""

import logging

import anthropic
from flask import current_app

from app.utils.errors import ServiceError

logger = logging.getLogger(__name__)

UNAVAILABLE_MESSAGE = "El asistente no está disponible en este momento. Intenta más tarde."


class ToolCall:
    def __init__(self, call_id, name, arguments):
        self.id = call_id
        self.name = name
        self.arguments = arguments


class LLMTurn:
    """Un turno del modelo: texto, llamadas a herramientas y el mensaje a guardar en el historial."""

    def __init__(self, text, tool_calls, assistant_message):
        self.text = text
        self.tool_calls = tool_calls
        self.assistant_message = assistant_message


class LLMProvider:
    def complete(self, system, messages, tools):
        raise NotImplementedError

    def tool_results_message(self, results):
        """Mensaje con los resultados de las herramientas; `results` = [(ToolCall, texto, es_error)]."""
        raise NotImplementedError


class ClaudeProvider(LLMProvider):
    def __init__(self):
        self._client = None

    def _get_client(self):
        api_key = current_app.config.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ServiceError(UNAVAILABLE_MESSAGE, 503)
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=api_key, timeout=45.0)
        return self._client

    def complete(self, system, messages, tools):
        config = current_app.config
        params = {
            "model": config["CHATBOT_MODEL"],
            "max_tokens": 1500,
            "system": system,
            "tools": [{**tool, "strict": True} for tool in tools],
            "messages": messages,
        }
        if config.get("CHATBOT_EFFORT"):
            params["output_config"] = {"effort": config["CHATBOT_EFFORT"]}

        try:
            response = self._get_client().messages.create(**params)
        except ServiceError:
            raise
        except anthropic.APIError:
            logger.exception("Error llamando a la API de Claude")
            raise ServiceError(UNAVAILABLE_MESSAGE, 503)

        if response.stop_reason == "refusal":
            return LLMTurn("No puedo ayudarte con esa solicitud.", [], None)

        text = "".join(block.text for block in response.content if block.type == "text").strip()
        calls = [
            ToolCall(block.id, block.name, block.input)
            for block in response.content
            if block.type == "tool_use"
        ]
        return LLMTurn(text, calls, {"role": "assistant", "content": response.content})

    def tool_results_message(self, results):
        return {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": call.id,
                    "content": content,
                    **({"is_error": True} if is_error else {}),
                }
                for call, content, is_error in results
            ],
        }
