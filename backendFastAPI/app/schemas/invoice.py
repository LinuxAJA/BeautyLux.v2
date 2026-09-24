"""Schemas de facturas — quinto avance, requisitos 7, 8 y 9.

La factura no tiene formulario de entrada libre: se emite a partir de una
venta (`saleId`), y todos sus importes y líneas se copian de esa venta. Por
eso solo hay un schema de entrada, mínimo.
"""

from __future__ import annotations

from datetime import datetime

from app.schemas.common import CamelModel, InputModel


class InvoiceDetailOut(CamelModel):
    id: int
    description: str
    quantity: int
    unit_price: float
    discount: float
    tax_rate: float
    subtotal: float

    @classmethod
    def from_model(cls, detail) -> "InvoiceDetailOut":
        return cls.model_validate(
            {
                "id": detail.id,
                "description": detail.description,
                "quantity": detail.quantity,
                "unitPrice": detail.unit_price,
                "discount": detail.discount,
                "taxRate": detail.tax_rate,
                "subtotal": detail.subtotal,
            }
        )


class InvoiceCustomerOut(CamelModel):
    first_name: str
    last_name: str
    document_type: str | None = None
    document_number: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None


class InvoiceOut(CamelModel):
    id: int
    invoice_number: str
    sale_id: int
    sale_number: str | None = None
    customer: InvoiceCustomerOut
    subtotal: float
    discount_total: float
    tax_total: float
    total: float
    status: str
    issued_at: datetime
    created_at: datetime
    details: list[InvoiceDetailOut] | None = None

    @classmethod
    def from_model(cls, invoice, *, with_details: bool = False) -> "InvoiceOut":
        return cls.model_validate(
            {
                "id": invoice.id,
                "invoiceNumber": invoice.invoice_number,
                "saleId": invoice.sale_id,
                "saleNumber": invoice.sale.sale_number if invoice.sale else None,
                "customer": {
                    "firstName": invoice.customer_first_name,
                    "lastName": invoice.customer_last_name,
                    "documentType": invoice.customer_document_type,
                    "documentNumber": invoice.customer_document_number,
                    "email": invoice.customer_email,
                    "phone": invoice.customer_phone,
                    "address": invoice.customer_address,
                },
                "subtotal": invoice.subtotal,
                "discountTotal": invoice.discount_total,
                "taxTotal": invoice.tax_total,
                "total": invoice.total,
                "status": invoice.status,
                "issuedAt": invoice.issued_at,
                "createdAt": invoice.created_at,
                "details": (
                    [InvoiceDetailOut.from_model(d) for d in invoice.details] if with_details else None
                ),
            }
        )


class CreateInvoiceRequest(InputModel):
    sale_id: int
