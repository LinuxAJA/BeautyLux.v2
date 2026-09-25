# CLAUDE.md — BeautyLux

Contexto operativo del proyecto. Léelo completo antes de tocar código.

> **Por qué existe este archivo.** El proyecto se movió del disco `D:` al `C:` por fallos de
> hardware. Las memorias automáticas de Claude se indexan por ruta del proyecto, así que
> **no sobreviven a la mudanza**. Todo lo que estaba en ellas está volcado aquí, en las
> "Reglas del usuario". Este archivo viaja con el repositorio; aquellas no.

---

## 1. Qué es esto

Proyecto académico del SENA — **Ficha 3406204 · Trimestre 03 · Ambiente 502 · Instructor Jhan Hader Muñoz**.
Monorepo con tres subproyectos independientes que comparten una sola base de datos MySQL:

| Carpeta | Stack | Puerto | Avance |
|---|---|---|---|
| `backend/` | Node.js 22 + Express 5 + MySQL | 3000 | Tercer avance |
| `backendFastAPI/` | Python 3.11 + FastAPI + SQLAlchemy 2.0 + MySQL | 8000 | Cuarto avance |
| `frontend/` | React 19 + Vite 8 + React Router 7 + Tailwind v4 | 5173 | Segundo al quinto |

**Decisión de arquitectura central:** los dos backends exponen **el mismo contrato** (mismas
rutas, mismo envoltorio de respuesta, misma autenticación) contra la **misma base de datos
`db_beautylux_v2`**. Cambiar de backend es cambiar solo `VITE_API_URL`, sin tocar un componente.
Las reglas de validación de `frontend/src/utils/validators.js` están espejadas en
`backend/src/validations/` y en `backendFastAPI/app/schemas/`, con los mismos mensajes en español.

Actualmente se desarrolla el **quinto avance** sobre `backendFastAPI/` + `frontend/`.

---

## 2. Arranque

```powershell
# Base de datos: MySQL 8 en localhost:3306, esquema db_beautylux_v2

# Backend FastAPI
cd backendFastAPI
.\venv\Scripts\activate
pip install -r requirements.txt
python database/run.py ping      # comprueba conexion
python database/run.py reset     # DESTRUCTIVO: recrea schema + seed. Solo en local.
uvicorn app.main:app --reload --port 8000
# Swagger en http://localhost:8000/docs

# Frontend
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run lint     # oxlint
npm run build    # debe pasar limpio antes de cada PR
```

Usuarios de prueba (del seed): `admin@beautylux.com` / `Admin123*` · `empleado@beautylux.com` / `Empleado123*` · `cliente@beautylux.com` / `Cliente123*`

---

## 3. Reglas del usuario

Decisiones explícitas del usuario. **No se re-litigan**: si algo aquí parece mejorable, propónlo
en una frase y sigue adelante con la regla salvo que él diga lo contrario.

### 3.1 `backend/` es intocable

El backend Node.js/Express de `backend/` **no se borra ni se modifica**: es el entregable del
tercer avance y debe seguir funcionando. El trabajo nuevo va en `backendFastAPI/`. Cuando el
backend FastAPI necesita sus propios archivos por orden (`schema.sql`, `seed.sql`, colección de
Postman), se **duplican y adaptan**, nunca se mueven ni se sustituyen los originales.

### 3.2 El motor es MySQL 8, no MariaDB

El servidor real es **MySQL Community 8.0.46** en `localhost:3306`. Se puede usar sintaxis
exclusiva de MySQL 8 y la intercalación `utf8mb4_0900_ai_ci`.

⚠️ En esta máquina el ejecutable `mysql` que aparece primero en el PATH es el cliente de
**MariaDB 10.4 de XAMPP** (`C:\xampp\mysql\bin\mysql.exe`), así que `mysql --version` miente.
Para saber el motor real hay que preguntarle al servidor (`SELECT VERSION()`). El usuario `root`
usa `caching_sha2_password`, que el cliente de MariaDB y el phpMyAdmin de XAMPP no saben
negociar: conéctate con MySQL Workbench, MySQL Shell, `mysql2` desde Node o PyMySQL.

### 3.3 `docs/` y `stitch_beautylux/` no van al repositorio

Son almacenes de documentación de desarrollo: PDFs de los avances, planes, checklists, capturas
de evidencia y mockups de Google Stitch. Están en `.gitignore` **a propósito**. No los versiones
aunque parezcan las evidencias que pide el instructor. La carpeta `postman/` de la raíz también
está ignorada; las colecciones versionadas son los `.json` de `backend/postman/` y
`backendFastAPI/postman/`.

⚠️ **Consecuencia de la mudanza:** un `git clone` no trae esas carpetas. Hay que copiarlas a mano.

### 3.4 Los pull requests los abre el usuario

La GitHub CLI (`gh`) **no está instalada** y el usuario decidió encargarse él de los PR desde la
web. Por cada etapa terminada: crear la rama, commitear, `git push -u origin feat/<nombre>` y
entregarle el **título y el resumen del PR ya redactados** para que los pegue. No instales `gh`
ni intentes abrir el PR por otra vía.

### 3.5 La tipografía se queda en Inter

`stitch_beautylux/` propone Montserrat. El usuario decidió **conservar Inter** como `--font-sans`
y limitarse a añadir los tokens que faltaban. Los mockups de Stitch son **referencia visual y de
composición, no la fuente de verdad del sistema de diseño**: esa son los tokens de
`frontend/src/index.css`. De Stitch sí se adoptaron el logo nuevo, la estructura del footer y los
colores de marca ausentes.

### 3.6 IA: Google Gemini Flash Lite

El chatbot usa **Google Gemini** por su capa gratuita. El usuario descartó `gemini-2.0-flash` por
estar descontinuado: **no propongas modelos de la serie 2.0**. Se trabaja con la generación 3.x,
variante **Flash Lite**. Confirma el identificador exacto contra la documentación vigente de
Google antes de escribirlo, y déjalo siempre en la variable de entorno `AI_MODEL`, nunca quemado.

### 3.7 Despliegue: Render + Aiven + Vercel, preparar sin desplegar

Backend FastAPI en **Render**, MySQL gestionado en **Aiven.io**, frontend en **Vercel**. La base
de datos va fuera de Render porque Render solo ofrece PostgreSQL gestionado. El despliegue real
lo ejecuta el usuario con sus credenciales al final: nosotros solo dejamos la configuración lista.

---

## 4. Convenciones de código

### 4.1 Backend FastAPI

Capas: `router → service → repository → model / schema`. Cada archivo documenta en su docstring
su equivalente del backend Node.

- Endpoints **`def` síncronos**, nunca `async def` (SQLAlchemy es síncrono; solo los middlewares son async).
- Inyección: `db: Session = Depends(get_db)`, siempre con ese nombre.
- Protección por rol: `user: User = Depends(require_role("admin", "employee"))`. Si no interesa el usuario, `_user:`.
- Respuestas **siempre** con `ok()` / `created()` de `app/core/responses.py` → `{success, message, data, meta?}`. **Sin `response_model=`.**
- Query params con **alias camelCase**: `per_page: int = Query(12, ge=1, le=100, alias="perPage")`.
- Schemas: `XOut(CamelModel)` con `@classmethod from_model`, `CreateXRequest(InputModel)`, `UpdateXRequest` con todo opcional. Validadores con **mensajes en español** (el frontend los muestra tal cual). Bases en `app/schemas/common.py`.
- Repos heredan de `BaseRepository[X]` con un `SORTABLE` a nivel de módulo (acepta camelCase y snake_case). Los joins van en un método propio `find_all_with_*` usando `joinedload` + `.unique()`.
- Services: `db` primer posicional sin anotar, el resto keyword-only tras `*`. Devuelven DTOs, no modelos. Lanzan errores de `app/core/errors.py`, **nunca `HTTPException`**. Hacen `flush()`, **nunca `commit()`** (lo hace `get_db()`). Singleton al final del módulo: `sale_service = SaleService()`.
- `list()` devuelve `dict` con claves `"data"` y `"meta"`; el router hace `ok(data=result["data"], meta=result["meta"])`.
- **Auditoría manual en cada mutación** — no es automática:

  ```python
  audit_service.record(db, user_id=user.id, action="sale_created", entity="sales",
                       entity_id=sale.id, changes={"after": {...}}, ip_address=client_ip(request))
  ```

  `entity` = tabla en plural; `action` = `<entidad_singular>_<verbo_pasado>`.
- Al añadir un modelo: registrarlo en `app/models/__init__.py` (import + `__all__`).
- Al añadir un router: `app/main.py` — import (línea ~25), entrada en `tags_metadata` (~74-81) e `include_router` (~110-115). El prefijo es **`/api`, no `/api/v1`**.
- **No hay Alembic ni migraciones.** Cada cambio de esquema edita `database/schema.sql` y `database/seed.sql`, y en local se corre `python database/run.py reset`. Documenta el `ALTER TABLE` equivalente para no perder datos en producción.
- Nomenclatura: **inglés para la API** (`users`, `firstName`), **español para la documentación** y los mensajes.

### 4.2 Frontend React

- `.jsx` si el archivo devuelve JSX, `.js` si no. Lo impone la regla `react/only-export-components` de oxlint (por eso `AuthContext.js` está separado de `AuthProvider.jsx`).
- `function NombrePascal(props) {}` — nunca arrow, nunca `React.FC` — y `export default` al final. Los primitivos de `ui/` que envuelven inputs usan `forwardRef` y exportan **nombrado + default**.
- Imports **siempre relativos** (`../../`), **sin alias**. Orden: React → `react-router` → `lucide-react` → línea en blanco → componentes → hooks → services → data/utils.
- Datos: `useApi(() => service.list(params), [deps])` → `{data, meta, error, isLoading, refetch}`.
- Formularios: `useForm(initialValues, schema)` y `{...getFieldProps('campo')}` en `<Input>`/`<Select>`.
- CRUD de panel: replicar `components/dashboard/ProductsManager.jsx`. Convención del modal: `undefined` = cerrado, `null` = crear, objeto = editar. Se acompaña de `DataTable`, `ConfirmDialog` y un `XFormModal`.
- Páginas de panel = envoltorios finos de un `Manager` con props de capacidad (`<ProductsManager canDelete={false} />`).
- Precios **siempre** con `formatPrice` de `src/data/products.js` (`Intl.NumberFormat('es-CO', {currency:'COP'})`).
- Clases condicionales con `cn()` de `src/utils/cn.js`. ⚠️ `cn` solo concatena: **no resuelve conflictos de Tailwind**, así que no pases dos utilidades que peleen por la misma propiedad.
- Iconos: solo `lucide-react`, tamaño con `className="size-4"`, decorativos con `aria-hidden="true"`.
- Errores: los services **lanzan** `ApiError`; el componente hace `try/catch` y guarda un string en estado local, que se pinta en `<p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">`. `AuthProvider` es la excepción: devuelve `{ ok, error }` en vez de lanzar.
- Accesibilidad: es una prioridad visible en todo el código. `aria-label`, `aria-live="polite"`, `role="alert"`, `aria-pressed`, `focus-visible:ring-2`, `prefers-reduced-motion`. Mantenlo.
- Todo en español: rutas (`/productos`, `/panel/empleado`), etiquetas, mensajes y comentarios. Nombres de variables y funciones en inglés.

### 4.3 Autenticación

- **Access token: Bearer, solo en memoria** (`let accessToken` en `src/services/api.js`). Nada de `localStorage`.
- **Refresh token: cookie httpOnly**, opaca, rotativa, con detección de reuso. `credentials: 'include'` en cada petición.
- Ante `401` con código `TOKEN_EXPIRED`, `api.js` refresca una vez y reintenta, de forma transparente.
- Roles exactos: **`admin` · `employee` · `client`**. `user.role.name` y `user.role.label`.
- Existe `require_permission()` en el backend y permisos granulares en BD, pero **hoy el RBAC efectivo es por rol**.

### 4.4 Postman

Los requests nuevos van a la colección **versionada** `backendFastAPI/postman/BeautyLux-FastAPI.postman_collection.json`.
Nombre: `MÉTODO -ruta (caso esperado, código)`. Cada request lleva `scripts.afterResponse` con
`pm.test` en español y `pm.environment.set` para encadenar ids. Ejecutar siempre la carpeta
`1. Auth` primero. Es la evidencia que pide el PDF.

---

## 5. Sistema de diseño

**Tailwind v4 CSS-first.** No existe `tailwind.config.js` ni `postcss.config.js` — y no deben
crearse. Todo se configura en `frontend/src/index.css`: `:root` (valores `hsl(...)` completos para
que funcionen los modificadores de opacidad), `.dark` y `@theme inline`.

Tokens de marca:

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `hsl(340 75% 65%)` ≈ `#E9638F` | rosa de marca |
| `--primary-hover` | `hsl(341 65% 57%)` ≈ `#D84A76` | interacción |
| `--primary-glow` | `hsl(345 80% 75%)` | degradados |
| `--brand-gold` | `hsl(46 65% 52%)` ≈ `#D4AF37` | claim del logo |
| `--accent` | `hsl(45 95% 70%)` | amarillo de acento (distinto del dorado de marca) |
| `--blush` `--champagne` `--rose-gold` `--nude` | — | paleta de belleza |

Fuentes: `--font-sans: 'Inter'`, `--font-serif: 'Playfair Display'`. Se cargan por `@import` de
Google Fonts en la línea 1 de `index.css`, no desde el `index.html`.

Utilidades propias (`@utility`, no `@layer components`): `container-app`, `hero-gradient`,
`primary-gradient`, `gold-gradient`, `subtle-gradient`, `text-gradient`, `text-gradient-hero`
(palabra resaltada de `PageHero`), `text-gradient-gold`, `smooth-transition`,
`bounce-transition`, `label-caps`.

**Modo oscuro:** `.dark` redefine todos los tokens de color, incluidos la paleta de belleza y
los degradados (`--gradient-sunset`, `--gradient-gold`, `--gradient-hero-text`), que en `:root`
llevan los colores escritos a mano. Si añades un degradado, dale también su valor en `.dark`.
Hoy ningún control activa la clase `.dark`: los overrides dejan la paleta lista para cuando exista.

**Logo:** `frontend/src/components/ui/BrandLogo.jsx` es la **única** fuente. Props `variant`
(`full` | `mark`), `size` (`sm` | `md` | `lg`), `withClaim`. No vuelvas a dibujar el logo a mano
ni uses el icono `Sparkles` como isotipo (en `Hero.jsx` sí aparece `Sparkles`, pero ahí es un
icono decorativo, no el logo).

**Adherencia:** el código no usa colores crudos de Tailwind (`pink-500`, `gray-*`) ni hex sueltos.
La única excepción justificada es el verde `#25D366` de WhatsApp en `WhatsAppButton.jsx`.
Termina cada etapa igual.

---

## 6. Flujo de trabajo

Una etapa = una rama = un PR.

```bash
git checkout main && git pull
git checkout -b feat/<nombre-etapa>
# ... trabajo ...
git add <solo los archivos de la etapa>     # nunca `git add -A`: hay ruido preexistente
git commit -m "feat: <descripcion en espanol, minusculas, sin tildes>"
git push -u origin feat/<nombre-etapa>
# -> entregar TITULO + RESUMEN del PR al usuario
```

Commits: Conventional Commits, tipo `feat:` (o `fix:` cuando corresponde), mensaje en español,
minúsculas, sin tildes. Cierra con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

⚠️ En el árbol de trabajo hay cambios preexistentes sin commitear que **no son nuestros**:
`backendFastAPI/README.md` y `frontend/README.md` (reformateo cosmético de tablas markdown) y
`frontend/package-lock.json`. Déjalos en paz: stagea siempre archivos concretos.

Antes de cada PR: `npm run lint` y `npm run build` en `frontend/`, y la carpeta de Postman de la
etapa en verde.

---

## 7. Estado del quinto avance

El plan completo está en `docs/PLAN_QUINTO_AVANCE.md`. La bitácora de lo hecho, en
`docs/BITACORA_QUINTO_AVANCE.md`.

| # | Rama | Entrega | Reqs. PDF | Estado |
|---|---|---|---|---|
| 1 | `feat/sistema-diseno-marca` | Logo, favicon, tokens, footer | — | ✅ mezclada |
| 2 | `feat/catalogo-servicios` | Página pública `/servicios` | — | ✅ mezclada |
| 3 | `feat/carrito-bolsa` | Carrito "Tu bolsa" | — | ✅ mezclada |
| 4 | `feat/ventas-backend` | Tablas + API de ventas | 1, 2, 3, 14 | ✅ mezclada |
| 5 | `feat/agenda-citas` | Disponibilidad y citas | — | ✅ mezclada |
| 6 | `feat/checkout-confirmacion` | Checkout + confirmación | 1, 2 | ✅ mezclada |
| 7 | `feat/facturacion` | Facturas + PDF | 7, 8, 9 | ✅ mezclada |
| 8 | `feat/reportes-ventas` | Reporte diario PDF + Excel | 4, 5, 6 | ✅ mezclada |
| 9 | `feat/pos` | Punto de venta presencial | 1, 2 | ✅ mezclada |
| 10 | `feat/dashboards-analitica` | Dashboards y gráficas | 10–13, 15 | ✅ mezclada |
| 11 | `feat/modulo-pqr` | PQR | 16 | ✅ mezclada (squash, PR #11) |
| 12 | `feat/chatbot-gemini` | Chatbot con IA | 17, 18, 19 | ✅ mezclada (squash, PR #12) |
| 13 | `feat/verificacion-diseno` | Auditoría visual + historial de ventas | 3, 10 | ✅ mezclada (PR #13) |
| 14 | `feat/preparacion-despliegue` | Docker, Render, Vercel | 20 | ⏳ PR pendiente |

Los PR se mezclan con **squash and merge**: después del merge, borra la rama local con
`git branch -D` (el `-d` avisa de "no mezclada" porque el squash crea un commit nuevo).

---

## 8. Trampas conocidas

Cosas que ya mordieron una vez. No las repitas.

- **`frontend/public/images/` NO es duplicado de `src/assets/images/`.** La base de datos guarda
  las imágenes de categorías, productos y servicios como rutas públicas absolutas
  (`/images/labial-mate.jpg`, 28 filas en `seed.sql`), que el navegador resuelve contra el origen
  del frontend. Borrarla deja el catálogo entero sin imágenes. `src/assets/images/` es distinto:
  son las imágenes del contenido estático, importadas como módulos para que Vite las procese.
  Hay un `README.md` en la carpeta que lo explica.
- **`src/services/api.js`: JSON con `apiRequest()`, binarios con `downloadRequest()`**
  (devuelve `{blob, filename}`; `utils/download.js` lo guarda). No soporta `FormData`,
  `AbortController` ni timeouts.
- **`@limiter.limit(...)` de slowapi no convive con `from __future__ import annotations`.**
  El wrapper hace que FastAPI no resuelva el tipo del body: lo toma como query param y
  `/openapi.json` responde 500. Un router con endpoints limitados (`auth.py`, `chat.py`) va
  **sin** esa importación; el resto de módulos sí la llevan.
- **El Header muestra la navegación completa desde `lg`, no desde `md`.** Con 6 enlaces más el
  menú de usuario, en 768 px se desborda 158 px. Si añades un enlace a `mainNavLinks`, prueba
  768 y 1024 px.
- **La torre de `FloatingActions` tapa lo que quede en la esquina inferior derecha.** En
  layouts de altura fija (el POS en `lg`) reserva `pr-14` para que no cubra botones de acción.
- **Vite re-optimiza dependencias en caliente** la primera vez que una ruta importa un paquete
  nuevo (p. ej. `recharts`) y recarga la página: una prueba automatizada puede ver una página
  en blanco o un `goto` colgado. Repite la navegación antes de concluir que algo se rompió.
- **La cookie de refresh se configura con `COOKIE_SAMESITE` / `COOKIE_SECURE`** (`app/core/cookies.py`).
  Local: `lax`. Producción (Vercel + Render, dominios distintos): `none` + `Secure`, o el login
  parece funcionar y el refresh falla en silencio. Crear y **borrar** la cookie usan los mismos
  atributos (`_policy_kwargs`): un `delete_cookie` con otros atributos lo descarta el navegador
  entre dominios y el logout no limpia nada. `none` sin `Secure` impide arrancar.
- **`CORS_ORIGIN` admite varios orígenes separados por coma** (`settings.cors_origins`).
- **Producción:** `render.yaml` (raíz), `backendFastAPI/Dockerfile`, `frontend/vercel.json` y los
  `.env.production.example`. MySQL de Aiven exige TLS: `DB_SSL_CA` apunta al `ca.pem` (en Render,
  Secret File en `/etc/secrets/ca.pem`) y lo usan tanto `app/db/session.py` como `database/run.py`.
  Uvicorn corre con `--proxy-headers`: sin eso, detrás del proxy de Render todos los visitantes
  comparten IP y el rate limit del login bloquea a todos a la vez. Guía paso a paso en
  `docs/GUIA_DESPLIEGUE.md`.
- **En `.dockerignore` un patrón sin `**/` solo aplica a la raíz del contexto** (`__pycache__/`
  no excluye `app/__pycache__/`).
- **`.env*` se ignora en backend y frontend salvo `!.env*.example`.** Antes de este ajuste
  `frontend/.env.example` nunca había llegado al repositorio.
- **WhatsApp y el chatbot comparten la esquina en una torre vertical** (`chat/FloatingActions.jsx`,
  montada en `MainLayout`, `DashboardLayout` y `Auth`). `WhatsAppButton` ya no se posiciona
  solo. Al abrir el chat **la torre entera se oculta** — ningún botón debe quedar al lado ni
  detrás del panel. El panel lleva su propia X (y Escape); al cerrarlo la torre vuelve.
- **`src/data/products.js` y `categories.js` están casi muertos**: los arrays ya no se usan
  (todo viene de la API), pero `formatPrice` sí se importa desde ahí en varios sitios. No borres
  el archivo sin mover esa función.
- **`app/models/session.py` define `Session`, que colisiona con `sqlalchemy.orm.Session`.**
  Impórtalo siempre como `Session as SessionModel`.
- **No hay tests automatizados** en ningún subproyecto, y es deliberado: las evidencias del
  avance son Postman y Swagger UI. No introduzcas pytest ni vitest sin pedirlo.
