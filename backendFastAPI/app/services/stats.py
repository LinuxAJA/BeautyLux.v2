"""Servicio de estadísticas — quinto avance, requisitos 10, 11, 12, 13 y 15.

No tiene equivalente en el backend Node: los dashboards analíticos nacen con
el quinto avance.

Los contadores de PQR se calcularon en 0 hasta la etapa 11 (la tabla `pqr`
todavía no existía); ahora que el módulo está construido, se reemplazan por
consultas reales sin tocar el contrato de los tres schemas de salida.
"""

from __future__ import annotations

from datetime import date, timedelta

from app.repositories.stats import stats_repository
from app.schemas.stats import (
    EmployeeSummaryOut,
    MySummaryOut,
    OverviewOut,
    SalesSeriesPointOut,
    TopItemOut,
)

GROUP_BY_VALUES = ("day", "week", "month")
ITEM_TYPES = ("product", "service")

# Una PQR "abierta" es cualquiera que todavía no se cerró: pendiente, en
# curso o ya respondida pero sin marcar como cerrada.
OPEN_PQR_STATUSES = ("pending", "in_progress", "answered")


def _week_start(day: date) -> date:
    """Lunes de la semana ISO a la que pertenece `day`."""
    return day - timedelta(days=day.isoweekday() - 1)


def _month_start(day: date) -> date:
    return day.replace(day=1)


class StatsService:
    # -----------------------------------------------------------------
    # Resúmenes por rol (requisitos 10 y 12)
    # -----------------------------------------------------------------
    def overview(self, db) -> OverviewOut:
        by_role = stats_repository.count_active_users_by_role(db)
        sales_count, sales_total = stats_repository.sales_summary(db)
        invoices_count, invoices_total = stats_repository.invoices_summary(db)

        return OverviewOut.model_validate(
            {
                "usersCount": sum(by_role.values()),
                "clientsCount": by_role.get("client", 0),
                "employeesCount": by_role.get("employee", 0),
                "productsCount": stats_repository.count_active_products(db),
                "servicesCount": stats_repository.count_active_services(db),
                "salesCount": sales_count,
                "salesTotal": sales_total,
                "invoicesCount": invoices_count,
                "invoicesTotal": invoices_total,
                "appointmentsToday": stats_repository.count_appointments_for_day(db, date.today()),
                "pqrReceived": stats_repository.count_pqr_total(db),
                "pqrPending": stats_repository.count_pqr_by_status(db, ("pending",)),
            }
        )

    def employee_summary(self, db) -> EmployeeSummaryOut:
        today = date.today()
        sales_count, sales_total = stats_repository.sales_summary(db, date_from=today, date_to=today)

        return EmployeeSummaryOut.model_validate(
            {
                "salesTodayCount": sales_count,
                "salesTodayTotal": sales_total,
                "appointmentsToday": stats_repository.count_appointments_for_day(db, today),
                # Sin un campo de asignación por persona en el modelo, "asignadas"
                # es la cola completa de lo que el equipo todavía no cierra.
                "pqrAssigned": stats_repository.count_pqr_by_status(db, OPEN_PQR_STATUSES),
            }
        )

    def my_summary(self, db, *, actor) -> MySummaryOut:
        # `sales_summary` no filtra por cliente; se reutiliza el mismo
        # vocabulario de filtros de `daily_sales_totals` pasando `client_id`
        # en vez de escribir una consulta aparte.
        sales_count, sales_total = self._sales_summary_for_client(db, actor.id)

        return MySummaryOut.model_validate(
            {
                "ordersCount": sales_count,
                "ordersTotal": sales_total,
                "upcomingAppointments": stats_repository.count_upcoming_appointments(db, user_id=actor.id),
                "pqrOpen": stats_repository.count_pqr_open_for_user(db, user_id=actor.id),
            }
        )

    def _sales_summary_for_client(self, db, client_id: int) -> tuple[int, float]:
        rows = stats_repository.daily_sales_totals(
            db,
            date_from=None,
            date_to=None,
            status=None,
            client_id=client_id,
            product_id=None,
            service_id=None,
            channel=None,
        )
        count = sum(row[1] for row in rows)
        total = sum(row[2] for row in rows)
        return count, total

    # -----------------------------------------------------------------
    # Serie temporal de ventas (requisitos 11 y 13)
    # -----------------------------------------------------------------
    def sales_series(
        self,
        db,
        *,
        group_by: str,
        date_from: date | None,
        date_to: date | None,
        status: str | None,
        client_id: int | None,
        product_id: int | None,
        service_id: int | None,
        channel: str | None,
    ) -> list[SalesSeriesPointOut]:
        daily_rows = stats_repository.daily_sales_totals(
            db,
            date_from=date_from,
            date_to=date_to,
            status=status,
            client_id=client_id,
            product_id=product_id,
            service_id=service_id,
            channel=channel,
        )

        if group_by == "day" or not daily_rows:
            return [
                SalesSeriesPointOut.model_validate({"date": day, "salesCount": count, "total": total})
                for day, count, total in daily_rows
            ]

        # Reagrupa las sumas diarias ya calculadas en SQL: no vuelve a tocar
        # `sales`, solo suma lo que la base de datos ya sumó (requisito 15).
        bucket_of = _week_start if group_by == "week" else _month_start
        buckets: dict[date, list] = {}
        for day, count, total in daily_rows:
            key = bucket_of(day)
            bucket = buckets.setdefault(key, [0, 0])
            bucket[0] += count
            bucket[1] += total

        return [
            SalesSeriesPointOut.model_validate({"date": key, "salesCount": values[0], "total": values[1]})
            for key, values in sorted(buckets.items())
        ]

    # -----------------------------------------------------------------
    # Ranking de artículos (requisitos 11 y 13)
    # -----------------------------------------------------------------
    def top_items(
        self,
        db,
        *,
        item_type: str,
        limit: int,
        date_from: date | None,
        date_to: date | None,
        status: str | None,
        client_id: int | None,
    ) -> list[TopItemOut]:
        finder = stats_repository.top_products if item_type == "product" else stats_repository.top_services
        rows = finder(
            db, limit=limit, date_from=date_from, date_to=date_to, status=status, client_id=client_id,
        )
        return [
            TopItemOut.model_validate({"name": name, "quantity": quantity, "total": total})
            for name, quantity, total in rows
        ]


stats_service = StatsService()
