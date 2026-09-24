import { Store, Truck, Zap } from 'lucide-react';

import Input from '../ui/Input';
import { shippingOptions } from '../../data/checkout';
import { formatPrice } from '../../data/products';
import { cn } from '../../utils/cn';

/** Un icono por método, para no meter JSX en el archivo de datos. */
const ICONS = { standard: Truck, express: Zap, pickup: Store };

/**
 * Paso 2: a dónde va el pedido.
 *
 * Solo aparece cuando la bolsa lleva productos físicos: una compra de puros
 * servicios se presta en cabina y no se despacha.
 */
function ShippingStep({ form, method, onMethodChange, needsAddress, qualifiesForFreeShipping }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-semibold">Entrega</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dinos a dónde enviamos tu pedido y cómo prefieres recibirlo.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Método de envío</legend>

        {shippingOptions.map((option) => {
          const Icon = ICONS[option.value] ?? Truck;
          const isSelected = method === option.value;
          // El envío estándar es gratis por encima del umbral, igual que en el servidor.
          const cost = option.value === 'standard' && qualifiesForFreeShipping ? 0 : option.cost;

          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 smooth-transition',
                'focus-within:ring-2 focus-within:ring-ring',
                isSelected ? 'border-primary bg-blush/30' : 'border-border hover:border-primary',
              )}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={option.value}
                checked={isSelected}
                onChange={() => onMethodChange(option.value)}
                className="sr-only"
              />

              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />

              <span className="flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-sm font-semibold text-primary">
                    {cost > 0 ? formatPrice(cost) : 'Gratis'}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {needsAddress && (
        <div className="space-y-4">
          <Input label="Dirección" placeholder="Cra 45 # 12-30" {...form.getFieldProps('address')} />
          <Input label="Ciudad" placeholder="Medellín" {...form.getFieldProps('city')} />
          <Input
            label="Indicaciones para la entrega"
            placeholder="Apartamento, portería, referencia..."
            showCounter
            {...form.getFieldProps('notes')}
          />
        </div>
      )}

      {!needsAddress && (
        <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
          {method === 'pickup'
            ? 'Te esperamos en el atelier para entregarte tu pedido.'
            : 'Tu compra es solo de servicios, así que no hay nada que despachar.'}
        </p>
      )}
    </div>
  );
}

export default ShippingStep;
