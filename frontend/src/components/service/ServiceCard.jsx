import { Clock, ShoppingBag } from 'lucide-react';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../data/products';
import { formatDuration } from '../../utils/duration';

/** Tarjeta de servicio reutilizada en la página de inicio y en el catálogo de servicios. */
function ServiceCard({ service }) {
  const { serviceId, slug, name, description, categoryName, price, durationMinutes, image } = service;
  const { addItem } = useCart();

  const duration = formatDuration(durationMinutes);

  const handleAdd = () =>
    addItem({ itemType: 'service', itemId: serviceId, slug, name, price, image, durationMinutes });

  return (
    <Card hoverable className="group flex flex-col overflow-hidden">
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="size-full object-cover smooth-transition group-hover:scale-105"
        />

        {duration && (
          <Badge variant="soft" className="absolute left-3 top-3 gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {duration}
          </Badge>
        )}

        {/* El botón aparece al pasar el ratón y permanece visible en táctil. */}
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 smooth-transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <Button size="sm" fullWidth onClick={handleAdd} aria-label={`Añadir ${name} a la bolsa`}>
            <ShoppingBag />
            Añadir a la bolsa
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="label-caps text-muted-foreground">{categoryName}</p>

        <h3 className="mt-1 font-serif text-lg font-semibold leading-snug">{name}</h3>

        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-3">
          <span className="text-lg font-semibold text-primary">{formatPrice(price)}</span>
          {duration && <span className="text-xs text-muted-foreground">{duration} de sesión</span>}
        </div>
      </div>
    </Card>
  );
}

export default ServiceCard;
