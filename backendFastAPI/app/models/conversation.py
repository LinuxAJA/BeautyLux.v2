"""Modelo de conversación del chatbot — tabla `conversations` del quinto
avance, etapa 12, requisitos 17-19.

No tiene equivalente en el backend Node: el chat nace con el quinto avance.
`user_id` es opcional porque el chat funciona sin sesión; `session_token`
es la prueba de propiedad de una conversación anónima (se guarda en
`localStorage` del navegador, no es un token de autenticación).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

CONVERSATION_STATUSES = ("open", "closed")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    session_token: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(*CONVERSATION_STATUSES, name="conversation_status_enum"), nullable=False, default="open"
    )
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    messages: Mapped[list["Message"]] = relationship(  # noqa: F821
        "Message", back_populates="conversation", order_by="Message.created_at"
    )
