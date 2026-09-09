"""Router de usuarios — equivalente de backend/src/routes/user.routes.js
+ backend/src/controllers/user.controller.js.

Todas las rutas exigen admin o empleado; create/status/delete exigen admin."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.models.user import User
from app.schemas.user import CreateUserRequest, UpdateUserRequest, UpdateUserStatusRequest
from app.services.user import user_service

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("", summary="Listar usuarios")
def list_users(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
    search: str | None = Query(None),
    role: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100, alias="perPage"),
    order_by: str | None = Query(None, alias="orderBy"),
    order_dir: str | None = Query(None, alias="orderDir"),
):
    result = user_service.list(
        db,
        actor_role=user.role.name,
        search=search,
        role=role,
        status=status,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    return ok(data=result["data"], meta=result["meta"])


@router.get("/{user_id}", summary="Consultar un usuario")
def get_user(
    user_id: int, db: Session = Depends(get_db), user: User = Depends(require_role("admin", "employee"))
):
    result = user_service.get_by_id(db, user_id, actor_role=user.role.name)
    return ok(data=result)


@router.post("", summary="Crear un usuario", status_code=201)
def create_user(
    request: Request,
    dto: CreateUserRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    result = user_service.create(db, dto, actor_id=user.id, ip_address=client_ip(request))
    return created(data=result, message="Usuario creado correctamente.")


@router.put("/{user_id}", summary="Actualizar un usuario")
def update_user(
    user_id: int,
    dto: UpdateUserRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = user_service.update(
        db, user_id, dto, actor_id=user.id, actor_role=user.role.name, ip_address=client_ip(request)
    )
    return ok(data=result, message="Usuario actualizado correctamente.")


@router.patch("/{user_id}/status", summary="Cambiar el estado de un usuario")
def update_user_status(
    user_id: int,
    dto: UpdateUserStatusRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    result = user_service.update_status(db, user_id, dto.status, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=result, message="Estado actualizado correctamente.")


@router.delete("/{user_id}", summary="Eliminar un usuario")
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    user_service.remove(db, user_id, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=None, message="Usuario eliminado correctamente.")
