import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatPrice } from '../../data/products';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-elegant">
      <p className="max-w-48 font-medium">{point.name}</p>
      <p className="mt-1 text-primary">{formatPrice(point.total)}</p>
      <p className="text-muted-foreground">
        {point.quantity} {point.quantity === 1 ? 'unidad' : 'unidades'}
      </p>
    </div>
  );
}

/** Recorta un nombre largo para que quepa en el eje sin romper el layout. */
function truncateLabel(value) {
  return value.length > 18 ? `${value.slice(0, 17)}…` : value;
}

/**
 * Ranking horizontal de los productos o servicios más vendidos, ordenados
 * de mayor a menor facturación. `data` ya viene ordenado y agregado desde
 * `GET /api/stats/top-items` (requisito 15): la gráfica solo dibuja.
 */
function SalesBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(value) => formatPrice(value)}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickFormatter={truncateLabel}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey="total" fill="var(--brand-gold)" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default SalesBarChart;
