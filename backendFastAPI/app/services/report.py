"""Servicio de reportes — quinto avance, requisitos 4, 5 y 6.

Agrega las ventas de un día para el reporte diario. Es de solo lectura y no
decide reglas de negocio de venta: solo junta lo que `sales` y `sale_details`
ya tienen.

`build_daily_sales()` devuelve un `dict` en vez de un modelo Pydantic a
propósito: lo consumen tres salidas distintas (JSON vía `DailySalesReportOut`,
PDF vía `pdf_renderer` y Excel vía `excel_renderer`), y un `dict` plano de
tipos nativos de Python es más simple de pasar a las tres que un modelo.

Las filas listan **todas** las ventas del día, canceladas incluidas (el
estado se ve en su columna, para que el reporte no esconda lo que pasó), pero
los **totales generales no cuentan lo cancelado**: son el ingreso real del
día, y sumarían de más si incluyeran una venta que no se cobró.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from app.repositories.sale import sale_repository
from app.schemas.report import DailySalesReportOut


def _items_summary(sale) -> str:
    """`2x Labial Mate Luxe, 1x Corte y Peinado` — el reporte lista ventas,
    no líneas, así que lo vendido se resume en una sola celda legible."""
    parts = [f"{detail.quantity}x {detail.item_name}" for detail in sale.details]
    return ", ".join(parts) if parts else "—"


class ReportService:
    def build_daily_sales(self, db, day: date) -> dict:
        sales = sale_repository.find_all_for_day(db, day)

        rows = [
            {
                "sale_number": sale.sale_number,
                "sold_at": sale.sold_at,
                "channel": sale.channel,
                "customer_name": f"{sale.customer_first_name} {sale.customer_last_name}",
                "items_summary": _items_summary(sale),
                "items_count": sum(detail.quantity for detail in sale.details),
                "subtotal": sale.subtotal,
                "total": sale.total,
                "status": sale.status,
            }
            for sale in sales
        ]

        # Los totales generales son ingresos reales del día: una venta
        # cancelada sigue listada en las filas (el estado se ve en su
        # columna), pero no debe sumar al total ni al conteo de artículos,
        # o el reporte sobrestimaría lo que en realidad se vendió.
        realized = [sale for sale in sales if sale.status != "cancelled"]
        realized_rows = [row for row in rows if row["status"] != "cancelled"]

        zero = Decimal("0")
        totals = {
            "sales_count": len(realized),
            "items_count": sum(row["items_count"] for row in realized_rows),
            "subtotal": sum((sale.subtotal for sale in realized), zero),
            "shipping_total": sum((sale.shipping_cost for sale in realized), zero),
            "tax_total": sum((sale.tax_total for sale in realized), zero),
            "total": sum((sale.total for sale in realized), zero),
        }

        return {
            "date": day,
            "generated_at": datetime.now(),
            "rows": rows,
            "totals": totals,
        }

    def as_schema(self, report: dict) -> DailySalesReportOut:
        return DailySalesReportOut.model_validate(
            {
                "date": report["date"],
                "generatedAt": report["generated_at"],
                "rows": [
                    {
                        "saleNumber": row["sale_number"],
                        "soldAt": row["sold_at"],
                        "channel": row["channel"],
                        "customerName": row["customer_name"],
                        "itemsSummary": row["items_summary"],
                        "itemsCount": row["items_count"],
                        "subtotal": row["subtotal"],
                        "total": row["total"],
                        "status": row["status"],
                    }
                    for row in report["rows"]
                ],
                "totals": {
                    "salesCount": report["totals"]["sales_count"],
                    "itemsCount": report["totals"]["items_count"],
                    "subtotal": report["totals"]["subtotal"],
                    "shippingTotal": report["totals"]["shipping_total"],
                    "taxTotal": report["totals"]["tax_total"],
                    "total": report["totals"]["total"],
                },
            }
        )


report_service = ReportService()
