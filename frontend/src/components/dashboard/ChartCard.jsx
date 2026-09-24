import { cn } from '../../utils/cn';

/**
 * Envoltorio de tarjeta para una gráfica del dashboard: mismo marco visual
 * que `StatCard` y las tablas del panel, con título, subtítulo opcional y
 * un estado vacío cuando no hay datos que graficar.
 */
function ChartCard({ title, subtitle, isEmpty, emptyMessage = 'No hay datos para este rango.', className, children }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-card', className)}>
      <div className="mb-4">
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {isEmpty ? (
        <p className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

export default ChartCard;
