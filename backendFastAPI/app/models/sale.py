"""Modelo de venta — tabla `sales` del quinto avance.

No tiene equivalente en el backend Node: el módulo de ventas nace con el
quinto avance, así que aquí no hay paridad que conservar, solo las
convenciones de los modelos ya existentes.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sale_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    # El cliente puede quedar en NULL: venta de mostrador a consumidor final,
    # o cuenta eliminada. El snapshot de abajo conserva a quién se le vendió.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    # Quién atendió la venta. Solo se llena en el canal POS.
    staff_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    channel: Mapped[str] = mapped_column(
        Enum("web", "pos", name="sale_channel_enum"), nullable=False, default="web"
    )

    customer_first_name: Mapped[str] = mapped_column(String(40), nullable=False)
    customer_last_name: Mapped[str] = mapped_column(String(40), nullable=False)
    customer_document_type: Mapped[str | None] = mapped_column(String(5), nullable=True)
    customer_document_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(60), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    shipping_method: Mapped[str] = mapped_column(
        Enum("standard", "express", "pickup", name="sale_shipping_method_enum"),
        nullable=False,
        default="standard",
    )
    shipping_address: Mapped[str | None] = mapped_column(String(120), nullable=True)
    shipping_city: Mapped[str | None] = mapped_column(String(60), nullable=True)
    shipping_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    payment_method: Mapped[str] = mapped_column(
        Enum("card", "pse", "nequi", "cash", name="sale_payment_method_enum"),
        nullable=False,
        default="card",
    )

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    discount_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tax_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    shipping_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    status: Mapped[str] = mapped_column(
        Enum("pending", "paid", "processing", "completed", "cancelled", name="sale_status_enum"),
        nullable=False,
        default="pending",
    )
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    sold_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # `delete-orphan` + cascade: borrar una venta se lleva sus líneas, igual
    # que el ON DELETE CASCADE de la tabla.
    details: Mapped[list["SaleDetail"]] = relationship(  # noqa: F821
        "SaleDetail", back_populates="sale", cascade="all, delete-orphan", lazy="selectin"
    )
    customer: Mapped["User | None"] = relationship("User", foreign_keys=[user_id])  # noqa: F821
    staff: Mapped["User | None"] = relationship("User", foreign_keys=[staff_id])  # noqa: F821
