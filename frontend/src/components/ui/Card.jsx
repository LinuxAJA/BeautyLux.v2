import { cn } from '../../utils/cn';

/**
 * Contenedor base de tarjeta.
 * `hoverable` añade la elevación y el desplazamiento usados en productos y testimonios.
 */
function Card({ children, hoverable = false, className, as: Component = 'div', ...props }) {
  return (
    <Component
      className={cn(
        'rounded-xl border border-border bg-card shadow-card smooth-transition',
        hoverable && 'hover:-translate-y-1 hover:shadow-elegant',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Card;
