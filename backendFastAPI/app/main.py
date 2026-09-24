"""
Punto de entrada de la aplicación — equivalente de backend/src/app.js + server.js.

Orden de middlewares (de fuera hacia dentro, el primero añadido es el más
externo): CORS → cabeceras de seguridad → logger de peticiones → rate limit
→ routers bajo /api → manejadores de excepción.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.logger import logger
from app.db.session import SessionLocal, engine, health_check
from app.middleware.error_handler import register_exception_handlers
from app.middleware.rate_limit import limiter
from app.middleware.request_logger import RequestLoggerMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers import auth, categories, meta, products, sales, services, users
from app.services.maintenance import purge_expired_tokens
from app.services.permission import permission_service

DAY_SECONDS = 24 * 60 * 60


async def _maintenance_loop() -> None:
    """Purga sesiones y tokens de recuperación vencidos cada 24h.
    Equivalente de `scheduleMaintenance()` en backend/src/services/maintenance.service.js."""
    while True:
        await asyncio.sleep(DAY_SECONDS)
        await asyncio.to_thread(purge_expired_tokens)


@asynccontextmanager
async def lifespan(app: FastAPI):
    is_healthy = health_check()
    if not is_healthy:
        logger.error(
            f"No se pudo conectar a MySQL en {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}. "
            'Verifica que el servidor esté activo y que ejecutaste "python database/run.py schema".'
        )
        raise SystemExit(1)

    db = SessionLocal()
    try:
        permission_service.warm_cache(db)
    finally:
        db.close()

    # Purga inmediata al arrancar (igual que Node) y luego una tarea en segundo plano cada 24h.
    await asyncio.to_thread(purge_expired_tokens)
    maintenance_task = asyncio.create_task(_maintenance_loop())

    logger.info(f"BeautyLux API (FastAPI) escuchando en http://localhost:{settings.PORT}{settings.API_PREFIX}")
    logger.info(f"Entorno: {settings.ENVIRONMENT} — Base de datos: {settings.DB_NAME}")

    yield

    maintenance_task.cancel()
    try:
        await maintenance_task
    except asyncio.CancelledError:
        pass
    engine.dispose()
    logger.info("Servidor y pool de MySQL cerrados correctamente.")


tags_metadata = [
    {"name": "Autenticación", "description": "Registro, login, refresh, logout, perfil y recuperación de contraseña."},
    {"name": "Usuarios", "description": "Gestión de usuarios (admin y empleado)."},
    {"name": "Productos", "description": "Catálogo de productos. Lectura pública, escritura admin/empleado."},
    {"name": "Servicios", "description": "Catálogo de servicios. Lectura pública, escritura admin/empleado."},
    {"name": "Categorías", "description": "Categorías de productos y servicios. Lectura pública, escritura admin."},
    {"name": "Ventas", "description": "Registro e historial de ventas. El cliente ve solo las suyas; admin y empleado, todas."},
    {"name": "Metadatos", "description": "Salud del servicio, tipos de documento, roles, permisos y auditoría."},
]

app = FastAPI(
    title="BeautyLux API (FastAPI)",
    description=(
        "API REST del Cuarto Avance — Backend construido con FastAPI, SQLAlchemy 2.0 y MySQL 8, "
        "equivalente en contrato al backend Node.js/Express del Tercer Avance."
    ),
    version="1.0.0",
    openapi_tags=tags_metadata,
    lifespan=lifespan,
)

app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggerMiddleware)
app.add_middleware(SlowAPIMiddleware)

register_exception_handlers(app)

api_router_prefix = settings.API_PREFIX
app.include_router(auth.router, prefix=api_router_prefix)
app.include_router(users.router, prefix=api_router_prefix)
app.include_router(products.router, prefix=api_router_prefix)
app.include_router(services.router, prefix=api_router_prefix)
app.include_router(categories.router, prefix=api_router_prefix)
app.include_router(sales.router, prefix=api_router_prefix)
app.include_router(meta.router, prefix=api_router_prefix)
