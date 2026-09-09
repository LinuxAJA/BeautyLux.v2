"""Servicio de categorías — equivalente de backend/src/services/category.service.js."""

from __future__ import annotations

from app.core.errors import ConflictError, NotFoundError
from app.core.slug import slugify
from app.repositories.category import category_repository
from app.schemas.category import CategoryOut
from app.services.audit import audit_service


class CategoryService:
    def list(self, db, *, type: str | None) -> list[CategoryOut]:
        if type:
            rows = category_repository.find_by_type(db, type, status="active")
            return [CategoryOut.model_validate(c) for c in rows]
        rows, _total = category_repository.find_all(db, per_page=100)
        return [CategoryOut.model_validate(c) for c in rows]

    def create(self, db, dto, *, actor_id: int, ip_address: str | None) -> CategoryOut:
        slug = slugify(dto.name)
        if category_repository.slug_exists(db, slug):
            raise ConflictError("Ya existe una categoría con un nombre muy similar.")

        category = category_repository.create(
            db,
            {
                "slug": slug,
                "name": dto.name,
                "description": dto.description,
                "image_url": dto.image_url,
                "type": dto.type,
                "status": dto.status or "active",
            },
        )

        audit_service.record(
            db, user_id=actor_id, action="category_created", entity="categories", entity_id=category.id,
            ip_address=ip_address,
        )
        created = category_repository.find_by_id(db, category.id)
        return CategoryOut.model_validate(created)

    def update(self, db, category_id: int, dto, *, actor_id: int, ip_address: str | None) -> CategoryOut:
        existing = category_repository.find_by_id(db, category_id)
        if not existing:
            raise NotFoundError("La categoría no existe.")

        changes: dict = {}
        if dto.name:
            changes["name"] = dto.name
            new_slug = slugify(dto.name)
            if new_slug != existing.slug and category_repository.slug_exists(db, new_slug, exclude_id=category_id):
                raise ConflictError("Ya existe una categoría con un nombre muy similar.")
            changes["slug"] = new_slug
        if dto.description is not None:
            changes["description"] = dto.description
        if dto.image_url is not None:
            changes["image_url"] = dto.image_url
        if dto.type:
            changes["type"] = dto.type
        if dto.status:
            changes["status"] = dto.status

        category_repository.update(db, category_id, changes)
        audit_service.record(
            db, user_id=actor_id, action="category_updated", entity="categories", entity_id=category_id,
            changes={"after": dto.model_dump(by_alias=True, exclude_none=True)}, ip_address=ip_address,
        )
        updated = category_repository.find_by_id(db, category_id)
        return CategoryOut.model_validate(updated)

    def remove(self, db, category_id: int, *, actor_id: int, ip_address: str | None) -> None:
        existing = category_repository.find_by_id(db, category_id)
        if not existing:
            raise NotFoundError("La categoría no existe.")

        items_count = category_repository.count_items(db, category_id)
        if items_count > 0:
            raise ConflictError("No se puede eliminar: la categoría tiene productos o servicios asociados.")

        category_repository.hard_delete(db, category_id)
        audit_service.record(
            db, user_id=actor_id, action="category_deleted", entity="categories", entity_id=category_id,
            ip_address=ip_address,
        )


category_service = CategoryService()
