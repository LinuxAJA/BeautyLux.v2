import { cn } from '../../utils/cn';

/**
 * Envoltorio de tarjeta para una gráfica del dashboard: mismo marco visual
 * que `StatCard` y las tablas del panel, con título, subtítulo opcional y
 * un estado vacío cuando no hay datos que graficar.
 *
 * `actions` (p. ej. el selector día/semana/mes) va en la cabecera y no en
 * `children`: así sigue a la vista aunque el rango no tenga datos, y se puede
 * volver a otra opción. El cuerpo tiene la misma altura en carga, vacío y con
 * datos, para que la página no salte cuando llega la respuesta.
 */
function ChartCard({
  title,
  subtitle,
  actions,
  isLoading = false,
  isEmpty,
  emptyMessage = 'No hay datos para este rango.',
  className,
  children,
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-card', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-1">{actions}</div>}
      </div>

      {isLoading ? (
        <div className="h-70 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" aria-hidden="true" />
      ) : isEmpty ? (
        <p className="flex h-70 items-center justify-center text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
      {isLoading && <span className="sr-only">Cargando la gráfica…</span>}
    </div>
  );
}

export default ChartCard;
