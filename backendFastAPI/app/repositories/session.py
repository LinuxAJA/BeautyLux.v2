"""Repositorio de sesiones (refresh tokens) — equivalente de
backend/src/repositories/session.repository.js.

`Session` colisiona de nombre con `sqlalchemy.orm.Session`: aquí el modelo
ORM se importa como `SessionModel` y la sesión de BD se recibe siempre como
parámetro `db`."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, func, select, update

from app.models.session import Session as SessionModel
from sqlalchemy.orm import Session as DbSession


class SessionRepository:
    def create(
        self,
        db: DbSession,
        *,
        user_id: int,
        refresh_token_hash: str,
        user_agent: str | None,
        ip_address: str | None,
        expires_at: datetime,
        remember: bool,
    ) -> SessionModel:
        instance = SessionModel(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
            remember=remember,
        )
        db.add(instance)
        db.flush()
        return instance

    def find_by_token_hash(self, db: DbSession, refresh_token_hash: str) -> SessionModel | None:
        stmt = select(SessionModel).where(SessionModel.refresh_token_hash == refresh_token_hash).limit(1)
        return db.execute(stmt).scalars().first()

    def revoke(self, db: DbSession, session_id: int) -> bool:
        stmt = (
            update(SessionModel)
            .where(SessionModel.id == session_id, SessionModel.revoked_at.is_(None))
            .values(revoked_at=datetime.utcnow())
        )
        result = db.execute(stmt)
        return result.rowcount > 0

    def revoke_by_token_hash(self, db: DbSession, refresh_token_hash: str) -> bool:
        stmt = (
            update(SessionModel)
            .where(SessionModel.refresh_token_hash == refresh_token_hash, SessionModel.revoked_at.is_(None))
            .values(revoked_at=datetime.utcnow())
        )
        result = db.execute(stmt)
        return result.rowcount > 0

    def revoke_all_by_user(self, db: DbSession, user_id: int) -> None:
        stmt = (
            update(SessionModel)
            .where(SessionModel.user_id == user_id, SessionModel.revoked_at.is_(None))
            .values(revoked_at=datetime.utcnow())
        )
        db.execute(stmt)

    def purge_expired(self, db: DbSession) -> int:
        stmt = delete(SessionModel).where(
            (SessionModel.expires_at < func.now()) | (SessionModel.revoked_at.is_not(None))
        )
        result = db.execute(stmt)
        return result.rowcount


session_repository = SessionRepository()
