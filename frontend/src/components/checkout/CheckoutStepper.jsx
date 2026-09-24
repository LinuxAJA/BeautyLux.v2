import { Check } from 'lucide-react';

import { cn } from '../../utils/cn';

/**
 * Indicador de avance del checkout.
 *
 * `steps` es [{ key, label }] y `current` el índice del paso activo. Es solo
 * informativo: la navegación entre pasos la controla la página.
 */
function CheckoutStepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Pasos de la compra">
      {steps.map((step, index) => {
        const isDone = index < current;
        const isCurrent = index === current;

        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <span
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold smooth-transition',
                isDone && 'border-primary bg-primary text-primary-foreground',
                isCurrent && 'border-primary text-primary',
                !isDone && !isCurrent && 'border-border text-muted-foreground',
              )}
            >
              {isDone ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </span>

            <span
              className={cn(
                'hidden text-sm sm:block',
                isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
              {isDone && <span className="sr-only"> (completado)</span>}
            </span>

            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn('h-px flex-1 smooth-transition', isDone ? 'bg-primary' : 'bg-border')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default CheckoutStepper;
