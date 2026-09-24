"""Repositorio de estadísticas — quinto avance, requisitos 10, 11, 13 y 15.

Todo lo que sale de aquí se agrega con `func.sum`/`func.count` en SQL, nunca
en Python sobre las filas crudas: es la garantía del requisito 15 (ningún
dato quemado en el frontend). La única excepción es la serie temporal, que
agrega por día en SQL y solo *reagrupa* esas sumas diarias ya hechas —no las
ventas— en semanas o meses (ver `StatsService.sales_series`).
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.appointment import ACTIVE_STATUSES, Appointment
from app.models.invoice import Invoice
from app.models.pqr import Pqr
from app.models.product import Product
from app.models.role import Role
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail
from app.models.service import Service
from app.models.user import User


def _sales_filters(
    *,
    date_from: date | None,
    date_to: date | None,
    status: str | None,
    client_id: int | None,
    channel: str | None,
    exclude_cancelled: bool,
):
    """Cláusulas WHERE compartidas por `sales_series` y `top_items`: mismo
    vocabulario de filtros que ya usa `GET /api/sales` (requisito 13)."""
    clauses = [Sale.deleted_at.is_(None)]
    if date_from is not None:
        clauses.append(Sale.sold_at >= datetime.combine(date_from, time.min))
    if date_to is not None:
        clauses.append(Sale.sold_at <= datetime.combine(date_to, time.max))
    if status:
        clauses.append(Sale.status == status)
    elif exclude_cancelled:
        # Sin un estado explícito, las gráficas muestran ingresos reales:
        # una venta cancelada no vendió nada (mismo criterio que el reporte
        # diario de la etapa 8).
        clauses.append(Sale.status != "cancelled")
    if client_id is not None:
        clauses.append(Sale.user_id == client_id)
    if channel:
        clauses.append(Sale.channel == channel)
    return clauses


class StatsRepository:
    # -----------------------------------------------------------------
    # Resumen general (requisito 10)
    # -----------------------------------------------------------------
    def count_active_users_by_role(self, db: Session) -> dict[str, int]:
        stmt = (
            select(Role.name, func.count(User.id))
            .join(User, User.role_id == Role.id)
            .where(User.deleted_at.is_(None))
            .group_by(Role.name)
        )
        return dict(db.execute(stmt).all())

    def count_active_products(self, db: Session) -> int:
        stmt = select(func.count()).select_from(Product).where(
            Product.deleted_at.is_(None), Product.status == "active"
        )
        return db.execute(stmt).scalar_one()

    def count_active_services(self, db: Session) -> int:
        stmt = select(func.count()).select_from(Service).where(
            Service.deleted_at.is_(None), Service.status == "active"
        )
        return db.execute(stmt).scalar_one()

    def sales_summary(
        self, db: Session, *, date_from: date | None = None, date_to: date | None = None
    ) -> tuple[int, Decimal]:
        """(cantidad, total) de ventas no canceladas en el rango pedido."""
        clauses = _sales_filters(
            date_from=date_from, date_to=date_to, status=None, client_id=None, channel=None,
            exclude_cancelled=True,
        )
        stmt = select(func.count(Sale.id), func.coalesce(func.sum(Sale.total), 0))
        for clause in clauses:
            stmt = stmt.where(clause)
        count, total = db.execute(stmt).one()
        return count, total

    def invoices_summary(self, db: Session) -> tuple[int, Decimal]:
        stmt = select(func.count(Invoice.id), func.coalesce(func.sum(Invoice.total), 0)).where(
            Invoice.status != "void"
        )
        count, total = db.execute(stmt).one()
        return count, total

    def count_appointments_for_day(self, db: Session, day: date) -> int:
        stmt = select(func.count()).select_from(Appointment).where(
            Appointment.scheduled_date == day, Appointment.status.in_(ACTIVE_STATUSES)
        )
        return db.execute(stmt).scalar_one()

    def count_upcoming_appointments(self, db: Session, *, user_id: int) -> int:
        stmt = select(func.count()).select_from(Appointment).where(
            Appointment.user_id == user_id,
            Appointment.scheduled_date >= date.today(),
            Appointment.status.in_(("hold", "confirmed")),
        )
        return db.execute(stmt).scalar_one()

    def count_pqr_total(self, db: Session) -> int:
        return db.execute(select(func.count()).select_from(Pqr)).scalar_one()

    def count_pqr_by_status(self, db: Session, statuses: tuple[str, ...]) -> int:
        stmt = select(func.count()).select_from(Pqr).where(Pqr.status.in_(statuses))
        return db.execute(stmt).scalar_one()

    def count_pqr_open_for_user(self, db: Session, *, user_id: int) -> int:
        stmt = select(func.count()).select_from(Pqr).where(
            Pqr.user_id == user_id, Pqr.status != "closed"
        )
        return db.execute(stmt).scalar_one()

    # -----------------------------------------------------------------
    # Serie temporal de ventas (gráfica lineal)
    # -----------------------------------------------------------------
    def daily_sales_totals(
        self,
        db: Session,
        *,
        date_from: date | None,
        date_to: date | None,
        status: str | None,
        client_id: int | None,
        product_id: int | None,
        service_id: int | None,
        channel: str | None,
    ) -> list[tuple[date, int, Decimal]]:
        """Una fila por día con ventas: (fecha, cantidad, total). Se agrega
        en SQL con `func.sum`/`func.count`; `StatsService` la reagrupa por
        semana o mes si hace falta, sin volver a tocar la tabla `sales`."""
        clauses = _sales_filters(
            date_from=date_from, date_to=date_to, status=status, client_id=client_id,
            channel=channel, exclude_cancelled=True,
        )
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

        day_column = func.date(Sale.sold_at)
        stmt = (
            select(day_column, func.count(Sale.id), func.coalesce(func.sum(Sale.total), 0))
            .group_by(day_column)
            .order_by(day_column)
        )
        for clause in clauses:
            stmt = stmt.where(clause)

        return list(db.execute(stmt).all())

    # -----------------------------------------------------------------
    # Ranking de artículos vendidos (gráfica de barras)
    # -----------------------------------------------------------------
    def top_products(
        self,
        db: Session,
        *,
        limit: int,
        date_from: date | None,
        date_to: date | None,
        status: str | None,
        client_id: int | None,
    ) -> list[tuple[str, int, Decimal]]:
        return self._top_items(
            db, SaleDetail.product_id, limit=limit, date_from=date_from, date_to=date_to,
            status=status, client_id=client_id,
        )

    def top_services(
        self,
        db: Session,
        *,
        limit: int,
        date_from: date | None,
        date_to: date | None,
        status: str | None,
        client_id: int | None,
    ) -> list[tuple[str, int, Decimal]]:
        return self._top_items(
            db, SaleDetail.service_id, limit=limit, date_from=date_from, date_to=date_to,
            status=status, client_id=client_id,
        )

    def _top_items(
        self,
        db: Session,
        fk_column,
        *,
        limit: int,
        date_from: date | None,
        date_to: date | None,
        status: str | None,
        client_id: int | None,
    ) -> list[tuple[str, int, Decimal]]:
        """Nombre, unidades y facturación de los artículos más vendidos.

        Usa el nombre guardado en `sale_details` (`item_name`), no el del
        catálogo actual: así el ranking histórico no cambia si el producto se
        renombra o se elimina después de venderse.
        """
        clauses = _sales_filters(
            date_from=date_from, date_to=date_to, status=status, client_id=client_id,
            channel=None, exclude_cancelled=True,
        )
        clauses.append(fk_column.is_not(None))

        stmt = (
            select(
                SaleDetail.item_name,
                func.sum(SaleDetail.quantity),
                func.sum(SaleDetail.subtotal),
            )
            .join(Sale, SaleDetail.sale_id == Sale.id)
            .group_by(fk_column, SaleDetail.item_name)
            .order_by(func.sum(SaleDetail.subtotal).desc())
            .limit(limit)
        )
        for clause in clauses:
            stmt = stmt.where(clause)

        return list(db.execute(stmt).all())


stats_repository = StatsRepository()
