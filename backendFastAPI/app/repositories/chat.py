"""Repositorios del chatbot — quinto avance, etapa 12."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self) -> None:
        super().__init__(Conversation)

    def find_by_session_token(self, db: Session, session_token: str) -> Conversation | None:
        return self.find_one_by(db, Conversation.session_token, session_token)


class MessageRepository(BaseRepository[Message]):
    def __init__(self) -> None:
        super().__init__(Message)

    def find_by_conversation(self, db: Session, conversation_id: int, *, limit: int = 50) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
            .limit(limit)
        )
        return list(db.execute(stmt).scalars().all())


conversation_repository = ConversationRepository()
message_repository = MessageRepository()
