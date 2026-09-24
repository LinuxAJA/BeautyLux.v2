"""Router de reportes — quinto avance, requisitos 4, 5 y 6.

No hay equivalente en el backend Node: los reportes nacen aquí.

Es un reporte de gestión, exclusivo del rol admin —igual que la bitácora de
auditoría—, con `date` obligatorio y `format` opcional (`json` por defecto,
`pdf` o `xlsx`).
"""

from __future__ import annotations

import io as bytes_io
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.responses import ok
from app.db.session import get_db
from app.dependencies.roles import require_role
from app.models.user import User
from app.services.excel_renderer import render_daily_sales_excel
from app.services.pdf_renderer import render_daily_sales_report_pdf
from app.services.report import report_service

router = APIRouter(prefix="/reports", tags=["Reportes"])


@router.get("/daily-sales", summary="Reporte diario de ventas (JSON, PDF o Excel)")
def get_daily_sales_report(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
    day: date = Query(..., alias="date"),
    format: Literal["json", "pdf", "xlsx"] = Query("json"),
):
    report = report_service.build_daily_sales(db, day)
    filename_date = day.strftime("%Y-%m-%d")

    if format == "pdf":
        pdf_bytes = render_daily_sales_report_pdf(report)
        return StreamingResponse(
            bytes_io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="reporte-diario-{filename_date}.pdf"'},
        )

    if format == "xlsx":
        excel_bytes = render_daily_sales_excel(report)
        return StreamingResponse(
            bytes_io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="reporte-diario-{filename_date}.xlsx"'},
        )

    return ok(data=report_service.as_schema(report))
