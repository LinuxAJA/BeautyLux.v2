"""Servicio de servicios (catálogo) — equivalente de
backend/src/services/service.service.js. Se llama `service_catalog` para no
chocar con el término genérico "servicio" (capa) ni con `sqlalchemy.orm.Session`."""

from __future__ import annotations

import re

from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.core.pagination import build_meta
from app.core.slug import slugify
from app.repositories.category import category_repository
from app.repositories.service import service_repository
from app.schemas.service import ServiceOut
from app.services.audit import audit_service

_NUMERIC = re.compile(r"^\d+$")


class ServiceCatalogService:
    def list(
        self,
        db,
        *,
        is_public: bool,
        search: str | None,
        category: str | None,
        status: str | None,
        page: int = 1,
        per_page: int = 12,
        order_by: str | None,
        order_dir: str | None,
    ) -> dict:
        rows, total = service_repository.find_all_with_category(
            db,
            search=search,
            category_slug=category,
            status="active" if is_public else status,
            page=page,
            per_page=per_page,
            order_by=order_by,
            order_dir=order_dir or "DESC",
        )
        return {
            "data": [ServiceOut.from_model(s) for s in rows],
            "meta": build_meta(page, per_page, total),
        }

    def get_by_id_or_slug(self, db, id_or_slug: str, *, is_public: bool) -> ServiceOut:
        is_numeric = bool(_NUMERIC.match(id_or_slug))
        service = (
            service_repository.find_by_id_with_category(db, int(id_or_slug))
            if is_numeric
            else service_repository.find_by_slug(db, id_or_slug)
        )

        if not service or (is_public and service.status != "active"):
            raise NotFoundError("El servicio no existe.")
        return ServiceOut.from_model(service)

    def create(self, db, dto, *, actor_id: int, ip_address: str | None) -> ServiceOut:
        if dto.category_id and not category_repository.find_by_id(db, dto.category_id):
            raise BadRequestError("La categoría seleccionada no existe.")

        slug = slugify(dto.name)
        if service_repository.slug_exists(db, slug):
            raise ConflictError("Ya existe un servicio con un nombre muy similar.")

        service = service_repository.create(
            db,
            {
                "slug": slug,
                "name": dto.name,
                "description": dto.description,
                "category_id": dto.category_id,
                "price": dto.price,
                "duration_minutes": dto.duration_minutes,
                "image_url": dto.image_url,
                "status": dto.status or "active",
            },
        )

        audit_service.record(
            db, user_id=actor_id, action="service_created", entity="services", entity_id=service.id,
            ip_address=ip_address,
        )

        created = service_repository.find_by_id_with_category(db, service.id)
        return ServiceOut.from_model(created)

    def update(self, db, service_id: int, dto, *, actor_id: int, ip_address: str | None) -> ServiceOut:
        existing = service_repository.find_by_id_with_category(db, service_id)
        if not existing:
            raise NotFoundError("El servicio no existe.")

        if dto.category_id and not category_repository.find_by_id(db, dto.category_id):
            raise BadRequestError("La categoría seleccionada no existe.")

        changes: dict = {}
        if dto.name:
            changes["name"] = dto.name
            new_slug = slugify(dto.name)
            if new_slug != existing.slug and service_repository.slug_exists(db, new_slug, exclude_id=service_id):
                raise ConflictError("Ya existe un servicio con un nombre muy similar.")
            changes["slug"] = new_slug
        if dto.description is not None:
            changes["description"] = dto.description
        if dto.category_id is not None:
            changes["category_id"] = dto.category_id
        if dto.price is not None:
            changes["price"] = dto.price
        if dto.duration_minutes is not None:
            changes["duration_minutes"] = dto.duration_minutes
        if dto.image_url is not None:
            changes["image_url"] = dto.image_url
        if dto.status:
            changes["status"] = dto.status

        service_repository.update(db, service_id, changes)
        audit_service.record(
            db, user_id=actor_id, action="service_updated", entity="services", entity_id=service_id,
            changes={"after": dto.model_dump(by_alias=True, exclude_none=True)}, ip_address=ip_address,
        )

        updated = service_repository.find_by_id_with_category(db, service_id)
        return ServiceOut.from_model(updated)

    def update_status(self, db, service_id: int, status: str, *, actor_id: int, ip_address: str | None) -> ServiceOut:
        existing = service_repository.find_by_id_with_category(db, service_id)
        if not existing:
            raise NotFoundError("El servicio no existe.")

        service_repository.update(db, service_id, {"status": status})
        audit_service.record(
            db, user_id=actor_id, action="service_status_changed", entity="services", entity_id=service_id,
            changes={"after": {"status": status}}, ip_address=ip_address,
        )

        updated = service_repository.find_by_id_with_category(db, service_id)
        return ServiceOut.from_model(updated)

    def remove(self, db, service_id: int, *, actor_id: int, ip_address: str | None) -> None:
        existing = service_repository.find_by_id_with_category(db, service_id)
        if not existing:
            raise NotFoundError("El servicio no existe.")

        service_repository.soft_delete_by_id(db, service_id)
        audit_service.record(
            db, user_id=actor_id, action="service_deleted", entity="services", entity_id=service_id,
            ip_address=ip_address,
        )


service_catalog_service = ServiceCatalogService()
