import React, { useId } from 'react';
import { CircleAlert, Check } from 'lucide-react';

import { cn } from '../../utils/cn';

/**
 * Campo de texto reutilizable con label, mensaje de error, icono opcional,
 * contador de caracteres y marca de validación correcta.
 */
const Input = React.forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    endAdornment,
    isValid = false,
    showCounter = false,
    className,
    containerClassName,
    id,
    maxLength,
    value = '',
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `input-${generatedId}`;
  const messageId = `${inputId}-message`;
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-primary">*</span>}
          </label>
          {showCounter && maxLength && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {String(value).length}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        )}

        <input
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          required={required}
          aria-invalid={hasError}
          aria-describedby={hasError || hint ? messageId : undefined}
          className={cn(
            'h-11 w-full rounded-lg border bg-input/60 px-3.5 text-sm text-foreground smooth-transition',
            'placeholder:text-muted-foreground/70',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background',
            Icon && 'pl-10',
            (endAdornment || isValid) && 'pr-10',
            hasError
              ? 'border-destructive focus:ring-destructive/40'
              : isValid
                ? 'border-primary/60 focus:ring-ring/40'
                : 'border-border focus:border-primary focus:ring-ring/40',
            className,
          )}
          {...props}
        />

        {endAdornment ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{endAdornment}</div>
        ) : (
          isValid && (
            <Check
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary"
              aria-hidden="true"
            />
          )
        )}
      </div>

      {hasError ? (
        <p id={messageId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="mt-1.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export { Input };
export default Input;
