"""Servicio de auditoría — equivalente de backend/src/services/audit.service.js.

`record()` hace dos cosas que Node consigue gratis por no usar transacciones
y que aquí hay que replicar a propósito:

1. Nunca debe romper el flujo principal: el INSERT corre en un SAVEPOINT
   propio (`db.begin_nested()`); si falla, ese savepoint se descarta y la
   transacción de la petición sigue intacta para que el resto del `service`
   pueda continuar.
2. Debe persistir aunque la petición termine en error. `record()` se llama
   siempre justo antes de un posible `raise` (login fallido, reuso de
   refresh token, etc.); si no se hiciera commit aquí, el rollback que
   `get_db()` dispara al propagarse esa excepción se llevaría por delante
   también la auditoría — y, más grave, efectos de seguridad como revocar
   todas las sesiones de un usuario. Por eso `record()` hace `db.commit()`
   tras un INSERT exitoso: confirma el registro de auditoría y cualquier
   escritura previa de la misma petición (p. ej. la revocación de sesiones
   que siempre se ejecuta justo antes)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.core.logger import logger
from app.repositories.audit import audit_repository


class AuditService:
    def record(
        self,
        db: Session,
        *,
        user_id: int | None = None,
        action: str,
        entity: str,
        entity_id: int | None = None,
        changes: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> None:
        try:
            with db.begin_nested():
                audit_repository.record(
                    db,
                    user_id=user_id,
                    action=action,
                    entity=entity,
                    entity_id=entity_id,
                    changes=changes,
                    ip_address=ip_address,
                )
            db.commit()
        except Exception as error:  # noqa: BLE001
            # `begin_nested()` ya deshizo su propio savepoint antes de relanzar
            # la excepción; NO se hace rollback aquí para no perder las
            # escrituras previas de la petición que sí salieron bien.
            logger.error("No se pudo registrar la auditoría", {"action": action, "entity": entity, "error": str(error)})

    def list(
        self,
        db: Session,
        *,
        user_id: int | None = None,
        entity: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ):
        return audit_repository.find_all(db, user_id=user_id, entity=entity, page=page, per_page=per_page)


audit_service = AuditService()
