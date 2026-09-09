"""
Motor y sesión de SQLAlchemy — equivalente de backend/src/config/database.js.

A diferencia del Singleton manual de Node, aquí basta con el engine de
SQLAlchemy (que ya gestiona su propio pool) creado una sola vez a nivel de
módulo. `dateStrings: true` de mysql2 no tiene equivalente directo: PyMySQL
devuelve objetos `date`/`datetime`, que Pydantic serializa a ISO-8601 (ver
la decisión tomada en el plan, punto 9 del contrato de la API).
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

DATABASE_URL = (
    f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
    f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=settings.DB_CONNECTION_LIMIT,
    max_overflow=0,
    pool_recycle=3600,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: una sesión por request, con commit/rollback
    automático (equivalente a que cada operación de Node fuera transaccional)."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def health_check() -> bool:
    """Usado por GET /api/health y por el arranque de la aplicación."""
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1 AS ok")).mappings().first()
        return bool(result and result["ok"] == 1)
