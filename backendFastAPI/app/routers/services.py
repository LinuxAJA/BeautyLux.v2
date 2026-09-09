"""Router de servicios — equivalente de backend/src/routes/service.routes.js
+ backend/src/controllers/service.controller.js. Estructura idéntica a products."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.auth import get_current_user_optional
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.models.user import User
from app.schemas.service import CreateServiceRequest, UpdateServiceRequest, UpdateServiceStatusRequest
from app.services.service_catalog import service_catalog_service

router = APIRouter(prefix="/services", tags=["Servicios"])


@router.get("", summary="Listar servicios (público)")
def list_services(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    search: str | None = Query(None),
    category: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100, alias="perPage"),
    order_by: str | None = Query(None, alias="orderBy"),
    order_dir: str | None = Query(None, alias="orderDir"),
):
    is_public = current_user is None or current_user.role.name not in ("admin", "employee")
    result = service_catalog_service.list(
        db,
        is_public=is_public,
        search=search,
        category=category,
        status=status,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    return ok(data=result["data"], meta=result["meta"])


@router.get("/{id_or_slug}", summary="Consultar un servicio por id o slug (público)")
def get_service(
    id_or_slug: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    is_public = current_user is None or current_user.role.name not in ("admin", "employee")
    result = service_catalog_service.get_by_id_or_slug(db, id_or_slug, is_public=is_public)
    return ok(data=result)


@router.post("", summary="Crear un servicio", status_code=201)
def create_service(
    dto: CreateServiceRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = service_catalog_service.create(db, dto, actor_id=user.id, ip_address=client_ip(request))
    return created(data=result, message="Servicio creado correctamente.")


@router.put("/{service_id}", summary="Actualizar un servicio")
def update_service(
    service_id: int,
    dto: UpdateServiceRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = service_catalog_service.update(db, service_id, dto, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=result, message="Servicio actualizado correctamente.")


@router.patch("/{service_id}/status", summary="Cambiar el estado de un servicio")
def update_service_status(
    service_id: int,
    dto: UpdateServiceStatusRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = service_catalog_service.update_status(
        db, service_id, dto.status, actor_id=user.id, ip_address=client_ip(request)
    )
    return ok(data=result, message="Estado actualizado correctamente.")


@router.delete("/{service_id}", summary="Eliminar un servicio")
def delete_service(
    service_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    service_catalog_service.remove(db, service_id, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=None, message="Servicio eliminado correctamente.")
