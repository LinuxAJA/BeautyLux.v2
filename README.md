# BeautyLux

Plataforma de cosmética con **frontend en React + Vite** y **dos backends equivalentes en
paralelo sobre la misma base de datos MySQL 8**: uno en **Node.js + Express 5** (Tercer Avance)
y otro en **Python + FastAPI** (Cuarto Avance).

Este repositorio es un monorepo con tres proyectos independientes, cada uno con sus propias
dependencias y su propio README con instrucciones detalladas:

```
BeautyLux.v2/
├── backend/          API REST — Node.js + Express + MySQL     — ver backend/README.md
├── backendFastAPI/   API REST — Python + FastAPI + MySQL      — ver backendFastAPI/README.md
└── frontend/         Aplicación web — React + Vite + Tailwind — ver frontend/README.md
```

`backend/` y `backendFastAPI/` exponen **el mismo contrato de API** (los 36 endpoints del
Cuarto Avance, mismo formato de respuesta, misma autenticación JWT) contra **la misma base de
datos** `db_beautylux_v2`. El frontend puede apuntar a cualquiera de los dos cambiando una sola
variable de entorno — ver más abajo.

El **Quinto Avance** (ventas, citas, facturación, reportes PDF/Excel, dashboards, PQR y chatbot
con IA) se construyó solo sobre `backendFastAPI/`, que hoy expone 67 endpoints; el backend Node
se conserva intacto como entregable del Tercer Avance.

## Puesta en marcha rápida

Los tres proyectos se instalan y arrancan por separado, cada uno desde su propia carpeta.
Basta con levantar **un backend a la vez** junto con el frontend (los dos backends también
pueden correr simultáneamente, en puertos distintos, si se quieren comparar):

```bash
# Terminal 1 — backend FastAPI (http://localhost:8000/api) — el que usa el frontend por defecto
cd backendFastAPI
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python database/run.py ping     # verifica que hay MySQL 8 en localhost; si no existe la BD:
python database/run.py schema   # crea las tablas
python database/run.py seed     # inserta roles, permisos, usuarios demo y catálogo
uvicorn app.main:app --reload --port 8000

# — o, en su lugar, backend Node.js (http://localhost:3000/api) —
cd backend
npm install
npm run db:reset   # crea la BD, tablas y datos de prueba (si backendFastAPI ya la creó, omite este paso)
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Detalles de configuración, variables de entorno, estructura interna, endpoints,
validaciones y usuarios de prueba están documentados en el README de cada capa:

- [`backend/README.md`](backend/README.md)
- [`backendFastAPI/README.md`](backendFastAPI/README.md)
- [`frontend/README.md`](frontend/README.md)

Planificación detallada de cada avance en `docs/`: [`PLAN_BACKEND.md`](docs/PLAN_BACKEND.md)
(Node) y [`PLAN_BACKEND_FASTAPI.md`](docs/PLAN_BACKEND_FASTAPI.md) (FastAPI). Checklist de
entregables del Cuarto Avance: [`ENTREGABLES_CUARTO_AVANCE.md`](docs/ENTREGABLES_CUARTO_AVANCE.md).

## Cómo encajan las capas

- El frontend consume la API bajo `/api` que expone el backend activo, en el puerto que indique
  `VITE_API_URL` (`frontend/.env`): `http://localhost:3000/api` para Node,
  `http://localhost:8000/api` para FastAPI.
- Las reglas de validación de formularios (`frontend/src/utils/validators.js`) están espejadas
  en **ambos** backends (`backend/src/validations/` y `backendFastAPI/app/schemas/`), con los
  mismos mensajes de error en español, para que el mismo dato se valide igual sin importar cuál
  backend esté activo.
- La autenticación es real y vive en el backend: JWT de acceso (15 min) más un refresh token
  rotativo en cookie `httpOnly`, igual en los dos backends. El frontend consume ese flujo a
  través de `AuthContext`/`AuthProvider` y `useAuth`, sin lógica distinta según el backend.
- Los tipos de documento, categorías, productos y servicios que el frontend muestra provienen
  siempre de la base de datos `db_beautylux_v2` (compartida por ambos backends), no de datos
  estáticos locales.
- Cambiar de backend es **solo** cuestión de cambiar `VITE_API_URL` — no requiere tocar
  componentes, servicios ni el `AuthProvider` del frontend.

## Requisitos previos

- Node.js 22+ (para `backend/` y `frontend/`)
- Python 3.11+ (para `backendFastAPI/`)
- MySQL 8 activo en `localhost:3306` (ver la nota sobre XAMPP en `backend/README.md`
  si tienes otro servidor MySQL/MariaDB instalado)

## Despliegue

Arquitectura de producción: **frontend en Vercel → backend FastAPI en Render → MySQL
gestionado en Aiven.io**. La base de datos va fuera de Render porque Render solo ofrece
PostgreSQL gestionado. El repositorio trae la configuración lista; el despliegue se hace con
las credenciales propias de cada plataforma.

| Archivo | Para qué |
|---|---|
| `render.yaml` | Blueprint de Render: un web service Docker con `rootDir: backendFastAPI`, health check en `/api/health` y las variables de producción (las secretas se piden al crear el Blueprint) |
| `backendFastAPI/Dockerfile` | `python:3.11-slim`, usuario sin privilegios, `uvicorn` en el `$PORT` que inyecta Render y con `--proxy-headers` (IP real para el rate limit) |
| `backendFastAPI/.env.production.example` | Todas las variables del backend en producción |
| `frontend/vercel.json` | Build de Vite y rewrite SPA, para que recargar `/panel/...` no dé 404 |
| `frontend/.env.production.example` | `VITE_API_URL` apuntando a Render |

Orden de despliegue:

1. **Aiven** — crear un servicio MySQL, descargar su `ca.pem` y cargar el esquema desde tu
   equipo, una sola vez (con `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` de Aiven y
   `DB_SSL_CA=ruta/al/ca.pem` en `backendFastAPI/.env`):
   `python database/run.py ping`, `python database/run.py schema` y `python database/run.py seed`.
   **No repitas `schema` ni uses `reset` sobre una base con datos: los borran.**
2. **Render** — New > Blueprint con este repositorio; completar las variables secretas y subir
   el `ca.pem` en Environment > Secret Files (queda en `/etc/secrets/ca.pem`).
3. **Vercel** — importar el repositorio con Root Directory `frontend` y definir `VITE_API_URL`
   con la URL de Render terminada en `/api`.
4. Volver a Render y poner la URL de Vercel en `CORS_ORIGIN` y `FRONTEND_URL` (varios orígenes,
   separados por coma).

Como frontend y API quedan en dominios distintos, la cookie de refresh viaja con
`SameSite=None; Secure` (`COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, ya fijadas en
`render.yaml`). Sin eso, el login funcionaría pero la sesión se perdería al recargar la página.
