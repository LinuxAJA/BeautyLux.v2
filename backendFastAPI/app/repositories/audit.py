"""Repositorio de auditoría — equivalente de backend/src/repositories/audit.repository.js."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


class AuditRepository:
    def record(
        self,
        db: Session,
        *,
        user_id: int | None,
        action: str,
        entity: str,
        entity_id: int | None,
        changes: dict[str, Any] | None,
        ip_address: str | None,
    ) -> AuditLog:
        instance = AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            changes=changes,
            ip_address=ip_address,
        )
        db.add(instance)
        db.flush()
        return instance

    def find_all(
        self,
        db: Session,
        *,
        user_id: int | None = None,
        entity: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[tuple[AuditLog, str | None]], int]:
        """Devuelve [(audit_log, user_name)] igual que el JOIN a users de Node."""
        clauses = []
        if user_id:
            clauses.append(AuditLog.user_id == user_id)
        if entity:
            clauses.append(AuditLog.entity == entity)

        count_stmt = select(func.count()).select_from(AuditLog)
        base_stmt = select(
            AuditLog, func.concat(User.first_name, " ", User.last_name)
        ).outerjoin(User, User.id == AuditLog.user_id)

        for clause in clauses:
            count_stmt = count_stmt.where(clause)
            base_stmt = base_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.order_by(AuditLog.created_at.desc()).limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).all())
        return rows, total


audit_repository = AuditRepository()
