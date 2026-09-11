"""
Envío de correo por SMTP — sin dependencias nuevas (`smtplib` es de la
librería estándar de Python).

Con `MAIL_ENABLED=false` (valor por defecto) no se abre ninguna conexión:
el asunto y el cuerpo en texto plano se escriben en el log, para poder
desarrollar y probar el flujo de recuperación de contraseña sin una bandeja
de correo configurada. `send_email()` nunca lanza excepciones — se llama
siempre desde una `BackgroundTask` después de que la respuesta HTTP ya se
envió, así que un fallo de SMTP no debe romper nada; solo se loguea.
"""

from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.core.logger import logger


def send_email(to: str, subject: str, html_body: str, text_body: str) -> None:
    if not settings.MAIL_ENABLED:
        logger.info(
            "MAIL_ENABLED=false — correo no enviado, se registra en el log",
            {"to": to, "subject": subject, "body": text_body},
        )
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    try:
        if settings.SMTP_SECURITY == "ssl":
            with smtplib.SMTP_SSL(
                settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT_SECONDS
            ) as server:
                _authenticate_and_send(server, message)
        else:
            with smtplib.SMTP(
                settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT_SECONDS
            ) as server:
                if settings.SMTP_SECURITY == "starttls":
                    server.starttls()
                _authenticate_and_send(server, message)
        logger.info("Correo enviado", {"to": to, "subject": subject})
    except Exception as error:  # noqa: BLE001 - fire-and-forget, nunca debe propagar
        logger.error("No se pudo enviar el correo", {"to": to, "subject": subject, "error": str(error)})


def _authenticate_and_send(server: smtplib.SMTP, message: EmailMessage) -> None:
    if settings.SMTP_USER:
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    server.send_message(message)
