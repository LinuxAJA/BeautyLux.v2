"""Repositorio del registro de correos — tabla `email_logs` (migración a Brevo).

Sin equivalente en Node. Solo lectura con filtros para la página "Correos"
del panel y la carpeta `14. Correo` de Postman; la escritura la hace el hilo
de envío de `app/core/mail_outbox.py` con `create()` de la base.
"""

from __future__ import annotations

from datetime import date, datetime, time

from sqlalchemy.orm import Session

from app.core.mailer import DeliveryResult, OutgoingEmail
from app.models.email_log import EmailLog
from app.repositories.base import BaseRepository

SORTABLE = {
    "id": EmailLog.id,
    "kind": EmailLog.kind,
    "recipient": EmailLog.recipient,
    "status": EmailLog.status,
    "createdAt": EmailLog.created_at,
    "created_at": EmailLog.created_at,
    "sentAt": EmailLog.sent_at,
    "sent_at": EmailLog.sent_at,
}


class EmailLogRepository(BaseRepository[EmailLog]):
    def __init__(self) -> None:
        # Sin soft delete: es un registro de lo que pasó, no se oculta.
        super().__init__(EmailLog, soft_delete=False, sortable_columns=SORTABLE)

    def record(self, db: Session, email: OutgoingEmail, result: DeliveryResult) -> EmailLog:
        return self.create(
            db,
            {
                "kind": email.kind,
                "recipient": email.to[:60],
                "subject": email.subject,
                "status": result.status,
                "attempts": result.attempts,
                "error_message": result.error,
                "entity": email.entity,
                "entity_id": email.entity_id,
                "user_id": email.user_id,
                "sent_at": datetime.now() if result.status == "sent" else None,
            },
        )

    def find_all_with_filters(
        self,
        db: Session,
        *,
        search: str | None = None,
        status: str | None = None,
        kind: str | None = None,
        entity: str | None = None,
        entity_id: int | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = "created_at",
        order_dir: str = "DESC",
    ) -> tuple[list[EmailLog], int]:
        extra_clauses = []
        if date_from:
            extra_clauses.append(EmailLog.created_at >= datetime.combine(date_from, time.min))
        if date_to:
            extra_clauses.append(EmailLog.created_at <= datetime.combine(date_to, time.max))

        return self.find_all(
            db,
            search_columns=[EmailLog.recipient, EmailLog.subject],
            search=search,
            filters={
                EmailLog.status: status,
                EmailLog.kind: kind,
                EmailLog.entity: entity,
                EmailLog.entity_id: entity_id,
            },
            page=page,
            per_page=per_page,
            order_by=order_by or "created_at",
            order_dir=order_dir,
            extra_clauses=extra_clauses,
        )


email_log_repository = EmailLogRepository()
