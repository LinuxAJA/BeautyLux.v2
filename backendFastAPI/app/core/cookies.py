"""
Cookie de refresh — equivalente de backend/src/utils/cookies.js.

El refresh token es opaco (no es un JWT): 128 caracteres hex generados con
`secrets.token_hex`, y solo se persiste su hash SHA-256 en la tabla `sessions`.
La cookie usa `Path=/api/auth` (igual que Node) para que el navegador solo la
envíe a los endpoints de autenticación.
"""

from __future__ import annotations

import hashlib
import secrets

from app.core.config import settings

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/auth"


def generate_raw_token() -> str:
    return secrets.token_hex(64)  # 128 caracteres hex


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _policy_kwargs() -> dict:
    """Atributos que deben coincidir al crear y al borrar la cookie: si el
    borrado sale con otro SameSite/Secure, en un contexto entre dominios
    (Vercel → Render) el navegador lo descarta y el logout no limpia nada."""
    return {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.COOKIE_SAMESITE,
        "path": REFRESH_COOKIE_PATH,
    }


def refresh_cookie_kwargs(max_age_ms: int | None = None) -> dict:
    """Argumentos para Response.set_cookie(); sin max_age la cookie es "de
    sesión" (se borra al cerrar el navegador), igual que en Node cuando
    `remember` es falso."""
    kwargs = _policy_kwargs()
    if max_age_ms:
        kwargs["max_age"] = max_age_ms // 1000
    return kwargs


def clear_cookie_kwargs() -> dict:
    """Argumentos para Response.delete_cookie()."""
    return _policy_kwargs()
