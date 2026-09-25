# BeautyLux — Frontend

Aplicación web de cosmética y salón de belleza desarrollada con **React 19 + Vite 8**,
**React Router 7** y **Tailwind CSS v4**, conectada a un backend real: autenticación JWT,
catálogo de productos y servicios, carrito y checkout con agenda de citas, punto de venta,
facturación, reportes, dashboards por rol con gráficas (`recharts`), PQR y chatbot con IA.

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
│   ├── ui/              Button · Input · Select · Checkbox · Modal · Card · Badge
│   │                    Rating · SectionHeading · PageHero · SocialIcon · BrandLogo
│   ├── layout/          Header · UserMenu · Footer · MainLayout
│   │                    MobileMenu · DashboardLayout
│   ├── home/            Hero · Carousel · CarouselSlide · CategoryGrid · Benefits
│   │                    FeaturedProducts · FeaturedServices · Testimonials · Newsletter*
│   ├── product/         ProductCard · ProductGrid · ProductFilters
│   ├── service/         ServiceCard · ServiceGrid · ServiceFilters
│   ├── cart/            CartDrawer · CartItemRow · FreeShippingMeter · OrderSummary
│   ├── checkout/        CheckoutStepper · AppointmentStep · ShippingStep
│   │                    PaymentStep · HoldTimer
│   ├── booking/         SlotPicker (calendario semanal + franjas libres)
│   ├── pos/             PosItemPicker · PosTicket · PosCustomerPanel
│   │                    PosCheckoutModal · QuickClientModal
│   ├── chat/            FloatingActions (torre de FABs) · ChatWidget
│   ├── common/          WhatsAppButton · InvoiceDownloadButton
│   ├── auth/            LoginForm · RecoverPassword · ResetPasswordForm
│   │                    RegisterModal · PasswordInput · PasswordStrength
│   │                    ProtectedRoute · RoleRoute
│   └── dashboard/       DataTable · StatCard · ConfirmDialog · *StatusBadge
│                        ChartCard · SalesBarChart · SalesLineChart · DashboardFilters
│                        Users/Products/Services/Categories/Appointments/Invoices/
│                        Sales/PqrManager · *FormModal · RescheduleModal · PqrResponseModal
├── hooks/               useForm · useCarousel · useDisclosure · useAuth · useCart
│                        useApi · useScrollTop
├── data/                carouselSlides · products (solo `formatPrice`) · categories
│                        testimonials · benefits · navLinks · documentTypes · checkout
├── utils/               validators · cn · download (guardar blobs) · duration
├── context/             AuthContext · AuthProvider · CartContext · CartProvider
├── services/            api (cliente fetch + descarga de binarios) · auth · users
│                        products · services · categories · meta · sales · appointments
│                        invoices · reports · stats · pqr · chat
├── pages/               Home · Products · Services · Cart · Checkout · OrderConfirmation
│                        Pqr · About · Contact · Auth · NotFound
│                        panel/ (admin · employee · client · pos)
└── index.css            Sistema de diseño (tokens, tema claro/oscuro y utilidades propias)
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

En producción (Vercel) las variables se definen en el panel del proyecto, con Root Directory
`frontend`: ver `.env.production.example` y la sección **Despliegue** del
[README raíz](../README.md). `vercel.json` hace el rewrite de la SPA para que recargar una
ruta de React Router no dé 404.

Ver [`../backendFastAPI/README.md`](../backendFastAPI/README.md) o
[`../backend/README.md`](../backend/README.md) para levantar el backend elegido.

## Rutas

| Ruta                          | Página                                                    | Acceso |
| ------------------------------ | ---------------------------------------------------------- | :----: |
| `/`                           | Inicio con el carrusel de 10 imágenes                     | público |
| `/productos`                  | Catálogo con búsqueda, filtro por categoría y orden      | público |
| `/servicios`                  | Catálogo de servicios con duración, filtros y orden       | público |
| `/bolsa`                      | Carrito "Tu bolsa" (productos y servicios)                | público |
| `/checkout`                   | Compra en 4 pasos: cita, entrega, pago simulado, revisión | 🔑 |
| `/pedido/:saleNumber`         | Confirmación del pedido (o detalle de venta, si es personal) | 🔑 |
| `/pqr`                        | Radicar una PQR y consultar su estado sin iniciar sesión  | público |
| `/nosotros`                   | ¿Quiénes somos?                                          | público |
| `/contacto`                   | Contacto con formulario y preguntas frecuentes             | público |
| `/login`                      | Inicio de sesión, recuperar contraseña y registro         | público |
| `/restablecer-contrasena`     | Crear contraseña nueva (enlace del correo de recuperación) | público |
| `/panel`                      | Redirige al panel del rol autenticado                       | 🔑 |
| `/panel/admin*`                | Resumen con gráficas, usuarios, productos, servicios, categorías, citas, ventas, punto de venta, facturación, reportes, PQR, bitácora | 👑 |
| `/panel/empleado*`             | Resumen operativo, clientes, productos, servicios, citas, ventas, punto de venta, facturación, PQR | 🧑‍💼 |
| `/panel/cliente*`              | Perfil y resumen, mis pedidos, mis citas, mis PQR           | 🙋 |
| `/403`                        | Acceso denegado (rol sin permiso para la ruta)              | 🔑 |
| cualquier otra                 | Página 404                                                  | público |

Toda vista se alcanza desde la navegación — `mainNavLinks`, `footerColumns`,
`accountShortcuts` (`data/navLinks.js`) y `NAV_BY_ROLE` (`DashboardLayout.jsx`) —, nunca
solo escribiendo la URL.

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
  menú desplegable (`components/layout/UserMenu.jsx`), con "Mi panel", atajos según el rol
  (`accountShortcuts` en `data/navLinks.js`: pedidos/citas/PQR del cliente, punto de venta y
  PQR del personal) y "Cerrar sesión". El menú móvil muestra los mismos atajos.

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
   `.dark` redefine también la paleta de belleza, los estados (`--destructive`,
   `--success`) y los degradados, para que ningún fondo claro quede bajo texto claro.
2. **`@theme inline`** — el puente que convierte esas variables en utilidades:
   `bg-background`, `text-primary`, `border-border`, `bg-blush`, `shadow-glow`,
   `font-serif`, `animate-fade-up`, etc.
3. **`@utility`** — utilidades propias del proyecto: `hero-gradient`, `gold-gradient`,
   `primary-gradient`, `subtle-gradient`, `text-gradient`, `text-gradient-hero`,
   `text-gradient-gold`, `label-caps`, `smooth-transition`, `container-app`.

Tipografías: **Playfair Display** para títulos e **Inter** para el cuerpo. El logo sale
siempre de `components/ui/BrandLogo.jsx`.

La navegación completa del Header aparece desde `lg` (1024 px); por debajo, el menú
hamburguesa. Con seis enlaces más el menú de usuario, en `md` (768 px) no caben.

## Componente `Carousel`

Reutilizable y controlado por el hook `useCarousel`:

```jsx
<Carousel slides={carouselSlides} interval={5000} autoPlay />
```

- 10 diapositivas, cada una con etiqueta, **título** y **descripción** siempre visibles.
- Avance automático cada 5 s que se pausa al pasar el ratón o al enfocar con el teclado.
- Navegación por flechas, indicadores, teclas `←` `→` y deslizamiento táctil en móvil.
- Respeta `prefers-reduced-motion` y anuncia los cambios con `aria-live`.

## Acciones flotantes: chatbot y WhatsApp

`components/chat/FloatingActions.jsx` es una torre vertical fija abajo a la derecha: el
botón del chatbot arriba y el de WhatsApp (`common/WhatsAppButton.jsx`, lee
`VITE_WHATSAPP_NUMBER`) abajo. Se monta en `MainLayout`, `DashboardLayout` y `/login`.

Al abrir el chat (`chat/ChatWidget.jsx`) **la torre entera se oculta**; el panel tiene su
propia X, se cierra también con Escape y al cerrarlo el foco vuelve al botón del chat. En
escritorio es una ventana anclada a la esquina; en móvil ocupa la pantalla completa. La
conversación se retoma entre recargas: `{conversationId, sessionToken}` se guarda en
`localStorage` (no es un token de autenticación). Las respuestas las genera Google Gemini
desde el backend; sin API Key, el backend responde con un FAQ local.

## Notas técnicas

- Se usa el paquete `react-router` v7. En esta versión `react-router-dom` es
  únicamente un reexporte del mismo paquete, por lo que la funcionalidad de
  enrutamiento para navegador es idéntica.
- `lucide-react` v1 eliminó los iconos de marcas, así que los iconos de redes
  sociales se definen como SVG en `components/ui/SocialIcon.jsx`.
- Las imágenes se importan como módulos para que Vite las procese y versione;
  provienen de Unsplash y son de uso libre.
