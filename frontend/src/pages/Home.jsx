import Benefits from '../components/home/Benefits';
import Carousel from '../components/home/Carousel';
import CategoryGrid from '../components/home/CategoryGrid';
import FeaturedProducts from '../components/home/FeaturedProducts';
import Hero from '../components/home/Hero';
import Newsletter from '../components/home/Newsletter';
import SectionHeading from '../components/ui/SectionHeading';
import Testimonials from '../components/home/Testimonials';
import { carouselSlides } from '../data/carouselSlides';

/** Página principal (Index): presenta la marca y el carrusel de 10 productos. */
function Home() {
  return (
    <>
      <Hero />

      <section className="container-app py-16 lg:py-20">
        <SectionHeading
          eyebrow="Colección destacada"
          title="Diez rituales para tu"
          highlight="belleza"
          subtitle="Recorre nuestra selección de productos favoritos. Desliza, usa las flechas o toca los indicadores para explorarlos."
        />

        <div className="mt-12">
          <Carousel slides={carouselSlides} interval={5000} autoPlay />
        </div>
      </section>

      <CategoryGrid />
      <FeaturedProducts />
      <Benefits />
      <Testimonials />
      <Newsletter />
    </>
  );
}

export default Home;
