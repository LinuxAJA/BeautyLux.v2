"""Repositorio de productos — equivalente de backend/src/repositories/product.repository.js."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.product import Product
from app.repositories.base import BaseRepository

SORTABLE = {
    "id": Product.id,
    "name": Product.name,
    "price": Product.price,
    "rating": Product.rating,
    "createdAt": Product.created_at,
    "created_at": Product.created_at,
}


class ProductRepository(BaseRepository[Product]):
    def __init__(self) -> None:
        super().__init__(Product, soft_delete=True, sortable_columns=SORTABLE)

    def find_by_id_with_category(self, db: Session, product_id: int) -> Product | None:
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(Product.id == product_id, Product.deleted_at.is_(None))
        )
        return db.execute(stmt).scalars().first()

    def find_by_slug(self, db: Session, slug: str) -> Product | None:
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(Product.slug == slug, Product.deleted_at.is_(None))
        )
        return db.execute(stmt).scalars().first()

    def find_all_with_category(
        self,
        db: Session,
        *,
        search: str | None = None,
        category_slug: str | None = None,
        status: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        page: int = 1,
        per_page: int = 12,
        order_by: str | None = "created_at",
        order_dir: str = "DESC",
    ) -> tuple[list[Product], int]:
        clauses = [Product.deleted_at.is_(None)]
        if search:
            like = f"%{search}%"
            clauses.append(
                or_(Product.name.like(like), Product.description.like(like), Product.sku.like(like))
            )
        if status:
            clauses.append(Product.status == status)
        if min_price is not None:
            clauses.append(Product.price >= min_price)
        if max_price is not None:
            clauses.append(Product.price <= max_price)

        base_stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .outerjoin(Category, Product.category_id == Category.id)
        )
        count_stmt = select(func.count()).select_from(Product).outerjoin(
            Category, Product.category_id == Category.id
        )
        if category_slug:
            clauses.append(Category.slug == category_slug)

        for clause in clauses:
            base_stmt = base_stmt.where(clause)
            count_stmt = count_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        order_column = SORTABLE.get(order_by or "", Product.created_at)
        safe_dir = "ASC" if (order_dir or "").upper() == "ASC" else "DESC"
        base_stmt = base_stmt.order_by(order_column.asc() if safe_dir == "ASC" else order_column.desc())

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).scalars().unique().all())
        return rows, total

    def sku_exists(self, db: Session, sku: str, *, exclude_id: int | None = None) -> bool:
        return self.exists_by(db, Product.sku, sku, exclude_id=exclude_id)

    def slug_exists(self, db: Session, slug: str, *, exclude_id: int | None = None) -> bool:
        return self.exists_by(db, Product.slug, slug, exclude_id=exclude_id)


product_repository = ProductRepository()
