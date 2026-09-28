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

from pydantic import Field, field_validator, model_validator
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
    # Uno o varios orígenes separados por coma: en producción van el dominio
    # de Vercel y sus previews, además de localhost para desarrollo.
    CORS_ORIGIN: str = Field(min_length=1)

    # Cookie de refresh. En local basta `lax`; con el frontend en Vercel y la
    # API en Render (dominios distintos) hace falta `none`, que el navegador
    # solo acepta con `Secure`. Sin valor, `Secure` se activa en producción.
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    COOKIE_SECURE: bool | None = None

    # Base de datos
    DB_HOST: str = Field(min_length=1)
    DB_PORT: int = Field(default=3306, gt=0)
    DB_USER: str = Field(min_length=1)
    DB_PASSWORD: str = ""
    DB_NAME: str = Field(min_length=1)
    DB_CONNECTION_LIMIT: int = Field(default=10, gt=0)
    # Ruta al certificado CA del servidor MySQL (Aiven exige TLS). Vacía en
    # local: la conexión sigue sin TLS, igual que antes.
    DB_SSL_CA: str = ""

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

    # Correo (SMTP, proveedor Brevo). Con MAIL_ENABLED=false no se envía nada:
    # el correo se escribe en el log y queda en `email_logs` como `skipped`.
    # El puerto es 2525 a propósito: el plan gratuito de Render bloquea la
    # salida a 25, 465 y 587, y Brevo también escucha en 2525 con STARTTLS.
    # El host es el nombre heredado de Brevo (antes Sendinblue): resuelve al
    # mismo servidor que `smtp-relay.brevo.com`, pero su certificado TLS solo
    # es válido para `smtp-relay.sendinblue.com`, así que con el nombre nuevo
    # la verificación del certificado falla (comprobado el 2026-09-27).
    MAIL_ENABLED: bool = False
    SMTP_HOST: str = "smtp-relay.sendinblue.com"
    SMTP_PORT: int = Field(default=2525, gt=0)
    # Login SMTP del panel de Brevo (SMTP & API > SMTP) y la clave SMTP, no la API key.
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    # Debe ser un remitente verificado en Brevo.
    SMTP_FROM: str = "BeautyLux <no-reply@beautylux.com>"
    SMTP_SECURITY: Literal["starttls", "ssl", "none"] = "starttls"
    SMTP_TIMEOUT_SECONDS: int = Field(default=10, gt=0)
    # Verificar el certificado del servidor SMTP. Solo se apaga como último
    # recurso, si el nodo de Brevo que atiende presenta otro nombre.
    SMTP_TLS_VERIFY: bool = True
    SMTP_MAX_RETRIES: int = Field(default=2, ge=0, le=5)
    SMTP_RETRY_BACKOFF_SECONDS: float = Field(default=2, ge=0)
    # Brevo reescribe un remitente Gmail a @brevosend.com: Reply-To hace que
    # las respuestas de los clientes lleguen al buzón real.
    MAIL_REPLY_TO: str = ""

    # Chatbot con IA (etapa 12). Con AI_ENABLED=false, o sin GEMINI_API_KEY,
    # el chat sigue funcionando con respuestas de respaldo por FAQ local —
    # nunca se cae por falta de credenciales.
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    AI_MODEL: str = "gemini-3.5-flash-lite"
    AI_ENABLED: bool = False

    @field_validator("JWT_ACCESS_SECRET")
    @classmethod
    def _validate_secret_length(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("JWT_ACCESS_SECRET debe tener al menos 32 caracteres")
        return value

    @model_validator(mode="after")
    def _validate_cookie_policy(self) -> "Settings":
        if self.COOKIE_SAMESITE == "none" and not self.cookie_secure:
            raise ValueError("COOKIE_SAMESITE=none exige COOKIE_SECURE=true (el navegador rechaza la cookie sin Secure)")
        return self

    @model_validator(mode="after")
    def _validate_mail_credentials(self) -> "Settings":
        if self.MAIL_ENABLED:
            missing = [
                name for name in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM") if not getattr(self, name).strip()
            ]
            if missing:
                raise ValueError(
                    f"MAIL_ENABLED=true exige {', '.join(missing)} (login y clave SMTP del panel de Brevo)"
                )
        return self

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.CORS_ORIGIN.split(",") if origin.strip()]

    @property
    def cookie_secure(self) -> bool:
        return self.is_production if self.COOKIE_SECURE is None else self.COOKIE_SECURE

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
