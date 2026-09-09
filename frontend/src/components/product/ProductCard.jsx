import { ShoppingBag } from 'lucide-react';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Rating from '../ui/Rating';
import { formatPrice } from '../../data/products';

const BADGE_VARIANTS = {
  Oferta: 'default',
  Nuevo: 'soft',
  'Más vendido': 'gold',
  'Edición limitada': 'gold',
};

/** Tarjeta de producto reutilizada en la página de inicio y en el catálogo. */
function ProductCard({ product }) {
  const { name, categoryName, price, oldPrice, rating, reviews, image, badge } = product;

  return (
    <Card hoverable className="group flex flex-col overflow-hidden">
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="size-full object-cover smooth-transition group-hover:scale-105"
        />

        {badge && (
          <Badge variant={BADGE_VARIANTS[badge] ?? 'default'} className="absolute left-3 top-3">
            {badge}
          </Badge>
        )}

        {/* El botón aparece al pasar el ratón y permanece visible en táctil. */}
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 smooth-transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <Button size="sm" fullWidth>
            <ShoppingBag />
            Añadir a la bolsa
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {categoryName}
        </p>

        <h3 className="mt-1 font-serif text-lg font-semibold leading-snug">{name}</h3>

        <Rating value={rating} reviews={reviews} className="mt-2" />

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-lg font-semibold text-primary">{formatPrice(price)}</span>
          {oldPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(oldPrice)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ProductCard;
