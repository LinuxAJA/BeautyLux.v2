"""Utilidades compartidas por las dependencias de FastAPI."""

from __future__ import annotations

from fastapi import Request

from app.services.auth import RequestContext


def client_ip(request: Request) -> str | None:
    """Igual que `app.set('trust proxy', 1)` de Express: si hay
    `X-Forwarded-For`, se usa su primer valor; si no, la IP del socket."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def request_context(request: Request) -> RequestContext:
    return RequestContext(ip_address=client_ip(request), user_agent=request.headers.get("user-agent"))
