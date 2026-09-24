"""Schemas del reporte diario de ventas — quinto avance, requisitos 4, 5 y 6.

No hay entrada más allá de la fecha (que llega como query param, no como
body): el reporte es de solo lectura, agregado a partir de `sales`.
"""

from __future__ import annotations

from datetime import date, datetime

from app.schemas.common import CamelModel


class DailySalesReportRowOut(CamelModel):
    """Una fila del reporte: una venta del día, con lo que se vendió resumido
    en texto (`itemsSummary`) porque el reporte lista ventas, no líneas."""

    sale_number: str
    sold_at: datetime
    channel: str
    customer_name: str
    items_summary: str
    items_count: int
    subtotal: float
    total: float
    status: str


class DailySalesReportTotalsOut(CamelModel):
    """Totales generales del día (requisito 5)."""

    sales_count: int
    items_count: int
    subtotal: float
    shipping_total: float
    tax_total: float
    total: float


class DailySalesReportOut(CamelModel):
    date: date
    generated_at: datetime
    rows: list[DailySalesReportRowOut]
    totals: DailySalesReportTotalsOut
