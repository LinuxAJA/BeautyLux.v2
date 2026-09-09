"""Router de metadatos — equivalente de backend/src/routes/meta.routes.js
+ backend/src/controllers/meta.controller.js.

Diferencia con Node (corrección decidida en el plan): `GET /audit-logs` sí
valida su query aquí (Node no lo hacía)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.pagination import build_meta, parse_pagination
from app.core.responses import ok
from app.core.uptime import get_uptime_seconds
from app.db.session import get_db, health_check
from app.dependencies.roles import require_role
from app.models.user import User
from app.repositories.document_type import document_type_repository
from app.schemas.meta import AuditLogOut, DocumentTypeOut, PermissionOut
from app.schemas.user import RoleOut
from app.services.audit import audit_service
from app.services.permission import permission_service

router = APIRouter(prefix="", tags=["Metadatos"])


@router.get("/health", summary="Estado del servicio")
def health():
    try:
        is_healthy = health_check()
    except Exception:  # noqa: BLE001
        is_healthy = False
    message = "El servicio está disponible." if is_healthy else "El servicio no puede alcanzar la base de datos."
    return ok(
        data={"uptime": get_uptime_seconds(), "database": "up" if is_healthy else "down"}, message=message
    )


@router.get("/document-types", summary="Listar tipos de documento")
def document_types(db: Session = Depends(get_db)):
    rows = document_type_repository.find_all(db)
    return ok(data=[DocumentTypeOut.model_validate(r) for r in rows])


@router.get("/roles", summary="Listar roles")
def roles(db: Session = Depends(get_db), _user: User = Depends(require_role("admin"))):
    rows = permission_service.list_roles(db)
    return ok(data=[RoleOut.model_validate(r) for r in rows])


@router.get("/permissions", summary="Listar permisos")
def permissions(db: Session = Depends(get_db), _user: User = Depends(require_role("admin"))):
    rows = permission_service.list_permissions(db)
    return ok(data=[PermissionOut.model_validate(r) for r in rows])


@router.get("/audit-logs", summary="Consultar la bitácora de auditoría")
def audit_logs(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
    page: int | None = Query(None),
    per_page: int | None = Query(None, alias="perPage"),
    entity: str | None = Query(None),
    user_id: int | None = Query(None, alias="userId"),
):
    safe_page, safe_per_page, _offset = parse_pagination(page, per_page)
    rows, total = audit_service.list(db, user_id=user_id, entity=entity, page=safe_page, per_page=safe_per_page)
    data = [AuditLogOut.from_row(log, user_name) for log, user_name in rows]
    return ok(data=data, meta=build_meta(safe_page, safe_per_page, total))
