"""Repositorio de permisos — equivalente de backend/src/repositories/permission.repository.js."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.permission import Permission, role_permissions
from app.models.role import Role


class PermissionRepository:
    def find_all(self, db: Session) -> list[Permission]:
        stmt = select(Permission).order_by(Permission.module.asc(), Permission.action.asc())
        return list(db.execute(stmt).scalars().all())

    def find_all_grouped_by_role(self, db: Session) -> dict[str, set[str]]:
        """Devuelve { 'admin': {'users.create', ...}, 'employee': {...}, 'client': {...} }."""
        stmt = (
            select(Role.name, Permission.code)
            .select_from(role_permissions)
            .join(Role, Role.id == role_permissions.c.role_id)
            .join(Permission, Permission.id == role_permissions.c.permission_id)
        )
        grouped: dict[str, set[str]] = {}
        for role_name, permission_code in db.execute(stmt).all():
            grouped.setdefault(role_name, set()).add(permission_code)
        return grouped


permission_repository = PermissionRepository()
