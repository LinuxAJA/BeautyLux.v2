import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../utils/cn';

/** Páginas a mostrar: siempre la primera, la última y las vecinas de la actual. */
function pageItems(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) items.push(`gap-${p}`);
    items.push(p);
  });
  return items;
}

const baseButton =
  'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2.5 text-sm font-medium smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40';

/**
 * Paginación de los listados: "Mostrando 11–20 de 57", anterior/siguiente y
 * páginas numeradas con elipsis. En pantallas pequeñas los números se
 * reemplazan por "Página 2 de 6". No se pinta si todo cabe en una página.
 * `meta` es el que devuelve la API: `{ page, perPage, total, totalPages }`.
 */
function Pagination({ meta, onPageChange, itemLabel = 'registros', className }) {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, perPage, total, totalPages } = meta;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <nav
      aria-label="Paginación"
      className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Mostrando <span className="font-medium text-foreground">{from}–{to}</span> de{' '}
        <span className="font-medium text-foreground">{total}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(baseButton, 'hover:bg-muted')}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <ul className="hidden items-center gap-1 sm:flex">
          {pageItems(page, totalPages).map((item) =>
            typeof item === 'string' ? (
              <li key={item} className="px-1 text-sm text-muted-foreground" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={cn(baseButton, item === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={`Página ${item}`}
                >
                  {item}
                </button>
              </li>
            ),
          )}
        </ul>
        <span className="px-2 text-sm text-muted-foreground sm:hidden">
          Página {page} de {totalPages}
        </span>

        <button
          type="button"
          className={cn(baseButton, 'hover:bg-muted')}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
