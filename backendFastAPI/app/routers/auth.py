"""Router de autenticación — equivalente de backend/src/routes/auth.routes.js
+ backend/src/controllers/auth.controller.js.

Nota: a diferencia de los demás módulos, este archivo NO usa
`from __future__ import annotations`. `@limiter.limit(...)` (slowapi) envuelve
los endpoints con `functools.wraps`, y FastAPI resuelve las anotaciones
diferidas (PEP 563) con `__globals__` del wrapper — no del módulo original —
por lo que tipos como `LoginRequest` quedan sin resolver. Sin la importación
diferida, las anotaciones ya son objetos reales y ese problema no aparece."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.cookies import REFRESH_COOKIE_NAME, refresh_cookie_kwargs
from app.core.responses import created, ok
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.common import request_context
from app.middleware.rate_limit import (
    FORGOT_PASSWORD_LIMIT,
    FORGOT_PASSWORD_MESSAGE,
    LOGIN_LIMIT,
    LOGIN_MESSAGE,
    REGISTER_LIMIT,
    REGISTER_MESSAGE,
    limiter,
)
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
)
from app.services.auth import RequestContext, auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def _set_refresh_cookie(response, refresh: dict):
    response.set_cookie(
        REFRESH_COOKIE_NAME, refresh["raw_token"], **refresh_cookie_kwargs(refresh["max_age_ms"])
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/auth")


@router.post("/register", summary="Registrar un nuevo cliente")
@limiter.limit(REGISTER_LIMIT, error_message=REGISTER_MESSAGE)
def register(request: Request, dto: RegisterRequest, db: Session = Depends(get_db)):
    ctx = request_context(request)
    user = auth_service.register(db, dto, ctx)
    return created(data=user, message="Registro exitoso. Ya puedes iniciar sesión.")


@router.post("/login", summary="Iniciar sesión")
@limiter.limit(LOGIN_LIMIT, error_message=LOGIN_MESSAGE)
def login(request: Request, dto: LoginRequest, db: Session = Depends(get_db)):
    ctx = request_context(request)
    result = auth_service.login(db, dto.email, dto.password, dto.remember, ctx)

    response = ok(data={"user": result["user"], "accessToken": result["access_token"]}, message="Inicio de sesión exitoso.")
    _set_refresh_cookie(response, result["refresh"])
    return response


@router.post("/refresh", summary="Renovar el access token")
def refresh(request: Request, db: Session = Depends(get_db)):
    ctx = request_context(request)
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    result = auth_service.refresh(db, raw_token, ctx)

    response = ok(data={"user": result["user"], "accessToken": result["access_token"]}, message="Sesión renovada.")
    _set_refresh_cookie(response, result["refresh"])
    return response


@router.post("/logout", summary="Cerrar sesión")
def logout(request: Request, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    auth_service.logout(db, raw_token)

    response = ok(data=None, message="Sesión cerrada.")
    _clear_refresh_cookie(response)
    return response


@router.get("/me", summary="Perfil del usuario autenticado")
def me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = auth_service.me(db, user.id)
    return ok(data=profile)


@router.patch("/me", summary="Actualizar el perfil propio")
def update_me(
    dto: UpdateProfileRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    profile = auth_service.update_profile(db, user.id, dto)
    return ok(data=profile, message="Perfil actualizado correctamente.")


@router.patch("/me/password", summary="Cambiar la contraseña propia")
def change_my_password(
    dto: ChangePasswordRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    auth_service.change_password(db, user.id, dto.current_password, dto.new_password)
    return ok(data=None, message="Contraseña actualizada correctamente.")


@router.post("/forgot-password", summary="Solicitar recuperación de contraseña")
@limiter.limit(FORGOT_PASSWORD_LIMIT, error_message=FORGOT_PASSWORD_MESSAGE)
def forgot_password(request: Request, dto: ForgotPasswordRequest, db: Session = Depends(get_db)):
    result = auth_service.forgot_password(db, dto.email)
    return ok(data={"resetToken": result.get("reset_token")}, message=result["message"])


@router.post("/reset-password", summary="Restablecer contraseña con token")
def reset_password(dto: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(db, dto.token, dto.password)
    return ok(data=None, message="Contraseña restablecida correctamente. Ya puedes iniciar sesión.")
