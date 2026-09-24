"""Repositorio de ventas — quinto avance.

Sigue el molde de app/repositories/product.py: el repositorio consulta y no
decide reglas de negocio. El filtro de visibilidad por rol (un cliente solo ve
sus ventas) lo aplica `SaleService` pasando `user_id`, no este módulo.
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.sale_detail import SaleDetail
from app.repositories.base import BaseRepository

SORTABLE = {
    "id": Sale.id,
    "saleNumber": Sale.sale_number,
    "sale_number": Sale.sale_number,
    "total": Sale.total,
    "status": Sale.status,
    "soldAt": Sale.sold_at,
    "sold_at": Sale.sold_at,
    "createdAt": Sale.created_at,
    "created_at": Sale.created_at,
}


class SaleRepository(BaseRepository[Sale]):
    def __init__(self) -> None:
        super().__init__(Sale, soft_delete=True, sortable_columns=SORTABLE)

    # `Sale.details` se declara con lazy="selectin", asi que las lineas llegan
    # en una segunda consulta con IN. No se usa carga por JOIN: en el listado
    # paginado el LIMIT recaeria sobre las filas unidas y devolveria menos
    # ventas de las pedidas.
    def find_by_id_with_details(self, db: Session, sale_id: int) -> Sale | None:
        stmt = (
            select(Sale)
            .where(Sale.id == sale_id, Sale.deleted_at.is_(None))
        )
        return db.execute(stmt).scalars().first()

    def find_by_number(self, db: Session, sale_number: str) -> Sale | None:
        stmt = (
            select(Sale)
            .where(Sale.sale_number == sale_number, Sale.deleted_at.is_(None))
        )
        return db.execute(stmt).scalars().first()

    def find_all_for_day(self, db: Session, day: date) -> list[Sale]:
        """Todas las ventas vendidas un día, sin paginar y con cualquier
        estado: el reporte diario (etapa 8) muestra el día completo, no solo
        lo que está pagado. Ordenadas por hora de venta, que es como se lee
        una bitácora del día."""
        stmt = (
            select(Sale)
            .where(
                Sale.deleted_at.is_(None),
                Sale.sold_at >= datetime.combine(day, time.min),
                Sale.sold_at <= datetime.combine(day, time.max),
            )
            .order_by(Sale.sold_at.asc())
        )
        return list(db.execute(stmt).scalars().all())

    def last_number_of_year(self, db: Session, year: int) -> str | None:
        """Mayor `sale_number` emitido en el año, para calcular el siguiente.

        La garantía real contra duplicados es el índice UNIQUE de la tabla: si
        dos ventas simultáneas calculan el mismo consecutivo, MySQL rechaza la
        segunda y `SaleService` reintenta.
        """
        prefix = f"VTA-{year}-"
        stmt = (
            select(func.max(Sale.sale_number))
            .where(Sale.sale_number.like(f"{prefix}%"))
        )
        return db.execute(stmt).scalar_one_or_none()

    def find_all_with_filters(
        self,
        db: Session,
        *,
        search: str | None = None,
        user_id: int | None = None,
        staff_id: int | None = None,
        status: str | None = None,
        channel: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        min_total: Decimal | None = None,
        max_total: Decimal | None = None,
        product_id: int | None = None,
        service_id: int | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = "sold_at",
        order_dir: str = "DESC",
    ) -> tuple[list[Sale], int]:
        clauses = [Sale.deleted_at.is_(None)]

        if search:
            like = f"%{search}%"
            clauses.append(
                or_(
                    Sale.sale_number.like(like),
                    Sale.customer_first_name.like(like),
                    Sale.customer_last_name.like(like),
                    Sale.customer_email.like(like),
                    Sale.customer_document_number.like(like),
                )
            )
        if user_id is not None:
            clauses.append(Sale.user_id == user_id)
        if staff_id is not None:
            clauses.append(Sale.staff_id == staff_id)
        if status:
            clauses.append(Sale.status == status)
        if channel:
            clauses.append(Sale.channel == channel)
        # `sold_at` es DATETIME: el rango se abre al primer segundo del día
        # inicial y se cierra al último del final, para que filtrar por un
        # mismo día devuelva las ventas de ese día completo.
        if date_from is not None:
            clauses.append(Sale.sold_at >= datetime.combine(date_from, time.min))
        if date_to is not None:
            clauses.append(Sale.sold_at <= datetime.combine(date_to, time.max))
        if min_total is not None:
            clauses.append(Sale.total >= min_total)
        if max_total is not None:
            clauses.append(Sale.total <= max_total)

        # Filtrar por artículo vendido exige mirar el detalle: se resuelve con
        # un EXISTS para no multiplicar filas ni falsear el conteo.
        if product_id is not None:
            clauses.append(
                select(SaleDetail.id)
                .where(SaleDetail.sale_id == Sale.id, SaleDetail.product_id == product_id)
                .exists()
            )
        if service_id is not None:
            clauses.append(
                select(SaleDetail.id)
                .where(SaleDetail.sale_id == Sale.id, SaleDetail.service_id == service_id)
                .exists()
            )

        base_stmt = select(Sale)
        count_stmt = select(func.count()).select_from(Sale)
        for clause in clauses:
            base_stmt = base_stmt.where(clause)
            count_stmt = count_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        order_column = SORTABLE.get(order_by or "", Sale.sold_at)
        safe_dir = "ASC" if (order_dir or "").upper() == "ASC" else "DESC"
        base_stmt = base_stmt.order_by(
            order_column.asc() if safe_dir == "ASC" else order_column.desc()
        )

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).scalars().unique().all())
        return rows, total


sale_repository = SaleRepository()
