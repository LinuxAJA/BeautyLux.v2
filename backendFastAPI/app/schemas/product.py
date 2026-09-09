"""Schemas de productos — equivalente de backend/src/validations/product.validation.js
y backend/src/models/product.model.js."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import field_validator

from app.schemas.category import CategoryRefOut
from app.schemas.common import CamelModel, InputModel, PaginationQuery

STATUS_VALUES = ("active", "inactive")
MAX_PRICE = 99999999.99


class ProductOut(CamelModel):
    """La categoría va anidada; categoryId/categorySlug/categoryName no se exponen
    (igual que Product.toJSON() en Node)."""

    id: int
    sku: str
    slug: str
    name: str
    description: str | None = None
    category: CategoryRefOut | None = None
    price: Decimal
    old_price: Decimal | None = None
    stock: int
    rating: Decimal
    reviews_count: int
    image_url: str | None = None
    badge: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, product) -> "ProductOut":
        category = (
            {"id": product.category.id, "slug": product.category.slug, "name": product.category.name}
            if product.category_id and product.category
            else None
        )
        return cls.model_validate(
            {
                "id": product.id,
                "sku": product.sku,
                "slug": product.slug,
                "name": product.name,
                "description": product.description,
                "category": category,
                "price": product.price,
                "oldPrice": product.old_price,
                "stock": product.stock,
                "rating": product.rating,
                "reviewsCount": product.reviews_count,
                "imageUrl": product.image_url,
                "badge": product.badge,
                "status": product.status,
                "createdAt": product.created_at,
                "updatedAt": product.updated_at,
            }
        )


class CreateProductRequest(InputModel):
    sku: str
    name: str
    description: str | None = None
    category_id: int | None = None
    price: Decimal
    old_price: Decimal | None = None
    stock: int = 0
    image_url: str | None = None
    badge: str | None = None
    status: str | None = None

    @field_validator("sku")
    @classmethod
    def _sku(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2 or len(trimmed) > 40:
            raise ValueError("El SKU debe tener entre 2 y 40 caracteres.")
        return trimmed

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

    @field_validator("category_id")
    @classmethod
    def _category_id(cls, v: int | None) -> int | None:
        if v is not None and v <= 0:
            raise ValueError("La categoría no es válida.")
        return v

    @field_validator("price")
    @classmethod
    def _price(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("El precio no puede ser negativo.")
        if v > Decimal(str(MAX_PRICE)):
            raise ValueError("El precio es demasiado alto.")
        return v

    @field_validator("old_price")
    @classmethod
    def _old_price(cls, v: Decimal | None) -> Decimal | None:
        if v is None:
            return v
        if v < 0 or v > Decimal(str(MAX_PRICE)):
            raise ValueError("El precio anterior no es válido.")
        return v

    @field_validator("stock")
    @classmethod
    def _stock(cls, v: int) -> int:
        if v < 0:
            raise ValueError("El stock no puede ser negativo.")
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

    @field_validator("badge")
    @classmethod
    def _badge(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) > 40:
            raise ValueError("La etiqueta no puede superar los 40 caracteres.")
        return trimmed

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class UpdateProductRequest(InputModel):
    sku: str | None = None
    name: str | None = None
    description: str | None = None
    category_id: int | None = None
    price: Decimal | None = None
    old_price: Decimal | None = None
    stock: int | None = None
    image_url: str | None = None
    badge: str | None = None
    status: str | None = None

    @field_validator("sku")
    @classmethod
    def _sku(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) < 2 or len(trimmed) > 40:
            raise ValueError("El SKU debe tener entre 2 y 40 caracteres.")
        return trimmed

    @field_validator("name")
    @classmethod
    def _name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) < 2 or len(trimmed) > 120:
            raise ValueError("El nombre debe tener entre 2 y 120 caracteres.")
        return trimmed

    @field_validator("price")
    @classmethod
    def _price(cls, v: Decimal | None) -> Decimal | None:
        if v is None:
            return v
        if v < 0 or v > Decimal(str(MAX_PRICE)):
            raise ValueError("El precio no es válido.")
        return v

    @field_validator("stock")
    @classmethod
    def _stock(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("El stock no puede ser negativo.")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class UpdateProductStatusRequest(InputModel):
    status: str

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        if v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class ListProductsQuery(PaginationQuery):
    category: str | None = None
    status: str | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError("Estado no válido.")
        return v
