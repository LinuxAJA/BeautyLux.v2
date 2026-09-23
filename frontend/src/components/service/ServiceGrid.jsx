import { SearchX } from 'lucide-react';

import ServiceCard from './ServiceCard';

/** Rejilla responsiva de servicios con estado vacío. */
function ServiceGrid({ services, emptyMessage = 'No encontramos servicios con esos filtros.' }) {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service) => (
        <li key={service.id}>
          <ServiceCard service={service} />
        </li>
      ))}
    </ul>
  );
}

export default ServiceGrid;
