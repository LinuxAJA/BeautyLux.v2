import { Link } from 'react-router';
import { ArrowLeft, Search } from 'lucide-react';

import Button from '../components/ui/Button';

function NotFound() {
  return (
    <section className="hero-gradient">
      <div className="container-app flex min-h-[70vh] flex-col items-center justify-center gap-6 py-20 text-center">
        <p className="text-gradient font-serif text-7xl font-semibold sm:text-8xl">404</p>

        <div className="max-w-md">
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
            Esta página se nos escapó
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70 sm:text-base">
            La dirección que buscas no existe o cambió de lugar. Vuelve al inicio o
            explora nuestro catálogo.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/">
            <Button variant="gradient" size="lg" fullWidth>
              <ArrowLeft />
              Volver al inicio
            </Button>
          </Link>
          <Link to="/productos">
            <Button variant="outline" size="lg" fullWidth>
              <Search />
              Ver productos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
