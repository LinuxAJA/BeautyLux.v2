# BeautyLux — Frontend

Aplicación web de cosmética desarrollada con **React + Vite**, **React Router** y
**Tailwind CSS v4**

## Puesta en marcha

```bash
npm install
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # compilado de producción
npm run preview    # sirve el compilado de producción
npm run lint       # análisis estático con oxlint
```

## Estructura del proyecto

```
src/
├── assets/images/       10 imágenes del carrusel + imagen del hero
├── components/
│   ├── ui/              Button · Input · Select · Checkbox · Modal · Card
│   │                    Badge · Rating · SectionHeading · PageHero · SocialIcon
│   ├── layout/          Header · Footer · MainLayout · MobileMenu
│   ├── home/            Hero · Carousel · CarouselSlide · CategoryGrid
│   │                    FeaturedProducts · Benefits · Testimonials
│   │                    Newsletter · NewsletterForm
│   ├── product/         ProductCard · ProductGrid · ProductFilters
│   └── auth/            LoginForm · RecoverPassword · RegisterModal
│                        PasswordInput · PasswordStrength
├── hooks/               useForm · useCarousel · useDisclosure
│                        useAuth · useScrollTop
├── data/                carouselSlides · products · categories · testimonials
│                        benefits · navLinks · documentTypes
├── utils/               validators (RegEx y reglas) · cn (clases condicionales)
├── context/             AuthContext · AuthProvider
├── pages/               Home · Products · About · Contact · Auth · NotFound
└── index.css            Sistema de diseño (tokens, tema y utilidades propias)
```

## Rutas

| Ruta           | Página                                                       |
| -------------- | ------------------------------------------------------------- |
| `/`          | Inicio con el carrusel de 10 imágenes                        |
| `/productos` | Catálogo con búsqueda, filtro por categoría y ordenamiento |
| `/nosotros`  | ¿Quiénes somos?                                             |
| `/contacto`  | Contacto con formulario y preguntas frecuentes                |
| `/login`     | Inicio de sesión, recuperar contraseña y modal de registro  |
| cualquier otra | Página 404                                                   |

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

## Formularios y validación

Todos los formularios (login, recuperar contraseña, registro, contacto y boletín)
comparten el hook **`useForm`**, que valida en tiempo real:

- `sanitize` bloquea los caracteres no permitidos **mientras el usuario escribe** y
  recorta el valor a la longitud máxima.
- El mensaje de error aparece cuando el campo pierde el foco por primera vez o tras
  pulsar enviar, para no marcar en rojo desde la primera tecla.
- `handleSubmit` vuelve a validar todo el formulario antes de procesar los datos.

Las reglas viven en `src/utils/validators.js`:

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

## Autenticación simulada

No hay backend en este avance. `AuthProvider` persiste los datos en el navegador:

- Los clientes registrados se guardan en `localStorage` bajo `beautylux:users`.
- La sesión activa va a `localStorage` si se marca **"No cerrar sesión"**, o a
  `sessionStorage` si no se marca.

Para probar el flujo completo: abre `/login` → **Crear una cuenta** → completa el
registro → **Ir a iniciar sesión** → entra con ese correo y contraseña.

## Notas técnicas

- Se usa el paquete `react-router` v7. En esta versión `react-router-dom` es
  únicamente un reexporte del mismo paquete, por lo que la funcionalidad de
  enrutamiento para navegador es idéntica.
- `lucide-react` v1 eliminó los iconos de marcas, así que los iconos de redes
  sociales se definen como SVG en `components/ui/SocialIcon.jsx`.
- Las imágenes se importan como módulos para que Vite las procese y versione;
  provienen de Unsplash y son de uso libre.
