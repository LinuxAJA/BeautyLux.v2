"""Modelo del horario de atención — tabla `business_hours` del quinto avance.

Es configuración del salón, no catálogo: de aquí salen las franjas que la
disponibilidad ofrece cada día.
"""

from __future__ import annotations

from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, SmallInteger, Time, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BusinessHours(Base):
    __tablename__ = "business_hours"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # 1 = lunes … 7 = domingo, igual que `date.isoweekday()`.
    weekday: Mapped[int] = mapped_column(SmallInteger, unique=True, nullable=False)
    opens_at: Mapped[time] = mapped_column(Time, nullable=False)
    closes_at: Mapped[time] = mapped_column(Time, nullable=False)
    slot_minutes: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=30)
    # Cuántas citas caben a la vez: son los puestos de trabajo del salón.
    capacity: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    is_open: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
