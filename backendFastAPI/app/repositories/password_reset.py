"""Repositorio de recuperación de contraseña — equivalente de
backend/src/repositories/passwordReset.repository.js."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.password_reset import PasswordReset


class PasswordResetRepository:
    def create(self, db: Session, *, user_id: int, token_hash: str, expires_at: datetime) -> PasswordReset:
        instance = PasswordReset(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        db.add(instance)
        db.flush()
        return instance

    def find_valid_by_token_hash(self, db: Session, token_hash: str) -> PasswordReset | None:
        stmt = (
            select(PasswordReset)
            .where(
                PasswordReset.token_hash == token_hash,
                PasswordReset.used_at.is_(None),
                PasswordReset.expires_at > func.now(),
            )
            .limit(1)
        )
        return db.execute(stmt).scalars().first()

    def mark_used(self, db: Session, reset_id: int) -> bool:
        stmt = update(PasswordReset).where(PasswordReset.id == reset_id).values(used_at=datetime.utcnow())
        result = db.execute(stmt)
        return result.rowcount > 0

    def invalidate_previous(self, db: Session, user_id: int) -> None:
        stmt = (
            update(PasswordReset)
            .where(PasswordReset.user_id == user_id, PasswordReset.used_at.is_(None))
            .values(used_at=datetime.utcnow())
        )
        db.execute(stmt)


password_reset_repository = PasswordResetRepository()
