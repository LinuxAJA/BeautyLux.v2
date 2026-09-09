"""Servicio de tokens — equivalente de backend/src/services/token.service.js.

Emite y consume los refresh tokens opacos, con rotación en cada uso y
detección de reuso: si un token ya revocado vuelve a presentarse, se revocan
TODAS las sesiones del usuario (contención de robo de token)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.cookies import generate_raw_token, hash_token
from app.core.errors import UnauthorizedError
from app.core.jwt import sign_access_token, verify_access_token
from app.models.session import Session as SessionModel
from app.models.user import User
from app.repositories.session import session_repository
from app.services.audit import audit_service


class TokenService:
    def sign_access_token(self, user: User) -> str:
        return sign_access_token(user.id, user.role.name, user.status)

    def verify_access_token(self, token: str) -> dict:
        return verify_access_token(token)

    def issue_refresh_token(
        self,
        db: Session,
        user_id: int,
        *,
        remember: bool = False,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> dict:
        raw_token = generate_raw_token()
        ttl_days = settings.REFRESH_TTL_REMEMBER_DAYS if remember else settings.REFRESH_TTL_DAYS
        expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)

        session_repository.create(
            db,
            user_id=user_id,
            refresh_token_hash=hash_token(raw_token),
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at.replace(tzinfo=None),
            remember=remember,
        )

        max_age_ms = ttl_days * 86400 * 1000 if remember else None
        return {"raw_token": raw_token, "expires_at": expires_at, "max_age_ms": max_age_ms}

    def consume_refresh_token(
        self, db: Session, raw_token: str | None, *, ip_address: str | None = None
    ) -> SessionModel:
        if not raw_token:
            raise UnauthorizedError("No hay sesión activa.")

        token_hash = hash_token(raw_token)
        session = session_repository.find_by_token_hash(db, token_hash)

        if not session:
            raise UnauthorizedError("La sesión no es válida. Inicia sesión nuevamente.")

        if session.revoked_at is not None:
            session_repository.revoke_all_by_user(db, session.user_id)
            audit_service.record(
                db,
                user_id=session.user_id,
                action="refresh_token_reuse_detected",
                entity="sessions",
                entity_id=session.id,
                ip_address=ip_address,
            )
            raise UnauthorizedError("Se detectó actividad sospechosa. Inicia sesión nuevamente.")

        if session.expires_at < datetime.utcnow():
            raise UnauthorizedError("La sesión expiró. Inicia sesión nuevamente.")

        session_repository.revoke(db, session.id)
        return session

    def revoke_by_raw_token(self, db: Session, raw_token: str | None) -> None:
        if not raw_token:
            return
        session_repository.revoke_by_token_hash(db, hash_token(raw_token))

    def revoke_all_for_user(self, db: Session, user_id: int) -> None:
        session_repository.revoke_all_by_user(db, user_id)


token_service = TokenService()
