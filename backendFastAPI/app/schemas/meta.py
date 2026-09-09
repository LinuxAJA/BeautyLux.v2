"""Schemas de metadatos — equivalente de backend/src/models/{permission,documentType,auditLog}.model.js."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.schemas.common import CamelModel, InputModel


class PermissionOut(CamelModel):
    id: int
    code: str
    module: str
    action: str
    description: str | None = None


class DocumentTypeOut(CamelModel):
    code: str
    label: str
    min_length: int
    max_length: int
    pattern_kind: str


class AuditLogOut(CamelModel):
    id: int
    user_id: int | None = None
    user_name: str | None = None
    action: str
    entity: str
    entity_id: int | None = None
    changes: dict[str, Any] | None = None
    ip_address: str | None = None
    created_at: datetime

    @classmethod
    def from_row(cls, audit_log, user_name: str | None) -> "AuditLogOut":
        return cls.model_validate(
            {
                "id": audit_log.id,
                "userId": audit_log.user_id,
                "userName": user_name,
                "action": audit_log.action,
                "entity": audit_log.entity,
                "entityId": audit_log.entity_id,
                "changes": audit_log.changes,
                "ipAddress": audit_log.ip_address,
                "createdAt": audit_log.created_at,
            }
        )


class HealthOut(CamelModel):
    uptime: float
    database: str


class ListAuditLogsQuery(InputModel):
    page: int | None = None
    per_page: int | None = None
    entity: str | None = None
    user_id: int | None = None
