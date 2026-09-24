import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatPrice } from '../../data/products';

/** Formatea el eje X según lo corto o largo que sea el rango mostrado. */
function formatAxisDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-elegant">
      <p className="font-medium">{formatAxisDate(label)}</p>
      <p className="mt-1 text-primary">{formatPrice(point.total)}</p>
      <p className="text-muted-foreground">
        {point.salesCount} {point.salesCount === 1 ? 'venta' : 'ventas'}
      </p>
    </div>
  );
}

/**
 * Ventas a lo largo del tiempo, agrupadas por día, semana o mes según lo que
 * ya trae `data` de `GET /api/stats/sales-series`. Ningún dato se calcula
 * aquí: la gráfica solo dibuja lo que llega del backend (requisito 15).
 */
function SalesLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatAxisDate}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => formatPrice(value)}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="var(--primary)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: 'var(--primary)' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default SalesLineChart;
