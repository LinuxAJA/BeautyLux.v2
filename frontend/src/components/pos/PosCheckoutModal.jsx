import { useMemo, useState } from 'react';
import { CircleCheck, Printer } from 'lucide-react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';
import AppointmentStep from '../checkout/AppointmentStep';
import CheckoutStepper from '../checkout/CheckoutStepper';
import PaymentStep from '../checkout/PaymentStep';
import OrderSummary from '../cart/OrderSummary';
import { useCart } from '../../hooks/useCart';
import * as invoicesService from '../../services/invoices.service';
import * as salesService from '../../services/sales.service';
import { paymentMethods } from '../../data/checkout';
import { saveBlob } from '../../utils/download';

const TAX_RATE = 0.19;

/**
 * Cobro del tique: reserva de citas (si hay servicios), método de pago y
 * confirmación. Reutiliza los mismos pasos del checkout público porque la
 * regla de negocio es idéntica; lo único distinto es que aquí no hay envío
 * (el cliente se lleva el producto en el momento) y la venta se marca
 * pagada de inmediato, porque el cobro ya ocurrió en el mostrador.
 */
function PosCheckoutModal({ isOpen, onClose, customer, onCompleted }) {
  const cart = useCart();
  const [stepIndex, setStepIndex] = useState(0);
  const [holds, setHolds] = useState({});
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);
  const [isFetchingPdf, setIsFetchingPdf] = useState(false);

  const hasServices = cart.serviceItems.length > 0;
  const steps = useMemo(
    () => [hasServices && { key: 'cita', label: 'Citas' }, { key: 'pago', label: 'Pago' }, { key: 'revision', label: 'Revisión' }].filter(Boolean),
    [hasServices],
  );
  const currentStep = steps[stepIndex]?.key;
  const allServicesBooked = cart.serviceItems.every((item) => holds[item.key]);

  const taxTotal = Math.round(cart.subtotal - cart.subtotal / (1 + TAX_RATE));

  // De todas las reservas, la que vence antes marca el tiempo que queda
  // (igual regla que el checkout público: 10 minutos por reserva).
  const earliestExpiry = useMemo(() => {
    const dates = Object.values(holds)
      .map((hold) => hold.holdExpiresAt)
      .filter(Boolean)
      .sort();
    return dates[0] ?? null;
  }, [holds]);

  const handleHold = (key, appointment) => setHolds((previous) => ({ ...previous, [key]: appointment }));
  const handleRelease = (key) =>
    setHolds((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });

  const handleExpire = () => {
    setHolds({});
    setStepIndex(0);
    setSubmitError('La reserva del horario expiró. Vuelve a elegir la cita.');
  };

  const resetAndClose = () => {
    setStepIndex(0);
    setHolds({});
    setPaymentMethod(paymentMethods[0].value);
    setSubmitError(null);
    setCompletedSale(null);
    onClose();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await salesService.createSale({
        items: cart.items.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        channel: 'pos',
        clientId: customer.client?.id,
        customer: customer.client
          ? undefined
          : {
              firstName: customer.guest.firstName,
              lastName: customer.guest.lastName,
              phone: customer.guest.phone || undefined,
              email: customer.guest.email || undefined,
            },
        shipping: { method: 'pickup' },
        paymentMethod,
        appointmentHoldIds: Object.values(holds).map((hold) => hold.id),
      });

      const sale = response.data;
      // El cobro ya ocurrió en el mostrador: la venta nace pagada, lo que
      // dispara la factura automática (SaleService la emite al pasar a paid).
      await salesService.updateSaleStatus(sale.id, 'paid');

      cart.clear();
      setCompletedSale(sale);
      onCompleted?.(sale);
    } catch (error) {
      setSubmitError(error.message ?? 'No se pudo registrar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInvoice = async (mode) => {
    setIsFetchingPdf(true);
    try {
      const invoicesResponse = await invoicesService.listInvoices({ saleId: completedSale.id, perPage: 1 });
      const invoice = invoicesResponse.data?.[0];
      if (!invoice) return;

      const { blob, filename } = await invoicesService.downloadInvoicePdf(invoice.id);
      if (mode === 'print') {
        // Abrirla en una pestaña nueva deja que el visor de PDF del
        // navegador ofrezca imprimir, sin necesidad de un botón propio.
        window.open(URL.createObjectURL(blob), '_blank', 'noopener');
      } else {
        saveBlob(blob, filename ?? `${invoice.invoiceNumber}.pdf`);
      }
    } catch {
      setSubmitError('No se pudo abrir la factura. Puedes descargarla luego desde Facturación.');
    } finally {
      setIsFetchingPdf(false);
    }
  };

  if (completedSale) {
    return (
      <Modal isOpen={isOpen} onClose={resetAndClose} title="Venta cobrada" size="sm">
        <div className="space-y-4 text-center">
          <CircleCheck className="mx-auto size-12 text-primary" aria-hidden="true" />
          <div>
            <p className="font-serif text-lg font-semibold">{completedSale.saleNumber}</p>
            <p className="text-sm text-muted-foreground">La venta quedó registrada y pagada.</p>
          </div>

          {submitError && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button variant="gradient" onClick={() => openInvoice('print')} isLoading={isFetchingPdf}>
              <Printer className="size-4" />
              Ver e imprimir factura
            </Button>
            <Button variant="outline" onClick={() => openInvoice('download')} isLoading={isFetchingPdf}>
              Descargar factura en PDF
            </Button>
            <Button variant="ghost" onClick={resetAndClose}>
              Nueva venta
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Cobrar" size="lg">
      <div className="space-y-5">
        <CheckoutStepper steps={steps} current={stepIndex} />

        {currentStep === 'cita' && (
          <AppointmentStep
            serviceItems={cart.serviceItems}
            holds={holds}
            onHold={handleHold}
            onRelease={handleRelease}
            earliestExpiry={earliestExpiry}
            onExpire={handleExpire}
          />
        )}

        {currentStep === 'pago' && <PaymentStep value={paymentMethod} onChange={setPaymentMethod} inPerson />}

        {currentStep === 'revision' && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold">Revisión</h2>
            <OrderSummary
              items={cart.items}
              subtotal={cart.subtotal}
              shippingCost={0}
              taxTotal={taxTotal}
              total={cart.subtotal}
              shippingMethod="pickup"
            />
          </div>
        )}

        {submitError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => (stepIndex === 0 ? resetAndClose() : setStepIndex(stepIndex - 1))}
            disabled={isSubmitting}
          >
            {stepIndex === 0 ? 'Cancelar' : 'Atrás'}
          </Button>

          {currentStep === 'revision' ? (
            <Button variant="gradient" onClick={handleConfirm} isLoading={isSubmitting}>
              Confirmar y cobrar
            </Button>
          ) : (
            <Button
              variant="gradient"
              disabled={currentStep === 'cita' && !allServicesBooked}
              onClick={() => setStepIndex(stepIndex + 1)}
            >
              Continuar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default PosCheckoutModal;
