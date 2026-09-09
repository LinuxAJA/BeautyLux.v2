"""
Piezas compartidas de validación — equivalente de backend/src/validations/common.js.

Los mensajes de error están en español y coinciden literalmente con los de Node
porque el frontend los muestra tal cual al usuario (ver frontend/src/utils/validators.js
y frontend/src/services/api.js).
"""

from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel

REGEX = {
    "name": re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$"),
    "email": re.compile(r"^[\w.+-]+@[\w-]+(\.[\w-]+)*\.[A-Za-z]{2,}$"),
    "digits": re.compile(r"^\d+$"),
    "alphanumeric": re.compile(r"^[A-Za-z0-9]+$"),
    "colombian_mobile": re.compile(r"^3\d{9}$"),
    "address": re.compile(r"^[\wÁÉÍÓÚÜÑáéíóúüñ\s#\-.,°]+$"),
    "has_lowercase": re.compile(r"[a-z]"),
    "has_uppercase": re.compile(r"[A-Z]"),
    "has_number": re.compile(r"\d"),
    "has_symbol": re.compile(r"[^A-Za-z0-9]"),
}

DOCUMENT_TYPES = ("CC", "CE", "TI", "PA", "NIT")

DOCUMENT_RULES: dict[str, dict[str, Any]] = {
    "CC": {"min": 6, "max": 12, "pattern": REGEX["digits"], "message": "El número de documento debe tener entre 6 y 12 dígitos."},
    "TI": {"min": 6, "max": 12, "pattern": REGEX["digits"], "message": "El número de documento debe tener entre 6 y 12 dígitos."},
    "NIT": {"min": 6, "max": 12, "pattern": REGEX["digits"], "message": "El número de documento debe tener entre 6 y 12 dígitos."},
    "CE": {"min": 6, "max": 15, "pattern": REGEX["digits"], "message": "La cédula de extranjería debe tener entre 6 y 15 dígitos."},
    "PA": {"min": 6, "max": 15, "pattern": REGEX["alphanumeric"], "message": "El pasaporte debe tener entre 6 y 15 caracteres alfanuméricos."},
}


def validate_document_number(document_type: str, document_number: str) -> str | None:
    """Devuelve el mensaje de error si el documento no cumple su regla, o None si es válido."""
    rule = DOCUMENT_RULES.get(document_type)
    if not rule:
        return None
    if (
        len(document_number) < rule["min"]
        or len(document_number) > rule["max"]
        or not rule["pattern"].match(document_number)
    ):
        return rule["message"]
    return None


def validate_name(value: str, label: str) -> str:
    trimmed = value.strip()
    lower_label = label.lower()
    if len(trimmed) < 2:
        raise ValueError(f"El {lower_label} debe tener al menos 2 caracteres.")
    if len(trimmed) > 40:
        raise ValueError(f"El {lower_label} no puede superar los 40 caracteres.")
    if not REGEX["name"].match(trimmed):
        raise ValueError(f"El {lower_label} solo admite letras.")
    return trimmed


def validate_email(value: str) -> str:
    trimmed = value.strip().lower()
    if len(trimmed) > 60:
        raise ValueError("El correo electrónico no puede superar los 60 caracteres.")
    if not REGEX["email"].match(trimmed):
        raise ValueError("Escribe un correo válido, por ejemplo: nombre@correo.com")
    return trimmed


def validate_phone(value: str) -> str:
    if not REGEX["colombian_mobile"].match(value):
        raise ValueError("Ingresa un celular colombiano válido de 10 dígitos que inicie en 3.")
    return value


def validate_address(value: str) -> str:
    trimmed = value.strip()
    if len(trimmed) < 5:
        raise ValueError("La dirección debe tener al menos 5 caracteres.")
    if len(trimmed) > 80:
        raise ValueError("La dirección no puede superar los 80 caracteres.")
    if not REGEX["address"].match(trimmed):
        raise ValueError("La dirección contiene caracteres no permitidos.")
    return trimmed


def validate_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres.")
    if len(value) > 32:
        raise ValueError("La contraseña no puede superar los 32 caracteres.")
    if re.search(r"\s", value):
        raise ValueError("La contraseña no puede contener espacios.")
    if not REGEX["has_lowercase"].search(value):
        raise ValueError("Debe incluir al menos una letra minúscula.")
    if not REGEX["has_uppercase"].search(value):
        raise ValueError("Debe incluir al menos una letra mayúscula.")
    if not REGEX["has_number"].search(value):
        raise ValueError("Debe incluir al menos un número.")
    if not REGEX["has_symbol"].search(value):
        raise ValueError("Debe incluir al menos un símbolo (!, @, #, $…).")
    return value


class CamelModel(BaseModel):
    """Base para los schemas de SALIDA: serializa a camelCase (el frontend
    no entiende snake_case)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class InputModel(BaseModel):
    """Base para los schemas de ENTRADA: acepta camelCase desde el body y
    descarta silenciosamente cualquier campo extra (el frontend reenvía el
    row completo, con id/createdAt/etc., al editar)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class PaginationQuery(BaseModel):
    page: int | None = None
    per_page: int | None = None
    order_by: str | None = None
    order_dir: str | None = None
    search: str | None = None

    @field_validator("order_dir")
    @classmethod
    def _validate_order_dir(cls, value: str | None) -> str | None:
        if value is not None and value.upper() not in ("ASC", "DESC"):
            raise ValueError("El orden debe ser 'asc' o 'desc'.")
        return value

    @field_validator("search")
    @classmethod
    def _trim_search(cls, value: str | None) -> str | None:
        if value is None:
            return value
        trimmed = value.strip()
        if len(trimmed) > 100:
            raise ValueError("La búsqueda no puede superar los 100 caracteres.")
        return trimmed
