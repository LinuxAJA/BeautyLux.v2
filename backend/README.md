# BeautyLux — Backend

API REST construida con **Node.js + Express 5** y **MySQL 8**, con arquitectura por capas
(Repository Pattern + Service Layer) y un Singleton para la conexión a base de datos.

## Estructura

```
backend/
├── database/
│   ├── schema.sql      DDL completo (11 tablas)
│   ├── seed.sql         Roles, permisos, usuarios demo, categorías, productos y servicios
│   └── run.mjs           Ejecutor de los scripts (ping | schema | seed | reset)
├── postman/               Colección y entorno de Postman
└── src/
    ├── server.js          Arranque HTTP + verificación de BD + apagado ordenado
    ├── app.js             Express: helmet, cors, rate limit, rutas, manejo de errores
    ├── config/            env.js (validación con zod) + database.js (Singleton)
    ├── routes/            Un archivo por dominio, todas bajo /api
    ├── middlewares/        auth, autorización por rol/permiso, validación, rate limit
    ├── controllers/        Solo traducen HTTP ↔ servicios
    ├── services/           Reglas de negocio, transacciones, auditoría
    ├── repositories/        Acceso a datos con SQL parametrizado
    ├── models/              Traducen filas de MySQL (snake_case) a DTOs (camelCase)
    ├── validations/        Esquemas zod, espejo de frontend/src/utils/validators.js
    └── utils/               errores, logger, JWT, contraseñas, cookies, paginación
```

## Requisitos previos

- Node.js 22+
- MySQL 8 activo en `localhost:3306` (verificado con `SELECT VERSION()`; si tienes XAMPP
  instalado, asegúrate de que su módulo MySQL/MariaDB **no** esté iniciado, o correrá en el
  mismo puerto y este proyecto hablará con el servidor equivocado)

## Puesta en marcha

```bash
npm install

# 1. Verifica que estás hablando con MySQL 8 y no con otro servidor en el puerto 3306
npm run db:ping

# 2. Crea la base de datos y las tablas
npm run db:schema

# 3. Inserta roles, permisos, usuarios demo, categorías, productos y servicios
npm run db:seed

# (equivalente a los dos pasos anteriores, además de recrear la BD desde cero)
npm run db:reset

# 4. Arranca el servidor con recarga automática
npm run dev
```

El servidor queda disponible en `http://localhost:3000/api`. `GET /api/health` confirma que
la API y la base de datos están arriba.

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores. `src/config/env.js` valida el archivo
al arrancar y el proceso se detiene con un mensaje claro si falta algo.

## Usuarios de prueba (creados por `npm run db:seed`)

| Correo                     | Contraseña      | Rol           |
| -------------------------- | ---------------- | ------------- |
| `admin@beautylux.com`    | `Admin123*`    | Administrador |
| `empleado@beautylux.com` | `Empleado123*` | Empleado      |
| `cliente@beautylux.com`  | `Cliente123*`  | Cliente       |

## Autenticación

- **Access token**: JWT de 15 minutos, enviado en `Authorization: Bearer <token>`.
- **Refresh token**: 64 bytes aleatorios en una cookie `httpOnly` (`refresh_token`), con
  rotación en cada uso y detección de reutilización (si un token ya revocado se reutiliza,
  se cierran todas las sesiones del usuario).
- `POST /api/auth/refresh` renueva el access token usando la cookie; no requiere `Authorization`.

## Endpoints principales

Ver la colección de Postman en `postman/` para el listado completo, con ejemplos y pruebas
automáticas que encadenan el token entre peticiones.

| Dominio        | Base                                                                                                | Notas                                                   |
| -------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Autenticación | `/api/auth`                                                                                       | registro, login, refresh, logout, perfil, recuperación |
| Usuarios       | `/api/users`                                                                                      | admin y empleado (empleado limitado a clientes)         |
| Productos      | `/api/products`                                                                                   | lectura pública, escritura admin/empleado              |
| Servicios      | `/api/services`                                                                                   | lectura pública, escritura admin/empleado              |
| Categorías    | `/api/categories`                                                                                 | lectura pública, escritura solo admin                  |
| Metadatos      | `/api/health`, `/api/document-types`, `/api/roles`, `/api/permissions`, `/api/audit-logs` |                                                         |

## Pruebas con Postman

1. Importa `postman/BeautyLux.postman_collection.json` y `postman/BeautyLux.postman_environment.json`.
2. Selecciona el entorno "BeautyLux Local".
3. Ejecuta la carpeta "1. Auth" primero: el login guarda `accessToken` automáticamente en las
   variables del entorno para el resto de las peticiones.
