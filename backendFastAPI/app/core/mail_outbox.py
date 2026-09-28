"""
Bandeja de salida transaccional: los correos salen **solo si la petición
confirmó su transacción**, y se envían fuera del ciclo de la petición.

Por qué no `BackgroundTasks`: en la versión instalada de FastAPI el cierre
de `get_db()` (commit + close) corre *después* de las tareas en segundo
plano, así que cada envío SMTP —con sus reintentos, hasta decenas de
segundos— retenía una conexión de un pool de 5 (Aiven, capa gratuita) sin
overflow. Además obligaba a pasar `background_tasks` por cada service.

Cómo funciona:
1. Un service llama a `queue(db, email)`: el correo se guarda en `db.info`,
   atado a la sesión de esa petición.
2. `get_db()` hace commit y después llama a `dispatch(db)`, que entrega cada
   correo a un pool de 2 hilos y retorna enseguida. Si la petición falla,
   `get_db()` llama a `discard(db)` y nada sale. El commit intermedio de
   `audit_service.record()` no dispara nada: solo `get_db()` despacha.
3. El hilo llama a `deliver()` y registra el resultado en `email_logs` con
   una sesión propia que abre y cierra en milisegundos.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

from sqlalchemy.orm import Session

from app.core.logger import logger
from app.core.mailer import OutgoingEmail, deliver
from app.repositories.email_log import email_log_repository

_OUTBOX_KEY = "mail_outbox"

_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="mail")


def queue(db: Session, email: OutgoingEmail) -> None:
    db.info.setdefault(_OUTBOX_KEY, []).append(email)


def dispatch(db: Session) -> None:
    for email in db.info.pop(_OUTBOX_KEY, []):
        try:
            _executor.submit(_deliver_and_log, email)
        except RuntimeError:
            # El pool ya se cerró: el servidor se está apagando.
            logger.error("Correo descartado: el servidor se está apagando", {"kind": email.kind, "to": email.to})


def discard(db: Session) -> None:
    dropped = db.info.pop(_OUTBOX_KEY, [])
    if dropped:
        logger.warn(
            "Correos descartados: la petición no confirmó su transacción",
            {"kinds": [email.kind for email in dropped]},
        )


def shutdown() -> None:
    """Espera los envíos en curso. Se llama al apagar la aplicación."""
    _executor.shutdown(wait=True)


def _deliver_and_log(email: OutgoingEmail) -> None:
    result = deliver(email)

    # Import diferido: app.db.session importa este módulo para despachar.
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        email_log_repository.record(db, email, result)
        db.commit()
    except Exception as error:  # noqa: BLE001 - el registro nunca debe tumbar el hilo
        db.rollback()
        logger.error("No se pudo registrar el correo en email_logs", {"kind": email.kind, "error": str(error)})
    finally:
        db.close()
