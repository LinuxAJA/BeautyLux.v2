"""Generación de slugs — equivalente de la función `slugify()` duplicada en
backend/src/services/{product,service,category}.service.js."""

from __future__ import annotations

import re
import unicodedata


def slugify(text: str) -> str:
    lowered = text.lower()
    normalized = unicodedata.normalize("NFD", lowered)
    without_marks = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    dashed = re.sub(r"[^a-z0-9]+", "-", without_marks)
    return dashed.strip("-")
