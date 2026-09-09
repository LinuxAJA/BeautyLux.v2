"""Caché de permisos en memoria — equivalente de
backend/src/services/permission.service.js.

Se carga una vez al arrancar (`warm_cache`, invocado desde el lifespan de
main.py) y no se refresca tras cambios en `role_permissions`, igual que en
Node."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.logger import logger
from app.models.role import Role
from app.repositories.permission import permission_repository
from app.repositories.role import role_repository


class PermissionService:
    def __init__(self) -> None:
        self._cache: dict[str, set[str]] = {}
        self._roles: list[Role] = []

    def warm_cache(self, db: Session) -> None:
        self._cache = permission_repository.find_all_grouped_by_role(db)
        self._roles = role_repository.find_all(db)
        total = sum(len(codes) for codes in self._cache.values())
        logger.info("Caché de permisos cargada", {"roles": list(self._cache.keys()), "totalPermisos": total})

    def has_permission(self, role_name: str, permission_code: str) -> bool:
        return permission_code in self._cache.get(role_name, set())

    def permissions_for(self, role_name: str) -> list[str]:
        return sorted(self._cache.get(role_name, set()))

    def list_permissions(self, db: Session):
        return permission_repository.find_all(db)

    def list_roles(self, db: Session) -> list[Role]:
        return self._roles or role_repository.find_all(db)


permission_service = PermissionService()
