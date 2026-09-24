"""Router del chatbot — quinto avance, etapa 12, requisitos 17-19.

No hay equivalente en el backend Node: el chat nace aquí. Público y
autenticado, sin diferencia de comportamiento salvo que, con sesión, la
conversación queda ligada a la cuenta. Sin sesión, la propiedad de la
conversación la prueba el `sessionToken` que devuelve
`POST /api/chat/conversations` (se guarda en `localStorage`, no es un
token de autenticación).

Nota: a diferencia de los demás módulos, este archivo NO usa
`from __future__ import annotations` — el mismo motivo que en auth.py:
`@limiter.limit(...)` rompe la resolución de anotaciones diferidas (PEP 563).
"""

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.auth import get_current_user_optional
from app.middleware.rate_limit import CHAT_MESSAGE_LIMIT, CHAT_MESSAGE_MESSAGE, limiter
from app.models.user import User
from app.schemas.chat import ConversationOut, CreateMessageRequest, MessageOut
from app.services.chat import chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversations", summary="Abrir una conversación (pública o autenticada)", status_code=201)
def open_conversation(db: Session = Depends(get_db), user: User | None = Depends(get_current_user_optional)):
    conversation = chat_service.open_conversation(db, actor=user)
    return created(data=ConversationOut.from_model(conversation), message="Conversación iniciada.")


@router.get("/conversations/{conversation_id}/messages", summary="Ver el historial de una conversación")
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
    session_token: str | None = Query(None, alias="sessionToken"),
):
    messages = chat_service.list_messages(db, conversation_id, actor=user, session_token=session_token)
    return ok(data=[MessageOut.from_model(message) for message in messages])


@router.post("/conversations/{conversation_id}/messages", summary="Enviar un mensaje y recibir la respuesta")
@limiter.limit(CHAT_MESSAGE_LIMIT, error_message=CHAT_MESSAGE_MESSAGE)
def send_message(
    conversation_id: int,
    dto: CreateMessageRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    result = chat_service.send_message(
        db, conversation_id, dto.content, actor=user, session_token=dto.session_token
    )
    return created(
        data={
            "userMessage": MessageOut.from_model(result["userMessage"]),
            "assistantMessage": MessageOut.from_model(result["assistantMessage"]),
        },
        message="Mensaje enviado.",
    )
