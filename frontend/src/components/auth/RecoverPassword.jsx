import { useState } from 'react';
import { ArrowLeft, CircleAlert, CircleCheck, Mail, Send } from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import useForm from '../../hooks/useForm';
import * as authService from '../../services/auth.service';
import { emailRule } from '../../utils/validators';

const schema = { email: emailRule };

/**
 * Recuperación de contraseña.
 *
 * Componente independiente y reutilizable: no conoce al formulario de login,
 * solo recibe `onBack` para devolver el control a quien lo renderiza.
 *
 * El backend responde con el mismo mensaje genérico exista o no la cuenta
 * (evita revelar qué correos están registrados) y envía el enlace por correo
 * en segundo plano — ver ResetPasswordForm para el segundo paso.
 */
function RecoverPassword({ onBack }) {
  const [sentTo, setSentTo] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const { isSubmitting, getFieldProps, handleSubmit } = useForm(
    { email: '' },
    schema,
  );

  const onSubmit = handleSubmit(async (data) => {
    setRequestError(null);
    try {
      await authService.forgotPassword(data.email);
      setSentTo(data.email);
    } catch (error) {
      setRequestError(
        error.code === 'RATE_LIMITED'
          ? error.message
          : 'No se pudo procesar la solicitud. Inténtalo de nuevo en unos minutos.',
      );
    }
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
            Si <strong className="font-medium text-foreground">{sentTo}</strong> está registrado,
            te enviamos un enlace para restablecer tu contraseña. El enlace caduca en 30 minutos.
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

      {requestError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {requestError}
        </p>
      )}

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
