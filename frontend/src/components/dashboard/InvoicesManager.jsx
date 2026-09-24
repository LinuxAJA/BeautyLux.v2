import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';

import Button from '../ui/Button';
import DataTable from './DataTable';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { useApi } from '../../hooks/useApi';
import * as invoicesService from '../../services/invoices.service';
import { formatPrice } from '../../data/products';
import { saveBlob } from '../../utils/download';

/** Facturación del panel: `/panel/admin/facturas` y `/panel/empleado/facturas`. */
function InvoicesManager() {
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  const { data, isLoading, error } = useApi(
    () =>
      invoicesService.listInvoices({
        search,
        perPage: 50,
        orderBy: 'issuedAt',
        orderDir: 'desc',
      }),
    [search],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const handleDownload = async (invoice) => {
    setDownloadingId(invoice.id);
    setDownloadError(null);
    try {
      const { blob, filename } = await invoicesService.downloadInvoicePdf(invoice.id);
      saveBlob(blob, filename ?? `${invoice.invoiceNumber}.pdf`);
    } catch (downloadFailure) {
      setDownloadError(downloadFailure.message ?? 'No se pudo descargar la factura.');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    { key: 'invoiceNumber', header: 'Factura' },
    { key: 'saleNumber', header: 'Venta' },
    {
      key: 'customer',
      header: 'Cliente',
      render: (row) => `${row.customer.firstName} ${row.customer.lastName}`,
    },
    { key: 'issuedAt', header: 'Emitida', render: (row) => row.issuedAt?.slice(0, 10) },
    { key: 'total', header: 'Total', render: (row) => formatPrice(row.total) },
    { key: 'status', header: 'Estado', render: (row) => <InvoiceStatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Descargar la factura ${row.invoiceNumber} en PDF`}
          isLoading={downloadingId === row.id}
          onClick={() => handleDownload(row)}
        >
          <Download className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Facturación</h1>

      {downloadError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {downloadError}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por factura, venta o cliente..."
        emptyMessage="No hay facturas emitidas todavía."
      />
    </div>
  );
}

export default InvoicesManager;
