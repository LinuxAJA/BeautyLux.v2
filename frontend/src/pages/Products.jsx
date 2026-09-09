import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import PageHero from '../components/ui/PageHero';
import ProductFilters from '../components/product/ProductFilters';
import ProductGrid from '../components/product/ProductGrid';
import { useApi } from '../hooks/useApi';
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

  const { data: categories } = useApi(() => categoriesService.listCategories('product'), []);

  const { data: apiProducts, isLoading } = useApi(() => {
    const { orderBy, orderDir } = SORT_TO_QUERY[sort];
    return productsService.listProducts({
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      orderBy,
      orderDir,
      perPage: 50,
    });
  }, [search, category, sort]);

  const visibleProducts = useMemo(
    () => (apiProducts ?? []).map(productsService.toCardShape),
    [apiProducts],
  );

  return (
    <>
      <PageHero
        eyebrow="Productos"
        title="Nuestro"
        highlight="catálogo"
        subtitle="Productos desarrollados con ingredientes de origen natural, fórmulas veganas y resultados comprobados."
      />

      <section className="container-app py-14 lg:py-16">
        <ProductFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
          categories={categories ?? []}
        />

        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          {isLoading
            ? 'Buscando productos...'
            : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}`}
        </p>

        <div className="mt-6">
          <ProductGrid
            products={visibleProducts}
            emptyMessage="No encontramos productos que coincidan con tu búsqueda. Prueba con otro término o cambia de categoría."
          />
        </div>
      </section>
    </>
  );
}

export default Products;
