"""
Transporte de correo por SMTP (proveedor: Brevo) — sin dependencias nuevas:
`smtplib` y `email` son de la librería estándar de Python.

`deliver()` envía un `OutgoingEmail` y devuelve qué pasó; **nunca lanza**.
Quién decide *cuándo* se envía es `app/core/mail_outbox.py` (solo tras el
commit de la petición); aquí solo se habla con el servidor SMTP.

- Con `MAIL_ENABLED=false` no se abre ninguna conexión: el correo se escribe
  en el log y el resultado es `skipped`. Así se desarrolla en local sin buzón.
- Los errores transitorios (timeout, conexión caída, respuestas 4xx) se
  reintentan `SMTP_MAX_RETRIES` veces con espera exponencial. Los permanentes
  (5xx, credenciales inválidas, remitente sin verificar) fallan a la primera:
  repetirlos solo gastaría tiempo y cuota.
- STARTTLS y SSL verifican el certificado del servidor contra las CA del
  sistema (`starttls()` sin contexto no lo hace). `SMTP_TLS_VERIFY=false`
  mantiene el cifrado pero sin verificar: solo como último recurso.
"""

from __future__ import annotations

import smtplib
import ssl
import time
from dataclasses import dataclass, field
from email.message import EmailMessage
from functools import lru_cache
from email.utils import formatdate, make_msgid, parseaddr
from typing import Literal

from app.core.config import settings
from app.core.email_templates import LOGO_CID, LOGO_PATH
from app.core.logger import logger

DeliveryStatus = Literal["sent", "failed", "skipped"]

SUBJECT_MAX_LENGTH = 200
ERROR_MAX_LENGTH = 500


@dataclass(frozen=True)
class Attachment:
    filename: str
    content: bytes
    mime: str = "application/pdf"


@dataclass
class OutgoingEmail:
    """Un correo listo para enviar, más lo necesario para registrarlo en `email_logs`."""

    to: str
    subject: str
    html: str
    text: str
    kind: str
    entity: str | None = None
    entity_id: int | None = None
    user_id: int | None = None
    attachments: list[Attachment] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.to = self.to.strip()
        # Un salto de línea en el asunto permitiría inyectar cabeceras; además
        # el asunto de una PQR es texto libre del formulario público.
        self.subject = " ".join(self.subject.split())[:SUBJECT_MAX_LENGTH]


@dataclass(frozen=True)
class DeliveryResult:
    status: DeliveryStatus
    attempts: int
    error: str | None = None


def deliver(email: OutgoingEmail) -> DeliveryResult:
    if not settings.MAIL_ENABLED:
        logger.info(
            "MAIL_ENABLED=false — correo no enviado, se registra en el log",
            {
                "kind": email.kind,
                "to": email.to,
                "subject": email.subject,
                "attachments": [f"{a.filename} ({len(a.content)} bytes)" for a in email.attachments],
                "body": email.text,
            },
        )
        return DeliveryResult(status="skipped", attempts=0)

    try:
        message = _build_message(email)
    except (ValueError, TypeError) as error:
        # Dirección o cabecera mal formada: no tiene sentido reintentar.
        return _failed(email, attempts=0, error=error)

    max_attempts = 1 + settings.SMTP_MAX_RETRIES
    for attempt in range(1, max_attempts + 1):
        try:
            _send(message)
            logger.info("Correo enviado", {"kind": email.kind, "to": email.to, "attempts": attempt})
            return DeliveryResult(status="sent", attempts=attempt)
        except Exception as error:  # noqa: BLE001 - deliver() nunca debe propagar
            if attempt == max_attempts or not _is_transient(error):
                return _failed(email, attempts=attempt, error=error)
            wait = settings.SMTP_RETRY_BACKOFF_SECONDS * 2 ** (attempt - 1)
            logger.warn(
                "Fallo transitorio de SMTP, se reintenta",
                {"kind": email.kind, "to": email.to, "attempt": attempt, "waitSeconds": wait, "error": str(error)},
            )
            time.sleep(wait)

    return _failed(email, attempts=max_attempts, error=RuntimeError("Sin intentos de envío"))


def _build_message(email: OutgoingEmail) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = email.subject
    message["From"] = settings.SMTP_FROM
    message["To"] = email.to
    if settings.MAIL_REPLY_TO:
        message["Reply-To"] = settings.MAIL_REPLY_TO
    message["Date"] = formatdate(localtime=True)
    sender_domain = parseaddr(settings.SMTP_FROM)[1].rpartition("@")[2] or None
    message["Message-ID"] = make_msgid(domain=sender_domain)

    message.set_content(email.text)
    message.add_alternative(email.html, subtype="html")
    # El logo va dentro del correo (multipart/related) y no como enlace
    # remoto: se ve aunque el cliente bloquee imágenes externas. Tiene que
    # añadirse antes que los adjuntos, que convierten el mensaje en `mixed`.
    if f"cid:{LOGO_CID}" in email.html:
        html_part = message.get_payload()[1]
        html_part.add_related(
            _logo_bytes(), maintype="image", subtype="png",
            cid=f"<{LOGO_CID}>", filename="beautylux-logo.png", disposition="inline",
        )
    for attachment in email.attachments:
        maintype, _, subtype = attachment.mime.partition("/")
        message.add_attachment(
            attachment.content, maintype=maintype, subtype=subtype or "octet-stream", filename=attachment.filename
        )
    return message


def _tls_context() -> ssl.SSLContext:
    context = ssl.create_default_context()
    if not settings.SMTP_TLS_VERIFY:
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
    return context


@lru_cache(maxsize=1)
def _logo_bytes() -> bytes:
    return LOGO_PATH.read_bytes()


def _send(message: EmailMessage) -> None:
    context = _tls_context()
    timeout = settings.SMTP_TIMEOUT_SECONDS

    if settings.SMTP_SECURITY == "ssl":
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout, context=context) as server:
            _authenticate_and_send(server, message)
        return

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout) as server:
        if settings.SMTP_SECURITY == "starttls":
            server.starttls(context=context)
        _authenticate_and_send(server, message)


def _authenticate_and_send(server: smtplib.SMTP, message: EmailMessage) -> None:
    if settings.SMTP_USER:
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    server.send_message(message)


def _is_transient(error: Exception) -> bool:
    """Decide si vale la pena reintentar. Ojo con el orden: en `smtplib`
    todas las excepciones heredan de `OSError`."""
    if isinstance(error, smtplib.SMTPResponseException):
        return 400 <= error.smtp_code < 500
    if isinstance(error, smtplib.SMTPRecipientsRefused):
        codes = [code for code, _ in error.recipients.values()]
        return bool(codes) and all(400 <= code < 500 for code in codes)
    if isinstance(error, smtplib.SMTPServerDisconnected):
        return True
    if isinstance(error, (smtplib.SMTPException, ssl.SSLCertVerificationError)):
        return False
    return isinstance(error, OSError)  # timeouts, conexión rechazada, DNS


def _failed(email: OutgoingEmail, *, attempts: int, error: Exception) -> DeliveryResult:
    detail = f"{type(error).__name__}: {error}"[:ERROR_MAX_LENGTH]
    logger.error(
        "No se pudo enviar el correo", {"kind": email.kind, "to": email.to, "attempts": attempts, "error": detail}
    )
    return DeliveryResult(status="failed", attempts=attempts, error=detail)
