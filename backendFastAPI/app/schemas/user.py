"""Schemas de usuarios — equivalente de backend/src/validations/user.validation.js
y backend/src/models/usuario.model.js (para el DTO de salida)."""

from __future__ import annotations

from datetime import datetime

from pydantic import field_validator, model_validator

from app.schemas.common import (
    CamelModel,
    DOCUMENT_TYPES,
    InputModel,
    PaginationQuery,
    validate_address,
    validate_document_number,
    validate_email,
    validate_name,
    validate_password,
    validate_phone,
)

ROLE_NAMES = ("admin", "employee", "client")
STATUS_VALUES = ("active", "inactive")


class RoleOut(CamelModel):
    id: int
    name: str
    label: str


class UserOut(CamelModel):
    """DTO de salida — nunca incluye `passwordHash`, igual que User.toJSON() en Node."""

    id: int
    first_name: str
    last_name: str
    document_type: str
    document_number: str
    address: str
    phone: str
    email: str
    role: RoleOut
    status: str
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, user) -> "UserOut":
        """Traduce la fila ORM (con `role` cargado) al DTO — equivalente de
        User.fromRow()/toJSON() en backend/src/models/usuario.model.js."""
        return cls.model_validate(
            {
                "id": user.id,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "documentType": user.document_type_code,
                "documentNumber": user.document_number,
                "address": user.address,
                "phone": user.phone,
                "email": user.email,
                "role": {"id": user.role.id, "name": user.role.name, "label": user.role.label},
                "status": user.status,
                "lastLoginAt": user.last_login_at,
                "createdAt": user.created_at,
                "updatedAt": user.updated_at,
            }
        )


class MeOut(UserOut):
    """GET /auth/me añade el array de permisos del rol."""

    permissions: list[str] = []

    @classmethod
    def from_model_with_permissions(cls, user, permissions: list[str]) -> "MeOut":
        base = UserOut.from_model(user).model_dump(by_alias=True)
        base["permissions"] = permissions
        return cls.model_validate(base)


class CreateUserRequest(InputModel):
    first_name: str
    last_name: str
    document_type: str
    document_number: str
    address: str
    phone: str
    email: str
    password: str
    role: str

    @field_validator("first_name")
    @classmethod
    def _first_name(cls, v: str) -> str:
        return validate_name(v, "Nombre")

    @field_validator("last_name")
    @classmethod
    def _last_name(cls, v: str) -> str:
        return validate_name(v, "Apellido")

    @field_validator("document_type")
    @classmethod
    def _document_type(cls, v: str) -> str:
        if v not in DOCUMENT_TYPES:
            raise ValueError("Selecciona un tipo de documento válido.")
        return v

    @field_validator("address")
    @classmethod
    def _address(cls, v: str) -> str:
        return validate_address(v)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return validate_phone(v)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return validate_email(v)

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        return validate_password(v)

    @field_validator("role")
    @classmethod
    def _role(cls, v: str) -> str:
        if v not in ROLE_NAMES:
            raise ValueError("Selecciona un rol válido.")
        return v

    @model_validator(mode="after")
    def _cross_field(self) -> "CreateUserRequest":
        message = validate_document_number(self.document_type, self.document_number)
        if message:
            raise ValueError(message)
        return self


class UpdateUserRequest(InputModel):
    first_name: str | None = None
    last_name: str | None = None
    document_type: str | None = None
    document_number: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    role: str | None = None

    @field_validator("first_name")
    @classmethod
    def _first_name(cls, v: str | None) -> str | None:
        return validate_name(v, "Nombre") if v is not None else v

    @field_validator("last_name")
    @classmethod
    def _last_name(cls, v: str | None) -> str | None:
        return validate_name(v, "Apellido") if v is not None else v

    @field_validator("document_type")
    @classmethod
    def _document_type(cls, v: str | None) -> str | None:
        if v is not None and v not in DOCUMENT_TYPES:
            raise ValueError("Selecciona un tipo de documento válido.")
        return v

    @field_validator("address")
    @classmethod
    def _address(cls, v: str | None) -> str | None:
        return validate_address(v) if v is not None else v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return validate_phone(v) if v is not None else v

    @field_validator("email")
    @classmethod
    def _email(cls, v: str | None) -> str | None:
        return validate_email(v) if v is not None else v

    @field_validator("role")
    @classmethod
    def _role(cls, v: str | None) -> str | None:
        if v is not None and v not in ROLE_NAMES:
            raise ValueError("Selecciona un rol válido.")
        return v

    @model_validator(mode="after")
    def _cross_field(self) -> "UpdateUserRequest":
        if self.document_type and self.document_number:
            message = validate_document_number(self.document_type, self.document_number)
            if message:
                raise ValueError(message)
        return self


class UpdateUserStatusRequest(InputModel):
    status: str

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        if v not in STATUS_VALUES:
            raise ValueError('El estado debe ser "active" o "inactive".')
        return v


class ListUsersQuery(PaginationQuery):
    role: str | None = None
    status: str | None = None

    @field_validator("role")
    @classmethod
    def _role(cls, v: str | None) -> str | None:
        if v is not None and v not in ROLE_NAMES:
            raise ValueError("Rol no válido.")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        if v is not None and v not in STATUS_VALUES:
            raise ValueError("Estado no válido.")
        return v
