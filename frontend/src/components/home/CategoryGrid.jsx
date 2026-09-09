import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

import SectionHeading from '../ui/SectionHeading';
import { useApi } from '../../hooks/useApi';
import * as categoriesService from '../../services/categories.service';

function CategoryGrid() {
  const { data: categories } = useApi(() => categoriesService.listCategories('product'), []);

  return (
    <section className="container-app py-16 lg:py-20">
      <SectionHeading
        eyebrow="Explora"
        title="Compra por"
        highlight="categoría"
        subtitle="Encuentra justo lo que buscas dentro de nuestras líneas de producto."
      />

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(categories ?? []).map(({ id, slug, name, description, imageUrl }) => (
          <li key={id}>
            <Link
              to={`/productos?categoria=${slug}`}
              className="group relative block h-64 overflow-hidden rounded-xl shadow-card smooth-transition hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <img
                src={imageUrl}
                alt={name}
                loading="lazy"
                className="size-full object-cover smooth-transition group-hover:scale-105"
              />

              <div
                className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent"
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="mt-1 flex items-center gap-1.5 font-serif text-xl font-semibold text-background">
                  {name}
                  <ArrowUpRight
                    className="size-4 smooth-transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </h3>
                <p className="mt-0.5 text-xs text-background/75">{description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CategoryGrid;
