"""Schemas de estadísticas — quinto avance, requisitos 10, 11, 12, 13 y 15.

Todo lo que exponen estos schemas viene de una agregación SQL en
`StatsRepository`; ninguno tiene un schema de entrada porque los cuatro
endpoints son de solo lectura (los filtros llegan por query params).
"""

from __future__ import annotations

from datetime import date

from app.schemas.common import CamelModel


class OverviewOut(CamelModel):
    """Requisito 10: totales del negocio para el resumen del admin."""

    users_count: int
    clients_count: int
    employees_count: int
    products_count: int
    services_count: int
    sales_count: int
    sales_total: float
    invoices_count: int
    invoices_total: float
    appointments_today: int
    pqr_received: int
    pqr_pending: int


class EmployeeSummaryOut(CamelModel):
    """Cards operativas del resumen del empleado: lo de hoy, no el histórico."""

    sales_today_count: int
    sales_today_total: float
    appointments_today: int
    pqr_assigned: int


class MySummaryOut(CamelModel):
    """Requisito 12: lo que ve un cliente en su propio resumen — solo lo suyo,
    reforzado además por `require_role` en el router."""

    orders_count: int
    orders_total: float
    upcoming_appointments: int
    pqr_open: int


class SalesSeriesPointOut(CamelModel):
    date: date
    sales_count: int
    total: float


class TopItemOut(CamelModel):
    name: str
    quantity: int
    total: float
