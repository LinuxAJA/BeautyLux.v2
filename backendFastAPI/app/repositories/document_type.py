"""Repositorio de tipos de documento — equivalente de
backend/src/repositories/documentType.repository.js."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_type import DocumentType


class DocumentTypeRepository:
    def find_all(self, db: Session) -> list[DocumentType]:
        stmt = select(DocumentType).order_by(DocumentType.code.asc())
        return list(db.execute(stmt).scalars().all())

    def find_by_code(self, db: Session, code: str) -> DocumentType | None:
        stmt = select(DocumentType).where(DocumentType.code == code).limit(1)
        return db.execute(stmt).scalars().first()


document_type_repository = DocumentTypeRepository()
