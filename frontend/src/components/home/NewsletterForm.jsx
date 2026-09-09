import { useState } from 'react';
import { CircleCheck, Mail, Send } from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import useForm from '../../hooks/useForm';
import { emailRule } from '../../utils/validators';
import { cn } from '../../utils/cn';

const schema = { email: emailRule };

/**
 * Suscripción al boletín. Reutiliza `useForm` para validar el correo en
 * tiempo real. La variante `compact` se usa dentro del Footer.
 */
function NewsletterForm({ variant = 'default' }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { values, errors, isValid, isSubmitting, getFieldProps, handleSubmit, reset } = useForm(
    { email: '' },
    schema,
  );

  const onSubmit = handleSubmit(async () => {
    // Sin backend en este avance: se simula el envío.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubscribed(true);
    reset();
  });

  const isCompact = variant === 'compact';

  if (isSubscribed) {
    return (
      <p
        role="status"
        className={cn(
          'flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2.5 text-sm font-medium text-success',
          !isCompact && 'justify-center',
        )}
      >
        <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
        ¡Listo! Revisa tu correo para confirmar la suscripción.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn(isCompact ? 'space-y-2' : 'w-full max-w-md')}>
      {isCompact && (
        <p className="text-sm font-medium text-foreground">Suscríbete al boletín</p>
      )}

      <div className={cn('flex gap-2', isCompact ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row')}>
        <Input
          type="email"
          icon={Mail}
          placeholder="tucorreo@ejemplo.com"
          aria-label="Correo electrónico para el boletín"
          autoComplete="email"
          containerClassName="flex-1"
          {...getFieldProps('email')}
          isValid={!errors.email && values.email.length > 0 && isValid}
        />
        <Button
          type="submit"
          variant={isCompact ? 'default' : 'gradient'}
          isLoading={isSubmitting}
          className="shrink-0"
        >
          <Send />
          Suscribirme
        </Button>
      </div>
    </form>
  );
}

export default NewsletterForm;
