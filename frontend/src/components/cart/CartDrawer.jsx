import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Package, ShoppingBag, Sparkles, X } from 'lucide-react';

import Button from '../ui/Button';
import CartItemRow from './CartItemRow';
import FreeShippingMeter from './FreeShippingMeter';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../data/products';
import { cn } from '../../utils/cn';

/** Cabecera de cada bloque del panel: productos físicos y servicios de belleza. */
function CartSection({ icon: Icon, title, note, items }) {
  if (items.length === 0) return null;

  return (
    <section className="px-4">
      <h3 className="label-caps flex items-center gap-2 pt-4 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {title}
      </h3>

      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <CartItemRow key={item.key} item={item} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Panel lateral de la bolsa.
 *
 * Reutiliza la mecánica de `MobileMenu`: overlay que cierra al pulsarlo, cierre
 * con Escape, bloqueo del scroll de fondo y `role="dialog"` con `aria-modal`.
 */
function CartDrawer() {
  const { items, productItems, serviceItems, itemCount, subtotal, isOpen, close } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Se cierra al navegar a otra ruta, igual que el menú móvil.
  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  const isEmpty = items.length === 0;

  return (
    <div className={cn('fixed inset-0 z-60', isOpen ? 'visible' : 'invisible')} aria-hidden={!isOpen}>
      <div
        className={cn(
          'absolute inset-0 bg-foreground/40 backdrop-blur-sm smooth-transition',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={close}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu bolsa de compras"
        className={cn(
          'absolute inset-y-0 right-0 flex w-104 max-w-[90vw] flex-col bg-background shadow-elegant smooth-transition',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
            <ShoppingBag className="size-5 text-primary" aria-hidden="true" />
            Tu bolsa
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({itemCount})</span>
            )}
          </h2>

          <Button variant="ghost" size="icon" onClick={close} aria-label="Cerrar la bolsa">
            <X />
          </Button>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Tu bolsa está vacía. Explora el catálogo y añade lo que te guste.
            </p>
            <Button variant="gradient" onClick={() => navigate('/productos')}>
              Ver productos
            </Button>
            <Button variant="outline" onClick={() => navigate('/servicios')}>
              Ver servicios
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pb-4">
              <CartSection icon={Package} title="Productos físicos" items={productItems} />
              <CartSection
                icon={Sparkles}
                title="Servicios de belleza"
                note="La fecha y la hora de cada cita se eligen al finalizar la compra."
                items={serviceItems}
              />
            </div>

            <div className="space-y-3 border-t border-border p-4">
              <FreeShippingMeter />

              <div className="flex items-baseline justify-between" aria-live="polite">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-xl font-semibold text-primary">{formatPrice(subtotal)}</span>
              </div>

              <p className="text-xs text-muted-foreground">
                El envío y los impuestos se calculan al finalizar la compra.
              </p>

              <Button variant="gradient" fullWidth onClick={() => navigate('/bolsa')}>
                Ver la bolsa completa
              </Button>

              <Button variant="outline" fullWidth onClick={close}>
                Seguir explorando
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
