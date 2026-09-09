"""Repositorio de servicios — equivalente de backend/src/repositories/service.repository.js."""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.service import Service
from app.repositories.base import BaseRepository

SORTABLE = {
    "id": Service.id,
    "name": Service.name,
    "price": Service.price,
    "durationMinutes": Service.duration_minutes,
    "duration_minutes": Service.duration_minutes,
    "createdAt": Service.created_at,
    "created_at": Service.created_at,
}


class ServiceRepository(BaseRepository[Service]):
    def __init__(self) -> None:
        super().__init__(Service, soft_delete=True, sortable_columns=SORTABLE)

    def find_by_id_with_category(self, db: Session, service_id: int) -> Service | None:
        stmt = (
            select(Service)
            .options(joinedload(Service.category))
            .where(Service.id == service_id, Service.deleted_at.is_(None))
        )
        return db.execute(stmt).scalars().first()

    def find_by_slug(self, db: Session, slug: str) -> Service | None:
        stmt = (
            select(Service)
            .options(joinedload(Service.category))
            .where(Service.slug == slug, Service.deleted_at.is_(None))
        )
        return db.execute(stmt).scalars().first()

    def find_all_with_category(
        self,
        db: Session,
        *,
        search: str | None = None,
        category_slug: str | None = None,
        status: str | None = None,
        page: int = 1,
        per_page: int = 12,
        order_by: str | None = "created_at",
        order_dir: str = "DESC",
    ) -> tuple[list[Service], int]:
        clauses = [Service.deleted_at.is_(None)]
        if search:
            like = f"%{search}%"
            clauses.append(or_(Service.name.like(like), Service.description.like(like)))
        if status:
            clauses.append(Service.status == status)

        base_stmt = (
            select(Service)
            .options(joinedload(Service.category))
            .outerjoin(Category, Service.category_id == Category.id)
        )
        count_stmt = select(func.count()).select_from(Service).outerjoin(
            Category, Service.category_id == Category.id
        )
        if category_slug:
            clauses.append(Category.slug == category_slug)

        for clause in clauses:
            base_stmt = base_stmt.where(clause)
            count_stmt = count_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        order_column = SORTABLE.get(order_by or "", Service.created_at)
        safe_dir = "ASC" if (order_dir or "").upper() == "ASC" else "DESC"
        base_stmt = base_stmt.order_by(order_column.asc() if safe_dir == "ASC" else order_column.desc())

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).scalars().unique().all())
        return rows, total

    def slug_exists(self, db: Session, slug: str, *, exclude_id: int | None = None) -> bool:
        return self.exists_by(db, Service.slug, slug, exclude_id=exclude_id)


service_repository = ServiceRepository()
