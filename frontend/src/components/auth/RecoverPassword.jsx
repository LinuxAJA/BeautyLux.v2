import { useState } from 'react';
import { ArrowLeft, CircleCheck, Mail, Send } from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import useForm from '../../hooks/useForm';
import { emailRule } from '../../utils/validators';

const schema = { email: emailRule };

/**
 * Recuperación de contraseña.
 *
 * Componente independiente y reutilizable: no conoce al formulario de login,
 * solo recibe `onBack` para devolver el control a quien lo renderiza.
 */
function RecoverPassword({ onBack }) {
  const [sentTo, setSentTo] = useState(null);
  const { isSubmitting, getFieldProps, handleSubmit } = useForm(
    { email: '' },
    schema,
  );

  const onSubmit = handleSubmit(async (data) => {
    // Sin backend en este avance: se simula el envío del enlace.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSentTo(data.email);
  });

  if (sentTo) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10">
          <CircleCheck className="size-7 text-success" aria-hidden="true" />
        </span>

        <div>
          <h1 className="font-serif text-2xl font-semibold">Revisa tu correo</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Enviamos un enlace para restablecer tu contraseña a{' '}
            <strong className="font-medium text-foreground">{sentTo}</strong>. El enlace
            caduca en 30 minutos.
          </p>
        </div>

        <Button type="button" variant="outline" fullWidth onClick={onBack}>
          <ArrowLeft />
          Volver al inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Recuperar contraseña</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Escribe el correo con el que te registraste y te enviaremos un enlace para
          crear una contraseña nueva.
        </p>
      </div>

      <Input
        label="Correo electrónico"
        type="email"
        icon={Mail}
        placeholder="tucorreo@ejemplo.com"
        autoComplete="email"
        autoFocus
        {...getFieldProps('email')}
      />

      <Button type="submit" variant="gradient" size="lg" fullWidth isLoading={isSubmitting}>
        <Send />
        Recuperar contraseña
      </Button>

      <Button type="button" variant="ghost" fullWidth onClick={onBack}>
        <ArrowLeft />
        Volver al inicio de sesión
      </Button>
    </form>
  );
}

export default RecoverPassword;
