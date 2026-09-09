import React, { useId } from 'react';
import { CircleAlert, ChevronDown } from 'lucide-react';

import { cn } from '../../utils/cn';

/**
 * Lista desplegable reutilizable.
 * Recibe `options` como [{ value, label }] y comparte la misma
 * presentación de label/error que <Input> para mantener la coherencia visual.
 */
const Select = React.forwardRef(function Select(
  {
    label,
    error,
    hint,
    options = [],
    placeholder = 'Selecciona una opción',
    className,
    containerClassName,
    id,
    required,
    // `getFieldProps` los entrega para <Input>; aquí no aplican y no deben
    // llegar al DOM como atributos desconocidos.
    isValid: _isValid,
    maxLength: _maxLength,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? `select-${generatedId}`;
  const messageId = `${selectId}-message`;
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-primary">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={hasError}
          aria-describedby={hasError || hint ? messageId : undefined}
          className={cn(
            'h-11 w-full appearance-none rounded-lg border bg-input/60 px-3.5 pr-10 text-sm text-foreground smooth-transition',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background',
            hasError
              ? 'border-destructive focus:ring-destructive/40'
              : 'border-border focus:border-primary focus:ring-ring/40',
            className,
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map(({ value, label: optionLabel }) => (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
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

export { Select };
export default Select;
