"""Mantenimiento periódico — equivalente de backend/src/services/maintenance.service.js.

Purga sesiones y tokens de recuperación vencidos. Se ejecuta una vez al
arrancar y luego cada 24 horas desde una tarea `asyncio` programada en el
`lifespan` de main.py."""

from __future__ import annotations

from sqlalchemy import delete, func, or_

from app.core.logger import logger
from app.db.session import SessionLocal
from app.models.password_reset import PasswordReset
from app.repositories.session import session_repository


def purge_expired_tokens() -> None:
    db = SessionLocal()
    try:
        removed_sessions = session_repository.purge_expired(db)
        result = db.execute(
            delete(PasswordReset).where(
                or_(PasswordReset.expires_at < func.now(), PasswordReset.used_at.is_not(None))
            )
        )
        db.commit()
        logger.info(
            "Limpieza de tokens expirados completada",
            {"sessionsRemoved": removed_sessions, "passwordResetsRemoved": result.rowcount},
        )
    except Exception as error:  # noqa: BLE001
        db.rollback()
        logger.error("Falló la limpieza de tokens expirados", {"error": str(error)})
    finally:
        db.close()
