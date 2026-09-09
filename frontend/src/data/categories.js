import paletaSombras from '../assets/images/paleta-sombras.jpg';
import serumFacial from '../assets/images/serum-facial.jpg';
import perfume from '../assets/images/perfume.jpg';
import cuidadoCabello from '../assets/images/cuidado-cabello.jpg';

/** Categorías destacadas en la página de inicio. */
export const categories = [
  {
    id: 'makeup',
    name: 'Maquillaje',
    description: 'Labiales, sombras, bases y brochas',
    count: 5,
    image: paletaSombras,
  },
  {
    id: 'skincare',
    name: 'Cuidado facial',
    description: 'Sérums, cremas y mascarillas',
    count: 4,
    image: serumFacial,
  },
  {
    id: 'fragrance',
    name: 'Fragancias',
    description: 'Perfumes y brumas corporales',
    count: 2,
    image: perfume,
  },
  {
    id: 'hair',
    name: 'Cabello',
    description: 'Tratamientos y rituales capilares',
    count: 1,
    image: cuidadoCabello,
  },
];

export default categories;
