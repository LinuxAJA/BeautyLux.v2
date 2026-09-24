import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Lock, Package, Sparkles } from 'lucide-react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHero from '../components/ui/PageHero';
import AppointmentStep from '../components/checkout/AppointmentStep';
import CheckoutStepper from '../components/checkout/CheckoutStepper';
import OrderSummary from '../components/cart/OrderSummary';
import PaymentStep from '../components/checkout/PaymentStep';
import ShippingStep from '../components/checkout/ShippingStep';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useForm } from '../hooks/useForm';
import * as salesService from '../services/sales.service';
import { estimateShippingCost, paymentMethods, shippingOptions } from '../data/checkout';
import { addressRule } from '../utils/validators';

/** El IVA va incluido en el precio: aquí solo se desglosa para mostrarlo. */
const TAX_RATE = 0.19;

const shippingSchema = {
  address: addressRule,
  city: {
    label: 'Ciudad',
    required: true,
    minLength: 3,
    maxLength: 60,
    messages: {
      required: 'La ciudad es obligatoria.',
      minLength: 'La ciudad debe tener al menos 3 caracteres.',
      maxLength: 'La ciudad no puede superar los 60 caracteres.',
    },
  },
  notes: {
    label: 'Indicaciones',
    maxLength: 255,
    messages: { maxLength: 'Las indicaciones no pueden superar los 255 caracteres.' },
  },
};

/**
 * Compra en cuatro pasos: cita, entrega, pago y revisión.
 *
 * El paso de la cita solo aparece si la bolsa lleva servicios, y el de entrega
 * pide dirección solo si lleva productos físicos. Los importes que se ven aquí
 * son una estimación con las mismas reglas del servidor; el cobro definitivo
 * lo calcula `POST /api/sales`.
 */
function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cart = useCart();

  const [stepIndex, setStepIndex] = useState(0);
  const [holds, setHolds] = useState({});
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasServices = cart.serviceItems.length > 0;
  const hasProducts = cart.productItems.length > 0;

  const form = useForm(
    { address: user?.address ?? '', city: '', notes: '' },
    // Sin productos físicos no hay nada que despachar, así que la dirección
    // deja de ser obligatoria.
    hasProducts && shippingMethod !== 'pickup'
      ? shippingSchema
      : { ...shippingSchema, address: { ...addressRule, required: false }, city: { ...shippingSchema.city, required: false } },
  );

  const steps = useMemo(
    () =>
      [
        hasServices && { key: 'cita', label: 'Tu cita' },
        { key: 'entrega', label: 'Entrega' },
        { key: 'pago', label: 'Pago' },
        { key: 'revision', label: 'Revisión' },
      ].filter(Boolean),
    [hasServices],
  );

  const currentStep = steps[stepIndex]?.key;

  const shippingCost = estimateShippingCost(shippingMethod, cart.productsSubtotal);
  const total = cart.subtotal + shippingCost;
  const taxTotal = Math.round(cart.subtotal - cart.subtotal / (1 + TAX_RATE));

  // De todas las reservas, la que vence antes marca el tiempo que queda.
  const earliestExpiry = useMemo(() => {
    const dates = Object.values(holds)
      .map((hold) => hold.holdExpiresAt)
      .filter(Boolean)
      .sort();
    return dates[0] ?? null;
  }, [holds]);

  const allServicesBooked = cart.serviceItems.every((item) => holds[item.key]);
  const needsAddress = hasProducts && shippingMethod !== 'pickup';

  const canAdvance = () => {
    if (currentStep === 'cita') return allServicesBooked;
    if (currentStep === 'entrega') return !needsAddress || form.isValid;
    return true;
  };

  const handleHold = (key, appointment) => setHolds((previous) => ({ ...previous, [key]: appointment }));

  const handleRelease = (key) =>
    setHolds((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });

  /** Al vencer la reserva, las citas se sueltan y hay que volver a elegirlas. */
  const handleExpire = () => {
    setHolds({});
    setStepIndex(0);
    setSubmitError('La reserva del horario expiró. Vuelve a elegir tu cita.');
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
        shipping: {
          method: shippingMethod,
          address: form.values.address || undefined,
          city: form.values.city || undefined,
          notes: form.values.notes || undefined,
        },
        paymentMethod,
        appointmentHoldIds: Object.values(holds).map((hold) => hold.id),
      });

      cart.clear();
      navigate(`/pedido/${response.data.saleNumber}`, { replace: true });
    } catch (error) {
      setSubmitError(error.message ?? 'No se pudo registrar el pedido.');
      setIsSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <>
        <PageHero eyebrow="Checkout" title="Finalizar" highlight="compra" />
        <section className="container-app py-16">
          <div className="mx-auto max-w-md space-y-4 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-serif text-xl font-semibold">Tu bolsa está vacía</p>
            <p className="text-sm text-muted-foreground">
              Añade productos o servicios antes de finalizar la compra.
            </p>
            <Button variant="gradient" onClick={() => navigate('/productos')}>
              Ver productos
            </Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Checkout"
        title="Finalizar"
        highlight="compra"
        subtitle="Unos pasos y tu pedido queda listo."
      />

      <section className="container-app py-12 lg:py-16">
        <CheckoutStepper steps={steps} current={stepIndex} />

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
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

            {currentStep === 'entrega' && (
              <ShippingStep
                form={form}
                method={shippingMethod}
                onMethodChange={setShippingMethod}
                needsAddress={needsAddress}
                qualifiesForFreeShipping={cart.qualifiesForFreeShipping}
              />
            )}

            {currentStep === 'pago' && (
              <PaymentStep value={paymentMethod} onChange={setPaymentMethod} />
            )}

            {currentStep === 'revision' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-serif text-xl font-semibold">Revisión</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Comprueba que todo esté bien antes de confirmar.
                  </p>
                </div>

                {hasProducts && (
                  <Card className="space-y-2 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-medium">
                      <Package className="size-4 text-primary" aria-hidden="true" />
                      Entrega
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {shippingOptions.find((option) => option.value === shippingMethod)?.label}
                      {needsAddress && form.values.address
                        ? ` · ${form.values.address}${form.values.city ? `, ${form.values.city}` : ''}`
                        : ''}
                    </p>
                  </Card>
                )}

                {hasServices && (
                  <Card className="space-y-2 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="size-4 text-primary" aria-hidden="true" />
                      Tus citas
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {cart.serviceItems.map((item) => (
                        <li key={item.key}>
                          {item.name}
                          {holds[item.key]
                            ? ` · ${holds[item.key].scheduledDate} a las ${holds[item.key].startTime}`
                            : ' · sin horario'}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                <Card className="space-y-2 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="size-4 text-primary" aria-hidden="true" />
                    Pago
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethods.find((method) => method.value === paymentMethod)?.label}
                  </p>
                </Card>
              </div>
            )}

            {submitError && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <Button
                variant="outline"
                onClick={() => (stepIndex === 0 ? navigate('/bolsa') : setStepIndex(stepIndex - 1))}
                disabled={isSubmitting}
              >
                <ArrowLeft />
                {stepIndex === 0 ? 'Volver a la bolsa' : 'Atrás'}
              </Button>

              {currentStep === 'revision' ? (
                <Button variant="gradient" onClick={handleConfirm} isLoading={isSubmitting}>
                  Confirmar el pedido
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  disabled={!canAdvance()}
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Continuar
                  <ArrowRight />
                </Button>
              )}
            </div>

            {currentStep === 'cita' && !allServicesBooked && (
              <p className="text-xs text-muted-foreground">
                Reserva el horario de cada servicio para continuar.
              </p>
            )}
          </div>

          <div className="lg:col-span-5">
            <Card className="sticky top-24 space-y-4 p-5">
              <h2 className="font-serif text-lg font-semibold">Tu pedido</h2>
              <OrderSummary
                items={cart.items}
                subtotal={cart.subtotal}
                shippingCost={shippingCost}
                taxTotal={taxTotal}
                total={total}
                shippingMethod={shippingMethod}
                isEstimate
              />
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

export default Checkout;
