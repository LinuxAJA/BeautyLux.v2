"""Repositorio de facturas — quinto avance, etapa 7."""

from __future__ import annotations

from datetime import date, datetime, time

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.invoice import Invoice
from app.models.sale import Sale
from app.repositories.base import BaseRepository

SORTABLE = {
    "id": Invoice.id,
    "invoiceNumber": Invoice.invoice_number,
    "invoice_number": Invoice.invoice_number,
    "total": Invoice.total,
    "status": Invoice.status,
    "issuedAt": Invoice.issued_at,
    "issued_at": Invoice.issued_at,
}


class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self) -> None:
        super().__init__(Invoice, soft_delete=False, sortable_columns=SORTABLE)

    def find_by_id_with_sale(self, db: Session, invoice_id: int) -> Invoice | None:
        stmt = select(Invoice).options(joinedload(Invoice.sale)).where(Invoice.id == invoice_id)
        return db.execute(stmt).scalars().first()

    def find_by_number(self, db: Session, invoice_number: str) -> Invoice | None:
        stmt = (
            select(Invoice)
            .options(joinedload(Invoice.sale))
            .where(Invoice.invoice_number == invoice_number)
        )
        return db.execute(stmt).scalars().first()

    def find_by_sale_id(self, db: Session, sale_id: int) -> Invoice | None:
        stmt = select(Invoice).options(joinedload(Invoice.sale)).where(Invoice.sale_id == sale_id)
        return db.execute(stmt).scalars().first()

    def last_number_of_year(self, db: Session, year: int) -> str | None:
        stmt = select(func.max(Invoice.invoice_number)).where(
            Invoice.invoice_number.like(f"FAC-{year}-%")
        )
        return db.execute(stmt).scalar_one_or_none()

    def find_all_with_filters(
        self,
        db: Session,
        *,
        search: str | None = None,
        user_id: int | None = None,
        client_id: int | None = None,
        sale_id: int | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = "issued_at",
        order_dir: str = "DESC",
    ) -> tuple[list[Invoice], int]:
        clauses = []

        if search:
            like = f"%{search}%"
            clauses.append(
                or_(
                    Invoice.invoice_number.like(like),
                    Invoice.customer_first_name.like(like),
                    Invoice.customer_last_name.like(like),
                    Invoice.customer_document_number.like(like),
                    Invoice.sale.has(Sale.sale_number.like(like)),
                )
            )
        # Un cliente solo ve las facturas de sus propias ventas: se resuelve
        # con un JOIN contra `sales`, la fuente real del dueño. `user_id` lo
        # fuerza el service para un cliente; `client_id` es el filtro que el
        # personal elige a mano, igual que en ventas y citas.
        if user_id is not None:
            clauses.append(Invoice.sale.has(Sale.user_id == user_id))
        elif client_id is not None:
            clauses.append(Invoice.sale.has(Sale.user_id == client_id))
        if sale_id is not None:
            clauses.append(Invoice.sale_id == sale_id)
        if date_from is not None:
            clauses.append(Invoice.issued_at >= datetime.combine(date_from, time.min))
        if date_to is not None:
            clauses.append(Invoice.issued_at <= datetime.combine(date_to, time.max))

        base_stmt = select(Invoice).options(joinedload(Invoice.sale))
        count_stmt = select(func.count()).select_from(Invoice)
        for clause in clauses:
            base_stmt = base_stmt.where(clause)
            count_stmt = count_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        order_column = SORTABLE.get(order_by or "", Invoice.issued_at)
        safe_dir = "ASC" if (order_dir or "").upper() == "ASC" else "DESC"
        base_stmt = base_stmt.order_by(
            order_column.asc() if safe_dir == "ASC" else order_column.desc()
        )

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).scalars().unique().all())
        return rows, total


invoice_repository = InvoiceRepository()
