"""Router de estadísticas — quinto avance, requisitos 10, 11, 12, 13 y 15.

No hay equivalente en el backend Node: los dashboards analíticos nacen aquí.

Quién puede qué: `overview` y `top-items` son del admin (el mismo alcance que
el reporte diario y la bitácora); `sales-series` la comparten admin y
empleado, porque `EmployeeOverview` también dibuja su propia gráfica lineal;
`my-summary` es exclusivo de `client` — cada rol ve solo lo suyo (requisito
12), reforzado aquí por `require_role`, no solo por el frontend.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.errors import BadRequestError
from app.core.responses import ok
from app.db.session import get_db
from app.dependencies.roles import require_role
from app.models.user import User
from app.services.stats import stats_service

router = APIRouter(prefix="/stats", tags=["Estadísticas"])


@router.get("/overview", summary="Totales del negocio (admin)")
def get_overview(db: Session = Depends(get_db), _user: User = Depends(require_role("admin"))):
    return ok(data=stats_service.overview(db))


@router.get("/employee-summary", summary="Resumen operativo del día (empleado)")
def get_employee_summary(
    db: Session = Depends(get_db), _user: User = Depends(require_role("admin", "employee"))
):
    return ok(data=stats_service.employee_summary(db))


@router.get("/my-summary", summary="Mi resumen (cliente)")
def get_my_summary(db: Session = Depends(get_db), user: User = Depends(require_role("client"))):
    return ok(data=stats_service.my_summary(db, actor=user))


@router.get("/sales-series", summary="Serie temporal de ventas para la gráfica lineal")
def get_sales_series(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "employee")),
    group_by: Literal["day", "week", "month"] = Query("day", alias="groupBy"),
    date_from: date | None = Query(None, alias="dateFrom"),
    date_to: date | None = Query(None, alias="dateTo"),
    status: str | None = Query(None),
    client_id: int | None = Query(None, alias="clientId"),
    product_id: int | None = Query(None, alias="productId"),
    service_id: int | None = Query(None, alias="serviceId"),
    channel: str | None = Query(None),
):
    if date_from is not None and date_to is not None and date_from > date_to:
        raise BadRequestError("La fecha inicial no puede ser posterior a la fecha final.")

    result = stats_service.sales_series(
        db,
        group_by=group_by,
        date_from=date_from,
        date_to=date_to,
        status=status,
        client_id=client_id,
        product_id=product_id,
        service_id=service_id,
        channel=channel,
    )
    return ok(data=result)


@router.get("/top-items", summary="Ranking de productos o servicios más vendidos")
def get_top_items(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
    type: Literal["product", "service"] = Query(...),
    limit: int = Query(5, ge=1, le=20),
    date_from: date | None = Query(None, alias="dateFrom"),
    date_to: date | None = Query(None, alias="dateTo"),
    status: str | None = Query(None),
    client_id: int | None = Query(None, alias="clientId"),
):
    if date_from is not None and date_to is not None and date_from > date_to:
        raise BadRequestError("La fecha inicial no puede ser posterior a la fecha final.")

    result = stats_service.top_items(
        db,
        item_type=type,
        limit=limit,
        date_from=date_from,
        date_to=date_to,
        status=status,
        client_id=client_id,
    )
    return ok(data=result)
