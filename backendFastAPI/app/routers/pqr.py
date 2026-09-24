"""Router de PQR — quinto avance, requisito 16.

No hay equivalente en el backend Node: el módulo de PQR nace aquí.

Quién puede qué:
  · `POST /api/pqr`                 — público y autenticado, sin diferencia
    de comportamiento salvo que, con sesión, queda ligada a la cuenta.
  · `GET /api/pqr/{ticketNumber}`   — público, exige `email` como query
    param para verificar identidad (no hay sesión de por medio).
  · `GET /api/pqr`                  — autenticado; el personal ve todas, el
    cliente solo las suyas (lo fuerza el service).
  · `PATCH .../status` y `POST .../response` — solo admin y empleado.
"""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.auth import get_current_user, get_current_user_optional
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.models.user import User
from app.schemas.pqr import CreatePqrRequest, RespondPqrRequest, UpdatePqrStatusRequest
from app.services.pqr import pqr_service

router = APIRouter(prefix="/pqr", tags=["PQR"])


@router.post("", summary="Radicar una PQR (público o autenticado)", status_code=201)
def create_pqr(
    dto: CreatePqrRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    result = pqr_service.submit(
        db, dto, actor=user, ip_address=client_ip(request), background_tasks=background_tasks
    )
    return created(data=result, message="Tu PQR quedó radicada. Guarda el número de seguimiento.")


@router.get("", summary="Listar PQR")
def list_pqr(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    search: str | None = Query(None),
    type: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100, alias="perPage"),
    order_by: str | None = Query(None, alias="orderBy"),
    order_dir: str | None = Query(None, alias="orderDir"),
):
    result = pqr_service.list(
        db,
        actor=user,
        search=search,
        type_=type,
        status=status,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    return ok(data=result["data"], meta=result["meta"])


@router.get("/{ticket_number}", summary="Consultar el estado de una PQR por número y correo (público)")
def get_pqr_by_ticket(
    ticket_number: str,
    db: Session = Depends(get_db),
    email: str = Query(...),
):
    result = pqr_service.get_by_ticket_public(db, ticket_number, email)
    return ok(data=result)


@router.patch("/{pqr_id}/status", summary="Cambiar el estado de una PQR")
def update_pqr_status(
    pqr_id: int,
    dto: UpdatePqrStatusRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = pqr_service.update_status(db, pqr_id, dto.status, actor=user, ip_address=client_ip(request))
    return ok(data=result, message="Estado de la PQR actualizado correctamente.")


@router.post("/{pqr_id}/response", summary="Responder una PQR")
def respond_pqr(
    pqr_id: int,
    dto: RespondPqrRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = pqr_service.respond(
        db, pqr_id, dto.response, actor=user, ip_address=client_ip(request), background_tasks=background_tasks
    )
    return ok(data=result, message="Respuesta enviada correctamente.")
