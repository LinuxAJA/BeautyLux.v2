"""
Hashing de contraseñas — equivalente de backend/src/utils/password.js.

bcrypt con el número de rondas configurado (12 por defecto), más un hash
"señuelo" para que el login tarde lo mismo exista o no la cuenta (mitiga
enumeración de usuarios por tiempo de respuesta).
"""

from __future__ import annotations

import bcrypt

from app.core.config import settings

_DUMMY_PASSWORD = "dummy-password-for-timing-safety"
_dummy_hash_cache: str | None = None


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def compare_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def get_dummy_hash() -> str:
    """Cachea el hash señuelo en memoria, igual que la promesa cacheada en Node."""
    global _dummy_hash_cache
    if _dummy_hash_cache is None:
        _dummy_hash_cache = hash_password(_DUMMY_PASSWORD)
    return _dummy_hash_cache
