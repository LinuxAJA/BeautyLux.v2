"""
Autenticación por dependencia — equivalente de backend/src/middlewares/auth.middleware.js.

`get_current_user` exige un Bearer token válido. `get_current_user_optional`
es la mejora decidida en el plan sobre Node: los GET públicos de productos y
servicios la usan para que un admin/empleado autenticado vea también los
registros inactivos, sin dejar de funcionar para el público anónimo.
"""

from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import UnauthorizedError
from app.core.jwt import verify_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user import user_repository


def _extract_bearer_token(request: Request) -> str | None:
    header = request.headers.get("authorization", "")
    parts = header.split(" ")
    if len(parts) != 2 or parts[0] != "Bearer" or not parts[1]:
        return None
    return parts[1]


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = _extract_bearer_token(request)
    if not token:
        raise UnauthorizedError("Debes iniciar sesión para continuar.")

    payload = verify_access_token(token)
    user = user_repository.find_by_id_with_role(db, int(payload["sub"]))

    if not user:
        raise UnauthorizedError("El usuario ya no existe.")
    if user.status == "inactive":
        raise UnauthorizedError("Tu cuenta está inactiva.", "ACCOUNT_INACTIVE")

    return user


def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = _extract_bearer_token(request)
    if not token:
        return None
    try:
        payload = verify_access_token(token)
    except UnauthorizedError:
        return None

    user = user_repository.find_by_id_with_role(db, int(payload["sub"]))
    if not user or user.status == "inactive":
        return None
    return user
