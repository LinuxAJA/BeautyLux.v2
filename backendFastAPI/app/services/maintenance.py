"""Mantenimiento periódico — equivalente de backend/src/services/maintenance.service.js.

Purga sesiones y tokens de recuperación vencidos, y las reservas de cita que
nadie llegó a confirmar. Se ejecuta una vez al arrancar y luego cada 24 horas
desde una tarea `asyncio` programada en el `lifespan` de main.py.

Que un `hold` vencido siga en la tabla no bloquea la agenda —la consulta de
disponibilidad ya los descarta por fecha—, pero dejarlos acumulándose ensucia
el histórico, así que se borran aquí."""

from __future__ import annotations

from sqlalchemy import delete, func, or_

from datetime import datetime

from app.core.logger import logger
from app.db.session import SessionLocal
from app.models.password_reset import PasswordReset
from app.repositories.appointment import appointment_repository
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
        removed_holds = appointment_repository.purge_expired_holds(db, now=datetime.now())
        db.commit()
        logger.info(
            "Limpieza de tokens expirados completada",
            {
                "sessionsRemoved": removed_sessions,
                "passwordResetsRemoved": result.rowcount,
                "appointmentHoldsRemoved": removed_holds,
            },
        )
    except Exception as error:  # noqa: BLE001
        db.rollback()
        logger.error("Falló la limpieza de tokens expirados", {"error": str(error)})
    finally:
        db.close()
