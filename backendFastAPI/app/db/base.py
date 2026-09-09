"""Base declarativa de SQLAlchemy 2.0 para todos los modelos ORM."""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
