"""
Ejecutor de los scripts SQL del proyecto — equivalente en Python de backend/database/run.mjs.

Uso:
    python database/run.py ping     # verifica la conexión y la versión de MySQL
    python database/run.py schema   # crea la base de datos y las tablas (schema.sql)
    python database/run.py seed     # inserta roles, permisos, usuarios demo, catálogo (seed.sql)
    python database/run.py reset    # DROP DATABASE + schema + seed

Nota: la base de datos `db_beautylux_v2` normalmente ya existe (la usa también el backend
Node en paralelo). `schema`/`seed`/`reset` son destructivos: solo se ejecutan a propósito,
no como parte de la puesta en marcha habitual del backend FastAPI.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pymysql
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

load_dotenv(ROOT_DIR / ".env")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "db_beautylux_v2")


def _connect(with_database: bool = False) -> pymysql.connections.Connection:
    """Conecta sin seleccionar base de datos por defecto, igual que run.mjs
    (los propios scripts .sql hacen su CREATE DATABASE / USE)."""
    kwargs = dict(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        charset="utf8mb4",
        autocommit=True,
    )
    if with_database:
        kwargs["database"] = DB_NAME
    return pymysql.connect(**kwargs)


def ping() -> None:
    conn = _connect()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT VERSION() AS version")
            (version,) = cursor.fetchone()
        print(f"Conectado a MySQL {version} en {DB_HOST}:{DB_PORT}")
    finally:
        conn.close()


def _run_sql_file(filename: str) -> None:
    sql_path = BASE_DIR / filename
    sql_text = sql_path.read_text(encoding="utf-8")

    conn = _connect()
    try:
        with conn.cursor() as cursor:
            # pymysql no soporta multi-statement nativo como mysql2; se divide
            # respetando que no haya `;` dentro de valores. Los scripts del
            # proyecto no usan `;` embebido en literales, así que un split simple
            # por línea que termina en `;` es seguro para este caso.
            statements = _split_statements(sql_text)
            for statement in statements:
                if statement.strip():
                    cursor.execute(statement)
        print(f"Ejecutado {filename} correctamente.")
    finally:
        conn.close()


def _split_statements(sql_text: str) -> list[str]:
    """Divide un script SQL en sentencias individuales, ignorando comentarios
    de línea (`--`) y respetando que DELIMITER no se usa en este proyecto."""
    lines = []
    for line in sql_text.splitlines():
        stripped = line.strip()
        if stripped.startswith("--") or not stripped:
            continue
        lines.append(line)
    cleaned = "\n".join(lines)
    statements = [s.strip() for s in cleaned.split(";")]
    return [s for s in statements if s]


def schema() -> None:
    _run_sql_file("schema.sql")


def seed() -> None:
    _run_sql_file("seed.sql")


def drop_database() -> None:
    conn = _connect()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS `{DB_NAME}`")
        print(f"Base de datos `{DB_NAME}` eliminada (si existía).")
    finally:
        conn.close()


def reset() -> None:
    drop_database()
    schema()
    seed()


COMMANDS = {
    "ping": ping,
    "schema": schema,
    "seed": seed,
    "reset": reset,
}


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print("Uso: python database/run.py <ping|schema|seed|reset>")
        sys.exit(1)

    command = sys.argv[1]
    try:
        COMMANDS[command]()
    except Exception as error:  # noqa: BLE001 - script de utilidad
        print(f"Error: {error}")
        sys.exit(1)


if __name__ == "__main__":
    main()
