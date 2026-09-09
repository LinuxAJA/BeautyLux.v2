import React, { useId } from 'react';
import { CircleAlert } from 'lucide-react';

import { cn } from '../../utils/cn';

/** Casilla de verificación reutilizable con label y mensaje de error. */
const Checkbox = React.forwardRef(function Checkbox(
  { label, error, className, containerClassName, id, ...props },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? `checkbox-${generatedId}`;
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)}>
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          aria-invalid={hasError}
          className={cn(
            'mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border accent-[var(--primary)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            hasError && 'border-destructive',
            className,
          )}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="cursor-pointer text-sm leading-snug text-foreground/85">
            {label}
          </label>
        )}
      </div>

      {hasError && (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

export { Checkbox };
export default Checkbox;
