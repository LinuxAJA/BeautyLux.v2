"""
Envoltorio de respuesta de éxito — equivalente de backend/src/utils/apiResponse.js.

El frontend lee `payload.data` y `payload.meta` literalmente (ver
frontend/src/services/api.js), así que todo endpoint exitoso debe pasar por
`ok()` o `created()` en vez de devolver el modelo directamente.
"""

from __future__ import annotations

from typing import Any

from fastapi import status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def ok(
    data: Any = None,
    message: str = "Operación exitosa",
    meta: dict[str, Any] | None = None,
    status_code: int = status.HTTP_200_OK,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {"success": True, "message": message, "data": jsonable_encoder(data)}
    if meta is not None:
        body["meta"] = meta
    return JSONResponse(content=body, status_code=status_code, headers=headers)


def created(
    data: Any = None,
    message: str = "Recurso creado correctamente",
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    return ok(data=data, message=message, status_code=status.HTTP_201_CREATED, headers=headers)
