"""Repositorio de PQR — quinto avance, requisito 16."""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.pqr import Pqr
from app.repositories.base import BaseRepository

SORTABLE = {
    "id": Pqr.id,
    "ticketNumber": Pqr.ticket_number,
    "ticket_number": Pqr.ticket_number,
    "status": Pqr.status,
    "type": Pqr.type,
    "createdAt": Pqr.created_at,
    "created_at": Pqr.created_at,
}


class PqrRepository(BaseRepository[Pqr]):
    def __init__(self) -> None:
        # Sin soft delete: una PQR es un registro de cara al usuario y de
        # cumplimiento, no se oculta.
        super().__init__(Pqr, soft_delete=False, sortable_columns=SORTABLE)

    def find_by_id_with_sale(self, db: Session, pqr_id: int) -> Pqr | None:
        stmt = select(Pqr).options(joinedload(Pqr.sale)).where(Pqr.id == pqr_id)
        return db.execute(stmt).scalars().first()

    def find_by_number(self, db: Session, ticket_number: str) -> Pqr | None:
        stmt = select(Pqr).where(Pqr.ticket_number == ticket_number)
        return db.execute(stmt).scalars().first()

    def last_number_of_year(self, db: Session, year: int) -> str | None:
        stmt = select(func.max(Pqr.ticket_number)).where(Pqr.ticket_number.like(f"PQR-{year}-%"))
        return db.execute(stmt).scalar_one_or_none()

    def find_all_with_filters(
        self,
        db: Session,
        *,
        search: str | None = None,
        user_id: int | None = None,
        type_: str | None = None,
        status: str | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = "created_at",
        order_dir: str = "DESC",
    ) -> tuple[list[Pqr], int]:
        clauses = []

        if search:
            like = f"%{search}%"
            clauses.append(
                or_(
                    Pqr.ticket_number.like(like),
                    Pqr.subject.like(like),
                    Pqr.contact_first_name.like(like),
                    Pqr.contact_last_name.like(like),
                    Pqr.contact_email.like(like),
                )
            )
        if user_id is not None:
            clauses.append(Pqr.user_id == user_id)
        if type_:
            clauses.append(Pqr.type == type_)
        if status:
            clauses.append(Pqr.status == status)

        base_stmt = select(Pqr).options(joinedload(Pqr.sale))
        count_stmt = select(func.count()).select_from(Pqr)
        for clause in clauses:
            base_stmt = base_stmt.where(clause)
            count_stmt = count_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        order_column = SORTABLE.get(order_by or "", Pqr.created_at)
        safe_dir = "ASC" if (order_dir or "").upper() == "ASC" else "DESC"
        base_stmt = base_stmt.order_by(
            order_column.asc() if safe_dir == "ASC" else order_column.desc()
        )

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).scalars().unique().all())
        return rows, total


pqr_repository = PqrRepository()
