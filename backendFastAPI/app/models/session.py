from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, CHAR, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Session(Base):
    """Tabla `sessions`: refresh tokens opacos. Choca de nombre con
    sqlalchemy.orm.Session, por eso las importaciones de la sesión de BD
    usan siempre el alias `Session as DbSession` o `from app.db.session import ...`."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False
    )
    refresh_token_hash: Mapped[str] = mapped_column(CHAR(64), unique=True, nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    remember: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
