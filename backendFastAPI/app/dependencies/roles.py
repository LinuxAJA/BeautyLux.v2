"""Autorización por rol/permiso — equivalente de
backend/src/middlewares/authorize.middleware.js."""

from __future__ import annotations

from fastapi import Depends

from app.core.errors import ForbiddenError
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.permission import permission_service


def require_role(*allowed_roles: str):
    """Control grueso por rol, uso: `Depends(require_role('admin', 'employee'))`."""

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role.name not in allowed_roles:
            raise ForbiddenError("No tienes permisos para realizar esta acción.")
        return user

    return dependency


def require_permission(permission_code: str):
    """Control fino contra la caché de permisos por rol."""

    def dependency(user: User = Depends(get_current_user)) -> User:
        if not permission_service.has_permission(user.role.name, permission_code):
            raise ForbiddenError("No tienes permisos para realizar esta acción.")
        return user

    return dependency
