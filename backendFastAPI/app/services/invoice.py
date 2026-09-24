"""Servicio de facturas — quinto avance, requisitos 7, 8 y 9.

La factura se emite a partir de una venta ya pagada: copia sus datos del
comprador y sus líneas tal como están en ese momento (snapshot), para que
quede congelada aunque la venta cambie después. Se emite de dos formas:

1. **Automática**: `SaleService.update_status()` llama a `issue()` cuando la
   venta pasa a `paid`.
2. **Manual**: `POST /api/invoices` desde el panel, para una venta que ya
   estaba pagada y a la que se le olvidó emitir la factura.

Ambas rutas terminan en el mismo método, `issue()`, que es idempotente: si la
venta ya tiene factura, la devuelve en vez de duplicarla.
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy.exc import IntegrityError

from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.core.pagination import build_meta
from app.models.invoice import Invoice
from app.models.invoice_detail import InvoiceDetail
from app.repositories.invoice import invoice_repository
from app.repositories.sale import sale_repository
from app.schemas.invoice import InvoiceOut
from app.services.audit import audit_service
from app.services.pdf_renderer import render_invoice_pdf

STAFF_ROLES = ("admin", "employee")

# Una venta que nunca se pagó (`pending`) o que se canceló no genera factura.
INVOICEABLE_STATUSES = ("paid", "processing", "completed")


class InvoiceService:
    # -----------------------------------------------------------------
    # Emisión
    # -----------------------------------------------------------------
    def issue(self, db, sale_id: int, *, actor, ip_address: str | None, quiet: bool = False) -> InvoiceOut:
        """Emite la factura de una venta.

        `quiet=True` la usa `SaleService` al pagar una venta: si por lo que
        sea ya existe una factura (dos clics, una segunda petición), no debe
        romper el cambio de estado — simplemente se devuelve la que ya había.
        Desde el router (`quiet=False`) sí se avisa con un 409, porque ahí
        emitir dos veces sí es un error del usuario.
        """
        existing = invoice_repository.find_by_sale_id(db, sale_id)
        if existing:
            if quiet:
                return InvoiceOut.from_model(existing, with_details=True)
            raise ConflictError("Esta venta ya tiene una factura emitida.")

        sale = sale_repository.find_by_id_with_details(db, sale_id)
        if not sale:
            raise NotFoundError("La venta no existe.")
        if sale.status not in INVOICEABLE_STATUSES:
            raise BadRequestError(
                "Solo se puede facturar una venta que ya esté pagada."
            )

        invoice = self._insert_with_number(
            db,
            {
                "sale_id": sale.id,
                "customer_first_name": sale.customer_first_name,
                "customer_last_name": sale.customer_last_name,
                "customer_document_type": sale.customer_document_type,
                "customer_document_number": sale.customer_document_number,
                "customer_email": sale.customer_email,
                "customer_phone": sale.customer_phone,
                "customer_address": sale.shipping_address,
                "subtotal": sale.subtotal,
                "discount_total": sale.discount_total,
                "tax_total": sale.tax_total,
                "total": sale.total,
                # El estado propio de la factura arranca en "issued": no
                # copia el de la venta. "paid"/"void" son ciclo de vida de la
                # factura en si (cobro del documento, anulacion), que este
                # avance no modela mas alla de dejar la columna lista.
                "status": "issued",
                "issued_at": datetime.now(),
            },
        )

        for detail in sale.details:
            db.add(
                InvoiceDetail(
                    invoice_id=invoice.id,
                    description=detail.item_name,
                    quantity=detail.quantity,
                    unit_price=detail.unit_price,
                    discount=detail.discount,
                    tax_rate=detail.tax_rate,
                    subtotal=detail.subtotal,
                )
            )
        db.flush()

        audit_service.record(
            db,
            user_id=actor.id if actor else None,
            action="invoice_issued",
            entity="invoices",
            entity_id=invoice.id,
            changes={
                "after": {
                    "invoiceNumber": invoice.invoice_number,
                    "saleId": sale.id,
                    "total": str(invoice.total),
                }
            },
            ip_address=ip_address,
        )

        created = invoice_repository.find_by_id_with_sale(db, invoice.id)
        return InvoiceOut.from_model(created, with_details=True)

    def _insert_with_number(self, db, data: dict, *, attempts: int = 3) -> Invoice:
        """Mismo patrón que `Sale` y `Appointment`: consecutivo por año,
        arbitrado por el índice UNIQUE ante una colisión."""
        year = datetime.now().year

        for attempt in range(attempts):
            last = invoice_repository.last_number_of_year(db, year)
            sequence = int(last.rsplit("-", 1)[1]) + 1 if last else 1
            invoice = Invoice(invoice_number=f"FAC-{year}-{sequence:05d}", **data)

            try:
                with db.begin_nested():
                    db.add(invoice)
                    db.flush()
                return invoice
            except IntegrityError:
                if attempt == attempts - 1:
                    raise ConflictError(
                        "No se pudo asignar el número de factura. Inténtalo de nuevo."
                    ) from None

        raise ConflictError("No se pudo asignar el número de factura. Inténtalo de nuevo.")

    # -----------------------------------------------------------------
    # Lectura
    # -----------------------------------------------------------------
    def list(
        self,
        db,
        *,
        actor,
        search: str | None = None,
        client_id: int | None = None,
        sale_id: int | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = None,
        order_dir: str | None = None,
    ) -> dict:
        visible_user_id = None if actor.role.name in STAFF_ROLES else actor.id

        rows, total = invoice_repository.find_all_with_filters(
            db,
            search=search,
            user_id=visible_user_id,
            client_id=client_id,
            sale_id=sale_id,
            date_from=date_from,
            date_to=date_to,
            page=page,
            per_page=per_page,
            order_by=order_by,
            order_dir=order_dir or "DESC",
        )
        return {
            "data": [InvoiceOut.from_model(row) for row in rows],
            "meta": build_meta(page, per_page, total),
        }

    def get_by_id(self, db, invoice_id: int, *, actor) -> InvoiceOut:
        invoice = self._visible_or_404(db, invoice_id, actor)
        return InvoiceOut.from_model(invoice, with_details=True)

    def _visible_or_404(self, db, invoice_id: int, actor) -> Invoice:
        invoice = invoice_repository.find_by_id_with_sale(db, invoice_id)
        if not invoice:
            raise NotFoundError("La factura no existe.")
        if actor.role.name not in STAFF_ROLES and (not invoice.sale or invoice.sale.user_id != actor.id):
            raise NotFoundError("La factura no existe.")
        return invoice

    def get_pdf(self, db, invoice_id: int, *, actor) -> tuple[bytes, str]:
        invoice = self._visible_or_404(db, invoice_id, actor)
        return render_invoice_pdf(invoice), invoice.invoice_number


invoice_service = InvoiceService()
