# BeautyLux — Backend FastAPI

API REST construida con **Python 3.11 + FastAPI** y **MySQL 8**, con arquitectura por capas
(Repository Pattern + Service Layer) sobre **SQLAlchemy 2.0**. Es el backend del **Cuarto
Avance**: mismo contrato de API, misma base de datos y mismo frontend que el backend del
Tercer Avance (`backend/`, Node.js + Express), que **se conserva intacto** y sigue funcionando
en paralelo en el puerto 3000.

## Estructura

```
backendFastAPI/
├── database/
│   ├── schema.sql      DDL completo (11 tablas) — copia de backend/database/schema.sql
│   ├── seed.sql          Roles, permisos, usuarios demo, categorías, productos y servicios
│   └── run.py             Ejecutor de los scripts (ping | schema | seed | reset)
├── postman/               Colección y entorno de Postman (apuntando al puerto 8000)
└── app/
    ├── main.py            Arranque de FastAPI: middlewares, routers, lifespan
    ├── core/               config.py (pydantic-settings) + security.py, jwt.py, cookies.py,
    │                       errors.py, responses.py, pagination.py, logger.py, slug.py
    ├── db/                 session.py (engine + Session) + base.py (DeclarativeBase)
    ├── models/             SQLAlchemy 2.0: un archivo por tabla (11 modelos)
    ├── schemas/             Esquemas Pydantic v2, espejo de frontend/src/utils/validators.js
    ├── repositories/        Acceso a datos con SQLAlchemy `select()`
    ├── services/             Reglas de negocio, transacciones, auditoría
    ├── dependencies/        auth.py (JWT), roles.py (RBAC) — equivalentes a los middlewares
    ├── routers/              Un archivo por dominio, todos bajo /api
    └── middleware/           Cabeceras de seguridad, logger de peticiones, rate limit, errores
```

## Requisitos previos

- Python 3.11+
- MySQL 8 activo en `localhost:3306` (la misma base de datos `db_beautylux_v2` que usa el
  backend Node — no se crea una base aparte). Si tienes XAMPP instalado, asegúrate de que su
  módulo MySQL/MariaDB **no** esté iniciado, o correrá en el mismo puerto y este proyecto
  hablará con el servidor equivocado.

## Puesta en marcha

```bash
# 1. Crea y activa el entorno virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Instala las dependencias
pip install -r requirements.txt

# 3. Verifica que estás hablando con MySQL 8 y no con otro servidor en el puerto 3306
python database/run.py ping

# La base de datos db_beautylux_v2 normalmente YA existe (la usa también el backend Node).
# schema/seed/reset son destructivos: solo se ejecutan si necesitas crearla desde cero.
# python database/run.py schema
# python database/run.py seed
# python database/run.py reset

# 4. Arranca el servidor con recarga automática
uvicorn app.main:app --reload --port 8000
```

El servidor queda disponible en `http://localhost:8000/api`. `GET /api/health` confirma que
la API y la base de datos están arriba. La documentación automática de FastAPI (Swagger UI)
está en `http://127.0.0.1:8000/docs` (Redoc en `/redoc`).

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores. `app/core/config.py` valida el archivo
al arrancar (con `pydantic-settings`) y el proceso se detiene con un mensaje claro si falta
algo. Usa el **mismo** `JWT_ACCESS_SECRET` que `backend/.env` si quieres que un token emitido
por cualquiera de los dos backends sea válido en el otro.

## Usuarios de prueba

Los mismos que sembró `backend/database/seed.sql` — la base de datos es compartida:

| Correo                     | Contraseña      | Rol           |
| -------------------------- | ---------------- | ------------- |
| `admin@beautylux.com`    | `Admin123*`    | Administrador |
| `empleado@beautylux.com` | `Empleado123*` | Empleado      |
| `cliente@beautylux.com`  | `Cliente123*`  | Cliente       |

## Autenticación

- **Access token**: JWT (HS256) de 15 minutos, enviado en `Authorization: Bearer <token>`.
  Mismos claims que Node: `sub`, `role`, `status`, `iat`, `exp`, `iss`, `aud`.
- **Refresh token**: 128 caracteres hex en una cookie `httpOnly` (`refresh_token`), con
  rotación en cada uso y detección de reutilización (si un token ya revocado se reutiliza,
  se cierran todas las sesiones del usuario).
- `POST /api/auth/refresh` renueva el access token usando la cookie; no requiere `Authorization`.
- Un access token vencido responde 401 con `"code": "TOKEN_EXPIRED"` — el frontend lo usa para
  refrescar automáticamente sin interrumpir al usuario.

## Endpoints principales

Ver la colección de Postman en `postman/` para el listado completo, con ejemplos y pruebas
automáticas que encadenan el token entre peticiones. Son los mismos **36 endpoints**, mismos
verbos y mismos paths que el backend Node — el frontend puede apuntar aquí solo cambiando
`VITE_API_URL`.

| Dominio        | Base                                                                                                | Notas                                                   |
| -------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Autenticación | `/api/auth`                                                                                        | registro, login, refresh, logout, perfil, recuperación |
| Usuarios       | `/api/users`                                                                                       | admin y empleado (empleado limitado a clientes)         |
| Productos      | `/api/products`                                                                                    | lectura pública, escritura admin/empleado               |
| Servicios      | `/api/services`                                                                                    | lectura pública, escritura admin/empleado               |
| Categorías    | `/api/categories`                                                                                  | lectura pública, escritura solo admin                   |
| Metadatos      | `/api/health`, `/api/document-types`, `/api/roles`, `/api/permissions`, `/api/audit-logs`  |                                                          |

> **Mejora sobre el backend Node**: en `GET /api/products` y `GET /api/services`, un
> admin o empleado autenticado ve también los registros `inactive` y el filtro `?status=`
> funciona (en Node, esos endpoints nunca leían el token y por eso siempre mostraban solo
> `active`, incluso a un administrador). El público anónimo sigue viendo solo lo activo.

## Pruebas con Postman

1. Importa `postman/BeautyLux-FastAPI.postman_collection.json` y
   `postman/BeautyLux-FastAPI.postman_environment.json`.
2. Selecciona el entorno "BeautyLux FastAPI Local" (`baseUrl` = `http://localhost:8000/api`).
3. Ejecuta la carpeta "1. Auth" primero: el login guarda `accessToken` automáticamente en las
   variables del entorno para el resto de las peticiones.

## Diferencias de implementación frente al backend Node

| Aspecto | Node (Tercer Avance) | FastAPI (Cuarto Avance) |
| ---- | ---- | ---- |
| Framework | Express 5 | FastAPI |
| Acceso a datos | SQL parametrizado a mano | SQLAlchemy 2.0 ORM (`select()`) |
| Validación | Zod | Pydantic v2 |
| Contraseñas | bcrypt (paquete `bcrypt`) | bcrypt (paquete `bcrypt`) |
| JWT | `jsonwebtoken` | `python-jose` |
| Rate limiting | `express-rate-limit` (IP+email en login) | `slowapi` (IP; ver nota abajo) |
| Documentación | Colección de Postman | Colección de Postman **+** Swagger UI (`/docs`) automático |
| Transacciones | Ninguna (cada query autocommitea) | Una transacción por petición (con checkpoints explícitos en auditoría y revocación de sesiones) |

> **Nota sobre rate limiting**: los limitadores de login y recuperación de contraseña en Node
> combinan IP + correo como clave. `slowapi` resuelve la clave de forma síncrona antes de que
> el cuerpo de la petición esté disponible, así que aquí se limita solo por IP. El
> comportamiento observable (código `RATE_LIMITED`, mismas ventanas y límites) se conserva.
