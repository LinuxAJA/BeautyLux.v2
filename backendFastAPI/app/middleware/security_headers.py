"""
Cabeceras de seguridad — equivalente de `helmet()` en backend/src/app.js.

Deliberadamente SIN `Content-Security-Policy`: el CSP por defecto de helmet
bloquearía los scripts que Swagger UI carga desde CDN en `/docs`, y esa
página es evidencia exigida por el punto 25 del PDF. El resto de cabeceras
que helmet añade por defecto sí se replican.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        if "server" in response.headers:
            del response.headers["server"]
        return response
