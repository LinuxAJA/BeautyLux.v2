import { formatPrice } from '../../data/products';
import { cn } from '../../utils/cn';

const SHIPPING_LABELS = {
  standard: 'Envío estándar',
  express: 'Envío exprés',
  pickup: 'Recoger en tienda',
};

/**
 * Desglose de importes del pedido.
 *
 * Lo usan el checkout y la confirmación. Durante el checkout los totales son
 * una estimación calculada con los precios que trae el carrito; a partir del
 * `POST /api/sales` se pintan los que devolvió el servidor, que son los que
 * mandan. Por eso acepta los importes ya resueltos en vez de calcularlos.
 */
function OrderSummary({
  items,
  subtotal,
  shippingCost,
  taxTotal,
  total,
  shippingMethod,
  isEstimate = false,
  className,
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key ?? item.id} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block truncate">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {item.quantity > 1 ? `${item.quantity} × ${formatPrice(item.price)}` : formatPrice(item.price)}
              </span>
            </span>
            <span className="whitespace-nowrap font-medium">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-border pt-3 text-sm" aria-live="polite">
        <div className="flex items-baseline justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>

        <div className="flex items-baseline justify-between">
          <dt className="text-muted-foreground">
            {SHIPPING_LABELS[shippingMethod] ?? 'Envío'}
          </dt>
          <dd>{shippingCost > 0 ? formatPrice(shippingCost) : 'Gratis'}</dd>
        </div>

        {/* El IVA ya está dentro del precio: se muestra desglosado, no se suma. */}
        {taxTotal > 0 && (
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <dt>IVA incluido (19%)</dt>
            <dd>{formatPrice(taxTotal)}</dd>
          </div>
        )}

        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <dt className="font-medium">Total</dt>
          <dd className="text-xl font-semibold text-primary">{formatPrice(total)}</dd>
        </div>
      </dl>

      {isEstimate && (
        <p className="text-xs text-muted-foreground">
          El total definitivo lo confirma el sistema al registrar el pedido.
        </p>
      )}
    </div>
  );
}

export default OrderSummary;
