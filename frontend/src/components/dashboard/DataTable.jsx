import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

import Pagination from '../ui/Pagination';
import { cn } from '../../utils/cn';

/**
 * Tabla reutilizable con búsqueda, estado de carga y estado vacío.
 * `columns`: [{ key, header, render?(row) }]
 *
 * Con `meta` (el de la API) y `onPageChange` pinta la paginación al pie. Si
 * la página pedida ya no existe (se borró el último registro de la última
 * página), vuelve sola a la última que sí hay.
 */
function DataTable({
  columns,
  rows,
  isLoading,
  error,
  search,
  onSearchChange,
  searchPlaceholder,
  emptyMessage,
  toolbar,
  meta,
  onPageChange,
  itemLabel,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (onPageChange && meta && meta.totalPages > 0 && meta.page > meta.totalPages) {
      onPageChange(meta.totalPages);
    }
  }, [meta, onPageChange]);

  const handlePageChange = (nextPage) => {
    onPageChange(nextPage);
    // Si la cabecera de la tabla quedó arriba de la ventana, la trae de vuelta.
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      rootRef.current.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <div ref={rootRef} className="scroll-mt-20 rounded-2xl border border-border bg-card shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        {onSearchChange && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder ?? 'Buscar...'}
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            )}

            {!isLoading && error && (
              <tr>
                <td role="alert" colSpan={columns.length} className="px-4 py-10 text-center text-destructive">
                  {error.message ?? 'Ocurrió un error al cargar la información.'}
                </td>
              </tr>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {emptyMessage ?? 'No hay registros para mostrar.'}
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              rows.map((row, index) => (
                <tr
                  key={row.id ?? index}
                  className={cn('border-b border-border last:border-0', 'hover:bg-muted/30')}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <Pagination
          meta={meta}
          onPageChange={handlePageChange}
          itemLabel={itemLabel}
          className="border-t border-border px-4 py-3 empty:hidden"
        />
      )}
    </div>
  );
}

export default DataTable;
