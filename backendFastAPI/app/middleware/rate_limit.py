"""
Rate limiting — equivalente de backend/src/middlewares/rateLimit.js.

`limiter` se aplica como middleware global (300/15min) y como decorador en
las rutas sensibles (login, registro, recuperación de contraseña).

Diferencia con Node: los limitadores de login y recuperación de contraseña
en Express combinan IP + email como clave; `slowapi` resuelve la clave de
forma síncrona antes de que el body async esté disponible, así que aquí se
limita solo por IP. El comportamiento observable (código `RATE_LIMITED`,
mismas ventanas y límites) se conserva igual.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

GENERAL_LIMIT = "300/15minute"
LOGIN_LIMIT = "5/15minute"
REGISTER_LIMIT = "10/hour"
FORGOT_PASSWORD_LIMIT = "3/hour"
CHAT_MESSAGE_LIMIT = "20/15minute"

GENERAL_MESSAGE = "Demasiadas peticiones, inténtalo de nuevo en unos minutos."
LOGIN_MESSAGE = "Demasiados intentos de inicio de sesión. Espera unos minutos."
REGISTER_MESSAGE = "Demasiados registros desde esta red. Inténtalo más tarde."
FORGOT_PASSWORD_MESSAGE = "Demasiadas solicitudes de recuperación. Inténtalo más tarde."
CHAT_MESSAGE_MESSAGE = "Demasiados mensajes seguidos. Espera un momento antes de escribir otra vez."

# `default_limits` aplica el límite general (300/15min) a TODA petición,
# igual que `generalLimiter` montado antes de las rutas en app.js. Los
# decoradores @limiter.limit(...) en rutas puntuales (login, registro,
# forgot-password) añaden un límite más estricto encima de ese default.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=not settings.is_test,
    default_limits=[GENERAL_LIMIT],
)
