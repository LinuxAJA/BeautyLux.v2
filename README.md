# BeautyLux

Plataforma de cosmética con **frontend en React + Vite**
y **backend en Node.js + Express 5 sobre MySQL 8**.

Este repositorio es un monorepo con dos proyectos independientes, cada uno con su
propio `package.json` y su propio README con instrucciones detalladas:

```
BeautyLux.v2/
├── backend/    API REST (Node.js + Express + MySQL) — ver backend/README.md
└── frontend/   Aplicación web (React + Vite + Tailwind) — ver frontend/README.md
```

## Puesta en marcha rápida

Backend y frontend se instalan y arrancan por separado, cada uno desde su propia
carpeta, y **deben correr al mismo tiempo** en dos terminales distintas:

```bash
# Terminal 1 — backend (http://localhost:3000/api)
cd backend
npm install
npm run db:reset   # crea la BD, tablas y datos de prueba (requiere MySQL 8 en localhost)
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Detalles de configuración, variables de entorno, estructura interna, endpoints,
validaciones y usuarios de prueba están documentados en el README de cada capa:

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)

## Cómo encajan las dos capas

- El frontend consume la API bajo `/api` que expone el backend en `localhost:3000`.
- Las reglas de validación de formularios (`frontend/src/utils/validators.js`) están
  espejadas en el backend (`backend/src/validations/`), para que el mismo dato se
  valide igual en ambos lados.
- La autenticación es real y vive en el backend: JWT de acceso (15 min) más un
  refresh token rotativo en cookie `httpOnly`. El frontend consume ese flujo a
  través de `AuthContext`/`AuthProvider` y `useAuth`.
- Los tipos de documento, categorías, productos y servicios que el frontend
  muestra provienen de la base de datos (poblada con `npm run db:seed` en el
  backend), no de datos estáticos locales.

## Requisitos previos

- Node.js 22+
- MySQL 8 activo en `localhost:3306` (ver la nota sobre XAMPP en `backend/README.md`
  si tienes otro servidor MySQL/MariaDB instalado)
