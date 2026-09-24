"""Modelo del detalle de venta — tabla `sale_details` del quinto avance.

Cada línea guarda una copia del nombre, el SKU y el precio del artículo en el
momento de la venta. Así, si el catálogo cambia o el producto se elimina, la
venta histórica sigue siendo legible y la factura de la etapa 7 puede
reimprimirse idéntica.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SaleDetail(Base):
    __tablename__ = "sale_details"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False
    )
    item_type: Mapped[str] = mapped_column(
        Enum("product", "service", name="sale_detail_item_type_enum"), nullable=False
    )

    # Excluyentes: una línea es de producto o de servicio. Ambos admiten NULL
    # para que eliminar el artículo del catálogo no borre la venta.
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    service_id: Mapped[int | None] = mapped_column(
        ForeignKey("services.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )

    item_name: Mapped[str] = mapped_column(String(120), nullable=False)
    item_sku: Mapped[str | None] = mapped_column(String(40), nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # Solo servicios: la agenda de citas la necesita aunque luego se edite el catálogo.
    duration_minutes: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    sale: Mapped["Sale"] = relationship("Sale", back_populates="details")  # noqa: F821
