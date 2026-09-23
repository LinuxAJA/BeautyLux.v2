import { Truck } from 'lucide-react';

import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../data/products';
import { cn } from '../../utils/cn';

/**
 * Progreso hacia el envío gratis.
 *
 * Solo cuenta los productos físicos: un servicio se presta en cabina y no se
 * despacha, así que no acerca el pedido al umbral.
 */
function FreeShippingMeter({ className }) {
  const { productsSubtotal, freeShippingThreshold, qualifiesForFreeShipping, missingForFreeShipping } =
    useCart();

  const percent = Math.min(Math.round((productsSubtotal / freeShippingThreshold) * 100), 100);

  return (
    <div className={cn('rounded-lg bg-muted/60 p-3', className)}>
      <p className="flex items-start gap-2 text-xs leading-relaxed">
        <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span aria-live="polite">
          {qualifiesForFreeShipping ? (
            <>
              ¡Listo! Tu pedido tiene <strong className="font-semibold text-primary">envío gratis</strong>.
            </>
          ) : (
            <>
              Te faltan{' '}
              <strong className="font-semibold text-primary">{formatPrice(missingForFreeShipping)}</strong>{' '}
              en productos para el envío gratis.
            </>
          )}
        </span>
      </p>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso hacia el envío gratis"
      >
        <div
          className={cn('h-full rounded-full smooth-transition', qualifiesForFreeShipping ? 'gold-gradient' : 'primary-gradient')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default FreeShippingMeter;
