"""
Configuración de la aplicación — equivalente de backend/src/config/env.js.

Usa pydantic-settings para leer y validar las variables de entorno desde `.env`.
Si falta algo obligatorio o un valor no cumple sus restricciones, el proceso
falla al arrancar con un mensaje claro (igual que `envSchema.safeParse` en Node).
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    ENVIRONMENT: Literal["development", "production", "test"] = "development"
    PORT: int = Field(default=8000, gt=0)
    API_PREFIX: str = Field(default="/api", min_length=1)
    CORS_ORIGIN: str = Field(min_length=1)

    # Base de datos
    DB_HOST: str = Field(min_length=1)
    DB_PORT: int = Field(default=3306, gt=0)
    DB_USER: str = Field(min_length=1)
    DB_PASSWORD: str = ""
    DB_NAME: str = Field(min_length=1)
    DB_CONNECTION_LIMIT: int = Field(default=10, gt=0)

    # JWT
    JWT_ACCESS_SECRET: str = Field(min_length=32)
    JWT_ACCESS_EXPIRES_IN: str = Field(default="15m", min_length=1)
    JWT_ISSUER: str = Field(default="beautylux-api", min_length=1)
    JWT_AUDIENCE: str = Field(default="beautylux-web", min_length=1)

    # Seguridad / TTL
    BCRYPT_ROUNDS: int = Field(default=12, ge=8, le=15)
    REFRESH_TTL_DAYS: int = Field(default=7, gt=0)
    REFRESH_TTL_REMEMBER_DAYS: int = Field(default=30, gt=0)
    PASSWORD_RESET_TTL_MINUTES: int = Field(default=30, gt=0)
    EXPOSE_RESET_TOKEN: bool = False

    # Frontend (para construir el enlace del correo de recuperación)
    FRONTEND_URL: str = Field(default="http://localhost:5173", min_length=1)

    # Datos del negocio para la cabecera de facturas y reportes (etapas 7 y 8).
    # Los mismos que muestra el pie de pagina del frontend
    # (frontend/src/data/navLinks.js -> contactInfo), para que coincidan.
    BUSINESS_NAME: str = "BeautyLux"
    BUSINESS_NIT: str = "900.123.456-7"
    BUSINESS_ADDRESS: str = "Calle 45 #23-18, Barrio La Castellana, Bogota D.C."
    BUSINESS_PHONE: str = "+57 320 456 7890"
    BUSINESS_EMAIL: str = "hola@beautylux.com"

    # Correo (SMTP). Con MAIL_ENABLED=false no se envía nada: el enlace se escribe en el log.
    MAIL_ENABLED: bool = False
    SMTP_HOST: str = "sandbox.smtp.mailtrap.io"
    SMTP_PORT: int = Field(default=2525, gt=0)
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "BeautyLux <no-reply@beautylux.com>"
    SMTP_SECURITY: Literal["starttls", "ssl", "none"] = "starttls"
    SMTP_TIMEOUT_SECONDS: int = Field(default=10, gt=0)

    @field_validator("JWT_ACCESS_SECRET")
    @classmethod
    def _validate_secret_length(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("JWT_ACCESS_SECRET debe tener al menos 32 caracteres")
        return value

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_test(self) -> bool:
        return self.ENVIRONMENT == "test"

    @property
    def jwt_access_expires_seconds(self) -> int:
        """Convierte JWT_ACCESS_EXPIRES_IN ('15m', '1h', '30s', '2d') a segundos."""
        value = self.JWT_ACCESS_EXPIRES_IN.strip()
        units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        if value[-1] in units:
            return int(value[:-1]) * units[value[-1]]
        return int(value)


def _load_settings() -> Settings:
    try:
        return Settings()  # type: ignore[call-arg]
    except Exception as error:  # noqa: BLE001
        print("\n[env] Variables de entorno inválidas o faltantes:\n", file=sys.stderr)
        print(f"  {error}", file=sys.stderr)
        print("\nRevisa tu archivo .env contra .env.example y vuelve a intentarlo.\n", file=sys.stderr)
        sys.exit(1)


settings = _load_settings()
