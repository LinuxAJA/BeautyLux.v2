"""Router de productos — equivalente de backend/src/routes/product.routes.js
+ backend/src/controllers/product.controller.js.

Mejora sobre Node (decidida en el plan): `list`/`get_one` usan
`get_current_user_optional`, así que un admin/empleado autenticado ve también
los productos inactivos y el filtro `status` funciona; el público anónimo
sigue viendo solo los activos."""

from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.auth import get_current_user_optional
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.models.user import User
from app.schemas.product import CreateProductRequest, UpdateProductRequest, UpdateProductStatusRequest
from app.services.product import product_service

router = APIRouter(prefix="/products", tags=["Productos"])


@router.get("", summary="Listar productos (público)")
def list_products(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    search: str | None = Query(None),
    category: str | None = Query(None),
    status: str | None = Query(None),
    min_price: Decimal | None = Query(None, alias="minPrice"),
    max_price: Decimal | None = Query(None, alias="maxPrice"),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100, alias="perPage"),
    order_by: str | None = Query(None, alias="orderBy"),
    order_dir: str | None = Query(None, alias="orderDir"),
):
    is_public = current_user is None or current_user.role.name not in ("admin", "employee")
    result = product_service.list(
        db,
        is_public=is_public,
        search=search,
        category=category,
        status=status,
        min_price=min_price,
        max_price=max_price,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    return ok(data=result["data"], meta=result["meta"])


@router.get("/{id_or_slug}", summary="Consultar un producto por id o slug (público)")
def get_product(
    id_or_slug: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    is_public = current_user is None or current_user.role.name not in ("admin", "employee")
    result = product_service.get_by_id_or_slug(db, id_or_slug, is_public=is_public)
    return ok(data=result)


@router.post("", summary="Crear un producto", status_code=201)
def create_product(
    dto: CreateProductRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = product_service.create(db, dto, actor_id=user.id, ip_address=client_ip(request))
    return created(data=result, message="Producto creado correctamente.")


@router.put("/{product_id}", summary="Actualizar un producto")
def update_product(
    product_id: int,
    dto: UpdateProductRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = product_service.update(db, product_id, dto, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=result, message="Producto actualizado correctamente.")


@router.patch("/{product_id}/status", summary="Cambiar el estado de un producto")
def update_product_status(
    product_id: int,
    dto: UpdateProductStatusRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = product_service.update_status(db, product_id, dto.status, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=result, message="Estado actualizado correctamente.")


@router.delete("/{product_id}", summary="Eliminar un producto")
def delete_product(
    product_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    product_service.remove(db, product_id, actor_id=user.id, ip_address=client_ip(request))
    return ok(data=None, message="Producto eliminado correctamente.")
