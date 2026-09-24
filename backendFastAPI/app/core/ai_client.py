"""Cliente de Google Gemini — quinto avance, etapa 12, requisitos 17-19.

Igual que `mailer.py`: con `AI_ENABLED=false` o sin `GEMINI_API_KEY` no se
llama a ninguna API externa, y `generate_reply()` nunca lanza — cualquier
fallo de red o de la API cae en `None`, para que quien la llama use su
propio FAQ de respaldo y la sustentación nunca se caiga por falta de
credenciales o por un corte del servicio de Google.
"""

from __future__ import annotations

from app.core.config import settings
from app.core.logger import logger

# El SDK de Gemini usa 'model' donde nosotros guardamos 'assistant'; los
# mensajes de sistema no van en el historial, van en `system_instruction`.
_ROLE_MAP = {"user": "user", "assistant": "model"}


def generate_reply(
    *, system_prompt: str, history: list[tuple[str, str]], user_message: str
) -> tuple[str, int | None] | None:
    """Devuelve `(texto, tokens_usados)`, o `None` si no se pudo generar (para que el
    llamador use el FAQ de respaldo)."""
    if not settings.AI_ENABLED or not settings.GEMINI_API_KEY:
        return None

    try:
        from google import genai
        from google.genai import errors, types

        # Política de reintentos del SDK oficial.
        #
        # attempts=4 significa:
        #   1 intento inicial + 3 reintentos.
        #
        # Los códigos indicados representan errores transitorios
        # para los que tiene sentido volver a intentar.
        retry_options = types.HttpRetryOptions(
            attempts=4,
            initial_delay=1.0,
            max_delay=8.0,
            exp_base=2.0,
            jitter=1.0,
        )

        client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options = types.HttpOptions(
                retry_options=retry_options,
            ),
        )

        contents = [
            types.Content(role=_ROLE_MAP[role], parts=[types.Part(text=content)])
            for role, content in history
            if role in _ROLE_MAP
        ]
        contents.append(types.Content(role="user", parts=[types.Part(text=user_message)]))

        response = client.models.generate_content(
            model=settings.AI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=True
                )
            )
        )

        text = (response.text or "").strip()
        if not text:
            return None

        tokens = None
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            tokens = getattr(response.usage_metadata, "total_token_count", None)

        return text, tokens

    except errors.APIError as error:
        logger.error("Error de la API de Gemini", {"code": error.code, "error": error.message})
        return None

    except Exception as error:  # noqa: BLE001 - nunca debe propagar, hay FAQ de respaldo
        logger.error("Error inesperado del cliente de Gemini", {"error": str(error)})
        return None
