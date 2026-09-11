"""Schemas de categorías — equivalente de backend/src/validations/category.validation.js."""

from __future__ import annotations

from datetime import datetime

from pydantic import field_validator

from app.schemas.common import CamelModel, InputModel

CATEGORY_TYPES = ("product", "service")
STATUS_VALUES = ("active", "inactive")
DESCRIPTION_MAX = 255


class CategoryOut(CamelModel):
    id: int
    slug: str
    name: str
    description: str | None = None
    image_url: str | None = None
    type: str
    status: str
    created_at: datetime
    updated_at: datetime


class CategoryRefOut(CamelModel):
    """Categoría anidada dentro de un producto/servicio (id, slug, name)."""

    id: int
    slug: str
    name: str


class CreateCategoryRequest(InputModel):
    name: str
    description: str | None = None
    image_url: str | None = None
    type: str
    status: str | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2 or len(trimmed) > 80:
            raise ValueError("El nombre debe tener entre 2 y 80 caracteres.")
        return trimmed

    @field_validator("description")
    @classmethod
    def _description(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        # 255 y no 300 (como en Node): la columna categories.description es VARCHAR(255);
        # con 300 un texto de 256-300 caracteres pasaba la validación y fallaba en MySQL.
        if len(trimmed) > DESCRIPTION_MAX:
            raise ValueError(f"La descripción no puede superar los {DESCRIPTION_MAX} caracteres.")
        return trimmed

    @field_validator("image_url")
    @classmethod
    def _image_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) > 500:
            raise ValueError("La URL de la imagen es demasiado larga.")
        return trimmed

    @field_validator("type")
    @classmethod
    def _type(cls, v: str) -> str:
        if v not in CATEGORY_TYPES:
            raise ValueError('El tipo debe ser "product" o "service".')
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class UpdateCategoryRequest(InputModel):
    name: str | None = None
    description: str | None = None
    image_url: str | None = None
    type: str | None = None
    status: str | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) < 2 or len(trimmed) > 80:
            raise ValueError("El nombre debe tener entre 2 y 80 caracteres.")
        return trimmed

    @field_validator("description")
    @classmethod
    def _description(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) > DESCRIPTION_MAX:
            raise ValueError(f"La descripción no puede superar los {DESCRIPTION_MAX} caracteres.")
        return trimmed

    @field_validator("image_url")
    @classmethod
    def _image_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) > 500:
            raise ValueError("La URL de la imagen es demasiado larga.")
        return trimmed

    @field_validator("type")
    @classmethod
    def _type(cls, v: str | None) -> str | None:
        if v is not None and v not in CATEGORY_TYPES:
            raise ValueError('El tipo debe ser "product" o "service".')
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class ListCategoriesQuery(InputModel):
    type: str | None = None

    @field_validator("type")
    @classmethod
    def _type(cls, v: str | None) -> str | None:
        if v is not None and v not in CATEGORY_TYPES:
            raise ValueError('El tipo debe ser "product" o "service".')
        return v
