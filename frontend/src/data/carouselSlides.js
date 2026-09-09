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

/**
 * Las 10 imágenes del carrusel, cada una con su título y descripción.
 * Las imágenes se importan (no se referencian por ruta) para que Vite
 * las procese, las optimice y las incluya en el bundle de producción.
 */
export const carouselSlides = [
  {
    id: 1,
    image: labialMate,
    alt: 'Aplicación de labial mate sobre los labios con pincel profesional',
    tag: 'Maquillaje',
    title: 'Labiales Mate Luxe',
    description:
      'Pigmentación intensa de larga duración disponible en 12 tonos, con acabado aterciopelado que no reseca los labios.',
  },
  {
    id: 2,
    image: paletaSombras,
    alt: 'Paleta de sombras de ojos sostenida en la mano junto a un pincel',
    tag: 'Maquillaje',
    title: 'Paleta Sunset Glow',
    description:
      '18 sombras de tonos cálidos con acabados mate, satinado y metálico. Alta pigmentación y mínimo desprendimiento.',
  },
  {
    id: 3,
    image: mascaraPestanas,
    alt: 'Máscara de pestañas dorada abierta sobre fondo rosado',
    tag: 'Maquillaje',
    title: 'Máscara Volumen Extremo',
    description:
      'Efecto pestañas postizas desde la primera capa. Fórmula resistente al agua que no forma grumos ni se corre.',
  },
  {
    id: 4,
    image: ruborIluminador,
    alt: 'Rubor en polvo con brocha dorada sobre superficie blanca',
    tag: 'Maquillaje',
    title: 'Dúo Rubor & Iluminador',
    description:
      'Mejillas radiantes al instante gracias a una textura sedosa que se difumina sin esfuerzo y se adapta a todos los tonos de piel.',
  },
  {
    id: 5,
    image: serumFacial,
    alt: 'Gotero de sérum facial sostenido a contraluz',
    tag: 'Cuidado facial',
    title: 'Sérum Vitamina C',
    description:
      'Ilumina y unifica el tono de la piel combinando vitamina C estabilizada con ácido hialurónico de bajo peso molecular.',
  },
  {
    id: 6,
    image: cremaHidratante,
    alt: 'Mano tomando un frasco de crema hidratante junto a productos de cuidado facial',
    tag: 'Cuidado facial',
    title: 'Crema Hidratante Rosé',
    description:
      'Hidratación continua durante 48 horas con agua de rosas, ceramidas y niacinamida. Textura ligera de rápida absorción.',
  },
  {
    id: 7,
    image: limpiadorFacial,
    alt: 'Tubo de espuma limpiadora facial con una muestra de producto',
    tag: 'Cuidado facial',
    title: 'Espuma Limpiadora Suave',
    description:
      'Retira maquillaje e impurezas sin alterar la barrera cutánea. Apta para piel sensible y de uso diario.',
  },
  {
    id: 8,
    image: mascarillaArcilla,
    alt: 'Mujer recibiendo la aplicación de una mascarilla facial de arcilla',
    tag: 'Ritual',
    title: 'Mascarilla Detox de Arcilla',
    description:
      'Purifica los poros y matifica en 10 minutos. Arcilla verde y carbón activado para un ritual de spa en casa.',
  },
  {
    id: 9,
    image: perfume,
    alt: 'Frascos de perfume ámbar sobre fondo oscuro con detalles dorados',
    tag: 'Fragancias',
    title: 'Eau de Parfum Blush',
    description:
      'Una fragancia floral amaderada con notas de peonía, vainilla de Madagascar y ámbar. Hasta 8 horas de fijación.',
  },
  {
    id: 10,
    image: cuidadoCabello,
    alt: 'Mujer de espaldas mostrando su cabello largo frente a una pared rosada',
    tag: 'Cabello',
    title: 'Ritual Capilar Nutritivo',
    description:
      'Aceite de argán y keratina vegetal para un brillo espejo. Repara las puntas abiertas y reduce el frizz desde el primer uso.',
  },
];

export default carouselSlides;
