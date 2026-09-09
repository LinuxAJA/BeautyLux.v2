"""Uptime del proceso — equivalente de `process.uptime()` en Node, usado por GET /api/health."""

from __future__ import annotations

import time

_START_TIME = time.monotonic()


def get_uptime_seconds() -> float:
    return time.monotonic() - _START_TIME
