import { useState } from 'react';
import { Download, FileText } from 'lucide-react';

import Button from '../ui/Button';
import { useApi } from '../../hooks/useApi';
import * as invoicesService from '../../services/invoices.service';
import { saveBlob } from '../../utils/download';

/**
 * Botón de descarga de factura para una venta.
 *
 * No toda venta tiene factura: solo se emite cuando queda pagada. Por eso
 * primero busca `GET /invoices?saleId=` y, si no hay ninguna, no muestra
 * nada en vez de un botón roto — la factura llegará cuando el pago se
 * confirme.
 */
function InvoiceDownloadButton({
  saleId,
  label = 'Descargar factura',
  className,
  variant = 'outline',
  fullWidth = false,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  const { data } = useApi(
    () => invoicesService.listInvoices({ saleId, perPage: 1 }),
    [saleId],
  );

  const invoice = data?.[0];

  if (!invoice) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const { blob, filename } = await invoicesService.downloadInvoicePdf(invoice.id);
      saveBlob(blob, filename ?? `${invoice.invoiceNumber}.pdf`);
    } catch (downloadFailure) {
      setError(downloadFailure.message ?? 'No se pudo descargar la factura.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={className}>
      <Button variant={variant} fullWidth={fullWidth} onClick={handleDownload} isLoading={isDownloading}>
        <FileText />
        {label}
        <Download className="size-3.5" aria-hidden="true" />
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default InvoiceDownloadButton;
