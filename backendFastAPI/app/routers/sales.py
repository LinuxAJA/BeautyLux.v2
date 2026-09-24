"""Router de ventas — quinto avance, requisitos 1, 2, 3 y 14.

No hay equivalente en el backend Node: el módulo de ventas nace aquí.

Quién puede qué:
  · `POST /api/sales`              — cualquier usuario autenticado. Un cliente
    solo compra para sí mismo; el personal puede vender a nombre de un cliente
    (`clientId`) o a consumidor final por el canal `pos`.
  · `GET /api/sales`               — el personal ve todas; el cliente, solo las
    suyas (lo fuerza el service, no este router).
  · `GET /api/sales/{id}`          — lo mismo, por venta.
  · `PATCH /api/sales/{id}/status` — solo admin y empleado.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.models.user import User
from app.schemas.sale import CreateSaleRequest, UpdateSaleStatusRequest
from app.services.sale import sale_service

router = APIRouter(prefix="/sales", tags=["Ventas"])


@router.get("", summary="Listar ventas (historial con filtros)")
def list_sales(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    search: str | None = Query(None),
    client_id: int | None = Query(None, alias="clientId"),
    staff_id: int | None = Query(None, alias="staffId"),
    status: str | None = Query(None),
    channel: str | None = Query(None),
    date_from: date | None = Query(None, alias="dateFrom"),
    date_to: date | None = Query(None, alias="dateTo"),
    min_total: Decimal | None = Query(None, alias="minTotal"),
    max_total: Decimal | None = Query(None, alias="maxTotal"),
    product_id: int | None = Query(None, alias="productId"),
    service_id: int | None = Query(None, alias="serviceId"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100, alias="perPage"),
    order_by: str | None = Query(None, alias="orderBy"),
    order_dir: str | None = Query(None, alias="orderDir"),
):
    result = sale_service.list(
        db,
        actor=user,
        search=search,
        client_id=client_id,
        staff_id=staff_id,
        status=status,
        channel=channel,
        date_from=date_from,
        date_to=date_to,
        min_total=min_total,
        max_total=max_total,
        product_id=product_id,
        service_id=service_id,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    return ok(data=result["data"], meta=result["meta"])


@router.post("", summary="Registrar una venta", status_code=201)
def create_sale(
    dto: CreateSaleRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = sale_service.create(db, dto, actor=user, ip_address=client_ip(request))
    return created(data=result, message="Venta registrada correctamente.")


@router.get("/number/{sale_number}", summary="Consultar una venta por su número")
def get_sale_by_number(
    sale_number: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = sale_service.get_by_number(db, sale_number, actor=user)
    return ok(data=result)


@router.get("/{sale_id}", summary="Consultar una venta con su detalle")
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = sale_service.get_by_id(db, sale_id, actor=user)
    return ok(data=result)


@router.patch("/{sale_id}/status", summary="Cambiar el estado de una venta")
def update_sale_status(
    sale_id: int,
    dto: UpdateSaleStatusRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = sale_service.update_status(
        db, sale_id, dto.status, actor=user, ip_address=client_ip(request)
    )
    return ok(data=result, message="Estado de la venta actualizado correctamente.")
