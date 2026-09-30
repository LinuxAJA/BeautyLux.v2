import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import PageHero from '../components/ui/PageHero';
import ServiceFilters from '../components/service/ServiceFilters';
import ServiceGrid from '../components/service/ServiceGrid';
import Pagination from '../components/ui/Pagination';
import { useApi } from '../hooks/useApi';
import useUrlPage from '../hooks/useUrlPage';
import * as categoriesService from '../services/categories.service';
import * as servicesService from '../services/services.service';

const SORT_TO_QUERY = {
  featured: { orderBy: 'created_at', orderDir: 'desc' },
  'price-asc': { orderBy: 'price', orderDir: 'asc' },
  'price-desc': { orderBy: 'price', orderDir: 'desc' },
  'duration-asc': { orderBy: 'durationMinutes', orderDir: 'asc' },
  name: { orderBy: 'name', orderDir: 'asc' },
};

/** Catálogo de servicios con búsqueda, filtro por categoría y ordenamiento, servidos por la API. */
function Services() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('categoria') ?? 'all');
  const [sort, setSort] = useState('featured');
  const { page, setPage, withReset } = useUrlPage();
  const resultsRef = useRef(null);

  const { data: categories } = useApi(() => categoriesService.listCategories('service'), []);

  const { data: apiServices, meta, isLoading, error } = useApi(() => {
    const { orderBy, orderDir } = SORT_TO_QUERY[sort];
    return servicesService.listServices({
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      orderBy,
      orderDir,
      page,
      perPage: 12,
    });
  }, [search, category, sort, page]);

  const visibleServices = useMemo(
    () => (apiServices ?? []).map(servicesService.toCardShape),
    [apiServices],
  );
  const total = meta?.total ?? visibleServices.length;

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <PageHero
        eyebrow="Servicios"
        title="Nuestros"
        highlight="servicios"
        subtitle="Rituales de belleza, maquillaje profesional y estética personalizada a cargo de especialistas certificadas."
      />

      <section ref={resultsRef} className="container-app scroll-mt-24 py-14 lg:py-16">
        <ServiceFilters
          search={search}
          onSearchChange={withReset(setSearch)}
          category={category}
          onCategoryChange={withReset(setCategory)}
          sort={sort}
          onSortChange={withReset(setSort)}
          categories={categories ?? []}
        />

        {error ? (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error.message ?? 'No pudimos cargar los servicios. Inténtalo de nuevo en un momento.'}
          </p>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
            {isLoading
              ? 'Buscando servicios...'
              : `${total} ${total === 1 ? 'servicio disponible' : 'servicios disponibles'}`}
          </p>
        )}

        <div className="mt-6">
          <ServiceGrid
            services={visibleServices}
            emptyMessage="No encontramos servicios que coincidan con tu búsqueda. Prueba con otro término o cambia de categoría."
          />
        </div>

        <Pagination meta={meta} onPageChange={handlePageChange} itemLabel="servicios" className="mt-10" />
      </section>
    </>
  );
}

export default Services;
