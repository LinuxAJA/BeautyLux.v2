/**
 * Tarjeta de métrica para los resúmenes de panel. Con `isLoading` pinta un
 * bloque del mismo tamaño que el valor; el texto se recorta en vez de
 * desbordar cuando un importe es largo (`$ 12.345.678`).
 */
function StatCard({ icon: Icon, label, value, isLoading = false }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blush/50 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {isLoading ? (
          <span className="block h-8 w-20 animate-pulse rounded-md bg-muted motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <p className="truncate text-2xl font-semibold tabular-nums" title={value != null ? String(value) : undefined}>
            {value ?? '—'}
          </p>
        )}
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default StatCard;
