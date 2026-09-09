"""Repositorio de roles — equivalente de backend/src/repositories/role.repository.js."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.role import Role


class RoleRepository:
    def find_by_name(self, db: Session, name: str) -> Role | None:
        stmt = select(Role).where(Role.name == name).limit(1)
        return db.execute(stmt).scalars().first()

    def find_all(self, db: Session) -> list[Role]:
        stmt = select(Role).order_by(Role.id.asc())
        return list(db.execute(stmt).scalars().all())


role_repository = RoleRepository()
