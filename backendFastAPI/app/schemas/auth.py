"""Schemas de autenticación — equivalente de backend/src/validations/auth.validation.js."""

from __future__ import annotations

from pydantic import field_validator, model_validator

from app.schemas.common import (
    DOCUMENT_TYPES,
    InputModel,
    validate_address,
    validate_document_number,
    validate_email,
    validate_name,
    validate_password,
    validate_phone,
)


class RegisterRequest(InputModel):
    first_name: str
    last_name: str
    document_type: str
    document_number: str
    address: str
    phone: str
    email: str
    password: str
    confirm_password: str

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

    @model_validator(mode="after")
    def _cross_field(self) -> "RegisterRequest":
        message = validate_document_number(self.document_type, self.document_number)
        if message:
            raise ValueError(message)
        if self.password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden.")
        return self


class LoginRequest(InputModel):
    email: str
    password: str
    remember: bool = False

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return validate_email(v)

    @field_validator("password")
    @classmethod
    def _password_required(cls, v: str) -> str:
        if len(v) < 1:
            raise ValueError("La contraseña es obligatoria.")
        return v


class UpdateProfileRequest(InputModel):
    first_name: str | None = None
    last_name: str | None = None
    address: str | None = None
    phone: str | None = None

    @field_validator("first_name")
    @classmethod
    def _first_name(cls, v: str | None) -> str | None:
        return validate_name(v, "Nombre") if v is not None else v

    @field_validator("last_name")
    @classmethod
    def _last_name(cls, v: str | None) -> str | None:
        return validate_name(v, "Apellido") if v is not None else v

    @field_validator("address")
    @classmethod
    def _address(cls, v: str | None) -> str | None:
        return validate_address(v) if v is not None else v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return validate_phone(v) if v is not None else v


class ChangePasswordRequest(InputModel):
    current_password: str
    new_password: str
    confirm_new_password: str

    @field_validator("current_password")
    @classmethod
    def _current_required(cls, v: str) -> str:
        if len(v) < 1:
            raise ValueError("Debes ingresar tu contraseña actual.")
        return v

    @field_validator("new_password")
    @classmethod
    def _new_password(cls, v: str) -> str:
        return validate_password(v)

    @model_validator(mode="after")
    def _match(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_new_password:
            raise ValueError("Las contraseñas no coinciden.")
        return self


class ForgotPasswordRequest(InputModel):
    email: str

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return validate_email(v)


class ResetPasswordRequest(InputModel):
    token: str
    password: str
    confirm_password: str

    @field_validator("token")
    @classmethod
    def _token_required(cls, v: str) -> str:
        if len(v) < 1:
            raise ValueError("El token de recuperación es obligatorio.")
        return v

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        return validate_password(v)

    @model_validator(mode="after")
    def _match(self) -> "ResetPasswordRequest":
        if self.password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden.")
        return self
