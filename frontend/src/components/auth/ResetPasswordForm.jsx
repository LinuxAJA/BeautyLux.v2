import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowLeft, CircleAlert, CircleCheck } from 'lucide-react';

import Button from '../ui/Button';
import PasswordInput from './PasswordInput';
import PasswordStrength from './PasswordStrength';
import useForm from '../../hooks/useForm';
import * as authService from '../../services/auth.service';
import { confirmPasswordRule, passwordRule } from '../../utils/validators';

const schema = { password: passwordRule, confirmPassword: confirmPasswordRule };

/**
 * Segundo paso de la recuperación de contraseña: se llega aquí desde el
 * enlace del correo (`/restablecer-contrasena?token=...`). Pide la
 * contraseña nueva y la envía junto al token al backend.
 */
function ResetPasswordForm({ onBack, onDone }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isDone, setIsDone] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const { values, isSubmitting, getFieldProps, handleSubmit } = useForm(
    { password: '', confirmPassword: '' },
    schema,
  );

  const onSubmit = handleSubmit(async (data) => {
    setRequestError(null);
    try {
      await authService.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setIsDone(true);
    } catch (error) {
      setRequestError(
        error.code === 'INVALID_RESET_TOKEN'
          ? 'Este enlace no es válido o ya expiró. Solicita uno nuevo.'
          : error.message ?? 'No se pudo restablecer la contraseña. Inténtalo de nuevo.',
      );
    }
  });

  // Enlace mal formado o abierto sin token: no tiene sentido mostrar el formulario.
  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <CircleAlert className="size-7 text-destructive" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-semibold">Enlace incompleto</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Este enlace no incluye la información necesaria para restablecer tu contraseña.
            Solicita uno nuevo desde la recuperación de contraseña.
          </p>
        </div>
        <Button type="button" variant="outline" fullWidth onClick={onBack}>
          <ArrowLeft />
          Volver al inicio de sesión
        </Button>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10">
          <CircleCheck className="size-7 text-success" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-semibold">Contraseña actualizada</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <Button type="button" variant="gradient" fullWidth onClick={onDone}>
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Crear nueva contraseña</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Elige una contraseña segura para volver a acceder a tu cuenta.
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

      <div>
        <PasswordInput
          label="Contraseña nueva"
          placeholder="Mínimo 8 caracteres"
          autoFocus
          {...getFieldProps('password')}
        />
        <PasswordStrength password={values.password} />
      </div>

      <PasswordInput
        label="Confirmar contraseña"
        placeholder="Repite la contraseña"
        {...getFieldProps('confirmPassword')}
      />

      <Button type="submit" variant="gradient" size="lg" fullWidth isLoading={isSubmitting}>
        Restablecer contraseña
      </Button>

      <Button type="button" variant="ghost" fullWidth onClick={onBack}>
        <ArrowLeft />
        Volver al inicio de sesión
      </Button>
    </form>
  );
}

export default ResetPasswordForm;
