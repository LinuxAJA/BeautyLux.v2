import { cn } from '../../utils/cn';

const VARIANT_CLASSES = {
  default: 'bg-primary text-primary-foreground',
  gold: 'gold-gradient text-foreground',
  soft: 'bg-blush/60 text-foreground',
  outline: 'border border-border bg-background text-foreground',
  muted: 'bg-muted text-muted-foreground',
};

/** Etiqueta compacta para destacar estados: "Nuevo", "Oferta", "Más vendido". */
function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default,
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
