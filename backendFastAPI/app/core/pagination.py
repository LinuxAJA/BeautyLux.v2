"""Paginación — equivalente de backend/src/utils/pagination.js."""

from __future__ import annotations

MAX_PER_PAGE = 100
DEFAULT_PER_PAGE = 10


def parse_pagination(page: int | None, per_page: int | None) -> tuple[int, int, int]:
    """Normaliza page/perPage. Devuelve (page, per_page, offset)."""
    safe_page = max(1, page or 1)
    safe_per_page = min(MAX_PER_PAGE, max(1, per_page or DEFAULT_PER_PAGE))
    offset = (safe_page - 1) * safe_per_page
    return safe_page, safe_per_page, offset


def build_meta(page: int, per_page: int, total: int) -> dict[str, int]:
    total_pages = 0 if total == 0 else -(-total // per_page)  # ceil sin importar math
    return {"page": page, "perPage": per_page, "total": total, "totalPages": total_pages}
