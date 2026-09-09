"""Repositorio de categorías — equivalente de backend/src/repositories/category.repository.js.

Sin soft delete (a diferencia de users/products/services): `categories` no
tiene `deleted_at`, el borrado siempre es hard delete.
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.models.service import Service
from app.repositories.base import BaseRepository

SORTABLE = {"id": Category.id, "name": Category.name, "createdAt": Category.created_at, "created_at": Category.created_at}


class CategoryRepository(BaseRepository[Category]):
    def __init__(self) -> None:
        super().__init__(Category, soft_delete=False, sortable_columns=SORTABLE)

    def find_by_type(self, db: Session, category_type: str, *, status: str | None = None) -> list[Category]:
        stmt = select(Category).where(Category.type == category_type)
        if status:
            stmt = stmt.where(Category.status == status)
        stmt = stmt.order_by(Category.name.asc())
        return list(db.execute(stmt).scalars().all())

    def find_by_slug(self, db: Session, slug: str) -> Category | None:
        return self.find_one_by(db, Category.slug, slug)

    def slug_exists(self, db: Session, slug: str, *, exclude_id: int | None = None) -> bool:
        return self.exists_by(db, Category.slug, slug, exclude_id=exclude_id)

    def count_items(self, db: Session, category_id: int) -> int:
        products_total = db.execute(
            select(func.count())
            .select_from(Product)
            .where(Product.category_id == category_id, Product.deleted_at.is_(None))
        ).scalar_one()
        services_total = db.execute(
            select(func.count())
            .select_from(Service)
            .where(Service.category_id == category_id, Service.deleted_at.is_(None))
        ).scalar_one()
        return products_total + services_total


category_repository = CategoryRepository()
