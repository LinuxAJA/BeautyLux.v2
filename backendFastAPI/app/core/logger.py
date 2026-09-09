"""
Logger propio con redacción de secretos — equivalente de backend/src/utils/logger.js.

Sin dependencias externas, igual que en Node. Silencioso en ENVIRONMENT=test.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.config import settings

_COLORS = {"debug": "\x1b[90m", "info": "\x1b[36m", "warn": "\x1b[33m", "error": "\x1b[31m"}
_RESET = "\x1b[0m"

_SENSITIVE_KEYS = {
    "password",
    "passwordHash",
    "password_hash",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
}


def _redact(value: Any) -> Any:
    if isinstance(value, list):
        return [_redact(item) for item in value]
    if isinstance(value, dict):
        return {
            key: ("[REDACTED]" if key in _SENSITIVE_KEYS else _redact(val))
            for key, val in value.items()
        }
    return value


def _log(level: str, message: str, meta: Any = None) -> None:
    if settings.is_test:
        return
    timestamp = datetime.now(timezone.utc).isoformat()
    color = _COLORS.get(level, "")
    prefix = f"{color}[{timestamp}] {level.upper()}{_RESET}"
    if meta is not None:
        print(prefix, message, _redact(meta))
    else:
        print(prefix, message)


class Logger:
    def debug(self, message: str, meta: Any = None) -> None:
        _log("debug", message, meta)

    def info(self, message: str, meta: Any = None) -> None:
        _log("info", message, meta)

    def warn(self, message: str, meta: Any = None) -> None:
        _log("warn", message, meta)

    def error(self, message: str, meta: Any = None) -> None:
        _log("error", message, meta)


logger = Logger()
