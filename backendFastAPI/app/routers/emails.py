"""Router de correo — registro de envíos y correo de prueba (migración a Brevo).

No hay equivalente en el backend Node, que no envía correos. Solo el admin:
  · `GET /api/emails/logs`  — historial de `email_logs` con filtros y paginación.
  · `POST /api/emails/test` — envía un correo de prueba en la misma petición
    y devuelve lo que respondió Brevo. Sirve para comprobar la configuración
    en Render sin disparar una recuperación de contraseña.

Nota: a diferencia de los demás módulos, este archivo NO usa
`from __future__ import annotations` — el mismo motivo que en auth.py:
`@limiter.limit(...)` rompe la resolución de anotaciones diferidas (PEP 563).
"""

from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.responses import ok
from app.db.session import get_db
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.middleware.rate_limit import EMAIL_TEST_LIMIT, EMAIL_TEST_MESSAGE, limiter
from app.models.user import User
from app.schemas.email_log import SendTestEmailRequest
from app.services.email import email_service

router = APIRouter(prefix="/emails", tags=["Correo"])

_TEST_MESSAGES = {
    "sent": "Correo de prueba enviado. Revisa la bandeja de entrada.",
    "skipped": "MAIL_ENABLED=false: el correo se escribió en el log del servidor y no se envió.",
    "failed": "El proveedor de correo rechazó el envío. Revisa el error y la configuración SMTP.",
}


@router.get("/logs", summary="Listar el registro de correos enviados")
def list_email_logs(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
    search: str | None = Query(None),
    status: str | None = Query(None),
    kind: str | None = Query(None),
    entity: str | None = Query(None),
    entity_id: int | None = Query(None, alias="entityId"),
    date_from: date | None = Query(None, alias="dateFrom"),
    date_to: date | None = Query(None, alias="dateTo"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100, alias="perPage"),
    order_by: str | None = Query(None, alias="orderBy"),
    order_dir: str | None = Query(None, alias="orderDir"),
):
    result = email_service.list(
        db,
        search=search,
        status=status,
        kind=kind,
        entity=entity,
        entity_id=entity_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    return ok(data=result["data"], meta=result["meta"])


@router.post("/test", summary="Enviar un correo de prueba")
@limiter.limit(EMAIL_TEST_LIMIT, error_message=EMAIL_TEST_MESSAGE)
def send_test_email(
    request: Request,
    dto: SendTestEmailRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    result = email_service.send_test(db, to=dto.to, actor=user, ip_address=client_ip(request))
    return ok(data=result, message=_TEST_MESSAGES[result.status])
