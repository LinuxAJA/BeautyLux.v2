import { Link } from 'react-router';
import { ArrowRight, Sparkles, Star } from 'lucide-react';

import Button from '../ui/Button';
import heroImage from '../../assets/images/hero-beautylux.jpg';

const STATS = [
  { value: '500+', label: 'Productos' },
  { value: '50 mil', label: 'Clientas felices' },
  { value: '4.9', label: 'Valoración media' },
];

function Hero() {
  return (
    <section className="hero-gradient relative overflow-hidden">
      {/* Manchas difuminadas de fondo: dan profundidad sin competir con el texto. */}
      <div
        className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-champagne/50 blur-3xl animate-float"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 size-80 rounded-full bg-primary-glow/40 blur-3xl animate-float"
        style={{ animationDelay: '2s' }}
        aria-hidden="true"
      />

      <div className="container-app relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-background/70 px-4 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Nueva colección 2026
          </span>

          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.1] md:text-6xl lg:text-7xl">
            Descubre tu belleza <span className="text-gradient">radiante</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/75 sm:text-lg">
            Cosmética consciente con fórmulas veganas, ingredientes de origen natural
            y resultados visibles. Porque cuidarte también es un ritual de belleza.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/productos" className="sm:w-auto">
              <Button size="lg" variant="gradient" fullWidth>
                Explorar productos
                <ArrowRight />
              </Button>
            </Link>
            <Link to="/nosotros" className="sm:w-auto">
              <Button size="lg" variant="outline" fullWidth>
                Conocer la marca
              </Button>
            </Link>
          </div>

          <dl className="mt-10 flex flex-wrap gap-8 border-t border-foreground/10 pt-6">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-serif text-2xl font-semibold sm:text-3xl">{value}</dd>
                <p className="text-xs text-foreground/60 sm:text-sm">{label}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <img
            src={heroImage}
            alt="Brochas, labial y polvos compactos de BeautyLux dispuestos sobre un fondo beige"
            loading="eager"
            fetchPriority="high"
            className="w-full rounded-2xl object-cover shadow-elegant"
          />

          <div className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-xl bg-card/95 p-3.5 shadow-card backdrop-blur-sm sm:-left-6">
            <span className="gold-gradient flex size-10 items-center justify-center rounded-full">
              <Star className="size-5 fill-foreground text-foreground" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">4.9 / 5</p>
              <p className="text-xs text-muted-foreground">Más de 2.400 reseñas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
