import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import PageHero from '../components/ui/PageHero';
import ProductFilters from '../components/product/ProductFilters';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/ui/Pagination';
import { useApi } from '../hooks/useApi';
import useUrlPage from '../hooks/useUrlPage';
import * as categoriesService from '../services/categories.service';
import * as productsService from '../services/products.service';

const SORT_TO_QUERY = {
  featured: { orderBy: 'created_at', orderDir: 'desc' },
  'price-asc': { orderBy: 'price', orderDir: 'asc' },
  'price-desc': { orderBy: 'price', orderDir: 'desc' },
  rating: { orderBy: 'rating', orderDir: 'desc' },
};

/** Catálogo con búsqueda por texto, filtro por categoría y ordenamiento, servidos por la API. */
function Products() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('categoria') ?? 'all');
  const [sort, setSort] = useState('featured');
  const { page, setPage, withReset } = useUrlPage();
  const resultsRef = useRef(null);

  const { data: categories } = useApi(() => categoriesService.listCategories('product'), []);

  const { data: apiProducts, meta, isLoading, error } = useApi(() => {
    const { orderBy, orderDir } = SORT_TO_QUERY[sort];
    return productsService.listProducts({
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      orderBy,
      orderDir,
      page,
      perPage: 12,
    });
  }, [search, category, sort, page]);

  const visibleProducts = useMemo(
    () => (apiProducts ?? []).map(productsService.toCardShape),
    [apiProducts],
  );
  const total = meta?.total ?? visibleProducts.length;

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <PageHero
        eyebrow="Productos"
        title="Nuestro"
        highlight="catálogo"
        subtitle="Productos desarrollados con ingredientes de origen natural, fórmulas veganas y resultados comprobados."
      />

      <section ref={resultsRef} className="container-app scroll-mt-24 py-14 lg:py-16">
        <ProductFilters
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
            {error.message ?? 'No pudimos cargar los productos. Inténtalo de nuevo en un momento.'}
          </p>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
            {isLoading
              ? 'Buscando productos...'
              : `${total} ${total === 1 ? 'producto encontrado' : 'productos encontrados'}`}
          </p>
        )}

        <div className="mt-6">
          <ProductGrid
            products={visibleProducts}
            emptyMessage="No encontramos productos que coincidan con tu búsqueda. Prueba con otro término o cambia de categoría."
          />
        </div>

        <Pagination meta={meta} onPageChange={handlePageChange} itemLabel="productos" className="mt-10" />
      </section>
    </>
  );
}

export default Products;
