"""Router de categorías — equivalente de backend/src/routes/category.routes.js
+ backend/src/controllers/category.controller.js. Lectura pública, escritura solo admin."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.models.user import User
from app.schemas.category import CreateCategoryRequest, UpdateCategoryRequest
from app.services.category import category_service

router = APIRouter(prefix="/categories", tags=["Categorías"])


@router.get("", summary="Listar categorías (público)")
def list_categories(type: str | None = Query(None), db: Session = Depends(get_db)):
    result = category_service.list(db, type=type)
    return ok(data=result)


@router.post("", summary="Crear una categoría", status_code=201)
def create_category(
    dto: CreateCategoryRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    result = category_service.create(db, dto, actor_id=user.id, ip_address=client_ip(request))
    return created(data=result, message="Categoría creada correctamente.")


@router.put("/{category_id}", summary="Actualizar una categoría")
def update_category(
    category_id: int,
    dto: UpdateCategoryRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    result = category_service.update(db, category_id, dto, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=result, message="Categoría actualizada correctamente.")


@router.delete("/{category_id}", summary="Eliminar una categoría")
def delete_category(
    category_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    category_service.remove(db, category_id, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=None, message="Categoría eliminada correctamente.")
