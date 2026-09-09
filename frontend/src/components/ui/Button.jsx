import React from 'react';
import { LoaderCircle } from 'lucide-react';

import { cn } from '../../utils/cn';

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

const VARIANT_CLASSES = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow',
  gradient: 'primary-gradient text-primary-foreground hover:opacity-90 hover:shadow-glow',
  gold: 'gold-gradient text-foreground hover:opacity-90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-border bg-background hover:bg-muted hover:text-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-muted hover:text-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};

const SIZE_CLASSES = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-12 rounded-lg px-8 text-base',
  icon: 'h-10 w-10',
};

/**
 * Botón reutilizable de la aplicación.
 * Soporta variantes de color, tamaños, estado de carga y ancho completo.
 */
const Button = React.forwardRef(function Button(
  {
    className,
    variant = 'default',
    size = 'default',
    isLoading = false,
    fullWidth = false,
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default,
        SIZE_CLASSES[size] ?? SIZE_CLASSES.default,
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export { Button };
export default Button;
