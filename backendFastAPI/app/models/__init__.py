"""
Importa todos los modelos ORM para que SQLAlchemy resuelva las relaciones
declaradas por nombre de cadena (p. ej. `relationship("Category")`) y para
que `Base.metadata` los conozca a todos.
"""

from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.business_hours import BusinessHours
from app.models.category import Category
from app.models.conversation import Conversation
from app.models.document_type import DocumentType
from app.models.invoice import Invoice
from app.models.invoice_detail import InvoiceDetail
from app.models.message import Message
from app.models.password_reset import PasswordReset
from app.models.permission import Permission, role_permissions
from app.models.pqr import Pqr
from app.models.product import Product
from app.models.role import Role
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail
from app.models.service import Service
from app.models.session import Session
from app.models.user import User

__all__ = [
    "Appointment",
    "AuditLog",
    "BusinessHours",
    "Category",
    "Conversation",
    "DocumentType",
    "Invoice",
    "InvoiceDetail",
    "Message",
    "PasswordReset",
    "Permission",
    "Pqr",
    "role_permissions",
    "Product",
    "Role",
    "Sale",
    "SaleDetail",
    "Service",
    "Session",
    "User",
]
