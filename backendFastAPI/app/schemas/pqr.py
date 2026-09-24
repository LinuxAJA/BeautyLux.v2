"""Schemas de PQR — quinto avance, requisito 16.

Mensajes de validación en español, porque el frontend los muestra tal cual.
`subject` reutiliza en el frontend la misma lista `contactSubjects` del
formulario de contacto (`data/documentTypes.js`), pero aquí se valida solo
por longitud: es texto libre, no un enum de base de datos, igual que
`badge` en productos.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import field_validator

from app.models.pqr import PQR_STATUSES, PQR_TYPES
from app.schemas.common import CamelModel, InputModel, validate_email, validate_name, validate_phone


class PqrOut(CamelModel):
    id: int
    ticket_number: str
    user_id: int | None = None
    type: str
    subject: str
    message: str
    contact_first_name: str
    contact_last_name: str
    contact_email: str
    contact_phone: str | None = None
    status: str
    response: str | None = None
    responded_at: datetime | None = None
    sale_id: int | None = None
    sale_number: str | None = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, pqr) -> "PqrOut":
        return cls.model_validate(
            {
                "id": pqr.id,
                "ticketNumber": pqr.ticket_number,
                "userId": pqr.user_id,
                "type": pqr.type,
                "subject": pqr.subject,
                "message": pqr.message,
                "contactFirstName": pqr.contact_first_name,
                "contactLastName": pqr.contact_last_name,
                "contactEmail": pqr.contact_email,
                "contactPhone": pqr.contact_phone,
                "status": pqr.status,
                "response": pqr.response,
                "respondedAt": pqr.responded_at,
                "saleId": pqr.sale_id,
                "saleNumber": pqr.sale.sale_number if pqr.sale_id and pqr.sale else None,
                "createdAt": pqr.created_at,
                "updatedAt": pqr.updated_at,
            }
        )


class CreatePqrRequest(InputModel):
    type: str
    subject: str
    message: str
    contact_first_name: str
    contact_last_name: str
    contact_email: str
    contact_phone: str | None = None
    sale_id: int | None = None

    @field_validator("type")
    @classmethod
    def _validate_type(cls, value: str) -> str:
        if value not in PQR_TYPES:
            raise ValueError("El tipo debe ser 'peticion', 'queja', 'reclamo' o 'sugerencia'.")
        return value

    @field_validator("subject")
    @classmethod
    def _validate_subject(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 3:
            raise ValueError("Selecciona o escribe el asunto de tu mensaje.")
        if len(trimmed) > 160:
            raise ValueError("El asunto no puede superar los 160 caracteres.")
        return trimmed

    @field_validator("message")
    @classmethod
    def _validate_message(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 15:
            raise ValueError("Cuéntanos un poco más: mínimo 15 caracteres.")
        if len(trimmed) > 2000:
            raise ValueError("El mensaje no puede superar los 2000 caracteres.")
        return trimmed

    @field_validator("contact_first_name")
    @classmethod
    def _validate_first_name(cls, value: str) -> str:
        return validate_name(value, "nombre")

    @field_validator("contact_last_name")
    @classmethod
    def _validate_last_name(cls, value: str) -> str:
        return validate_name(value, "apellido")

    @field_validator("contact_email")
    @classmethod
    def _validate_email(cls, value: str) -> str:
        return validate_email(value)

    @field_validator("contact_phone")
    @classmethod
    def _validate_phone(cls, value: str | None) -> str | None:
        return validate_phone(value) if value else value


class UpdatePqrStatusRequest(InputModel):
    status: str

    @field_validator("status")
    @classmethod
    def _validate_status(cls, value: str) -> str:
        if value not in PQR_STATUSES:
            raise ValueError("El estado debe ser 'pending', 'in_progress', 'answered' o 'closed'.")
        return value


class RespondPqrRequest(InputModel):
    response: str

    @field_validator("response")
    @classmethod
    def _validate_response(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 5:
            raise ValueError("Escribe una respuesta antes de enviarla.")
        if len(trimmed) > 2000:
            raise ValueError("La respuesta no puede superar los 2000 caracteres.")
        return trimmed
