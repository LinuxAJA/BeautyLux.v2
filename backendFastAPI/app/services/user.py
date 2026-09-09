"""Servicio de usuarios — equivalente de backend/src/services/user.service.js."""

from __future__ import annotations

from app.core.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.core.pagination import build_meta
from app.core.security import hash_password
from app.repositories.role import role_repository
from app.repositories.user import user_repository
from app.schemas.user import UserOut
from app.services.audit import audit_service
from app.services.token import token_service


class UserService:
    def list(
        self,
        db,
        *,
        actor_role: str,
        search: str | None,
        role: str | None,
        status: str | None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None,
        order_dir: str | None,
    ) -> dict:
        """Un empleado solo puede ver clientes: el rol se fuerza aquí, en el
        servicio, no en el router, para que no se pueda saltar con otros parámetros."""
        role_name = "client" if actor_role == "employee" else role

        rows, total = user_repository.find_all_with_role(
            db,
            search=search,
            role_name=role_name,
            status=status,
            page=page,
            per_page=per_page,
            order_by=order_by,
            order_dir=order_dir or "DESC",
        )

        return {
            "data": [UserOut.from_model(user) for user in rows],
            "meta": build_meta(page, per_page, total),
        }

    def get_by_id(self, db, user_id: int, *, actor_role: str) -> UserOut:
        user = user_repository.find_by_id_with_role(db, user_id)
        if not user:
            raise NotFoundError("El usuario no existe.")

        if actor_role == "employee" and user.role.name != "client":
            raise ForbiddenError("No tienes permisos para ver este usuario.")
        return UserOut.from_model(user)

    def create(self, db, dto, *, actor_id: int, ip_address: str | None) -> UserOut:
        email = dto.email.lower().strip()

        if user_repository.email_exists(db, email):
            raise ConflictError(
                "Ya existe una cuenta registrada con este correo electrónico.", "EMAIL_ALREADY_EXISTS"
            )
        if user_repository.document_exists(db, dto.document_type, dto.document_number):
            raise ConflictError(
                "Ya existe una cuenta registrada con este número de documento.", "DOCUMENT_ALREADY_EXISTS"
            )

        role = role_repository.find_by_name(db, dto.role)
        if not role:
            raise BadRequestError("El rol seleccionado no existe.")

        password_hash = hash_password(dto.password)
        user = user_repository.create(
            db,
            {
                "first_name": dto.first_name,
                "last_name": dto.last_name,
                "document_type_code": dto.document_type,
                "document_number": dto.document_number,
                "address": dto.address,
                "phone": dto.phone,
                "email": email,
                "password_hash": password_hash,
                "role_id": role.id,
                "status": "active",
            },
        )

        audit_service.record(
            db,
            user_id=actor_id,
            action="user_created",
            entity="users",
            entity_id=user.id,
            changes={"after": {"email": email, "role": dto.role}},
            ip_address=ip_address,
        )

        created = user_repository.find_by_id_with_role(db, user.id)
        return UserOut.from_model(created)

    def update(self, db, user_id: int, dto, *, actor_id: int, actor_role: str, ip_address: str | None) -> UserOut:
        """Un empleado solo puede editar clientes y no puede cambiarles el rol."""
        target = user_repository.find_by_id_with_role(db, user_id)
        if not target:
            raise NotFoundError("El usuario no existe.")

        if actor_role == "employee" and target.role.name != "client":
            raise ForbiddenError("No tienes permisos para editar este usuario.")
        if dto.role and actor_role != "admin":
            raise ForbiddenError("Solo un administrador puede cambiar el rol de un usuario.")

        if dto.email and dto.email.lower() != target.email:
            email = dto.email.lower().strip()
            if user_repository.email_exists(db, email, exclude_id=user_id):
                raise ConflictError(
                    "Ya existe una cuenta registrada con este correo electrónico.", "EMAIL_ALREADY_EXISTS"
                )
        if dto.document_type and dto.document_number:
            exists = user_repository.document_exists(
                db, dto.document_type, dto.document_number, exclude_id=user_id
            )
            if exists:
                raise ConflictError(
                    "Ya existe una cuenta registrada con este número de documento.", "DOCUMENT_ALREADY_EXISTS"
                )

        role_id = None
        if dto.role:
            role = role_repository.find_by_name(db, dto.role)
            if not role:
                raise BadRequestError("El rol seleccionado no existe.")
            role_id = role.id

        changes: dict = {}
        if dto.first_name:
            changes["first_name"] = dto.first_name
        if dto.last_name:
            changes["last_name"] = dto.last_name
        if dto.document_type:
            changes["document_type_code"] = dto.document_type
        if dto.document_number:
            changes["document_number"] = dto.document_number
        if dto.address:
            changes["address"] = dto.address
        if dto.phone:
            changes["phone"] = dto.phone
        if dto.email:
            changes["email"] = dto.email.lower().strip()
        if role_id:
            changes["role_id"] = role_id

        user_repository.update(db, user_id, changes)

        audit_service.record(
            db,
            user_id=actor_id,
            action="user_updated",
            entity="users",
            entity_id=user_id,
            changes={"after": dto.model_dump(by_alias=True, exclude_none=True)},
            ip_address=ip_address,
        )

        updated = user_repository.find_by_id_with_role(db, user_id)
        return UserOut.from_model(updated)

    def update_status(self, db, user_id: int, status: str, *, actor_id: int, ip_address: str | None) -> UserOut:
        """Activo/Inactivo. Un admin no puede desactivarse a sí mismo."""
        target = user_repository.find_by_id_with_role(db, user_id)
        if not target:
            raise NotFoundError("El usuario no existe.")

        if user_id == actor_id and status == "inactive":
            raise ForbiddenError("No puedes desactivar tu propia cuenta.")
        if target.role.name == "admin" and status == "inactive":
            active_admins = user_repository.count_active_admins(db, exclude_id=user_id)
            if active_admins == 0:
                raise ForbiddenError("No puedes desactivar al último administrador activo.")

        user_repository.update_status(db, user_id, status)
        if status == "inactive":
            token_service.revoke_all_for_user(db, user_id)

        audit_service.record(
            db,
            user_id=actor_id,
            action="user_status_changed",
            entity="users",
            entity_id=user_id,
            changes={"before": {"status": target.status}, "after": {"status": status}},
            ip_address=ip_address,
        )

        updated = user_repository.find_by_id_with_role(db, user_id)
        return UserOut.from_model(updated)

    def remove(self, db, user_id: int, *, actor_id: int, ip_address: str | None) -> None:
        """Soft delete. No permite eliminarse a sí mismo ni al último admin."""
        target = user_repository.find_by_id_with_role(db, user_id)
        if not target:
            raise NotFoundError("El usuario no existe.")

        if user_id == actor_id:
            raise ForbiddenError("No puedes eliminar tu propia cuenta.")
        if target.role.name == "admin":
            active_admins = user_repository.count_active_admins(db, exclude_id=user_id)
            if active_admins == 0:
                raise ForbiddenError("No puedes eliminar al último administrador activo.")

        user_repository.soft_delete_by_id(db, user_id)
        token_service.revoke_all_for_user(db, user_id)

        audit_service.record(
            db, user_id=actor_id, action="user_deleted", entity="users", entity_id=user_id, ip_address=ip_address
        )


user_service = UserService()
