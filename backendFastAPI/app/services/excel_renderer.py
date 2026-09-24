"""Generación de Excel con openpyxl — quinto avance, etapa 8, requisito 6.

`render_daily_sales_excel()` es la única plantilla de este módulo por ahora.
No hay equivalente en el backend Node: ninguno de los dos genera Excel.
"""

from __future__ import annotations

import io

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from app.core.config import settings

# Mismos tonos de marca que pdf_renderer.py (--primary, --brand-gold de
# frontend/src/index.css), en hex sin `#` porque así los pide openpyxl.
PRIMARY_FILL = "E9638F"
GOLD_FILL = "D4AF37"
HEADER_FONT = Font(color="FFFFFF", bold=True, size=10)
TITLE_FONT = Font(bold=True, size=14, color=PRIMARY_FILL)
SUBTITLE_FONT = Font(size=9, color="6B7280")
TOTALS_LABEL_FONT = Font(bold=True, size=10)
TOTALS_VALUE_FONT = Font(bold=True, size=10, color=PRIMARY_FILL)

STATUS_LABELS = {
    "pending": "Pendiente",
    "paid": "Pagado",
    "processing": "En preparación",
    "completed": "Entregado",
    "cancelled": "Cancelado",
}
CHANNEL_LABELS = {"web": "Tienda en línea", "pos": "Punto de venta"}

COLUMNS = [
    ("Venta", 16),
    ("Hora", 9),
    ("Canal", 16),
    ("Cliente", 26),
    ("Productos y servicios", 48),
    ("Cantidad", 11),
    ("Valor", 14),
    ("Total", 14),
    ("Estado", 16),
]


def _money(value) -> float:
    """openpyxl guarda números nativos (no texto) para que la celda quede
    analizable: sumas, promedios y gráficas funcionan sin reconvertir."""
    return round(float(value), 2)


def render_daily_sales_excel(report: dict) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Reporte diario"

    sheet["A1"] = settings.BUSINESS_NAME
    sheet["A1"].font = TITLE_FONT
    sheet["A2"] = f"Reporte diario de ventas — {report['date'].strftime('%d/%m/%Y')}"
    sheet["A2"].font = SUBTITLE_FONT

    header_row = 4
    for index, (label, width) in enumerate(COLUMNS, start=1):
        cell = sheet.cell(row=header_row, column=index, value=label)
        cell.font = HEADER_FONT
        cell.fill = PatternFill("solid", fgColor=PRIMARY_FILL)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        sheet.column_dimensions[get_column_letter(index)].width = width

    row_index = header_row
    for row in report["rows"]:
        row_index += 1
        values = [
            row["sale_number"],
            row["sold_at"].strftime("%H:%M"),
            CHANNEL_LABELS.get(row["channel"], row["channel"]),
            row["customer_name"],
            row["items_summary"],
            row["items_count"],
            _money(row["subtotal"]),
            _money(row["total"]),
            STATUS_LABELS.get(row["status"], row["status"]),
        ]
        for column_index, value in enumerate(values, start=1):
            cell = sheet.cell(row=row_index, column=column_index, value=value)
            if column_index in (7, 8):
                cell.number_format = '"$" #,##0'

    last_data_row = row_index

    # Congela la fila de encabezados: al bajar por un reporte largo, las
    # columnas siguen identificadas. Autofiltro sobre el mismo rango, para
    # que se pueda ordenar y filtrar sin salir de Excel (requisito 6).
    sheet.freeze_panes = f"A{header_row + 1}"
    if last_data_row > header_row:
        sheet.auto_filter.ref = f"A{header_row}:{get_column_letter(len(COLUMNS))}{last_data_row}"

    # Totales generales, dos filas debajo de la última venta (requisito 5).
    totals = report["totals"]
    totals_row = last_data_row + 2
    totals_entries = [
        ("Ventas del día", totals["sales_count"]),
        ("Artículos vendidos", totals["items_count"]),
        ("Subtotal", _money(totals["subtotal"])),
        ("Envíos", _money(totals["shipping_total"])),
        ("IVA incluido", _money(totals["tax_total"])),
        ("Total del día", _money(totals["total"])),
    ]
    for offset, (label, value) in enumerate(totals_entries):
        label_cell = sheet.cell(row=totals_row + offset, column=4, value=label)
        label_cell.font = TOTALS_LABEL_FONT
        label_cell.alignment = Alignment(horizontal="right")
        value_cell = sheet.cell(row=totals_row + offset, column=5, value=value)
        value_cell.font = TOTALS_VALUE_FONT
        if label in ("Subtotal", "Envíos", "IVA incluido", "Total del día"):
            value_cell.number_format = '"$" #,##0'

    footer_row = totals_row + len(totals_entries) + 2
    footer_cell = sheet.cell(
        row=footer_row,
        column=1,
        value=f"Generado por {settings.BUSINESS_NAME} el {report['generated_at'].strftime('%d/%m/%Y %H:%M')}.",
    )
    footer_cell.font = SUBTITLE_FONT

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
