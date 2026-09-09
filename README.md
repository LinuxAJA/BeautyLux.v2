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

`backend/` y `backendFastAPI/` exponen **el mismo contrato de API** (mismos 36 endpoints, mismo
formato de respuesta, misma autenticación JWT) contra **la misma base de datos**
`db_beautylux_v2`. El frontend puede apuntar a cualquiera de los dos cambiando una sola
variable de entorno — ver más abajo.

## Puesta en marcha rápida

Los tres proyectos se instalan y arrancan por separado, cada uno desde su propia carpeta.
Basta con levantar **un backend a la vez** junto con el frontend (los dos backends también
pueden correr simultáneamente, en puertos distintos, si se quieren comparar):

```bash
# Terminal 1 — backend Node.js (http://localhost:3000/api)
cd backend
npm install
npm run db:reset   # crea la BD, tablas y datos de prueba (requiere MySQL 8 en localhost)
npm run dev

# — o, en su lugar, backend FastAPI (http://localhost:8000/api) —
cd backendFastAPI
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python database/run.py ping   # la BD ya existe si el backend Node la creó antes
uvicorn app.main:app --reload --port 8000

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
(Node) y [`PLAN_BACKEND_FASTAPI.md`](docs/PLAN_BACKEND_FASTAPI.md) (FastAPI).

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
