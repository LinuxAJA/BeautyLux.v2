"""Modelo del registro de correos — tabla `email_logs` (migración a Brevo).

No tiene equivalente en el backend Node, que no envía correos. Una fila por
cada correo que la API intentó enviar, con su resultado: `sent`, `failed`
(con el error) o `skipped` (`MAIL_ENABLED=false`, solo se escribió en el
log). `entity` + `entity_id` apuntan a lo que originó el correo (una venta,
una PQR...) sin llave foránea, igual que `audit_logs`, para que el registro
sobreviva aunque esa fila cambie o desaparezca.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

EMAIL_STATUSES = ("sent", "failed", "skipped")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    kind: Mapped[str] = mapped_column(String(40), nullable=False)
    recipient: Mapped[str] = mapped_column(String(60), nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(Enum(*EMAIL_STATUSES, name="email_status_enum"), nullable=False)
    attempts: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    entity: Mapped[str | None] = mapped_column(String(40), nullable=True)
    entity_id: Mapped[int | None] = mapped_column(nullable=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
