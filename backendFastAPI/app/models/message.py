"""Modelo de mensaje del chatbot — tabla `messages` del quinto avance,
etapa 12, requisitos 17-19.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

MESSAGE_ROLES = ("user", "assistant", "system")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(Enum(*MESSAGE_ROLES, name="message_role_enum"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")  # noqa: F821
