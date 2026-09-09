"""
Manejador global de errores — equivalente de backend/src/middlewares/errorHandler.js
+ notFound.js.

Registra un `exception_handler` por tipo de excepción para que TODA
respuesta de error, sin excepción, salga con el envoltorio
`{success, message, code, errors?}` que el frontend espera literalmente
(ver frontend/src/services/api.js) — el `{"detail": ...}` por defecto de
FastAPI nunca debe llegar a un cliente.
"""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.errors import AppError
from app.core.logger import logger

_SKIP_LOC_PREFIXES = {"body", "query", "path", "header", "cookie"}

# errno de MySQL -> (status_code, code, mensaje). Ver backend/src/middlewares/errorHandler.js.
_MYSQL_ERRNO_MAP = {
    1062: (409, "CONFLICT", "El registro ya existe (valor duplicado)"),
    1452: (422, "INVALID_REFERENCE", "La referencia enviada no existe"),
    1451: (409, "CONFLICT", "No se puede eliminar: el registro está en uso"),
}


def _error_body(message: str, code: str, errors: list[dict] | None = None) -> dict:
    body: dict = {"success": False, "message": message, "code": code}
    if errors:
        body["errors"] = errors
    return body


def _field_name(loc: tuple) -> str:
    parts = [str(p) for p in loc if str(p) not in _SKIP_LOC_PREFIXES]
    return ".".join(parts) if parts else "body"


def _clean_message(msg: str) -> str:
    prefix = "Value error, "
    return msg[len(prefix):] if msg.startswith(prefix) else msg


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        if exc.status_code >= 500:
            logger.error(exc.message, {"path": str(request.url.path)})
        return JSONResponse(
            status_code=exc.status_code, content=_error_body(exc.message, exc.code, exc.errors)
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {"field": _field_name(tuple(err["loc"])), "message": _clean_message(err["msg"])}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=400,
            content=_error_body("Los datos enviados no son válidos", "VALIDATION_ERROR", errors),
        )

    @app.exception_handler(RateLimitExceeded)
    async def handle_rate_limit(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        # Los límites por ruta (login, registro, forgot-password) llevan un
        # `error_message` propio; el límite general (`default_limits`) no
        # admite uno en el constructor de slowapi, así que aquí se usa el
        # mismo mensaje que Node para `generalLimiter`.
        from app.middleware.rate_limit import GENERAL_MESSAGE

        custom_message = getattr(exc.limit, "error_message", None)
        message = custom_message if custom_message else GENERAL_MESSAGE
        return JSONResponse(status_code=429, content=_error_body(message, "RATE_LIMITED"))

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            message = f"La ruta {request.method} {request.url.path} no existe"
            return JSONResponse(status_code=404, content=_error_body(message, "NOT_FOUND"))
        message = exc.detail if isinstance(exc.detail, str) else "Ocurrió un error inesperado"
        return JSONResponse(status_code=exc.status_code, content=_error_body(message, "HTTP_ERROR"))

    @app.exception_handler(SQLAlchemyError)
    async def handle_sqlalchemy_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        mapped = _map_mysql_error(exc)
        if mapped:
            status_code, code, message = mapped
            return JSONResponse(status_code=status_code, content=_error_body(message, code))

        logger.error("Error de base de datos no controlado", {"error": str(exc)})
        if isinstance(exc, OperationalError):
            return JSONResponse(
                status_code=503,
                content=_error_body("No se pudo conectar con la base de datos", "DATABASE_UNAVAILABLE"),
            )
        return JSONResponse(
            status_code=500, content=_error_body("Ocurrió un error inesperado", "INTERNAL_ERROR")
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error(str(exc), {"path": str(request.url.path)})
        body = _error_body("Ocurrió un error inesperado", "INTERNAL_ERROR")
        if not settings.is_production:
            body["stack"] = repr(exc)
        return JSONResponse(status_code=500, content=body)


def _map_mysql_error(exc: SQLAlchemyError) -> tuple[int, str, str] | None:
    if not isinstance(exc, IntegrityError):
        return None
    orig = getattr(exc, "orig", None)
    errno = orig.args[0] if orig and getattr(orig, "args", None) else None
    return _MYSQL_ERRNO_MAP.get(errno)
