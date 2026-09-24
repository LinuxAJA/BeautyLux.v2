import { Banknote, CreditCard, Landmark, Smartphone } from 'lucide-react';

import { paymentMethods } from '../../data/checkout';
import { cn } from '../../utils/cn';

const ICONS = { card: CreditCard, pse: Landmark, nequi: Smartphone, cash: Banknote };

/**
 * Paso 3: método de pago.
 *
 * No hay pasarela integrada y **no se piden datos de tarjeta**: la compra solo
 * registra qué método eligió el cliente, tal como se acordó en el plan. El
 * cobro real queda fuera del alcance del avance.
 */
function PaymentStep({ value, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-semibold">Pago</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige cómo quieres pagar. Confirmamos el pedido y coordinamos el cobro contigo.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Método de pago</legend>

        {paymentMethods.map((method) => {
          const Icon = ICONS[method.value] ?? CreditCard;
          const isSelected = value === method.value;

          return (
            <label
              key={method.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 smooth-transition',
                'focus-within:ring-2 focus-within:ring-ring',
                isSelected ? 'border-primary bg-blush/30' : 'border-border hover:border-primary',
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={isSelected}
                onChange={() => onChange(method.value)}
                className="sr-only"
              />

              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />

              <span className="flex-1">
                <span className="block font-medium">{method.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {method.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        No pedimos ni guardamos datos de tarjeta en este paso.
      </p>
    </div>
  );
}

export default PaymentStep;
