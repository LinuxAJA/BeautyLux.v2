import labialMate from '../assets/images/labial-mate.jpg';
import paletaSombras from '../assets/images/paleta-sombras.jpg';
import mascaraPestanas from '../assets/images/mascara-pestanas.jpg';
import ruborIluminador from '../assets/images/rubor-iluminador.jpg';
import serumFacial from '../assets/images/serum-facial.jpg';
import cremaHidratante from '../assets/images/crema-hidratante.jpg';
import limpiadorFacial from '../assets/images/limpiador-facial.jpg';
import mascarillaArcilla from '../assets/images/mascarilla-arcilla.jpg';
import perfume from '../assets/images/perfume.jpg';
import cuidadoCabello from '../assets/images/cuidado-cabello.jpg';
import brochas from '../assets/images/hero-beautylux.jpg';

/** Categorías usadas por el catálogo y por la sección de categorías del inicio. */
export const CATEGORIES = {
  makeup: 'Maquillaje',
  skincare: 'Cuidado facial',
  fragrance: 'Fragancias',
  hair: 'Cabello',
};

/** Catálogo de productos (datos simulados: aún no hay backend). */
export const products = [
  {
    id: 'labial-mate-luxe',
    name: 'Labial Mate Luxe',
    category: 'makeup',
    price: 68900,
    oldPrice: 82000,
    rating: 4.9,
    reviews: 214,
    image: labialMate,
    badge: 'Más vendido',
  },
  {
    id: 'paleta-sunset-glow',
    name: 'Paleta Sunset Glow',
    category: 'makeup',
    price: 129900,
    oldPrice: null,
    rating: 4.8,
    reviews: 168,
    image: paletaSombras,
    badge: 'Nuevo',
  },
  {
    id: 'mascara-volumen-extremo',
    name: 'Máscara Volumen Extremo',
    category: 'makeup',
    price: 54900,
    oldPrice: 64900,
    rating: 4.7,
    reviews: 302,
    image: mascaraPestanas,
    badge: 'Oferta',
  },
  {
    id: 'duo-rubor-iluminador',
    name: 'Dúo Rubor & Iluminador',
    category: 'makeup',
    price: 72500,
    oldPrice: null,
    rating: 4.6,
    reviews: 96,
    image: ruborIluminador,
    badge: null,
  },
  {
    id: 'set-brochas-rose-gold',
    name: 'Set de Brochas Rose Gold',
    category: 'makeup',
    price: 158000,
    oldPrice: 189000,
    rating: 4.9,
    reviews: 141,
    image: brochas,
    badge: 'Oferta',
  },
  {
    id: 'serum-vitamina-c',
    name: 'Sérum Vitamina C',
    category: 'skincare',
    price: 96000,
    oldPrice: null,
    rating: 4.9,
    reviews: 387,
    image: serumFacial,
    badge: 'Más vendido',
  },
  {
    id: 'crema-hidratante-rose',
    name: 'Crema Hidratante Rosé',
    category: 'skincare',
    price: 84500,
    oldPrice: 95000,
    rating: 4.8,
    reviews: 259,
    image: cremaHidratante,
    badge: null,
  },
  {
    id: 'espuma-limpiadora-suave',
    name: 'Espuma Limpiadora Suave',
    category: 'skincare',
    price: 49900,
    oldPrice: null,
    rating: 4.7,
    reviews: 178,
    image: limpiadorFacial,
    badge: null,
  },
  {
    id: 'mascarilla-detox-arcilla',
    name: 'Mascarilla Detox de Arcilla',
    category: 'skincare',
    price: 62000,
    oldPrice: 71000,
    rating: 4.5,
    reviews: 84,
    image: mascarillaArcilla,
    badge: 'Oferta',
  },
  {
    id: 'eau-de-parfum-blush',
    name: 'Eau de Parfum Blush',
    category: 'fragrance',
    price: 245000,
    oldPrice: null,
    rating: 5.0,
    reviews: 132,
    image: perfume,
    badge: 'Edición limitada',
  },
  {
    id: 'bruma-corporal-champagne',
    name: 'Bruma Corporal Champagne',
    category: 'fragrance',
    price: 78000,
    oldPrice: 89000,
    rating: 4.6,
    reviews: 67,
    image: perfume,
    badge: null,
  },
  {
    id: 'ritual-capilar-nutritivo',
    name: 'Ritual Capilar Nutritivo',
    category: 'hair',
    price: 112000,
    oldPrice: null,
    rating: 4.8,
    reviews: 203,
    image: cuidadoCabello,
    badge: 'Nuevo',
  },
];

/** Productos destacados de la página de inicio. */
export const featuredProducts = products.filter((product) =>
  ['labial-mate-luxe', 'serum-vitamina-c', 'eau-de-parfum-blush', 'paleta-sunset-glow'].includes(
    product.id,
  ),
);

/** Formatea un precio en pesos colombianos: 68900 → "$ 68.900". */
export function formatPrice(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default products;
