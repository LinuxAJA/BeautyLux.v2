"""Servicio de autenticación — equivalente de backend/src/services/auth.service.js."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.cookies import hash_token
from app.core.errors import AppError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import compare_password, get_dummy_hash, hash_password
from app.core.config import settings
from app.repositories.password_reset import password_reset_repository
from app.repositories.role import role_repository
from app.repositories.user import user_repository
from app.schemas.auth import RegisterRequest
from app.schemas.user import MeOut, UserOut
from app.services.audit import audit_service
from app.services.permission import permission_service
from app.services.token import token_service


class RequestContext:
    """Metadatos de la petición (IP, user-agent) usados para auditoría y sesiones."""

    def __init__(self, ip_address: str | None = None, user_agent: str | None = None) -> None:
        self.ip_address = ip_address
        self.user_agent = user_agent


class AuthService:
    def register(self, db: Session, dto: RegisterRequest, ctx: RequestContext) -> UserOut:
        email = dto.email.lower().strip()

        if user_repository.email_exists(db, email):
            raise ConflictError(
                "Ya existe una cuenta registrada con este correo electrónico.", "EMAIL_ALREADY_EXISTS"
            )
        if user_repository.document_exists(db, dto.document_type, dto.document_number):
            raise ConflictError(
                "Ya existe una cuenta registrada con este número de documento.", "DOCUMENT_ALREADY_EXISTS"
            )

        client_role = role_repository.find_by_name(db, "client")
        if not client_role:
            raise AppError("El rol de cliente no está configurado.", 500)

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
                "role_id": client_role.id,
                "status": "active",
            },
        )

        audit_service.record(
            db,
            user_id=user.id,
            action="user_registered",
            entity="users",
            entity_id=user.id,
            ip_address=ctx.ip_address,
        )

        created = user_repository.find_by_id_with_role(db, user.id)
        return UserOut.from_model(created)

    def login(self, db: Session, email: str, password: str, remember: bool, ctx: RequestContext) -> dict:
        normalized_email = email.lower().strip()
        user = user_repository.find_by_email_with_password(db, normalized_email)

        # Compara siempre contra un hash, exista o no la cuenta, para no filtrar por tiempo.
        password_hash = user.password_hash if user else get_dummy_hash()
        is_valid_password = compare_password(password, password_hash)

        if not user or not is_valid_password:
            audit_service.record(
                db,
                action="login_failed",
                entity="users",
                changes={"email": normalized_email},
                ip_address=ctx.ip_address,
            )
            raise UnauthorizedError("Correo electrónico o contraseña incorrectos.", "INVALID_CREDENTIALS")

        if user.status == "inactive":
            raise ForbiddenError("Tu cuenta está inactiva. Contacta al administrador.", "ACCOUNT_INACTIVE")

        user_repository.touch_last_login(db, user.id)
        audit_service.record(
            db,
            user_id=user.id,
            action="login_succeeded",
            entity="users",
            entity_id=user.id,
            ip_address=ctx.ip_address,
        )

        access_token = token_service.sign_access_token(user)
        refresh = token_service.issue_refresh_token(
            db, user.id, remember=remember, user_agent=ctx.user_agent, ip_address=ctx.ip_address
        )

        return {"user": UserOut.from_model(user), "access_token": access_token, "refresh": refresh}

    def refresh(self, db: Session, raw_token: str | None, ctx: RequestContext) -> dict:
        session = token_service.consume_refresh_token(db, raw_token, ip_address=ctx.ip_address)
        user = user_repository.find_by_id_with_role(db, session.user_id)

        if not user or user.status == "inactive":
            raise UnauthorizedError("La cuenta ya no está disponible.", "ACCOUNT_INACTIVE")

        access_token = token_service.sign_access_token(user)
        refresh = token_service.issue_refresh_token(
            db, user.id, remember=bool(session.remember), user_agent=ctx.user_agent, ip_address=ctx.ip_address
        )

        return {"user": UserOut.from_model(user), "access_token": access_token, "refresh": refresh}

    def logout(self, db: Session, raw_token: str | None) -> None:
        token_service.revoke_by_raw_token(db, raw_token)

    def me(self, db: Session, user_id: int) -> MeOut:
        user = user_repository.find_by_id_with_role(db, user_id)
        if not user:
            raise NotFoundError("El usuario no existe.")
        permissions = permission_service.permissions_for(user.role.name)
        return MeOut.from_model_with_permissions(user, permissions)

    def update_profile(self, db: Session, user_id: int, dto) -> UserOut:
        data = {}
        if dto.first_name:
            data["first_name"] = dto.first_name
        if dto.last_name:
            data["last_name"] = dto.last_name
        if dto.address:
            data["address"] = dto.address
        if dto.phone:
            data["phone"] = dto.phone

        changed = user_repository.update(db, user_id, data)
        if not changed:
            raise NotFoundError("El usuario no existe.")

        user = user_repository.find_by_id_with_role(db, user_id)
        return UserOut.from_model(user)

    def change_password(self, db: Session, user_id: int, current_password: str, new_password: str) -> None:
        user = user_repository.find_by_id_with_role(db, user_id)
        if not user:
            raise NotFoundError("El usuario no existe.")

        # find_by_id_with_role no trae el hash; se recupera explícitamente.
        with_password = user_repository.find_by_email_with_password(db, user.email)
        is_valid = compare_password(current_password, with_password.password_hash)
        if not is_valid:
            raise UnauthorizedError("La contraseña actual es incorrecta.", "INVALID_CREDENTIALS")

        new_hash = hash_password(new_password)
        user_repository.update_password(db, user_id, new_hash)
        token_service.revoke_all_for_user(db, user_id)
        audit_service.record(db, user_id=user_id, action="password_changed", entity="users", entity_id=user_id)

    def forgot_password(self, db: Session, email: str) -> dict:
        normalized_email = email.lower().strip()
        user = user_repository.find_by_email_with_password(db, normalized_email)

        generic_message = "Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña."
        if not user:
            return {"message": generic_message}

        password_reset_repository.invalidate_previous(db, user.id)

        raw_token = secrets.token_hex(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_TTL_MINUTES)

        password_reset_repository.create(
            db, user_id=user.id, token_hash=hash_token(raw_token), expires_at=expires_at.replace(tzinfo=None)
        )

        audit_service.record(
            db, user_id=user.id, action="password_reset_requested", entity="users", entity_id=user.id
        )

        result = {"message": generic_message}
        if settings.EXPOSE_RESET_TOKEN:
            result["reset_token"] = raw_token
        return result

    def reset_password(self, db: Session, raw_token: str, new_password: str) -> None:
        record = password_reset_repository.find_valid_by_token_hash(db, hash_token(raw_token))
        if not record:
            raise UnauthorizedError("El enlace de recuperación no es válido o expiró.", "INVALID_RESET_TOKEN")

        new_hash = hash_password(new_password)
        user_repository.update_password(db, record.user_id, new_hash)
        password_reset_repository.mark_used(db, record.id)
        token_service.revoke_all_for_user(db, record.user_id)
        audit_service.record(
            db, user_id=record.user_id, action="password_reset_completed", entity="users", entity_id=record.user_id
        )


auth_service = AuthService()
