"""Schemas de citas — quinto avance, etapa 5.

Mensajes de validación en español, porque el frontend los muestra tal cual.
Las horas viajan como texto `HH:MM` para que el selector de franjas del
frontend pueda compararlas sin convertir nada.
"""

from __future__ import annotations

from datetime import date, datetime, time

from pydantic import field_validator

from app.schemas.common import CamelModel, InputModel, validate_email, validate_name, validate_phone

LOCATIONS = ("atelier", "home")
APPOINTMENT_STATUSES = ("hold", "confirmed", "completed", "cancelled", "no_show")
# Estados a los que el personal puede mover una cita desde el panel.
MANAGEABLE_STATUSES = ("confirmed", "completed", "cancelled", "no_show")


def _hhmm(value: time | None) -> str | None:
    return value.strftime("%H:%M") if value else None


# ---------------------------------------------------------------------------
# Salida
# ---------------------------------------------------------------------------
class SlotOut(CamelModel):
    """Una franja ofrecida por la disponibilidad.

    `available` viaja explícito en vez de devolver solo las libres: el selector
    del frontend pinta también las ocupadas, en gris, para que se vea que ese
    día sí hay horario y lo que falta es cupo.
    """

    start_time: str
    end_time: str
    available: bool
    remaining: int


class AvailabilityOut(CamelModel):
    date: date
    weekday: int
    is_open: bool
    service_id: int | None = None
    service_name: str | None = None
    duration_minutes: int | None = None
    opens_at: str | None = None
    closes_at: str | None = None
    capacity: int | None = None
    slots: list[SlotOut]
    message: str | None = None


class AppointmentOut(CamelModel):
    id: int
    appointment_number: str
    sale_id: int | None = None
    sale_detail_id: int | None = None
    user_id: int | None = None
    service_id: int | None = None
    service_name: str
    duration_minutes: int
    customer_first_name: str
    customer_last_name: str
    customer_email: str | None = None
    customer_phone: str | None = None
    scheduled_date: date
    start_time: str
    end_time: str
    location: str
    status: str
    hold_expires_at: datetime | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, appointment) -> "AppointmentOut":
        return cls.model_validate(
            {
                "id": appointment.id,
                "appointmentNumber": appointment.appointment_number,
                "saleId": appointment.sale_id,
                "saleDetailId": appointment.sale_detail_id,
                "userId": appointment.user_id,
                "serviceId": appointment.service_id,
                "serviceName": appointment.service_name,
                "durationMinutes": appointment.duration_minutes,
                "customerFirstName": appointment.customer_first_name,
                "customerLastName": appointment.customer_last_name,
                "customerEmail": appointment.customer_email,
                "customerPhone": appointment.customer_phone,
                "scheduledDate": appointment.scheduled_date,
                "startTime": _hhmm(appointment.start_time),
                "endTime": _hhmm(appointment.end_time),
                "location": appointment.location,
                "status": appointment.status,
                "holdExpiresAt": appointment.hold_expires_at,
                "notes": appointment.notes,
                "createdAt": appointment.created_at,
                "updatedAt": appointment.updated_at,
            }
        )


# ---------------------------------------------------------------------------
# Entrada
# ---------------------------------------------------------------------------
def _validate_time_text(value: str) -> str:
    """Acepta `HH:MM` y `HH:MM:SS`, y devuelve siempre `HH:MM`."""
    try:
        parts = [int(p) for p in value.split(":")]
        parsed = time(parts[0], parts[1])
    except (ValueError, IndexError):
        raise ValueError("La hora debe tener el formato HH:MM.") from None
    return parsed.strftime("%H:%M")


class HoldAppointmentRequest(InputModel):
    """Reserva temporal de una franja mientras se termina el checkout."""

    service_id: int
    scheduled_date: date
    start_time: str
    location: str = "atelier"
    notes: str | None = None

    @field_validator("start_time")
    @classmethod
    def _validate_start_time(cls, value: str) -> str:
        return _validate_time_text(value)

    @field_validator("location")
    @classmethod
    def _validate_location(cls, value: str) -> str:
        if value not in LOCATIONS:
            raise ValueError("El lugar de la cita debe ser 'atelier' o 'home'.")
        return value

    @field_validator("notes")
    @classmethod
    def _validate_notes(cls, value: str | None) -> str | None:
        if value and len(value.strip()) > 255:
            raise ValueError("Las indicaciones no pueden superar los 255 caracteres.")
        return value.strip() if value else value


class CreateAppointmentRequest(HoldAppointmentRequest):
    """Agenda una cita ya confirmada.

    Se usa desde el panel y desde el checkout; en este último caso llega
    `holdId` con la reserva temporal que se está confirmando, y entonces no
    hace falta volver a validar el solape.
    """

    hold_id: int | None = None
    sale_id: int | None = None
    sale_detail_id: int | None = None
    # Solo el personal puede agendar a nombre de otra persona.
    client_id: int | None = None
    customer_first_name: str | None = None
    customer_last_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None

    @field_validator("customer_first_name")
    @classmethod
    def _validate_first_name(cls, value: str | None) -> str | None:
        return validate_name(value, "nombre") if value else value

    @field_validator("customer_last_name")
    @classmethod
    def _validate_last_name(cls, value: str | None) -> str | None:
        return validate_name(value, "apellido") if value else value

    @field_validator("customer_email")
    @classmethod
    def _validate_email(cls, value: str | None) -> str | None:
        return validate_email(value) if value else value

    @field_validator("customer_phone")
    @classmethod
    def _validate_phone(cls, value: str | None) -> str | None:
        return validate_phone(value) if value else value


class RescheduleAppointmentRequest(InputModel):
    scheduled_date: date
    start_time: str

    @field_validator("start_time")
    @classmethod
    def _validate_start_time(cls, value: str) -> str:
        return _validate_time_text(value)


class UpdateAppointmentStatusRequest(InputModel):
    status: str

    @field_validator("status")
    @classmethod
    def _validate_status(cls, value: str) -> str:
        if value not in MANAGEABLE_STATUSES:
            raise ValueError(
                "El estado debe ser 'confirmed', 'completed', 'cancelled' o 'no_show'."
            )
        return value
