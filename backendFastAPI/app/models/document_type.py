from __future__ import annotations

from sqlalchemy import Enum, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DocumentType(Base):
    __tablename__ = "document_types"

    code: Mapped[str] = mapped_column(String(3), primary_key=True)
    label: Mapped[str] = mapped_column(String(60), nullable=False)
    min_length: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    max_length: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    pattern_kind: Mapped[str] = mapped_column(
        Enum("digits", "alphanumeric", name="pattern_kind_enum"), nullable=False, default="digits"
    )
