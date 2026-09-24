import { useMemo, useState } from 'react';
import { Package, Plus, Search, Sparkles } from 'lucide-react';

import Button from '../ui/Button';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../hooks/useCart';
import * as productsService from '../../services/products.service';
import * as servicesService from '../../services/services.service';
import { formatPrice } from '../../data/products';
import { formatDuration } from '../../utils/duration';
import { cn } from '../../utils/cn';

const TABS = [
  { value: 'products', label: 'Productos', icon: Package },
  { value: 'services', label: 'Servicios', icon: Sparkles },
];

/** Una casilla de la grilla táctil: producto o servicio, un toque para sumarlo al tique. */
function ItemTile({ item, onAdd }) {
  const isSoldOut = item.type === 'product' && item.stock === 0;
  const subtitle = item.type === 'product' ? item.categoryName : formatDuration(item.durationMinutes);

  return (
    <button
      type="button"
      disabled={isSoldOut}
      onClick={() => onAdd(item)}
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left smooth-transition',
        'hover:border-primary hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {item.image && <img src={item.image} alt="" className="size-full object-cover" />}
      </div>
      <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
      {subtitle && <p className="label-caps text-muted-foreground">{subtitle}</p>}
      <div className="mt-auto flex w-full items-center justify-between pt-1">
        <span className="text-sm font-semibold text-primary">{formatPrice(item.price)}</span>
        <span className="flex size-6 items-center justify-center rounded-full bg-blush/60 text-primary">
          <Plus className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      {isSoldOut && <span className="text-xs text-destructive">Sin existencias</span>}
    </button>
  );
}

/**
 * Buscador y grilla táctil de productos y servicios, para la columna
 * izquierda del punto de venta.
 */
function PosItemPicker() {
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const cart = useCart();

  const { data: products, isLoading: loadingProducts } = useApi(
    () => productsService.listProducts({ search, perPage: 24, status: 'active' }),
    [search, tab],
  );
  const { data: services, isLoading: loadingServices } = useApi(
    () => servicesService.listServices({ search, perPage: 24, status: 'active' }),
    [search, tab],
  );

  const items = useMemo(() => {
    if (tab === 'products') {
      return (products ?? []).map((product) => {
        const card = productsService.toCardShape(product);
        return { type: 'product', ...card };
      });
    }
    return (services ?? []).map((service) => {
      const card = servicesService.toCardShape(service);
      return { type: 'service', ...card };
    });
  }, [tab, products, services]);

  const isLoading = tab === 'products' ? loadingProducts : loadingServices;

  const handleAdd = (item) => {
    cart.addItem({
      itemType: item.type,
      itemId: item.type === 'product' ? item.productId : item.serviceId,
      slug: item.slug,
      name: item.name,
      price: item.price,
      image: item.image,
      stock: item.type === 'product' ? item.stock : undefined,
      durationMinutes: item.type === 'service' ? item.durationMinutes : undefined,
    });
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o SKU..."
          aria-label="Buscar productos o servicios"
          className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex gap-1" role="tablist" aria-label="Catálogo">
        {TABS.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={tab === value ? 'gradient' : 'outline'}
            size="sm"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground" aria-live="polite">
            Cargando...
          </p>
        )}

        {!isLoading && items.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron {tab === 'products' ? 'productos' : 'servicios'}.
          </p>
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ItemTile key={`${item.type}:${item.id}`} item={item} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PosItemPicker;
