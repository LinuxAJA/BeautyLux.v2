"""
Access tokens JWT — equivalente de backend/src/utils/jwt.js.

Mismos claims (`sub`, `role`, `status`, `iss`, `aud`, `iat`, `exp`), mismo
algoritmo (HS256) y el mismo código de error `TOKEN_EXPIRED` que el frontend
necesita para disparar su auto-refresh (ver frontend/src/services/api.js).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt as jose_jwt
from jose.exceptions import ExpiredSignatureError

from app.core.config import settings
from app.core.errors import UnauthorizedError

ALGORITHM = "HS256"


def sign_access_token(user_id: int, role_name: str, status: str) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=settings.jwt_access_expires_seconds)
    payload = {
        # python-jose exige que "sub" sea string (JWTClaimsError si es int);
        # jsonwebtoken en Node no lo exige, así que Node emitía `sub` numérico.
        # Se castea a string aquí; los consumidores hacen int(payload["sub"]).
        "sub": str(user_id),
        "role": role_name,
        "status": status,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
    }
    return jose_jwt.encode(payload, settings.JWT_ACCESS_SECRET, algorithm=ALGORITHM)


def verify_access_token(token: str) -> dict[str, Any]:
    try:
        return jose_jwt.decode(
            token,
            settings.JWT_ACCESS_SECRET,
            algorithms=[ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
    except ExpiredSignatureError as error:
        raise UnauthorizedError("El token de acceso expiró", "TOKEN_EXPIRED") from error
    except JWTError as error:
        raise UnauthorizedError("Token de acceso inválido", "UNAUTHENTICATED") from error
