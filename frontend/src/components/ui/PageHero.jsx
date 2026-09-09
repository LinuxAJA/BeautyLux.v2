import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

/** Cabecera compartida por las páginas internas, con migas de pan. */
function PageHero({ eyebrow, title, highlight, subtitle }) {
  return (
    <section className="hero-gradient">
      <div className="container-app py-14 text-center lg:py-20">
        <nav aria-label="Ruta de navegación" className="mb-4">
          <ol className="flex items-center justify-center gap-1 text-xs text-foreground/60">
            <li>
              <Link to="/" className="hover:text-primary">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li className="font-medium text-foreground/85" aria-current="page">
              {eyebrow}
            </li>
          </ol>
        </nav>

        <h1 className="font-serif text-4xl font-semibold sm:text-5xl">
          {title} {highlight && <span className="text-gradient">{highlight}</span>}
        </h1>

        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-foreground/70 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

export default PageHero;
