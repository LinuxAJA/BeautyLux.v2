"""
Formato de valores para textos generados en el servidor: PDF, chat y correos.

Antes cada módulo tenía su propia copia de `_money`; ahora las tres salidas
formatean igual que `formatPrice` del frontend (`src/data/products.js`).
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal

_MONTHS = (
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
)


def format_cop(value: Decimal | float | int) -> str:
    """Pesos colombianos sin decimales: `68900` → `$ 68.900`."""
    number = int(round(float(value)))
    return f"$ {number:,}".replace(",", ".")


def format_date_long(value: date | datetime) -> str:
    """`2026-09-27` → `27 de septiembre de 2026`."""
    return f"{value.day} de {_MONTHS[value.month - 1]} de {value.year}"


def format_time(value: time | datetime) -> str:
    """Hora en formato de 12 horas: `14:30` → `2:30 p. m.`."""
    suffix = "a. m." if value.hour < 12 else "p. m."
    hour = value.hour % 12 or 12
    return f"{hour}:{value.minute:02d} {suffix}"
