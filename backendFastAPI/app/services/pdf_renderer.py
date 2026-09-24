"""Generación de PDF con reportlab — quinto avance, etapas 7 y 8.

`render_invoice_pdf()` es la plantilla de la factura (etapa 7);
`render_daily_sales_report_pdf()` es la del reporte diario (etapa 8), y
reutiliza de aquí los colores, la cabecera del negocio y el pie de
generación. No hay equivalente en el backend Node: ninguno de los dos genera
PDF.
"""

from __future__ import annotations

import io
from datetime import datetime
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet

from app.core.config import settings

# Los mismos tonos de marca que frontend/src/index.css (--primary, --brand-gold),
# convertidos a RGB porque reportlab no entiende hsl().
PRIMARY = colors.HexColor("#E9638F")
GOLD = colors.HexColor("#D4AF37")
MUTED = colors.HexColor("#6B7280")
BORDER = colors.HexColor("#E5E7EB")

_styles = getSampleStyleSheet()

_TITLE_STYLE = ParagraphStyle(
    "BeautyLuxTitle", parent=_styles["Heading1"], fontSize=20, textColor=PRIMARY, spaceAfter=2
)
_SUBTITLE_STYLE = ParagraphStyle(
    "BeautyLuxSubtitle", parent=_styles["Normal"], fontSize=9, textColor=MUTED
)
_HEADING_STYLE = ParagraphStyle(
    "BeautyLuxHeading", parent=_styles["Heading3"], fontSize=11, textColor=colors.black, spaceAfter=4
)
_BODY_STYLE = ParagraphStyle("BeautyLuxBody", parent=_styles["Normal"], fontSize=9, leading=13)
_FOOTER_STYLE = ParagraphStyle(
    "BeautyLuxFooter", parent=_styles["Normal"], fontSize=7.5, textColor=MUTED, alignment=1
)
_TABLE_CELL_STYLE = ParagraphStyle("BeautyLuxTableCell", parent=_styles["Normal"], fontSize=7.5, leading=10)


def _money(value: Decimal | float) -> str:
    """Formatea como COP sin decimales, igual que `formatPrice` del frontend."""
    number = int(round(float(value)))
    return f"$ {number:,}".replace(",", ".")


def _business_header() -> list:
    """Cabecera con el nombre y los datos del negocio. Compartida por la
    factura y el reporte diario."""
    return [
        Paragraph(settings.BUSINESS_NAME, _TITLE_STYLE),
        Paragraph("Services &amp; Beauty", _SUBTITLE_STYLE),
        Spacer(1, 4),
        Paragraph(
            f"NIT {settings.BUSINESS_NIT} &nbsp;·&nbsp; {settings.BUSINESS_ADDRESS}<br/>"
            f"{settings.BUSINESS_PHONE} &nbsp;·&nbsp; {settings.BUSINESS_EMAIL}",
            _SUBTITLE_STYLE,
        ),
    ]


def _generated_footer(extra: str | None = None) -> Paragraph:
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    text = f"Generado por BeautyLux el {now}."
    if extra:
        text += f" {extra}"
    return Paragraph(text, _FOOTER_STYLE)


def render_invoice_pdf(invoice) -> bytes:
    """Arma el PDF de una factura: cabecera del negocio, datos del cliente,
    tabla de líneas y totales. `invoice` es el modelo ORM con `details`
    cargados (Invoice.details, lazy="selectin")."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=18 * mm,
        bottomMargin=16 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        title=f"Factura {invoice.invoice_number}",
    )

    story: list = [*_business_header(), Spacer(1, 14)]

    # Franja con el número de factura y la fecha de emisión, a la derecha.
    header_table = Table(
        [
            [
                Paragraph("FACTURA DE VENTA", _HEADING_STYLE),
                Paragraph(
                    f"<b>{invoice.invoice_number}</b><br/>"
                    f"Emitida el {invoice.issued_at.strftime('%d/%m/%Y %H:%M')}<br/>"
                    f"Venta {invoice.sale.sale_number if invoice.sale else ''}",
                    _BODY_STYLE,
                ),
            ]
        ],
        colWidths=[100 * mm, 76 * mm],
    )
    header_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, 0), 1, GOLD),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 10))

    customer_lines = [f"<b>{invoice.customer_first_name} {invoice.customer_last_name}</b>"]
    if invoice.customer_document_number:
        doc_type = invoice.customer_document_type or ""
        customer_lines.append(f"{doc_type} {invoice.customer_document_number}".strip())
    if invoice.customer_address:
        customer_lines.append(invoice.customer_address)
    if invoice.customer_email:
        customer_lines.append(invoice.customer_email)
    if invoice.customer_phone:
        customer_lines.append(invoice.customer_phone)

    story.append(Paragraph("Facturar a", _HEADING_STYLE))
    story.append(Paragraph("<br/>".join(customer_lines), _BODY_STYLE))
    story.append(Spacer(1, 14))

    # Tabla de líneas.
    rows = [["Descripción", "Cant.", "Precio unit.", "Subtotal"]]
    for line in invoice.details:
        rows.append(
            [
                Paragraph(line.description, _BODY_STYLE),
                str(line.quantity),
                _money(line.unit_price),
                _money(line.subtotal),
            ]
        )

    items_table = Table(rows, colWidths=[86 * mm, 20 * mm, 35 * mm, 35 * mm], repeatRows=1)
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(items_table)
    story.append(Spacer(1, 10))

    # Totales, alineados a la derecha.
    totals_rows = [
        ["Subtotal", _money(invoice.subtotal)],
    ]
    if invoice.discount_total:
        totals_rows.append(["Descuento", f"-{_money(invoice.discount_total)}"])
    totals_rows.append(["IVA incluido (19%)", _money(invoice.tax_total)])
    totals_rows.append(["Total", _money(invoice.total)])

    totals_table = Table(totals_rows, colWidths=[40 * mm, 35 * mm], hAlign="RIGHT")
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, -1), (-1, -1), 11),
                ("TEXTCOLOR", (0, -1), (-1, -1), PRIMARY),
                ("LINEABOVE", (0, -1), (-1, -1), 0.75, GOLD),
                ("TOPPADDING", (0, -1), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(totals_table)
    story.append(Spacer(1, 24))
    story.append(_generated_footer(f"Estado: {_invoice_status_label(invoice.status)}."))

    doc.build(story)
    return buffer.getvalue()


def _invoice_status_label(status: str) -> str:
    labels = {"issued": "Emitida", "paid": "Pagada", "void": "Anulada"}
    return labels.get(status, status)

_STATUS_LABELS = {
    "pending": "Pendiente",
    "paid": "Pagado",
    "processing": "En preparación",
    "completed": "Entregado",
    "cancelled": "Cancelado",
}
_CHANNEL_LABELS = {"web": "Tienda en línea", "pos": "Punto de venta"}


def render_daily_sales_report_pdf(report: dict) -> bytes:
    """Arma el PDF del reporte diario de ventas.

    `report` es el `dict` que arma `ReportService.build_daily_sales()`: una
    fila por venta del día (no por línea, para que quepan varias ventas por
    página) más los totales generales, con el mismo estilo de marca que la
    factura de la etapa 7.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=16 * mm,
        bottomMargin=14 * mm,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        title=f"Reporte diario {report['date'].strftime('%d/%m/%Y')}",
    )

    story: list = [*_business_header(), Spacer(1, 10)]
    story.append(Paragraph(f"REPORTE DIARIO DE VENTAS — {report['date'].strftime('%d/%m/%Y')}", _HEADING_STYLE))
    story.append(Spacer(1, 8))

    rows = [
        ["Venta", "Hora", "Canal", "Cliente", "Productos y servicios", "Cant.", "Valor", "Total", "Estado"]
    ]
    for row in report["rows"]:
        rows.append(
            [
                row["sale_number"],
                row["sold_at"].strftime("%H:%M"),
                _CHANNEL_LABELS.get(row["channel"], row["channel"]),
                Paragraph(row["customer_name"], _TABLE_CELL_STYLE),
                Paragraph(row["items_summary"], _TABLE_CELL_STYLE),
                str(row["items_count"]),
                _money(row["subtotal"]),
                _money(row["total"]),
                _STATUS_LABELS.get(row["status"], row["status"]),
            ]
        )

    if len(rows) == 1:
        story.append(Paragraph("No hubo ventas este día.", _BODY_STYLE))
    else:
        table = Table(
            rows,
            colWidths=[22 * mm, 12 * mm, 20 * mm, 30 * mm, 62 * mm, 12 * mm, 20 * mm, 20 * mm, 22 * mm],
            repeatRows=1,
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTSIZE", (0, 0), (-1, 0), 8),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 1), (-1, -1), 7.5),
                    ("ALIGN", (5, 0), (7, -1), "RIGHT"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(table)

    story.append(Spacer(1, 12))

    totals = report["totals"]
    totals_rows = [
        ["Ventas del día", str(totals["sales_count"])],
        ["Artículos vendidos", str(totals["items_count"])],
        ["Subtotal", _money(totals["subtotal"])],
        ["Envíos", _money(totals["shipping_total"])],
        ["IVA incluido", _money(totals["tax_total"])],
        ["Total del día", _money(totals["total"])],
    ]
    totals_table = Table(totals_rows, colWidths=[45 * mm, 35 * mm], hAlign="RIGHT")
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, -1), (-1, -1), 11),
                ("TEXTCOLOR", (0, -1), (-1, -1), PRIMARY),
                ("LINEABOVE", (0, -1), (-1, -1), 0.75, GOLD),
                ("TOPPADDING", (0, -1), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(totals_table)
    story.append(Spacer(1, 20))
    story.append(_generated_footer())

    doc.build(story)
    return buffer.getvalue()

