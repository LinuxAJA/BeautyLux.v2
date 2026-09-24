import { useNavigate, useParams } from 'react-router';
import { CalendarCheck, CircleCheck, MapPin, Package, Sparkles } from 'lucide-react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import OrderSummary from '../components/cart/OrderSummary';
import PageHero from '../components/ui/PageHero';
import { useApi } from '../hooks/useApi';
import * as appointmentsService from '../services/appointments.service';
import * as salesService from '../services/sales.service';
import { formatPrice } from '../data/products';
import { formatDuration } from '../utils/duration';

const SHIPPING_LABELS = {
  standard: 'Envío estándar',
  express: 'Envío exprés',
  pickup: 'Recoger en tienda',
};

const PAYMENT_LABELS = {
  card: 'Tarjeta de crédito o débito',
  pse: 'PSE',
  nequi: 'Nequi',
  cash: 'Efectivo contra entrega',
};

/**
 * Confirmación del pedido, en `/pedido/:saleNumber`.
 *
 * Todo lo que se muestra viene del servidor, no del carrito: es el
 * comprobante de lo que quedó registrado, con los importes definitivos.
 */
function OrderConfirmation() {
  const { saleNumber } = useParams();
  const navigate = useNavigate();

  const { data: sale, error, isLoading } = useApi(
    () => salesService.getSaleByNumber(saleNumber),
    [saleNumber],
  );

  // Las citas de esta venta se piden aparte: la venta no las incluye.
  const { data: appointments } = useApi(
    () => (sale?.id ? appointmentsService.listAppointments({ saleId: sale.id }) : Promise.resolve({ data: [] })),
    [sale?.id],
  );

  if (isLoading) {
    return (
      <section className="container-app py-20 text-center text-muted-foreground" aria-live="polite">
        Cargando tu pedido...
      </section>
    );
  }

  if (error) {
    return (
      <section className="container-app py-20">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error.message ?? 'No pudimos encontrar este pedido.'}
          </p>
          <Button variant="outline" onClick={() => navigate('/productos')}>
            Volver a la tienda
          </Button>
        </div>
      </section>
    );
  }

  const productLines = sale.details?.filter((line) => line.itemType === 'product') ?? [];
  const serviceLines = sale.details?.filter((line) => line.itemType === 'service') ?? [];
  const citas = appointments ?? [];

  return (
    <>
      <PageHero
        eyebrow="Pedido confirmado"
        title="¡Gracias por tu"
        highlight="compra!"
        subtitle={`Tu pedido ${sale.saleNumber} quedó registrado.`}
      />

      <section className="container-app py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Card className="flex items-start gap-3 p-5">
              <CircleCheck className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-serif text-lg font-semibold">Pedido {sale.saleNumber}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Te escribiremos a {sale.customer.email ?? 'tu correo'} para coordinar el pago con{' '}
                  {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod} y la entrega.
                </p>
              </div>
            </Card>

            {productLines.length > 0 && (
              <Card className="space-y-3 p-5">
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Package className="size-4 text-primary" aria-hidden="true" />
                  Productos
                </h3>
                <ul className="divide-y divide-border text-sm">
                  {productLines.map((line) => (
                    <li key={line.id} className="flex justify-between gap-3 py-2">
                      <span>
                        {line.itemName}
                        <span className="ml-1 text-muted-foreground">× {line.quantity}</span>
                      </span>
                      <span className="whitespace-nowrap font-medium">
                        {formatPrice(line.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {serviceLines.length > 0 && (
              <Card className="space-y-3 p-5">
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  Servicios
                </h3>

                <ul className="divide-y divide-border text-sm">
                  {serviceLines.map((line) => {
                    const cita = citas.find((item) => item.saleDetailId === line.id);

                    return (
                      <li key={line.id} className="space-y-1 py-2">
                        <div className="flex justify-between gap-3">
                          <span>{line.itemName}</span>
                          <span className="whitespace-nowrap font-medium">
                            {formatPrice(line.subtotal)}
                          </span>
                        </div>

                        {cita ? (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarCheck className="size-3.5 text-primary" aria-hidden="true" />
                            {cita.appointmentNumber} · {cita.scheduledDate} a las {cita.startTime}
                            {line.durationMinutes && ` · ${formatDuration(line.durationMinutes)}`}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Te contactaremos para agendar este servicio.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {sale.shipping.address && (
              <Card className="space-y-2 p-5">
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <MapPin className="size-4 text-primary" aria-hidden="true" />
                  Despacho
                </h3>
                <p className="text-sm text-muted-foreground">
                  {SHIPPING_LABELS[sale.shipping.method] ?? sale.shipping.method} ·{' '}
                  {sale.shipping.address}
                  {sale.shipping.city ? `, ${sale.shipping.city}` : ''}
                </p>
                {sale.shipping.notes && (
                  <p className="text-xs text-muted-foreground">{sale.shipping.notes}</p>
                )}
              </Card>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate('/productos')}>
                Seguir comprando
              </Button>
              <Button variant="ghost" onClick={() => navigate('/panel/cliente/pedidos')}>
                Ver mis pedidos
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="sticky top-24 space-y-4 p-5">
              <h2 className="font-serif text-lg font-semibold">Resumen</h2>
              <OrderSummary
                items={(sale.details ?? []).map((line) => ({
                  key: line.id,
                  name: line.itemName,
                  price: line.unitPrice,
                  quantity: line.quantity,
                }))}
                subtotal={sale.subtotal}
                shippingCost={sale.shippingCost}
                taxTotal={sale.taxTotal}
                total={sale.total}
                shippingMethod={sale.shipping.method}
              />
              {/* La descarga de la factura llega con la etapa 7. */}
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

export default OrderConfirmation;
