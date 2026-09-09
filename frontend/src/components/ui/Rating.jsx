import { Star } from 'lucide-react';

import { cn } from '../../utils/cn';

/**
 * Valoración con estrellas.
 * Rellena las estrellas enteras y deja el resto en trazo, sobre 5.
 */
function Rating({ value = 0, reviews, size = 'sm', className }) {
  const rounded = Math.round(value);
  const starSize = size === 'sm' ? 'size-3.5' : 'size-4';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Valoración de ${value} sobre 5`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              starSize,
              index < rounded ? 'fill-accent text-accent' : 'text-border',
            )}
            aria-hidden="true"
          />
        ))}
      </span>

      {reviews !== undefined && (
        <span className="text-xs text-muted-foreground">({reviews})</span>
      )}
    </div>
  );
}

export default Rating;
