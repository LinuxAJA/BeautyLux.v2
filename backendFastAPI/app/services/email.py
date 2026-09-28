"""Servicio de correo — punto de entrada para que los demás services envíen
correos, y lógica del registro `email_logs` y del correo de prueba.

Sin equivalente en el backend Node, que no envía correos.

- `queue()` es lo que usan los services de negocio: deja el correo en la
  bandeja de salida de la sesión y sale solo si la petición hace commit
  (ver `app/core/mail_outbox.py`).
- `send_test()` envía **en la misma petición** y devuelve el resultado, para
  que el admin (o Postman) sepa en el acto si Brevo aceptó el correo.
"""

from __future__ import annotations

from datetime import date

from app.core import mail_outbox
from app.core.email_templates import RenderedEmail, test_email
from app.core.mailer import Attachment, OutgoingEmail, deliver
from app.core.pagination import build_meta
from app.repositories.email_log import email_log_repository
from app.schemas.email_log import EmailLogOut, TestEmailResult
from app.services.audit import audit_service


class EmailService:
    def queue(
        self,
        db,
        *,
        kind: str,
        to: str | None,
        rendered: RenderedEmail,
        user_id: int | None = None,
        entity: str | None = None,
        entity_id: int | None = None,
        attachments: list[Attachment] | None = None,
    ) -> None:
        """Encola un correo para después del commit. Sin destinatario (una
        venta POS a consumidor final sin email, p. ej.) no hace nada."""
        if not to or not to.strip():
            return
        mail_outbox.queue(
            db,
            OutgoingEmail(
                to=to,
                subject=rendered.subject,
                html=rendered.html,
                text=rendered.text,
                kind=kind,
                entity=entity,
                entity_id=entity_id,
                user_id=user_id,
                attachments=attachments or [],
            ),
        )

    def list(
        self,
        db,
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
        order_by: str | None = None,
        order_dir: str | None = None,
    ) -> dict:
        rows, total = email_log_repository.find_all_with_filters(
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
            order_dir=order_dir or "DESC",
        )
        return {
            "data": [EmailLogOut.from_model(row) for row in rows],
            "meta": build_meta(page, per_page, total),
        }

    def send_test(self, db, *, to: str | None, actor, ip_address: str | None) -> TestEmailResult:
        recipient = to or actor.email
        rendered = test_email(requested_by=f"{actor.first_name} {actor.last_name} ({actor.email})")
        email = OutgoingEmail(
            to=recipient,
            subject=rendered.subject,
            html=rendered.html,
            text=rendered.text,
            kind="test",
            entity="users",
            entity_id=actor.id,
            user_id=actor.id,
        )

        result = deliver(email)
        log = email_log_repository.record(db, email, result)

        audit_service.record(
            db,
            user_id=actor.id,
            action="email_test_sent",
            entity="email_logs",
            entity_id=log.id,
            changes={"after": {"recipient": recipient, "status": result.status}},
            ip_address=ip_address,
        )

        return TestEmailResult(
            status=result.status,
            recipient=recipient,
            attempts=result.attempts,
            error=result.error,
            log_id=log.id,
        )


email_service = EmailService()
