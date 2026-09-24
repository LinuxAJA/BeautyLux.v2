"""
Plantillas de correo (HTML + texto plano): recuperación de contraseña y PQR
(quinto avance, requisito 16). Sin motor de plantillas: son funciones que
devuelven strings, suficiente para un puñado de correos fijos.
"""

from __future__ import annotations

from app.core.config import settings

_GRADIENT = "linear-gradient(135deg, #E9638F, #F28CA6)"

_BASE_STYLE = """
    body { margin: 0; padding: 0; background-color: #f7f3f4; font-family: Arial, Helvetica, sans-serif; }
    .wrapper { max-width: 480px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { background: %(gradient)s; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; }
    .body { padding: 32px; color: #3a2a2f; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; margin: 20px 0; padding: 12px 28px; border-radius: 999px;
              background: %(gradient)s; color: #ffffff !important; text-decoration: none; font-weight: 600; }
    .muted { color: #8a7378; font-size: 13px; }
    .footer { padding: 20px 32px; text-align: center; color: #8a7378; font-size: 12px; }
""" % {"gradient": _GRADIENT}


def _wrap(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><style>{_BASE_STYLE}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header"><h1>BeautyLux</h1></div>
      <div class="body">
        <h2 style="margin-top:0;">{title}</h2>
        {body_html}
      </div>
      <div class="footer">Este es un correo automático de BeautyLux — Cuarto Avance (React + FastAPI).</div>
    </div>
  </div>
</body>
</html>"""


def password_reset_requested(*, first_name: str, reset_url: str, ttl_minutes: int) -> tuple[str, str, str]:
    """Devuelve (subject, html_body, text_body) para el correo de solicitud de recuperación."""
    subject = "Recupera tu contraseña de BeautyLux"

    html_body = _wrap(
        "Recupera tu contraseña",
        f"""
        <p>Hola {first_name},</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en BeautyLux.
        Haz clic en el siguiente botón para crear una nueva:</p>
        <p style="text-align:center;">
          <a class="button" href="{reset_url}">Crear nueva contraseña</a>
        </p>
        <p class="muted">Este enlace caduca en {ttl_minutes} minutos y solo puede usarse una vez.</p>
        <p class="muted">Si no fuiste tú quien solicitó este cambio, puedes ignorar este correo:
        tu contraseña actual seguirá funcionando con normalidad.</p>
        """,
    )

    text_body = (
        f"Hola {first_name},\n\n"
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta en BeautyLux.\n"
        f"Abre este enlace para crear una nueva contraseña (caduca en {ttl_minutes} minutos):\n\n"
        f"{reset_url}\n\n"
        "Si no fuiste tú, puedes ignorar este correo: tu contraseña actual seguirá funcionando.\n"
    )

    return subject, html_body, text_body


def password_reset_completed(*, first_name: str) -> tuple[str, str, str]:
    """Correo de confirmación tras un restablecimiento exitoso (buena práctica de seguridad:
    si no fuiste tú, te enteras de inmediato)."""
    subject = "Tu contraseña de BeautyLux fue actualizada"

    html_body = _wrap(
        "Contraseña actualizada",
        f"""
        <p>Hola {first_name},</p>
        <p>Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con ella.</p>
        <p class="muted">Si no fuiste tú quien hizo este cambio, contacta al administrador de
        inmediato: alguien más podría tener acceso a tu cuenta.</p>
        """,
    )

    text_body = (
        f"Hola {first_name},\n\n"
        "Tu contraseña de BeautyLux se actualizó correctamente.\n\n"
        "Si no fuiste tú quien hizo este cambio, contacta al administrador de inmediato.\n"
    )

    return subject, html_body, text_body


def build_reset_url(token: str) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    return f"{base}/restablecer-contrasena?token={token}"


def pqr_received(*, first_name: str, ticket_number: str, subject: str) -> tuple[str, str, str]:
    """Confirmación al radicar una PQR: el número de ticket es lo único que
    hace falta para consultarla después (junto con el correo de contacto)."""
    mail_subject = f"Recibimos tu PQR {ticket_number} — BeautyLux"

    html_body = _wrap(
        "Recibimos tu mensaje",
        f"""
        <p>Hola {first_name},</p>
        <p>Registramos tu petición, queja, reclamo o sugerencia sobre
        «{subject}» con el número de seguimiento:</p>
        <p style="text-align:center; font-size:20px; font-weight:700; color:#D84A76;">
          {ticket_number}
        </p>
        <p>Guárdalo: con él y tu correo puedes consultar el estado en cualquier
        momento, sin necesidad de iniciar sesión.</p>
        <p class="muted">Nuestro equipo te responderá lo antes posible.</p>
        """,
    )

    text_body = (
        f"Hola {first_name},\n\n"
        f"Registramos tu PQR sobre «{subject}» con el número de seguimiento {ticket_number}.\n"
        "Guárdalo: con él y tu correo puedes consultar el estado sin iniciar sesión.\n\n"
        "Nuestro equipo te responderá lo antes posible.\n"
    )

    return mail_subject, html_body, text_body


def pqr_answered(*, first_name: str, ticket_number: str, response: str) -> tuple[str, str, str]:
    """Notificación cuando el equipo responde una PQR."""
    mail_subject = f"Respondimos tu PQR {ticket_number} — BeautyLux"

    html_body = _wrap(
        "Tu PQR tiene respuesta",
        f"""
        <p>Hola {first_name},</p>
        <p>Ya respondimos tu PQR <strong>{ticket_number}</strong>:</p>
        <p style="background:#f7f3f4; border-radius:12px; padding:16px; white-space:pre-line;">
          {response}
        </p>
        <p class="muted">Si necesitas algo más, puedes radicar una nueva PQR desde el sitio.</p>
        """,
    )

    text_body = (
        f"Hola {first_name},\n\n"
        f"Ya respondimos tu PQR {ticket_number}:\n\n"
        f"{response}\n\n"
        "Si necesitas algo más, puedes radicar una nueva PQR desde el sitio.\n"
    )

    return mail_subject, html_body, text_body
