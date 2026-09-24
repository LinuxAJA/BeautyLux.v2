"""Router de facturas — quinto avance, requisitos 7, 8 y 9.

No hay equivalente en el backend Node: la facturación nace aquí.

Quién puede qué:
  · `POST /api/invoices`         — solo admin y empleado (emisión manual;
    la automática la dispara `SaleService` al marcar una venta como pagada).
  · `GET /api/invoices`          — el personal ve todas; el cliente, solo las
    de sus propias ventas (lo fuerza el service).
  · `GET /api/invoices/{id}` y `.../pdf` — lo mismo, por factura.
"""

from __future__ import annotations

import io as bytes_io
from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.common import client_ip
from app.dependencies.roles import require_role
from app.models.user import User
from app.schemas.invoice import CreateInvoiceRequest
from app.services.invoice import invoice_service

router = APIRouter(prefix="/invoices", tags=["Facturación"])


@router.get("", summary="Listar facturas")
def list_invoices(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    search: str | None = Query(None),
    client_id: int | None = Query(None, alias="clientId"),
    sale_id: int | None = Query(None, alias="saleId"),
    date_from: date | None = Query(None, alias="dateFrom"),
    date_to: date | None = Query(None, alias="dateTo"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100, alias="perPage"),
    order_by: str | None = Query(None, alias="orderBy"),
    order_dir: str | None = Query(None, alias="orderDir"),
):
    result = invoice_service.list(
        db,
        actor=user,
        search=search,
        client_id=client_id,
        sale_id=sale_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    return ok(data=result["data"], meta=result["meta"])


@router.post("", summary="Emitir una factura desde una venta", status_code=201)
def create_invoice(
    dto: CreateInvoiceRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "employee")),
):
    result = invoice_service.issue(db, dto.sale_id, actor=user, ip_address=client_ip(request))
    return created(data=result, message="Factura emitida correctamente.")


@router.get("/{invoice_id}", summary="Consultar una factura con su detalle")
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = invoice_service.get_by_id(db, invoice_id, actor=user)
    return ok(data=result)


@router.get("/{invoice_id}/pdf", summary="Descargar la factura en PDF")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pdf_bytes, invoice_number = invoice_service.get_pdf(db, invoice_id, actor=user)
    return StreamingResponse(
        bytes_io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{invoice_number}.pdf"'},
    )
