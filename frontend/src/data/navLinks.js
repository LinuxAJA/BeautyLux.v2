/** Enlaces de navegación principales. Fuente única para Header, MobileMenu y Footer. */
export const mainNavLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Productos', to: '/productos' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
];

/** Columnas de enlaces del pie de página. */
export const footerColumns = [
  {
    title: 'Tienda',
    links: [
      { label: 'Maquillaje', to: '/productos?categoria=maquillaje' },
      { label: 'Cuidado facial', to: '/productos?categoria=cuidado-facial' },
      { label: 'Fragancias', to: '/productos?categoria=fragancias' },
      { label: 'Cabello', to: '/productos?categoria=cabello' },
    ],
  },
  {
    title: 'Compañía',
    links: [
      { label: '¿Quiénes somos?', to: '/nosotros' },
      { label: 'Contacto', to: '/contacto' },
      { label: 'Iniciar sesión', to: '/login' },
      { label: 'Crear cuenta', to: '/login' },
    ],
  },
];

/** Enlaces legales de la barra inferior del pie de página. */
export const legalLinks = [
  { label: 'Términos y condiciones', to: '/contacto' },
  { label: 'Política de privacidad', to: '/contacto' },
  { label: 'Política de envíos', to: '/contacto' },
];

/** Datos de contacto reutilizados en el Footer y en la página de Contacto. */
export const contactInfo = {
  address: 'Calle 45 #23-18, Barrio La Castellana, Bogotá D.C.',
  phone: '+57 320 456 7890',
  email: 'hola@beautylux.com',
  schedule: 'Lunes a sábado · 9:00 a.m. – 7:00 p.m.',
};

/** Redes sociales (el icono se resuelve en el componente con lucide-react). */
export const socialLinks = [
  { label: 'Instagram', icon: 'instagram', href: 'https://instagram.com' },
  { label: 'Facebook', icon: 'facebook', href: 'https://facebook.com' },
  { label: 'Twitter', icon: 'twitter', href: 'https://twitter.com' },
  { label: 'YouTube', icon: 'youtube', href: 'https://youtube.com' },
];
