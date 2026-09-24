"""Servicio de PQR — quinto avance, requisito 16.

Peticiones, quejas, reclamos y sugerencias. Se pueden radicar sin sesión
—por eso `actor` es opcional en `submit()`—, así que lo único que identifica
a quien escribió es el snapshot de contacto que llega en el formulario, no
la cuenta. La consulta pública de estado exige ese mismo correo junto con el
número de ticket, para que no sea posible leer la PQR de otra persona
adivinando el consecutivo.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import BackgroundTasks
from sqlalchemy.exc import IntegrityError

from app.core.email_templates import pqr_answered, pqr_received
from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.core.mailer import send_email
from app.core.pagination import build_meta
from app.models.pqr import Pqr
from app.repositories.pqr import pqr_repository
from app.repositories.sale import sale_repository
from app.schemas.pqr import PqrOut
from app.services.audit import audit_service

STAFF_ROLES = ("admin", "employee")


class PqrService:
    # -----------------------------------------------------------------
    # Radicación
    # -----------------------------------------------------------------
    def submit(self, db, dto, *, actor, ip_address: str | None, background_tasks: BackgroundTasks) -> PqrOut:
        if dto.sale_id is not None:
            sale = sale_repository.find_by_id(db, dto.sale_id)
            if not sale:
                raise BadRequestError("La venta indicada no existe.")
            # Si hay sesión, la PQR solo puede referenciar una venta propia:
            # de lo contrario cualquiera podría citar el pedido de otra
            # persona para que el ticket parezca más urgente.
            if actor and actor.role.name not in STAFF_ROLES and sale.user_id != actor.id:
                raise BadRequestError("La venta indicada no existe.")

        pqr = self._insert_with_number(
            db,
            {
                "user_id": actor.id if actor else None,
                "sale_id": dto.sale_id,
                "type": dto.type,
                "subject": dto.subject,
                "message": dto.message,
                "contact_first_name": dto.contact_first_name,
                "contact_last_name": dto.contact_last_name,
                "contact_email": dto.contact_email,
                "contact_phone": dto.contact_phone,
                "status": "pending",
            },
        )

        audit_service.record(
            db,
            user_id=actor.id if actor else None,
            action="pqr_created",
            entity="pqr",
            entity_id=pqr.id,
            changes={"after": {"ticketNumber": pqr.ticket_number, "type": pqr.type}},
            ip_address=ip_address,
        )

        subject, html_body, text_body = pqr_received(
            first_name=pqr.contact_first_name, ticket_number=pqr.ticket_number, subject=pqr.subject
        )
        background_tasks.add_task(
            send_email, to=pqr.contact_email, subject=subject, html_body=html_body, text_body=text_body
        )

        return PqrOut.from_model(pqr)

    def _insert_with_number(self, db, data: dict, *, attempts: int = 3) -> Pqr:
        """Mismo patrón que `Sale`, `Appointment` e `Invoice`: consecutivo
        por año, arbitrado por el índice UNIQUE ante una colisión."""
        year = datetime.now().year

        for attempt in range(attempts):
            last = pqr_repository.last_number_of_year(db, year)
            sequence = int(last.rsplit("-", 1)[1]) + 1 if last else 1
            pqr = Pqr(ticket_number=f"PQR-{year}-{sequence:05d}", **data)

            try:
                with db.begin_nested():
                    db.add(pqr)
                    db.flush()
                return pqr
            except IntegrityError:
                if attempt == attempts - 1:
                    raise ConflictError(
                        "No se pudo asignar el número de la PQR. Inténtalo de nuevo."
                    ) from None

        raise ConflictError("No se pudo asignar el número de la PQR. Inténtalo de nuevo.")

    # -----------------------------------------------------------------
    # Lectura
    # -----------------------------------------------------------------
    def list(
        self,
        db,
        *,
        actor,
        search: str | None = None,
        type_: str | None = None,
        status: str | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = None,
        order_dir: str | None = None,
    ) -> dict:
        visible_user_id = None if actor.role.name in STAFF_ROLES else actor.id

        rows, total = pqr_repository.find_all_with_filters(
            db,
            search=search,
            user_id=visible_user_id,
            type_=type_,
            status=status,
            page=page,
            per_page=per_page,
            order_by=order_by,
            order_dir=order_dir or "DESC",
        )
        return {
            "data": [PqrOut.from_model(row) for row in rows],
            "meta": build_meta(page, per_page, total),
        }

    def get_by_id(self, db, pqr_id: int, *, actor) -> PqrOut:
        pqr = self._visible_or_404(db, pqr_id, actor)
        return PqrOut.from_model(pqr)

    def _visible_or_404(self, db, pqr_id: int, actor) -> Pqr:
        pqr = pqr_repository.find_by_id_with_sale(db, pqr_id)
        if not pqr:
            raise NotFoundError("La PQR no existe.")
        if actor.role.name not in STAFF_ROLES and pqr.user_id != actor.id:
            raise NotFoundError("La PQR no existe.")
        return pqr

    def get_by_ticket_public(self, db, ticket_number: str, email: str) -> PqrOut:
        """Consulta sin sesión: número de ticket y correo de contacto tienen
        que coincidir los dos, o no se confirma que el ticket exista."""
        pqr = pqr_repository.find_by_number(db, ticket_number)
        if not pqr or pqr.contact_email.lower() != email.strip().lower():
            raise NotFoundError("No encontramos una PQR con ese número y ese correo.")
        return PqrOut.from_model(pqr)

    # -----------------------------------------------------------------
    # Gestión (personal)
    # -----------------------------------------------------------------
    def update_status(self, db, pqr_id: int, status: str, *, actor, ip_address: str | None) -> PqrOut:
        pqr = pqr_repository.find_by_id_with_sale(db, pqr_id)
        if not pqr:
            raise NotFoundError("La PQR no existe.")
        if pqr.status == status:
            raise BadRequestError("La PQR ya está en ese estado.")

        previous = pqr.status
        pqr.status = status
        db.flush()

        audit_service.record(
            db,
            user_id=actor.id,
            action="pqr_status_changed",
            entity="pqr",
            entity_id=pqr.id,
            changes={"before": {"status": previous}, "after": {"status": status}},
            ip_address=ip_address,
        )
        return PqrOut.from_model(pqr)

    def respond(
        self, db, pqr_id: int, response_text: str, *, actor, ip_address: str | None,
        background_tasks: BackgroundTasks,
    ) -> PqrOut:
        pqr = pqr_repository.find_by_id_with_sale(db, pqr_id)
        if not pqr:
            raise NotFoundError("La PQR no existe.")
        if pqr.status == "closed":
            raise BadRequestError("Esta PQR ya está cerrada y no admite más respuestas.")

        pqr.response = response_text
        pqr.responded_by = actor.id
        pqr.responded_at = datetime.now()
        pqr.status = "answered"
        db.flush()

        audit_service.record(
            db,
            user_id=actor.id,
            action="pqr_responded",
            entity="pqr",
            entity_id=pqr.id,
            changes={"after": {"status": "answered"}},
            ip_address=ip_address,
        )

        subject, html_body, text_body = pqr_answered(
            first_name=pqr.contact_first_name, ticket_number=pqr.ticket_number, response=response_text
        )
        background_tasks.add_task(
            send_email, to=pqr.contact_email, subject=subject, html_body=html_body, text_body=text_body
        )

        return PqrOut.from_model(pqr)


pqr_service = PqrService()
