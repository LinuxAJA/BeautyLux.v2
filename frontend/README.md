# BeautyLux — Frontend

Aplicación web de cosmética desarrollada con **React 19 + Vite 8**, **React Router 7** y
**Tailwind CSS v4**, conectada a un backend real (autenticación JWT, catálogo y paneles por rol).

## Puesta en marcha

```bash
npm install
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # compilado de producción
npm run preview    # sirve el compilado de producción
npm run lint       # análisis estático con oxlint
```

Necesita un backend corriendo — ver la sección **Backend y variables de entorno** más abajo.

## Estructura del proyecto

```
src/
├── assets/images/       10 imágenes del carrusel + imagen del hero
├── components/
│   ├── ui/              Button · Input · Select · Checkbox · Modal · Card
│   │                    Badge · Rating · SectionHeading · PageHero · SocialIcon
│   ├── layout/          Header · UserMenu · Footer · MainLayout
│   │                    MobileMenu · DashboardLayout
│   ├── home/            Hero · Carousel · CarouselSlide · CategoryGrid
│   │                    FeaturedProducts · Benefits · Testimonials
│   │                    Newsletter · NewsletterForm
│   ├── product/         ProductCard · ProductGrid · ProductFilters
│   ├── auth/             LoginForm · RecoverPassword · ResetPasswordForm
│   │                    RegisterModal · PasswordInput · PasswordStrength
│   │                    ProtectedRoute · RoleRoute
│   └── dashboard/       DataTable · StatCard · StatusBadge · ConfirmDialog
│                        UsersManager · ProductsManager · ServicesManager
│                        CategoriesManager · *FormModal
├── hooks/               useForm · useCarousel · useDisclosure
│                        useAuth · useApi · useScrollTop
├── data/                carouselSlides · products (solo `formatPrice`) · categories
│                        testimonials · benefits · navLinks · documentTypes
├── utils/               validators (RegEx y reglas) · cn (clases condicionales)
├── context/             AuthContext · AuthProvider
├── services/            api (cliente fetch) · auth · users · products
│                        services · categories · meta
├── pages/               Home · Products · About · Contact · Auth · NotFound
│                        panel/ (admin · employee · client)
└── index.css            Sistema de diseño (tokens, tema y utilidades propias)
```

## Backend y variables de entorno

El frontend consume una API REST bajo `/api`. El proyecto tiene **dos backends
equivalentes** (mismo contrato, misma base de datos) — elige uno con `VITE_API_URL`
en `.env` (copia `.env.example` como punto de partida):

```bash
VITE_API_URL=http://localhost:8000/api   # FastAPI (Cuarto Avance) — por defecto
# VITE_API_URL=http://localhost:3000/api   # Node.js + Express (Tercer Avance)

VITE_WHATSAPP_NUMBER=573001234567
```

Ver [`../backendFastAPI/README.md`](../backendFastAPI/README.md) o
[`../backend/README.md`](../backend/README.md) para levantar el backend elegido.

## Rutas

| Ruta                          | Página                                                    | Acceso |
| ------------------------------ | ---------------------------------------------------------- | :----: |
| `/`                           | Inicio con el carrusel de 10 imágenes                     | público |
| `/productos`                  | Catálogo con búsqueda, filtro por categoría y orden      | público |
| `/nosotros`                   | ¿Quiénes somos?                                          | público |
| `/contacto`                   | Contacto con formulario y preguntas frecuentes             | público |
| `/login`                      | Inicio de sesión, recuperar contraseña y registro         | público |
| `/restablecer-contrasena`     | Crear contraseña nueva (enlace del correo de recuperación) | público |
| `/panel`                      | Redirige al panel del rol autenticado                       | 🔑 |
| `/panel/admin*`                | Usuarios, productos, servicios, categorías, bitácora     | 👑 |
| `/panel/empleado*`             | Clientes (solo lectura/edición), productos, servicios     | 🧑‍💼 |
| `/panel/cliente`               | Perfil, resumen de cuenta, cambio de contraseña             | 🙋 |
| `/403`                        | Acceso denegado (rol sin permiso para la ruta)              | 🔑 |
| cualquier otra                 | Página 404                                                  | público |

## Autenticación

Real, contra el backend elegido — no hay simulación ni `localStorage` para la sesión:

- El *access token* (JWT) vive **solo en memoria** (`services/api.js`); se pierde al
  recargar la página, momento en que `AuthProvider` lo recupera automáticamente
  llamando a `/auth/refresh` con la cookie `httpOnly` que puso el backend al iniciar sesión.
- Si una petición responde 401 con `code: "TOKEN_EXPIRED"`, `api.js` refresca el token
  una sola vez (aunque haya varias peticiones a la vez) y reintenta, de forma transparente.
- **Recuperación de contraseña real**: `RecoverPassword` pide el correo
  (`POST /auth/forgot-password`), el backend envía un enlace por correo con un token de
  un solo uso válido 30 minutos, y `ResetPasswordForm` (en `/restablecer-contrasena?token=...`)
  completa el cambio (`POST /auth/reset-password`).
- El nombre, correo y rol del usuario autenticado se muestran en el Navbar dentro de un
  menú desplegable (`components/layout/UserMenu.jsx`), con accesos a "Mi panel" y
  "Cerrar sesión".

Para probar el flujo completo: `/login` → **Crear una cuenta** → completa el registro →
**Ir a iniciar sesión** → entra con ese correo y contraseña. Los tres roles (`admin`,
`employee`, `client`) tienen usuarios de prueba — ver el README del backend elegido.

## Formularios y validación

Todos los formularios (login, recuperar/restablecer contraseña, registro, perfil, los
modales de los paneles, contacto y boletín) comparten el hook **`useForm`**, que valida
en tiempo real:

- `sanitize` bloquea los caracteres no permitidos **mientras el usuario escribe** y
  recorta el valor a la longitud máxima.
- El mensaje de error aparece cuando el campo pierde el foco por primera vez o tras
  pulsar enviar, para no marcar en rojo desde la primera tecla.
- `handleSubmit` vuelve a validar todo el formulario antes de procesar los datos.
- El backend **siempre** revalida (nunca confía solo en el frontend); sus mensajes de
  error se muestran en los formularios y en los diálogos de confirmación de los paneles.

Las reglas viven en `src/utils/validators.js`, con los mismos límites que los `schemas/`
del backend:

| Campo                 | Regla                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Nombre / Apellido     | solo letras, tildes y ñ · 2–40 caracteres                                |
| Tipo de documento     | obligatorio                                                                 |
| Nº de documento      | CC/TI/NIT: 6–12 dígitos · CE: 6–15 dígitos · PA: 6–15 alfanuméricos |
| Dirección            | 5–80 caracteres, puntuación de dirección permitida                       |
| Teléfono             | celular colombiano: 10 dígitos que inician en 3                            |
| Correo                | formato de correo válido, máximo 60 caracteres                            |
| Contraseña           | 8–32 caracteres con minúscula, mayúscula, número y símbolo             |
| Confirmar contraseña | debe coincidir con la contraseña                                           |
| Precio / Precio anterior | numérico, 0–99 999 999.99                                              |
| Stock                 | entero ≥ 0                                                                 |
| Duración (servicios)  | entero, 1–600 minutos                                                       |
| Imagen (URL)           | hasta 500 caracteres                                                        |
| Descripción (producto/servicio · categoría) | hasta 2000 · 255 caracteres                            |

## Sistema de diseño

Tailwind CSS v4 se configura desde el propio CSS (no existe `tailwind.config.js`).
En `src/index.css` conviven tres bloques:

1. **`:root` / `.dark`** — las variables crudas del tema (colores, gradientes, sombras).
2. **`@theme inline`** — el puente que convierte esas variables en utilidades:
   `bg-background`, `text-primary`, `border-border`, `bg-blush`, `shadow-glow`,
   `font-serif`, `animate-fade-up`, etc.
3. **`@utility`** — utilidades propias del proyecto: `hero-gradient`, `gold-gradient`,
   `primary-gradient`, `subtle-gradient`, `text-gradient`, `smooth-transition`,
   `container-app`.

Tipografías: **Playfair Display** para títulos e **Inter** para el cuerpo.

## Componente `Carousel`

Reutilizable y controlado por el hook `useCarousel`:

```jsx
<Carousel slides={carouselSlides} interval={5000} autoPlay />
```

- 10 diapositivas, cada una con etiqueta, **título** y **descripción** siempre visibles.
- Avance automático cada 5 s que se pausa al pasar el ratón o al enfocar con el teclado.
- Navegación por flechas, indicadores, teclas `←` `→` y deslizamiento táctil en móvil.
- Respeta `prefers-reduced-motion` y anuncia los cambios con `aria-live`.

## Botón flotante de WhatsApp

`components/common/WhatsAppButton.jsx` es fijo (`position: fixed`) y reutilizable (sin
props, lee `VITE_WHATSAPP_NUMBER`). Se monta en `MainLayout`, `DashboardLayout` y en la
página `/login`, así que está visible independientemente de si hay sesión iniciada.

## Notas técnicas

- Se usa el paquete `react-router` v7. En esta versión `react-router-dom` es
  únicamente un reexporte del mismo paquete, por lo que la funcionalidad de
  enrutamiento para navegador es idéntica.
- `lucide-react` v1 eliminó los iconos de marcas, así que los iconos de redes
  sociales se definen como SVG en `components/ui/SocialIcon.jsx`.
- Las imágenes se importan como módulos para que Vite las procese y versione;
  provienen de Unsplash y son de uso libre.
