import { Clock, Minus, Plus, Trash2 } from 'lucide-react';

import Button from '../ui/Button';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../data/products';
import { formatDuration } from '../../utils/duration';
import { cn } from '../../utils/cn';

/**
 * Fila de la bolsa, compartida por el panel lateral y la página `/bolsa`.
 *
 * Los servicios no llevan control de cantidad: una cita se reserva de a una,
 * así que en su lugar se explica que la fecha se elige en el checkout.
 */
function CartItemRow({ item, className }) {
  const { updateQuantity, removeItem } = useCart();

  const isService = item.itemType === 'service';
  const duration = formatDuration(item.durationMinutes);
  const atStockLimit = item.stock !== null && item.quantity >= item.stock;
  const lineTotal = item.price * item.quantity;

  return (
    <li className={cn('flex gap-3 py-4', className)}>
      <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.image && (
          <img src={item.image} alt={item.name} loading="lazy" className="size-full object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-snug">{item.name}</h4>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(item.key)}
            aria-label={`Quitar ${item.name} de la bolsa`}
          >
            <Trash2 />
          </Button>
        </div>

        {isService && duration && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            {duration} de sesión
          </p>
        )}

        <p className="mt-1 text-xs text-muted-foreground">{formatPrice(item.price)} c/u</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {isService ? (
            <span className="text-xs text-muted-foreground">Fecha y hora en el checkout</span>
          ) : (
            <div className="flex items-center gap-1 rounded-lg border border-border">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                aria-label={`Quitar una unidad de ${item.name}`}
              >
                <Minus />
              </Button>

              <span className="min-w-6 text-center text-sm font-medium" aria-live="polite">
                {item.quantity}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={atStockLimit}
                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                aria-label={`Añadir una unidad de ${item.name}`}
              >
                <Plus />
              </Button>
            </div>
          )}

          <span className="text-sm font-semibold text-primary">{formatPrice(lineTotal)}</span>
        </div>

        {atStockLimit && (
          <p className="mt-1 text-xs text-muted-foreground">
            Solo quedan {item.stock} unidades disponibles.
          </p>
        )}
      </div>
    </li>
  );
}

export default CartItemRow;
