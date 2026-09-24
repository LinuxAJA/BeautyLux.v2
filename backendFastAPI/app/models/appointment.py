"""Modelo de cita — tabla `appointments` del quinto avance.

Una cita nace como `hold`: una reserva temporal que sostiene la franja
mientras la clienta termina el checkout. Si no se confirma antes de
`hold_expires_at`, la limpieza periódica la descarta y el cupo vuelve a
ofrecerse.

El nombre del servicio y su duración se copian aquí por la misma razón que en
`sale_details`: la agenda histórica debe seguir siendo legible aunque el
servicio cambie de nombre, de duración o desaparezca del catálogo.
"""

from __future__ import annotations

from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, SmallInteger, String, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Estados que ocupan sitio en la agenda. Los demás (`cancelled`, `no_show`) ya
# no bloquean la franja, y un `hold` solo cuenta mientras no haya vencido.
ACTIVE_STATUSES = ("hold", "confirmed", "completed")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    appointment_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    sale_id: Mapped[int | None] = mapped_column(
        ForeignKey("sales.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    sale_detail_id: Mapped[int | None] = mapped_column(
        ForeignKey("sale_details.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )
    service_id: Mapped[int | None] = mapped_column(
        ForeignKey("services.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True
    )

    customer_first_name: Mapped[str] = mapped_column(String(40), nullable=False)
    customer_last_name: Mapped[str] = mapped_column(String(40), nullable=False)
    customer_email: Mapped[str | None] = mapped_column(String(60), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    service_name: Mapped[str] = mapped_column(String(120), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

    location: Mapped[str] = mapped_column(
        Enum("atelier", "home", name="appointment_location_enum"), nullable=False, default="atelier"
    )
    status: Mapped[str] = mapped_column(
        Enum("hold", "confirmed", "completed", "cancelled", "no_show", name="appointment_status_enum"),
        nullable=False,
        default="hold",
    )
    hold_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    service: Mapped["Service | None"] = relationship("Service")  # noqa: F821
