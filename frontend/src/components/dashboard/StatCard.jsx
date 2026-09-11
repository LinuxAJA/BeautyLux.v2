/** Tarjeta de métrica para los resúmenes de panel (admin, empleado). */
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <span className="flex size-11 items-center justify-center rounded-full bg-blush/50 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-semibold">{value ?? '—'}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default StatCard;
