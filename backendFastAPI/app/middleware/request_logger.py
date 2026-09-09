"""Logger de peticiones — equivalente de backend/src/middlewares/requestLogger.js."""

from __future__ import annotations

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import logger


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start) * 1000
        status = response.status_code
        level = "error" if status >= 500 else "warn" if status >= 400 else "info"
        message = f"{request.method} {request.url.path} {status} — {duration_ms:.1f}ms"
        getattr(logger, level)(message, {"requestId": request_id})

        response.headers["X-Request-Id"] = request_id
        return response
