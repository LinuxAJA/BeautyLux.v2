"""Schemas del registro de correos y del correo de prueba (migración a Brevo)."""

from __future__ import annotations

from datetime import datetime

from pydantic import field_validator

from app.schemas.common import CamelModel, InputModel, validate_email


class EmailLogOut(CamelModel):
    id: int
    kind: str
    recipient: str
    subject: str
    status: str
    attempts: int
    error_message: str | None = None
    entity: str | None = None
    entity_id: int | None = None
    user_id: int | None = None
    sent_at: datetime | None = None
    created_at: datetime

    @classmethod
    def from_model(cls, log) -> "EmailLogOut":
        return cls.model_validate(
            {
                "id": log.id,
                "kind": log.kind,
                "recipient": log.recipient,
                "subject": log.subject,
                "status": log.status,
                "attempts": log.attempts,
                "errorMessage": log.error_message,
                "entity": log.entity,
                "entityId": log.entity_id,
                "userId": log.user_id,
                "sentAt": log.sent_at,
                "createdAt": log.created_at,
            }
        )


class SendTestEmailRequest(InputModel):
    """Sin `to`, el correo de prueba va al propio administrador."""

    to: str | None = None

    @field_validator("to")
    @classmethod
    def _validate_to(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return validate_email(value)


class TestEmailResult(CamelModel):
    status: str
    recipient: str
    attempts: int
    error: str | None = None
    log_id: int
