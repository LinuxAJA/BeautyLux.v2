import { Search } from 'lucide-react';

import Input from '../ui/Input';
import Select from '../ui/Select';
import { cn } from '../../utils/cn';

/**
 * El orden se limita a lo que la API de servicios sabe ordenar
 * (name, price, durationMinutes, createdAt): un servicio no tiene rating.
 */
const SORT_OPTIONS = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price-asc', label: 'Precio: de menor a mayor' },
  { value: 'price-desc', label: 'Precio: de mayor a menor' },
  { value: 'duration-asc', label: 'Duración: más cortos primero' },
  { value: 'name', label: 'Nombre: A – Z' },
];

/** Controles de búsqueda, categoría y ordenamiento del catálogo de servicios. */
function ServiceFilters({ search, onSearchChange, category, onCategoryChange, sort, onSortChange, categories = [] }) {
  const categoryChips = [{ id: 'all', name: 'Todos' }].concat(
    categories.map((c) => ({ id: c.slug, name: c.name })),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          icon={Search}
          placeholder="Buscar un servicio…"
          aria-label="Buscar servicios"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          containerClassName="flex-1"
        />

        <Select
          options={SORT_OPTIONS}
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          aria-label="Ordenar servicios"
          placeholder="Ordenar por"
          containerClassName="sm:w-64"
        />
      </div>

      <ul className="flex flex-wrap gap-2">
        {categoryChips.map(({ id, name }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onCategoryChange(id)}
              aria-pressed={category === id}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                category === id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground/75 hover:border-primary hover:text-primary',
              )}
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ServiceFilters;
