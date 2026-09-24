"""Modelo de PQR — tabla `pqr` del quinto avance, requisito 16.

No tiene equivalente en el backend Node: el módulo de PQR nace con el quinto
avance. `user_id` es opcional porque la radicación es pública; el snapshot de
contacto (`contact_*`) es lo que de verdad identifica a quien escribió,
independiente de si tiene cuenta o de que esta siga existiendo después.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

PQR_TYPES = ("peticion", "queja", "reclamo", "sugerencia")
PQR_STATUSES = ("pending", "in_progress", "answered", "closed")


class Pqr(Base):
    __tablename__ = "pqr"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    sale_id: Mapped[int | None] = mapped_column(
        ForeignKey("sales.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )

    type: Mapped[str] = mapped_column(Enum(*PQR_TYPES, name="pqr_type_enum"), nullable=False)
    subject: Mapped[str] = mapped_column(String(160), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    contact_first_name: Mapped[str] = mapped_column(String(40), nullable=False)
    contact_last_name: Mapped[str] = mapped_column(String(40), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(60), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    status: Mapped[str] = mapped_column(
        Enum(*PQR_STATUSES, name="pqr_status_enum"), nullable=False, default="pending"
    )
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    responded_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    sale: Mapped["Sale | None"] = relationship("Sale")  # noqa: F821
