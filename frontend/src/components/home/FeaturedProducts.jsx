import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

import Button from '../ui/Button';
import ProductGrid from '../product/ProductGrid';
import SectionHeading from '../ui/SectionHeading';
import { useApi } from '../../hooks/useApi';
import * as productsService from '../../services/products.service';

function FeaturedProducts() {
  const { data } = useApi(
    () => productsService.listProducts({ orderBy: 'rating', orderDir: 'desc', perPage: 4 }),
    [],
  );

  const featuredProducts = useMemo(() => (data ?? []).map(productsService.toCardShape), [data]);

  return (
    <section className="subtle-gradient py-16 lg:py-20">
      <div className="container-app">
        <SectionHeading
          eyebrow="Favoritos"
          title="Los más"
          highlight="deseados"
          subtitle="Los productos que nuestras clientas vuelven a comprar una y otra vez."
        />

        <div className="mt-12">
          <ProductGrid products={featuredProducts} />
        </div>

        <div className="mt-10 flex justify-center">
          <Link to="/productos">
            <Button variant="outline" size="lg">
              Ver todo el catálogo
              <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;
