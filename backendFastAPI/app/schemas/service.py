"""Schemas de servicios — equivalente de backend/src/validations/service.validation.js
y backend/src/models/service.model.js."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import field_validator

from app.schemas.category import CategoryRefOut
from app.schemas.common import CamelModel, InputModel, PaginationQuery

STATUS_VALUES = ("active", "inactive")
MAX_PRICE = 99999999.99


class ServiceOut(CamelModel):
    """`price` es DECIMAL en MySQL pero se expone como `float`, igual que Node."""

    id: int
    slug: str
    name: str
    description: str | None = None
    category: CategoryRefOut | None = None
    price: float
    duration_minutes: int
    image_url: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, service) -> "ServiceOut":
        category = (
            {"id": service.category.id, "slug": service.category.slug, "name": service.category.name}
            if service.category_id and service.category
            else None
        )
        return cls.model_validate(
            {
                "id": service.id,
                "slug": service.slug,
                "name": service.name,
                "description": service.description,
                "category": category,
                "price": service.price,
                "durationMinutes": service.duration_minutes,
                "imageUrl": service.image_url,
                "status": service.status,
                "createdAt": service.created_at,
                "updatedAt": service.updated_at,
            }
        )


class CreateServiceRequest(InputModel):
    name: str
    description: str | None = None
    category_id: int | None = None
    price: Decimal
    duration_minutes: int
    image_url: str | None = None
    status: str | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2 or len(trimmed) > 120:
            raise ValueError("El nombre debe tener entre 2 y 120 caracteres.")
        return trimmed

    @field_validator("description")
    @classmethod
    def _description(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) > 2000:
            raise ValueError("La descripción no puede superar los 2000 caracteres.")
        return trimmed

    @field_validator("price")
    @classmethod
    def _price(cls, v: Decimal) -> Decimal:
        if v < 0 or v > Decimal(str(MAX_PRICE)):
            raise ValueError("El precio no es válido.")
        return v

    @field_validator("duration_minutes")
    @classmethod
    def _duration(cls, v: int) -> int:
        if v <= 0 or v > 600:
            raise ValueError("La duración debe estar entre 1 y 600 minutos.")
        return v

    @field_validator("image_url")
    @classmethod
    def _image_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) > 500:
            raise ValueError("La URL de la imagen es demasiado larga.")
        return trimmed

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class UpdateServiceRequest(InputModel):
    name: str | None = None
    description: str | None = None
    category_id: int | None = None
    price: Decimal | None = None
    duration_minutes: int | None = None
    image_url: str | None = None
    status: str | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) < 2 or len(trimmed) > 120:
            raise ValueError("El nombre debe tener entre 2 y 120 caracteres.")
        return trimmed

    @field_validator("description")
    @classmethod
    def _description(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) > 2000:
            raise ValueError("La descripción no puede superar los 2000 caracteres.")
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

    @field_validator("price")
    @classmethod
    def _price(cls, v: Decimal | None) -> Decimal | None:
        if v is None:
            return v
        if v < 0 or v > Decimal(str(MAX_PRICE)):
            raise ValueError("El precio no es válido.")
        return v

    @field_validator("duration_minutes")
    @classmethod
    def _duration(cls, v: int | None) -> int | None:
        if v is not None and (v <= 0 or v > 600):
            raise ValueError("La duración debe estar entre 1 y 600 minutos.")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class UpdateServiceStatusRequest(InputModel):
    status: str

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        if v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class ListServicesQuery(PaginationQuery):
    category: str | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError("Estado no válido.")
        return v
