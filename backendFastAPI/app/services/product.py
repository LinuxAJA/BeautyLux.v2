"""Servicio de productos — equivalente de backend/src/services/product.service.js.

Mejora decidida sobre Node: `is_public` ya no es siempre `True` en los GET.
El router resuelve `is_public` con `get_current_user_optional` — un admin o
empleado autenticado pasa `is_public=False` y ve también los inactivos, con
el filtro `status` funcionando; el público anónimo sigue viendo solo activos."""

from __future__ import annotations

import re
from decimal import Decimal

from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.core.pagination import build_meta
from app.core.slug import slugify
from app.repositories.category import category_repository
from app.repositories.product import product_repository
from app.schemas.product import ProductOut
from app.services.audit import audit_service

_NUMERIC = re.compile(r"^\d+$")


class ProductService:
    def list(
        self,
        db,
        *,
        is_public: bool,
        search: str | None,
        category: str | None,
        status: str | None,
        min_price: Decimal | None,
        max_price: Decimal | None,
        page: int = 1,
        per_page: int = 12,
        order_by: str | None,
        order_dir: str | None,
    ) -> dict:
        rows, total = product_repository.find_all_with_category(
            db,
            search=search,
            category_slug=category,
            status="active" if is_public else status,
            min_price=min_price,
            max_price=max_price,
            page=page,
            per_page=per_page,
            order_by=order_by,
            order_dir=order_dir or "DESC",
        )
        return {
            "data": [ProductOut.from_model(p) for p in rows],
            "meta": build_meta(page, per_page, total),
        }

    def get_by_id_or_slug(self, db, id_or_slug: str, *, is_public: bool) -> ProductOut:
        is_numeric = bool(_NUMERIC.match(id_or_slug))
        product = (
            product_repository.find_by_id_with_category(db, int(id_or_slug))
            if is_numeric
            else product_repository.find_by_slug(db, id_or_slug)
        )

        if not product or (is_public and product.status != "active"):
            raise NotFoundError("El producto no existe.")
        return ProductOut.from_model(product)

    def create(self, db, dto, *, actor_id: int, ip_address: str | None) -> ProductOut:
        if product_repository.sku_exists(db, dto.sku):
            raise ConflictError("Ya existe un producto con ese SKU.")
        if dto.category_id and not category_repository.find_by_id(db, dto.category_id):
            raise BadRequestError("La categoría seleccionada no existe.")

        slug = slugify(dto.name)
        if product_repository.slug_exists(db, slug):
            raise ConflictError("Ya existe un producto con un nombre muy similar.")

        product = product_repository.create(
            db,
            {
                "sku": dto.sku,
                "slug": slug,
                "name": dto.name,
                "description": dto.description,
                "category_id": dto.category_id,
                "price": dto.price,
                "old_price": dto.old_price,
                "stock": dto.stock or 0,
                "rating": Decimal("0"),
                "reviews_count": 0,
                "image_url": dto.image_url,
                "badge": dto.badge,
                "status": dto.status or "active",
            },
        )

        audit_service.record(
            db, user_id=actor_id, action="product_created", entity="products", entity_id=product.id,
            ip_address=ip_address,
        )

        created = product_repository.find_by_id_with_category(db, product.id)
        return ProductOut.from_model(created)

    def update(self, db, product_id: int, dto, *, actor_id: int, ip_address: str | None) -> ProductOut:
        existing = product_repository.find_by_id_with_category(db, product_id)
        if not existing:
            raise NotFoundError("El producto no existe.")

        if dto.sku and dto.sku != existing.sku and product_repository.sku_exists(db, dto.sku, exclude_id=product_id):
            raise ConflictError("Ya existe un producto con ese SKU.")
        if dto.category_id and not category_repository.find_by_id(db, dto.category_id):
            raise BadRequestError("La categoría seleccionada no existe.")

        changes: dict = {}
        if dto.sku:
            changes["sku"] = dto.sku
        if dto.name:
            changes["name"] = dto.name
            new_slug = slugify(dto.name)
            # A diferencia de Node (que no comprobaba colisión al renombrar),
            # aquí sí se valida para evitar un 500 por índice único duplicado.
            if new_slug != existing.slug and product_repository.slug_exists(db, new_slug, exclude_id=product_id):
                raise ConflictError("Ya existe un producto con un nombre muy similar.")
            changes["slug"] = new_slug
        if dto.description is not None:
            changes["description"] = dto.description
        if dto.category_id is not None:
            changes["category_id"] = dto.category_id
        if dto.price is not None:
            changes["price"] = dto.price
        if dto.old_price is not None:
            changes["old_price"] = dto.old_price
        if dto.stock is not None:
            changes["stock"] = dto.stock
        if dto.image_url is not None:
            changes["image_url"] = dto.image_url
        if dto.badge is not None:
            changes["badge"] = dto.badge
        if dto.status:
            changes["status"] = dto.status

        product_repository.update(db, product_id, changes)
        audit_service.record(
            db, user_id=actor_id, action="product_updated", entity="products", entity_id=product_id,
            changes={"after": dto.model_dump(by_alias=True, exclude_none=True)}, ip_address=ip_address,
        )

        updated = product_repository.find_by_id_with_category(db, product_id)
        return ProductOut.from_model(updated)

    def update_status(self, db, product_id: int, status: str, *, actor_id: int, ip_address: str | None) -> ProductOut:
        existing = product_repository.find_by_id_with_category(db, product_id)
        if not existing:
            raise NotFoundError("El producto no existe.")

        product_repository.update(db, product_id, {"status": status})
        audit_service.record(
            db, user_id=actor_id, action="product_status_changed", entity="products", entity_id=product_id,
            changes={"after": {"status": status}}, ip_address=ip_address,
        )

        updated = product_repository.find_by_id_with_category(db, product_id)
        return ProductOut.from_model(updated)

    def remove(self, db, product_id: int, *, actor_id: int, ip_address: str | None) -> None:
        existing = product_repository.find_by_id_with_category(db, product_id)
        if not existing:
            raise NotFoundError("El producto no existe.")

        product_repository.soft_delete_by_id(db, product_id)
        audit_service.record(
            db, user_id=actor_id, action="product_deleted", entity="products", entity_id=product_id,
            ip_address=ip_address,
        )


product_service = ProductService()
