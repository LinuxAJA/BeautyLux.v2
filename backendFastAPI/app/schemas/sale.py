"""Schemas de ventas — quinto avance, requisitos 1, 2, 3 y 14.

Los mensajes de error están en español porque el frontend los muestra tal cual,
igual que en el resto de schemas (ver app/schemas/common.py).

Nota importante sobre el contrato: el cliente envía **qué** compra y **cuánto**,
nunca **a qué precio**. Todos los importes se calculan en el servidor a partir
del catálogo, así que cualquier `price` o `total` que llegue en el body se
ignora sin avisar.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import field_validator

from app.schemas.common import (
    CamelModel,
    InputModel,
    validate_address,
    validate_email,
    validate_name,
    validate_phone,
)

ITEM_TYPES = ("product", "service")
CHANNELS = ("web", "pos")
PAYMENT_METHODS = ("card", "pse", "nequi", "cash")
SHIPPING_METHODS = ("standard", "express", "pickup")
SALE_STATUSES = ("pending", "paid", "processing", "completed", "cancelled")

MAX_ITEMS_PER_SALE = 50
MAX_QUANTITY_PER_ITEM = 99


# ---------------------------------------------------------------------------
# Salida
# ---------------------------------------------------------------------------
class SaleDetailOut(CamelModel):
    """Una línea de la venta. `productId`/`serviceId` pueden venir en `null` si
    el artículo se eliminó del catálogo después de la venta; el nombre y el SKU
    sobreviven porque son una copia."""

    id: int
    item_type: str
    product_id: int | None = None
    service_id: int | None = None
    item_name: str
    item_sku: str | None = None
    unit_price: float
    quantity: int
    discount: float
    tax_rate: float
    subtotal: float
    duration_minutes: int | None = None

    @classmethod
    def from_model(cls, detail) -> "SaleDetailOut":
        return cls.model_validate(
            {
                "id": detail.id,
                "itemType": detail.item_type,
                "productId": detail.product_id,
                "serviceId": detail.service_id,
                "itemName": detail.item_name,
                "itemSku": detail.item_sku,
                "unitPrice": detail.unit_price,
                "quantity": detail.quantity,
                "discount": detail.discount,
                "taxRate": detail.tax_rate,
                "subtotal": detail.subtotal,
                "durationMinutes": detail.duration_minutes,
            }
        )


class SaleCustomerOut(CamelModel):
    """Snapshot del comprador, tal como estaba al vender."""

    first_name: str
    last_name: str
    document_type: str | None = None
    document_number: str | None = None
    email: str | None = None
    phone: str | None = None


class SaleShippingOut(CamelModel):
    method: str
    address: str | None = None
    city: str | None = None
    notes: str | None = None
    cost: float


class SaleOut(CamelModel):
    """Los importes son DECIMAL en MySQL y se exponen como `float`, igual que
    `price` en productos: el frontend espera números en el JSON, no strings."""

    id: int
    sale_number: str
    user_id: int | None = None
    staff_id: int | None = None
    channel: str
    customer: SaleCustomerOut
    shipping: SaleShippingOut
    payment_method: str
    subtotal: float
    discount_total: float
    tax_total: float
    shipping_cost: float
    total: float
    status: str
    notes: str | None = None
    items_count: int
    sold_at: datetime
    created_at: datetime
    updated_at: datetime
    details: list[SaleDetailOut] | None = None

    @classmethod
    def from_model(cls, sale, *, with_details: bool = False) -> "SaleOut":
        details = list(sale.details or [])
        return cls.model_validate(
            {
                "id": sale.id,
                "saleNumber": sale.sale_number,
                "userId": sale.user_id,
                "staffId": sale.staff_id,
                "channel": sale.channel,
                "customer": {
                    "firstName": sale.customer_first_name,
                    "lastName": sale.customer_last_name,
                    "documentType": sale.customer_document_type,
                    "documentNumber": sale.customer_document_number,
                    "email": sale.customer_email,
                    "phone": sale.customer_phone,
                },
                "shipping": {
                    "method": sale.shipping_method,
                    "address": sale.shipping_address,
                    "city": sale.shipping_city,
                    "notes": sale.shipping_notes,
                    "cost": sale.shipping_cost,
                },
                "paymentMethod": sale.payment_method,
                "subtotal": sale.subtotal,
                "discountTotal": sale.discount_total,
                "taxTotal": sale.tax_total,
                "shippingCost": sale.shipping_cost,
                "total": sale.total,
                "status": sale.status,
                "notes": sale.notes,
                "itemsCount": sum(d.quantity for d in details),
                "soldAt": sale.sold_at,
                "createdAt": sale.created_at,
                "updatedAt": sale.updated_at,
                "details": [SaleDetailOut.from_model(d) for d in details] if with_details else None,
            }
        )


# ---------------------------------------------------------------------------
# Entrada
# ---------------------------------------------------------------------------
class SaleItemRequest(InputModel):
    """Un artículo del carrito. Sin precio: lo pone el servidor."""

    item_type: str
    item_id: int
    quantity: int = 1

    @field_validator("item_type")
    @classmethod
    def _validate_item_type(cls, value: str) -> str:
        if value not in ITEM_TYPES:
            raise ValueError("El tipo de artículo debe ser 'product' o 'service'.")
        return value

    @field_validator("item_id")
    @classmethod
    def _validate_item_id(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("El identificador del artículo no es válido.")
        return value

    @field_validator("quantity")
    @classmethod
    def _validate_quantity(cls, value: int) -> int:
        if value < 1:
            raise ValueError("La cantidad debe ser al menos 1.")
        if value > MAX_QUANTITY_PER_ITEM:
            raise ValueError(f"La cantidad no puede superar las {MAX_QUANTITY_PER_ITEM} unidades.")
        return value


class SaleCustomerRequest(InputModel):
    """Datos del comprador. Para una venta propia se rellenan solos desde la
    cuenta; el POS los necesita para vender a consumidor final."""

    first_name: str | None = None
    last_name: str | None = None
    document_type: str | None = None
    document_number: str | None = None
    email: str | None = None
    phone: str | None = None

    @field_validator("first_name")
    @classmethod
    def _validate_first_name(cls, value: str | None) -> str | None:
        return validate_name(value, "nombre") if value else value

    @field_validator("last_name")
    @classmethod
    def _validate_last_name(cls, value: str | None) -> str | None:
        return validate_name(value, "apellido") if value else value

    @field_validator("email")
    @classmethod
    def _validate_email(cls, value: str | None) -> str | None:
        return validate_email(value) if value else value

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, value: str | None) -> str | None:
        return validate_phone(value) if value else value


class SaleShippingRequest(InputModel):
    method: str = "standard"
    address: str | None = None
    city: str | None = None
    notes: str | None = None

    @field_validator("method")
    @classmethod
    def _validate_method(cls, value: str) -> str:
        if value not in SHIPPING_METHODS:
            raise ValueError("El método de envío seleccionado no es válido.")
        return value

    @field_validator("address")
    @classmethod
    def _validate_address(cls, value: str | None) -> str | None:
        return validate_address(value) if value else value

    @field_validator("city")
    @classmethod
    def _validate_city(cls, value: str | None) -> str | None:
        if not value:
            return value
        trimmed = value.strip()
        if len(trimmed) < 3:
            raise ValueError("La ciudad debe tener al menos 3 caracteres.")
        if len(trimmed) > 60:
            raise ValueError("La ciudad no puede superar los 60 caracteres.")
        return trimmed

    @field_validator("notes")
    @classmethod
    def _validate_notes(cls, value: str | None) -> str | None:
        if value and len(value.strip()) > 255:
            raise ValueError("Las indicaciones no pueden superar los 255 caracteres.")
        return value.strip() if value else value


class CreateSaleRequest(InputModel):
    items: list[SaleItemRequest]
    customer: SaleCustomerRequest | None = None
    shipping: SaleShippingRequest | None = None
    payment_method: str = "card"
    # Solo el personal puede marcar una venta como presencial o venderla a
    # nombre de otro cliente; el service lo verifica contra el rol.
    channel: str | None = None
    client_id: int | None = None
    notes: str | None = None

    @field_validator("items")
    @classmethod
    def _validate_items(cls, value: list[SaleItemRequest]) -> list[SaleItemRequest]:
        if not value:
            raise ValueError("La venta debe incluir al menos un artículo.")
        if len(value) > MAX_ITEMS_PER_SALE:
            raise ValueError(f"La venta no puede superar los {MAX_ITEMS_PER_SALE} artículos distintos.")

        seen = {(item.item_type, item.item_id) for item in value}
        if len(seen) != len(value):
            raise ValueError("Hay artículos repetidos: agrupa las cantidades en una sola línea.")
        return value

    @field_validator("payment_method")
    @classmethod
    def _validate_payment_method(cls, value: str) -> str:
        if value not in PAYMENT_METHODS:
            raise ValueError("El método de pago seleccionado no es válido.")
        return value

    @field_validator("channel")
    @classmethod
    def _validate_channel(cls, value: str | None) -> str | None:
        if value is not None and value not in CHANNELS:
            raise ValueError("El canal de venta debe ser 'web' o 'pos'.")
        return value

    @field_validator("notes")
    @classmethod
    def _validate_notes(cls, value: str | None) -> str | None:
        if value and len(value.strip()) > 255:
            raise ValueError("Las notas no pueden superar los 255 caracteres.")
        return value.strip() if value else value


class UpdateSaleStatusRequest(InputModel):
    status: str

    @field_validator("status")
    @classmethod
    def _validate_status(cls, value: str) -> str:
        if value not in SALE_STATUSES:
            raise ValueError(
                "El estado debe ser 'pending', 'paid', 'processing', 'completed' o 'cancelled'."
            )
        return value
