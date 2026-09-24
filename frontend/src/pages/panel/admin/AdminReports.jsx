import { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Package, Receipt, ShoppingBag, Truck } from 'lucide-react';

import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DataTable from '../../../components/dashboard/DataTable';
import StatCard from '../../../components/dashboard/StatCard';
import { useApi } from '../../../hooks/useApi';
import * as reportsService from '../../../services/reports.service';
import { formatPrice } from '../../../data/products';
import { saveBlob } from '../../../utils/download';

const STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

const CHANNEL_LABELS = { web: 'Tienda en línea', pos: 'Punto de venta' };

/** `AAAA-MM-DD` en hora local: `toISOString()` cambiaría el día según la zona. */
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Reporte diario de ventas, `/panel/admin/reportes`.
 *
 * La tabla es la misma vista previa que trae el PDF y el Excel: las tres
 * salidas nacen del mismo `ReportService.build_daily_sales()` del backend,
 * así que lo que se ve aquí es exactamente lo que se descarga.
 */
function AdminReports() {
  const [date, setDate] = useState(todayIso);
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  const { data: report, isLoading, error } = useApi(
    () => reportsService.getDailySalesReport(date),
    [date],
  );

  const rows = useMemo(() => report?.rows ?? [], [report]);

  const handleDownload = async (format) => {
    setDownloading(format);
    setDownloadError(null);
    try {
      const download =
        format === 'pdf'
          ? reportsService.downloadDailySalesReportPdf(date)
          : reportsService.downloadDailySalesReportExcel(date);
      const { blob, filename } = await download;
      saveBlob(blob, filename ?? `reporte-diario-${date}.${format}`);
    } catch (downloadFailure) {
      setDownloadError(downloadFailure.message ?? 'No se pudo descargar el reporte.');
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    { key: 'saleNumber', header: 'Venta' },
    { key: 'soldAt', header: 'Hora', render: (row) => row.soldAt?.slice(11, 16) },
    { key: 'channel', header: 'Canal', render: (row) => CHANNEL_LABELS[row.channel] ?? row.channel },
    { key: 'customerName', header: 'Cliente' },
    { key: 'itemsSummary', header: 'Productos y servicios' },
    { key: 'itemsCount', header: 'Cant.' },
    { key: 'total', header: 'Total', render: (row) => formatPrice(row.total) },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge variant={row.status === 'cancelled' ? 'muted' : 'soft'}>
          {STATUS_LABELS[row.status] ?? row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Reporte diario de ventas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Incluye todas las ventas del día; el estado de cada una queda visible en su columna.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Input
            type="date"
            label="Fecha"
            value={date}
            max={todayIso()}
            onChange={(event) => setDate(event.target.value)}
            containerClassName="w-44"
          />
          <Button
            variant="outline"
            onClick={() => handleDownload('pdf')}
            isLoading={downloading === 'pdf'}
            disabled={!report}
          >
            <FileText />
            Descargar PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownload('xlsx')}
            isLoading={downloading === 'xlsx'}
            disabled={!report}
          >
            <FileSpreadsheet />
            Descargar Excel
          </Button>
        </div>
      </div>

      {downloadError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {downloadError}
        </p>
      )}

      {report && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-6">
          <StatCard icon={ShoppingBag} label="Ventas del día" value={report.totals.salesCount} />
          <StatCard icon={Package} label="Artículos vendidos" value={report.totals.itemsCount} />
          <StatCard icon={Receipt} label="Subtotal" value={formatPrice(report.totals.subtotal)} />
          <StatCard icon={Truck} label="Envíos" value={formatPrice(report.totals.shippingTotal)} />
          <StatCard icon={Receipt} label="IVA incluido" value={formatPrice(report.totals.taxTotal)} />
          <StatCard icon={Receipt} label="Total del día" value={formatPrice(report.totals.total)} />
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        emptyMessage="No hubo ventas este día."
      />

      {report && (
        <p className="text-xs text-muted-foreground">
          Generado el {new Date(report.generatedAt).toLocaleString('es-CO')}. Los totales no cuentan
          las ventas canceladas.
        </p>
      )}
    </div>
  );
}

export default AdminReports;
