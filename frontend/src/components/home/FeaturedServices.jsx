import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

import Button from '../ui/Button';
import SectionHeading from '../ui/SectionHeading';
import ServiceGrid from '../service/ServiceGrid';
import { useApi } from '../../hooks/useApi';
import * as servicesService from '../../services/services.service';

function FeaturedServices() {
  const { data } = useApi(
    () => servicesService.listServices({ orderBy: 'created_at', orderDir: 'desc', perPage: 4 }),
    [],
  );

  const featuredServices = useMemo(() => (data ?? []).map(servicesService.toCardShape), [data]);

  return (
    <section className="container-app py-16 lg:py-20">
      <SectionHeading
        eyebrow="En cabina"
        title="Rituales que se viven en el"
        highlight="atelier"
        subtitle="Tratamientos faciales, manos y pies, cabello y maquillaje social a cargo de nuestras especialistas."
      />

      <div className="mt-12">
        <ServiceGrid services={featuredServices} />
      </div>

      <div className="mt-10 flex justify-center">
        <Link to="/servicios">
          <Button variant="outline" size="lg">
            Ver todos los servicios
            <ArrowRight />
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default FeaturedServices;
