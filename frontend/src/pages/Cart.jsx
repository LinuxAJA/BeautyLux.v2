import { useNavigate } from 'react-router';
import { Package, ShoppingBag, Sparkles } from 'lucide-react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHero from '../components/ui/PageHero';
import CartItemRow from '../components/cart/CartItemRow';
import FreeShippingMeter from '../components/cart/FreeShippingMeter';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../data/products';

/** Bloque de la bolsa: productos físicos o servicios de belleza. */
function CartSection({ icon: Icon, title, note, items }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {title}
      </h2>

      {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}

      <ul className="mt-2 divide-y divide-border">
        {items.map((item) => (
          <CartItemRow key={item.key} item={item} />
        ))}
      </ul>
    </section>
  );
}

/** Vista completa de la bolsa, alternativa al panel lateral. */
function Cart() {
  const { items, productItems, serviceItems, itemCount, subtotal, clear } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <PageHero
        eyebrow="Tu bolsa"
        title="Tu"
        highlight="bolsa"
        subtitle="Revisa lo que llevas antes de finalizar la compra. Las citas de los servicios se agendan en el siguiente paso."
      />

      <section className="container-app py-12 lg:py-16">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-serif text-xl font-semibold">Tu bolsa está vacía</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Añade productos o reserva un servicio para continuar.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="gradient" onClick={() => navigate('/productos')}>
                Ver productos
              </Button>
              <Button variant="outline" onClick={() => navigate('/servicios')}>
                Ver servicios
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <CartSection icon={Package} title="Productos físicos" items={productItems} />
              <CartSection
                icon={Sparkles}
                title="Servicios de belleza"
                note="Elegirás la fecha y la hora de cada cita al finalizar la compra."
                items={serviceItems}
              />

              <div className="flex flex-wrap gap-3 border-t border-border pt-6">
                <Button variant="outline" onClick={() => navigate('/productos')}>
                  Continuar explorando
                </Button>
                <Button variant="ghost" className="text-muted-foreground" onClick={clear}>
                  Vaciar la bolsa
                </Button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <Card className="sticky top-24 space-y-4 p-5">
                <h2 className="font-serif text-lg font-semibold">Resumen</h2>

                <FreeShippingMeter />

                <dl className="space-y-2 text-sm" aria-live="polite">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">
                      Artículos ({itemCount})
                    </dt>
                    <dd>{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Envío</dt>
                    <dd className="text-muted-foreground">Se calcula en el checkout</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-border pt-2">
                    <dt className="font-medium">Subtotal</dt>
                    <dd className="text-xl font-semibold text-primary">{formatPrice(subtotal)}</dd>
                  </div>
                </dl>

                <Button variant="gradient" fullWidth onClick={() => navigate('/checkout')}>
                  Ir al checkout
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Necesitas iniciar sesión para finalizar la compra.
                </p>
              </Card>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default Cart;
