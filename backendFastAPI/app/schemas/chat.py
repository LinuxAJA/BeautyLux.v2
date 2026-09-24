"""Schemas del chatbot — quinto avance, etapa 12, requisitos 17-19."""

from __future__ import annotations

from datetime import datetime

from pydantic import field_validator

from app.schemas.common import CamelModel, InputModel


class ConversationOut(CamelModel):
    id: int
    session_token: str
    status: str
    started_at: datetime

    @classmethod
    def from_model(cls, conversation) -> "ConversationOut":
        return cls.model_validate(
            {
                "id": conversation.id,
                "sessionToken": conversation.session_token,
                "status": conversation.status,
                "startedAt": conversation.started_at,
            }
        )


class MessageOut(CamelModel):
    id: int
    role: str
    content: str
    created_at: datetime

    @classmethod
    def from_model(cls, message) -> "MessageOut":
        return cls.model_validate(
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "createdAt": message.created_at,
            }
        )


class CreateMessageRequest(InputModel):
    content: str
    session_token: str | None = None

    @field_validator("content")
    @classmethod
    def _validate_content(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 1:
            raise ValueError("Escribe un mensaje antes de enviarlo.")
        if len(trimmed) > 1000:
            raise ValueError("El mensaje no puede superar los 1000 caracteres.")
        return trimmed
