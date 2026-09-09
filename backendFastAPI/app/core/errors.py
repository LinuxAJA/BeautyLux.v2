"""
Jerarquía de errores de dominio — equivalente de backend/src/utils/errors.js.

Los services solo deben lanzar instancias de estas clases; el manejador global
de excepciones (app/middleware/error_handler.py) las traduce a la respuesta
HTTP con el mismo envoltorio {success, message, code, errors} que usa Node.
"""

from __future__ import annotations

from typing import Any


class AppError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        code: str = "INTERNAL_ERROR",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.errors = errors or []
        self.is_operational = True


class BadRequestError(AppError):
    def __init__(
        self,
        message: str = "Los datos enviados no son válidos",
        errors: list[dict[str, Any]] | None = None,
        code: str = "VALIDATION_ERROR",
    ) -> None:
        super().__init__(message, 400, code, errors)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "No autenticado", code: str = "UNAUTHENTICATED") -> None:
        super().__init__(message, 401, code)


class ForbiddenError(AppError):
    def __init__(
        self,
        message: str = "No tienes permisos para realizar esta acción",
        code: str = "FORBIDDEN",
    ) -> None:
        super().__init__(message, 403, code)


class NotFoundError(AppError):
    def __init__(self, message: str = "El recurso solicitado no existe", code: str = "NOT_FOUND") -> None:
        super().__init__(message, 404, code)


class ConflictError(AppError):
    def __init__(self, message: str = "El recurso ya existe", code: str = "CONFLICT") -> None:
        super().__init__(message, 409, code)


class TooManyRequestsError(AppError):
    def __init__(
        self,
        message: str = "Demasiados intentos, inténtalo más tarde",
        code: str = "RATE_LIMITED",
    ) -> None:
        super().__init__(message, 429, code)
