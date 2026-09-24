"""Router de citas — quinto avance, etapa 5.

Quién puede qué:
  · `GET /api/appointments/availability` — público: los horarios libres se
    consultan antes de iniciar sesión, igual que el catálogo.
  · `POST /api/appointments/hold` y `POST /api/appointments` — autenticado.
  · `GET /api/appointments` — el personal ve la agenda completa; el cliente,
    solo sus citas (lo fuerza el service).
  · `PATCH .../reschedule` y `.../cancel` — el dueño de la cita o el personal.
  · `PATCH .../status` — solo admin y empleado.
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.models.user import User
from app.schemas.appointment import (
    CreateAppointmentRequest,
    HoldAppointmentRequest,
    RescheduleAppointmentRequest,
    UpdateAppointmentStatusRequest,
)
from app.services.appointment import appointment_service

router = APIRouter(prefix="/appointments", tags=["Citas"])


@router.get("/availability", summary="Consultar los horarios libres de un día (público)")
def get_availability(
    db: Session = Depends(get_db),
    day: date = Query(..., alias="date"),
    service_id: int = Query(..., alias="serviceId"),
):
    result = appointment_service.availability(db, day=day, service_id=service_id)
    return ok(data=result)


@router.get("", summary="Listar citas (agenda con filtros)")
def list_appointments(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    search: str | None = Query(None),
    client_id: int | None = Query(None, alias="clientId"),
    service_id: int | None = Query(None, alias="serviceId"),
    sale_id: int | None = Query(None, alias="saleId"),
    status: str | None = Query(None),
    date_from: date | None = Query(None, alias="dateFrom"),
    date_to: date | None = Query(None, alias="dateTo"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100, alias="perPage"),
    order_by: str | None = Query(None, alias="orderBy"),
    order_dir: str | None = Query(None, alias="orderDir"),
):
    result = appointment_service.list(
        db,
        actor=user,
        search=search,
        client_id=client_id,
        service_id=service_id,
        sale_id=sale_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    return ok(data=result["data"], meta=result["meta"])


@router.post("/hold", summary="Reservar un horario mientras se completa la compra", status_code=201)
def hold_appointment(
    dto: HoldAppointmentRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = appointment_service.hold(db, dto, actor=user, ip_address=client_ip(request))
    return created(data=result, message="Horario reservado. Confírmalo antes de que expire.")


@router.post("", summary="Agendar una cita", status_code=201)
def create_appointment(
    dto: CreateAppointmentRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = appointment_service.create(db, dto, actor=user, ip_address=client_ip(request))
    return created(data=result, message="Cita agendada correctamente.")


@router.get("/{appointment_id}", summary="Consultar una cita")
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = appointment_service.get_by_id(db, appointment_id, actor=user)
    return ok(data=result)


@router.patch("/{appointment_id}/reschedule", summary="Reprogramar una cita")
def reschedule_appointment(
    appointment_id: int,
    dto: RescheduleAppointmentRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = appointment_service.reschedule(
        db, appointment_id, dto, actor=user, ip_address=client_ip(request)
    )
    return ok(data=result, message="Cita reprogramada correctamente.")


@router.patch("/{appointment_id}/cancel", summary="Cancelar una cita")
def cancel_appointment(
    appointment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = appointment_service.cancel(db, appointment_id, actor=user, ip_address=client_ip(request))
    return ok(data=result, message="Cita cancelada correctamente.")


@router.patch("/{appointment_id}/status", summary="Cambiar el estado de una cita")
def update_appointment_status(
    appointment_id: int,
    dto: UpdateAppointmentStatusRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = appointment_service.update_status(
        db, appointment_id, dto.status, actor=user, ip_address=client_ip(request)
    )
    return ok(data=result, message="Estado de la cita actualizado correctamente.")
