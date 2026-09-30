"""
Plantillas de correo (HTML + texto plano). Sin motor de plantillas: son
funciones que devuelven un `RenderedEmail`, suficiente para un puñado de
correos fijos.

Reglas de maquetación, porque los clientes de correo no son navegadores:
- Tablas y estilos *inline*. Gmail y Outlook ignoran `<style>`, variables
  CSS y `linear-gradient`, así que los colores de marca van escritos en hex
  (los mismos tokens de `frontend/src/index.css`). La regla de "sin hex
  sueltos" aplica al frontend; aquí no hay alternativa.
- El isotipo es un PNG **incrustado en el propio correo** (`cid:`), no un
  enlace: una URL al frontend fallaba si `FRONTEND_URL` apuntaba a un
  preview protegido de Vercel o a localhost, y los clientes bloquean las
  imágenes remotas por defecto. `mailer.py` adjunta el PNG como parte
  `multipart/related` cuando el HTML lo referencia. Gmail no pinta SVG.
- **Todo valor que llega de fuera pasa por `_esc()`**: nombres, asuntos y
  respuestas de PQR son texto libre, y el formulario de PQR es público.
"""

from __future__ import annotations

from datetime import datetime
from html import escape
from pathlib import Path
from typing import NamedTuple

from app.core.config import settings
from app.core.formatting import format_cop, format_date_long, format_time

# Isotipo incrustado: el HTML lo referencia como `cid:beautylux-logo` y el
# mailer adjunta este archivo con ese Content-ID.
LOGO_CID = "beautylux-logo"
LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "email" / "logo.png"

_BRAND = "#E9638F"
_BRAND_DARK = "#D84A76"
_INK = "#3A2A2F"
_MUTED = "#8A7378"
_PAGE_BG = "#F7F3F4"
_SOFT_BG = "#FDF2F5"
_BORDER = "#F1E4E8"
_SANS = "Arial, Helvetica, sans-serif"
_SERIF = "Georgia, 'Times New Roman', serif"


class RenderedEmail(NamedTuple):
    subject: str
    html: str
    text: str


# ---------------------------------------------------------------------
# Piezas comunes
# ---------------------------------------------------------------------
def _esc(value: object) -> str:
    return escape(str(value), quote=True)


def _site_url(path: str = "") -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}{path}"


def _wrap(*, title: str, preheader: str, body_html: str) -> str:
    """Estructura común: cabecera de marca, contenido y pie con los datos del
    negocio. `title` y `preheader` se escapan aquí; `body_html` ya viene
    armado con los helpers de abajo."""
    site = _esc(_site_url())
    logo = f"cid:{LOGO_CID}"
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>{_esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:{_PAGE_BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{_esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{_PAGE_BG};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:560px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
        <tr>
          <td align="center" bgcolor="{_BRAND}" style="background-color:{_BRAND};padding:28px 32px;">
            <a href="{site}" style="text-decoration:none;">
              <img src="{logo}" width="48" height="48" alt="" style="display:block;margin:0 auto 10px;border:0;">
              <span style="font-family:{_SERIF};font-size:26px;font-weight:bold;color:#FFFFFF;">BeautyLux</span>
            </a>
            <div style="margin-top:4px;font-family:{_SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FFFFFF;">
              Services &amp; Beauty
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;font-family:{_SANS};font-size:15px;line-height:1.6;color:{_INK};">
            <h1 style="margin:0 0 16px;font-family:{_SERIF};font-size:22px;line-height:1.3;color:{_INK};">{_esc(title)}</h1>
            {body_html}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 32px;background-color:{_SOFT_BG};font-family:{_SANS};font-size:12px;line-height:1.6;color:{_MUTED};">
            <strong style="color:{_INK};">{_esc(settings.BUSINESS_NAME)}</strong> · NIT {_esc(settings.BUSINESS_NIT)}<br>
            {_esc(settings.BUSINESS_ADDRESS)}<br>
            {_esc(settings.BUSINESS_PHONE)} · {_esc(settings.BUSINESS_EMAIL)}<br>
            <a href="{site}" style="color:{_BRAND_DARK};">Visitar BeautyLux</a>
            <div style="margin-top:10px;">Este es un correo automático sobre tu cuenta o tus solicitudes en BeautyLux.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>"""


def _text_footer() -> str:
    return (
        "\n--\n"
        f"{settings.BUSINESS_NAME} · NIT {settings.BUSINESS_NIT}\n"
        f"{settings.BUSINESS_ADDRESS}\n"
        f"{settings.BUSINESS_PHONE} · {settings.BUSINESS_EMAIL}\n"
        f"{_site_url()}\n"
    )


def _p(html: str, *, muted: bool = False) -> str:
    style = f"margin:0 0 14px;font-size:{'13px' if muted else '15px'};color:{_MUTED if muted else _INK};"
    return f'<p style="{style}">{html}</p>'


def _button(url: str, label: str) -> str:
    return f"""<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;">
  <tr>
    <td align="center" bgcolor="{_BRAND_DARK}" style="background-color:{_BRAND_DARK};border-radius:999px;">
      <a href="{_esc(url)}" style="display:inline-block;padding:12px 28px;font-family:{_SANS};font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:999px;">{_esc(label)}</a>
    </td>
  </tr>
</table>"""


def _highlight(value: str) -> str:
    """Un número que hay que guardar (ticket, pedido): grande y centrado."""
    return (
        f'<p style="margin:8px 0 20px;text-align:center;font-family:{_SANS};font-size:22px;'
        f'font-weight:bold;letter-spacing:1px;color:{_BRAND_DARK};">{_esc(value)}</p>'
    )


def _quote(text: str) -> str:
    return (
        f'<div style="margin:0 0 16px;padding:16px;border-radius:12px;background-color:{_SOFT_BG};'
        f'white-space:pre-line;color:{_INK};">{_esc(text)}</div>'
    )


def _detail_rows(rows: list[tuple[str, str]]) -> str:
    """Tabla de pares etiqueta/valor (ya formateados, sin escapar)."""
    cells = "".join(
        f'<tr><td style="padding:8px 0;border-bottom:1px solid {_BORDER};color:{_MUTED};font-size:14px;">{_esc(label)}</td>'
        f'<td align="right" style="padding:8px 0;border-bottom:1px solid {_BORDER};font-size:14px;font-weight:bold;">{_esc(value)}</td></tr>'
        for label, value in rows
    )
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:0 0 20px;font-family:{_SANS};color:{_INK};">{cells}</table>'
    )


def _items_table(rows: list[tuple[str, int, str]], totals: list[tuple[str, str, bool]]) -> str:
    """Líneas de una compra (nombre, cantidad, importe ya formateado) y sus
    totales (etiqueta, importe, resaltado)."""
    cell = f"padding:10px 0;border-bottom:1px solid {_BORDER};font-size:14px;"
    lines = "".join(
        f'<tr><td style="{cell}">{_esc(name)}<span style="color:{_MUTED};"> × {quantity}</span></td>'
        f'<td align="right" style="{cell}white-space:nowrap;">{_esc(amount)}</td></tr>'
        for name, quantity, amount in rows
    )
    summary = ""
    for label, amount, strong in totals:
        size = "16px" if strong else "14px"
        label_style = "font-weight:bold;" if strong else f"color:{_MUTED};"
        amount_style = f"font-weight:bold;color:{_BRAND_DARK};" if strong else ""
        summary += (
            f'<tr><td style="padding:6px 0;font-size:{size};{label_style}">{_esc(label)}</td>'
            f'<td align="right" style="padding:6px 0;white-space:nowrap;font-size:{size};{amount_style}">{_esc(amount)}</td></tr>'
        )
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:0 0 20px;font-family:{_SANS};color:{_INK};">{lines}{summary}</table>'
    )


def _section(title: str) -> str:
    return (
        f'<p style="margin:24px 0 8px;font-family:{_SANS};font-size:11px;font-weight:bold;'
        f'letter-spacing:1.5px;text-transform:uppercase;color:{_MUTED};">{_esc(title)}</p>'
    )


# Mismas etiquetas que `frontend/src/data/checkout.js`.
PAYMENT_LABELS = {
    "card": "Tarjeta de crédito o débito",
    "pse": "PSE",
    "nequi": "Nequi",
    "cash": "Efectivo contra entrega",
}
SHIPPING_LABELS = {
    "standard": "Envío estándar",
    "express": "Envío exprés",
    "pickup": "Recoger en tienda",
}
LOCATION_LABELS = {"atelier": "En nuestro atelier", "home": "A domicilio"}


def _appointment_when(appointment) -> str:
    return (
        f"{format_date_long(appointment.scheduled_date)}, "
        f"{format_time(appointment.start_time)} – {format_time(appointment.end_time)}"
    )


def _appointment_rows(appointment) -> list[tuple[str, str]]:
    return [
        ("Cita", appointment.appointment_number),
        ("Servicio", appointment.service_name),
        ("Fecha y hora", _appointment_when(appointment)),
        ("Lugar", LOCATION_LABELS.get(appointment.location, appointment.location)),
    ]


def _rows_as_text(rows: list[tuple[str, str]]) -> str:
    return "".join(f"{label}: {value}\n" for label, value in rows)


# ---------------------------------------------------------------------
# Recuperación de contraseña
# ---------------------------------------------------------------------
def build_reset_url(token: str) -> str:
    return _site_url(f"/restablecer-contrasena?token={token}")


def password_reset_requested(*, first_name: str, reset_url: str, ttl_minutes: int) -> RenderedEmail:
    body = (
        _p(f"Hola {_esc(first_name)},")
        + _p(
            "Recibimos una solicitud para restablecer la contraseña de tu cuenta en BeautyLux. "
            "Usa el siguiente botón para crear una nueva:"
        )
        + _button(reset_url, "Crear nueva contraseña")
        + _p(f"Este enlace caduca en {ttl_minutes} minutos y solo puede usarse una vez.", muted=True)
        + _p(
            "Si no fuiste tú quien solicitó este cambio, ignora este correo: "
            "tu contraseña actual seguirá funcionando con normalidad.",
            muted=True,
        )
    )
    text = (
        f"Hola {first_name},\n\n"
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta en BeautyLux.\n"
        f"Abre este enlace para crear una nueva contraseña (caduca en {ttl_minutes} minutos):\n\n"
        f"{reset_url}\n\n"
        "Si no fuiste tú, ignora este correo: tu contraseña actual seguirá funcionando.\n"
    )
    return RenderedEmail(
        "Recupera tu contraseña de BeautyLux",
        _wrap(title="Recupera tu contraseña", preheader="Crea una nueva contraseña para tu cuenta.", body_html=body),
        text + _text_footer(),
    )


def password_reset_completed(*, first_name: str) -> RenderedEmail:
    """Confirmación tras un restablecimiento exitoso: si no fuiste tú, te
    enteras de inmediato."""
    body = (
        _p(f"Hola {_esc(first_name)},")
        + _p("Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con ella.")
        + _button(_site_url("/login"), "Iniciar sesión")
        + _p(
            "Si no fuiste tú quien hizo este cambio, contáctanos de inmediato: "
            "alguien más podría tener acceso a tu cuenta.",
            muted=True,
        )
    )
    text = (
        f"Hola {first_name},\n\n"
        "Tu contraseña de BeautyLux se actualizó correctamente.\n\n"
        "Si no fuiste tú quien hizo este cambio, contáctanos de inmediato.\n"
    )
    return RenderedEmail(
        "Tu contraseña de BeautyLux fue actualizada",
        _wrap(title="Contraseña actualizada", preheader="El cambio de contraseña se completó.", body_html=body),
        text + _text_footer(),
    )


# ---------------------------------------------------------------------
# PQR
# ---------------------------------------------------------------------
def pqr_received(*, first_name: str, ticket_number: str, subject: str) -> RenderedEmail:
    """Confirmación al radicar: el número de ticket, junto con el correo de
    contacto, es lo único que hace falta para consultarla después."""
    body = (
        _p(f"Hola {_esc(first_name)},")
        + _p(f"Registramos tu petición, queja, reclamo o sugerencia sobre «{_esc(subject)}» con el número de seguimiento:")
        + _highlight(ticket_number)
        + _p("Guárdalo: con él y tu correo puedes consultar el estado en cualquier momento, sin iniciar sesión.")
        + _button(_site_url("/pqr"), "Consultar mi PQR")
        + _p("Nuestro equipo te responderá lo antes posible.", muted=True)
    )
    text = (
        f"Hola {first_name},\n\n"
        f"Registramos tu PQR sobre «{subject}» con el número de seguimiento {ticket_number}.\n"
        "Guárdalo: con él y tu correo puedes consultar el estado sin iniciar sesión:\n"
        f"{_site_url('/pqr')}\n\n"
        "Nuestro equipo te responderá lo antes posible.\n"
    )
    return RenderedEmail(
        f"Recibimos tu PQR {ticket_number} — BeautyLux",
        _wrap(title="Recibimos tu mensaje", preheader=f"Tu número de seguimiento es {ticket_number}.", body_html=body),
        text + _text_footer(),
    )


def pqr_answered(*, first_name: str, ticket_number: str, response: str) -> RenderedEmail:
    body = (
        _p(f"Hola {_esc(first_name)},")
        + _p(f"Ya respondimos tu PQR <strong>{_esc(ticket_number)}</strong>:")
        + _quote(response)
        + _p("Si necesitas algo más, puedes radicar una nueva PQR desde el sitio.", muted=True)
    )
    text = (
        f"Hola {first_name},\n\n"
        f"Ya respondimos tu PQR {ticket_number}:\n\n"
        f"{response}\n\n"
        "Si necesitas algo más, puedes radicar una nueva PQR desde el sitio.\n"
    )
    return RenderedEmail(
        f"Respondimos tu PQR {ticket_number} — BeautyLux",
        _wrap(title="Tu PQR tiene respuesta", preheader=f"Respuesta a la PQR {ticket_number}.", body_html=body),
        text + _text_footer(),
    )


# ---------------------------------------------------------------------
# Bienvenida
# ---------------------------------------------------------------------
def welcome(*, first_name: str) -> RenderedEmail:
    body = (
        _p(f"Hola {_esc(first_name)},")
        + _p(
            "Te damos la bienvenida a BeautyLux. Tu cuenta ya está activa: desde ahora puedes "
            "comprar nuestros productos, reservar servicios de belleza y seguir tus pedidos y citas "
            "desde tu panel."
        )
        + _button(_site_url("/productos"), "Explorar productos")
        + _p(
            f'¿Buscas un tratamiento? Mira nuestros <a href="{_esc(_site_url("/servicios"))}" '
            f'style="color:{_BRAND_DARK};">servicios</a> y agenda tu cita en línea.'
        )
    )
    text = (
        f"Hola {first_name},\n\n"
        "Te damos la bienvenida a BeautyLux. Tu cuenta ya está activa: puedes comprar productos, "
        "reservar servicios y seguir tus pedidos y citas desde tu panel.\n\n"
        f"Productos: {_site_url('/productos')}\n"
        f"Servicios: {_site_url('/servicios')}\n"
    )
    return RenderedEmail(
        "Te damos la bienvenida a BeautyLux",
        _wrap(title="Tu cuenta está lista", preheader="Ya puedes comprar y reservar en BeautyLux.", body_html=body),
        text + _text_footer(),
    )


# ---------------------------------------------------------------------
# Compra
# ---------------------------------------------------------------------
def sale_created(*, sale, appointments: list) -> RenderedEmail:
    """Confirmación de una compra web o POS. Las citas reservadas en el
    checkout van aquí dentro en vez de en correos aparte: una compra, un correo."""
    details = list(sale.details)
    has_products = any(detail.item_type == "product" for detail in details)

    totals = [("Subtotal", format_cop(sale.subtotal), False)]
    if has_products:
        shipping_label = SHIPPING_LABELS.get(sale.shipping_method, "Envío")
        totals.append((shipping_label, format_cop(sale.shipping_cost) if sale.shipping_cost else "Gratis", False))
    totals.append(("IVA incluido (19 %)", format_cop(sale.tax_total), False))
    totals.append(("Total", format_cop(sale.total), True))

    rows = [(detail.item_name, detail.quantity, format_cop(detail.subtotal)) for detail in details]
    payment = PAYMENT_LABELS.get(sale.payment_method, sale.payment_method or "—")
    info = [("Fecha", format_date_long(sale.sold_at)), ("Medio de pago", payment)]
    if has_products:
        info.append(("Entrega", SHIPPING_LABELS.get(sale.shipping_method, "—")))
    order_url = _site_url(f"/pedido/{sale.sale_number}")

    body = (
        _p(f"Hola {_esc(sale.customer_first_name)},")
        + _p("Gracias por tu compra. Registramos tu pedido con el número:")
        + _highlight(sale.sale_number)
        + _section("Resumen")
        + _items_table(rows, totals)
        + _detail_rows(info)
    )
    for appointment in appointments:
        body += _section("Tu cita") + _detail_rows(_appointment_rows(appointment))
    if sale.user_id:
        body += _button(order_url, "Ver mi pedido")
    body += _p("Cuando confirmemos el pago te enviaremos la factura por este medio.", muted=True)

    text = (
        f"Hola {sale.customer_first_name},\n\n"
        f"Gracias por tu compra. Tu pedido es el {sale.sale_number}.\n\n"
        + "".join(f"- {name} x {quantity}: {amount}\n" for name, quantity, amount in rows)
        + "".join(f"{label}: {amount}\n" for label, amount, _ in totals)
        + _rows_as_text(info)
        + "".join("\nTu cita\n" + _rows_as_text(_appointment_rows(a)) for a in appointments)
        + (f"\nVer el pedido: {order_url}\n" if sale.user_id else "")
        + "\nCuando confirmemos el pago te enviaremos la factura por este medio.\n"
    )
    return RenderedEmail(
        f"Recibimos tu pedido {sale.sale_number} — BeautyLux",
        _wrap(
            title="¡Gracias por tu compra!",
            preheader=f"Pedido {sale.sale_number} por {format_cop(sale.total)}.",
            body_html=body,
        ),
        text + _text_footer(),
    )


# ---------------------------------------------------------------------
# Citas
# ---------------------------------------------------------------------
def _appointments_link(appointment) -> str:
    return _button(_site_url("/panel/cliente/citas"), "Ver mis citas") if appointment.user_id else ""


def appointment_confirmed(*, appointment) -> RenderedEmail:
    rows = _appointment_rows(appointment)
    body = (
        _p(f"Hola {_esc(appointment.customer_first_name)},")
        + _p("Tu cita quedó confirmada. Estos son los detalles:")
        + _detail_rows(rows)
        + _appointments_link(appointment)
        + _p("Si no puedes asistir, cancela o reprograma con anticipación para liberar el espacio.", muted=True)
    )
    text = (
        f"Hola {appointment.customer_first_name},\n\n"
        "Tu cita quedó confirmada.\n\n"
        + _rows_as_text(rows)
        + "\nSi no puedes asistir, cancela o reprograma con anticipación.\n"
    )
    return RenderedEmail(
        f"Cita confirmada: {appointment.service_name} — BeautyLux",
        _wrap(title="Tu cita está confirmada", preheader=_appointment_when(appointment), body_html=body),
        text + _text_footer(),
    )


def appointment_rescheduled(*, appointment, previous_date, previous_start) -> RenderedEmail:
    rows = [("Horario anterior", f"{format_date_long(previous_date)}, {format_time(previous_start)}")]
    rows += [("Nuevo horario" if label == "Fecha y hora" else label, value) for label, value in _appointment_rows(appointment)]
    body = (
        _p(f"Hola {_esc(appointment.customer_first_name)},")
        + _p(f"Tu cita <strong>{_esc(appointment.appointment_number)}</strong> cambió de horario:")
        + _detail_rows(rows)
        + _appointments_link(appointment)
        + _p("Si no reconoces este cambio, contáctanos.", muted=True)
    )
    text = (
        f"Hola {appointment.customer_first_name},\n\n"
        f"Tu cita {appointment.appointment_number} cambió de horario.\n\n"
        + _rows_as_text(rows)
        + "\nSi no reconoces este cambio, contáctanos.\n"
    )
    return RenderedEmail(
        f"Tu cita {appointment.appointment_number} cambió de horario — BeautyLux",
        _wrap(
            title="Reprogramamos tu cita",
            preheader=f"Nuevo horario: {_appointment_when(appointment)}",
            body_html=body,
        ),
        text + _text_footer(),
    )


def appointment_cancelled(*, appointment) -> RenderedEmail:
    rows = _appointment_rows(appointment)
    body = (
        _p(f"Hola {_esc(appointment.customer_first_name)},")
        + _p("Tu cita fue cancelada:")
        + _detail_rows(rows)
        + _button(_site_url("/servicios"), "Agendar otra cita")
        + _p("Si no pediste esta cancelación, contáctanos.", muted=True)
    )
    text = (
        f"Hola {appointment.customer_first_name},\n\n"
        "Tu cita fue cancelada.\n\n"
        + _rows_as_text(rows)
        + f"\nAgenda otra cita en {_site_url('/servicios')}\n"
    )
    return RenderedEmail(
        f"Cita cancelada: {appointment.service_name} — BeautyLux",
        _wrap(
            title="Tu cita fue cancelada",
            preheader=f"Cita {appointment.appointment_number} cancelada.",
            body_html=body,
        ),
        text + _text_footer(),
    )


# ---------------------------------------------------------------------
# Factura
# ---------------------------------------------------------------------
def invoice_issued(*, invoice, sale_number: str, has_account: bool) -> RenderedEmail:
    rows = [(detail.description, detail.quantity, format_cop(detail.subtotal)) for detail in invoice.details]
    totals = [
        ("Subtotal", format_cop(invoice.subtotal), False),
        ("IVA incluido (19 %)", format_cop(invoice.tax_total), False),
        ("Total", format_cop(invoice.total), True),
    ]
    body = (
        _p(f"Hola {_esc(invoice.customer_first_name)},")
        + _p(f"Adjuntamos en PDF la factura de tu pedido <strong>{_esc(sale_number)}</strong>:")
        + _highlight(invoice.invoice_number)
        + _items_table(rows, totals)
        + _detail_rows([("Fecha de emisión", format_date_long(invoice.issued_at))])
        + (_button(_site_url("/panel/cliente/pedidos"), "Ver mis pedidos") if has_account else "")
        + _p("Guarda este correo: la factura es tu soporte de compra.", muted=True)
    )
    text = (
        f"Hola {invoice.customer_first_name},\n\n"
        f"Adjuntamos en PDF la factura {invoice.invoice_number} de tu pedido {sale_number}.\n\n"
        + "".join(f"- {name} x {quantity}: {amount}\n" for name, quantity, amount in rows)
        + "".join(f"{label}: {amount}\n" for label, amount, _ in totals)
    )
    return RenderedEmail(
        f"Tu factura {invoice.invoice_number} — BeautyLux",
        _wrap(
            title="Tu factura está lista",
            preheader=f"Factura {invoice.invoice_number} del pedido {sale_number}.",
            body_html=body,
        ),
        text + _text_footer(),
    )


# ---------------------------------------------------------------------
# Correo de prueba (panel del admin y Postman)
# ---------------------------------------------------------------------
def test_email(*, requested_by: str) -> RenderedEmail:
    now = datetime.now()
    sent_at = f"{format_date_long(now)}, {format_time(now)}"
    server = f"{settings.SMTP_HOST}:{settings.SMTP_PORT} ({settings.SMTP_SECURITY.upper()})"
    body = (
        _p("Si estás leyendo esto, BeautyLux ya puede enviar correos a través de Brevo.")
        + _detail_rows([("Solicitado por", requested_by), ("Servidor", server), ("Fecha", sent_at)])
        + _p("No hace falta responder este mensaje.", muted=True)
    )
    text = (
        "Si estás leyendo esto, BeautyLux ya puede enviar correos a través de Brevo.\n\n"
        f"Solicitado por: {requested_by}\n"
        f"Servidor: {server}\n"
        f"Fecha: {sent_at}\n"
    )
    return RenderedEmail(
        "Correo de prueba — BeautyLux",
        _wrap(title="Correo de prueba", preheader="La configuración de correo funciona.", body_html=body),
        text + _text_footer(),
    )
