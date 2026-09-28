"""
Rate limiting — equivalente de backend/src/middlewares/rateLimit.js.

`limiter` se aplica como middleware global (300/15min) y como decorador en
las rutas sensibles con clave por IP (registro, PQR, chat, correo de prueba).

Login y recuperación de contraseña cuentan por **IP + email**, igual que
`keyGenerator` en Node: `slowapi` arma la clave antes de que el body esté
disponible, así que esas dos rutas llaman a `enforce_identity_limit()` ya
con el email validado. Contar solo por IP hacía que todos los que salen por
la misma IP pública (un salón de clase, la colección de Postman) compartieran
los 5 intentos de login cada 15 minutos.
"""

from __future__ import annotations

from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import settings
from app.core.errors import TooManyRequestsError

GENERAL_LIMIT = "300/15minute"
LOGIN_LIMIT = "5/15minute"
REGISTER_LIMIT = "10/hour"
FORGOT_PASSWORD_LIMIT = "3/hour"
CHAT_MESSAGE_LIMIT = "20/15minute"
# Cada PQR radicada dispara un correo a un destinatario que escribe quien la
# radica: sin este tope, el formulario público serviría para mandar correo a
# cualquiera en nombre de BeautyLux y agotaría la cuota diaria de Brevo.
PQR_CREATE_LIMIT = "10/hour"
EMAIL_TEST_LIMIT = "5/15minute"

GENERAL_MESSAGE = "Demasiadas peticiones, inténtalo de nuevo en unos minutos."
LOGIN_MESSAGE = "Demasiados intentos de inicio de sesión. Espera unos minutos."
REGISTER_MESSAGE = "Demasiados registros desde esta red. Inténtalo más tarde."
FORGOT_PASSWORD_MESSAGE = "Demasiadas solicitudes de recuperación. Inténtalo más tarde."
CHAT_MESSAGE_MESSAGE = "Demasiados mensajes seguidos. Espera un momento antes de escribir otra vez."
PQR_CREATE_MESSAGE = "Ya radicaste varias PQR en la última hora. Inténtalo más tarde."
EMAIL_TEST_MESSAGE = "Demasiados correos de prueba seguidos. Espera unos minutos."

# `default_limits` aplica el límite general (300/15min) a TODA petición,
# igual que `generalLimiter` montado antes de las rutas en app.js. Los
# decoradores @limiter.limit(...) en rutas puntuales (registro, PQR, chat,
# correo de prueba) añaden un límite más estricto encima de ese default.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=not settings.is_test,
    default_limits=[GENERAL_LIMIT],
)

# Ventana fija, como `express-rate-limit`. En memoria del proceso, igual que
# el `limiter` de slowapi (Render corre un solo proceso de uvicorn).
_identity_limiter = FixedWindowRateLimiter(MemoryStorage())


def enforce_identity_limit(request: Request, *, scope: str, limit: str, identity: str, message: str) -> None:
    """Cuenta un intento de `scope` para la pareja IP + identidad (el email).

    La IP sale de `get_remote_address` y no de `X-Forwarded-For` crudo, que
    el cliente puede falsificar: detrás de Render, `--proxy-headers` ya deja
    la IP real en `request.client`.
    """
    if not limiter.enabled:
        return
    key = f"{get_remote_address(request)}:{identity.strip().lower()}"
    if not _identity_limiter.hit(parse(limit), scope, key):
        raise TooManyRequestsError(message)
