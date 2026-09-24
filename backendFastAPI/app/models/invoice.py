"""Modelo de factura — tabla `invoices` del quinto avance.

No tiene equivalente en el backend Node: la facturación nace con el quinto
avance. `sale_id` es único: una venta tiene a lo sumo una factura.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    invoice_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE", onupdate="CASCADE"), unique=True, nullable=False
    )

    # Snapshot fiscal del comprador, copiado de `sales` en el momento de
    # emitir: si la cuenta cambia después su documento o su dirección, la
    # factura ya emitida no debe cambiar.
    customer_first_name: Mapped[str] = mapped_column(String(40), nullable=False)
    customer_last_name: Mapped[str] = mapped_column(String(40), nullable=False)
    customer_document_type: Mapped[str | None] = mapped_column(String(5), nullable=True)
    customer_document_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(60), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    customer_address: Mapped[str | None] = mapped_column(String(120), nullable=True)

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tax_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    status: Mapped[str] = mapped_column(
        Enum("issued", "paid", "void", name="invoice_status_enum"), nullable=False, default="issued"
    )
    issued_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    voided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    sale: Mapped["Sale"] = relationship("Sale")  # noqa: F821
    details: Mapped[list["InvoiceDetail"]] = relationship(  # noqa: F821
        "InvoiceDetail", back_populates="invoice", cascade="all, delete-orphan", lazy="selectin"
    )
