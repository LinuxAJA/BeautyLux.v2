import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleAlert, LogIn, Mail } from 'lucide-react';

import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import Input from '../ui/Input';
import PasswordInput from './PasswordInput';
import useForm from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { emailRule, loginPasswordRule } from '../../utils/validators';

const schema = {
  email: emailRule,
  password: loginPasswordRule,
};

/**
 * Formulario de inicio de sesión.
 * Valida en tiempo real y delega la autenticación al AuthContext.
 */
function LoginForm({ onForgotPassword, onCreateAccount }) {
  const [authError, setAuthError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { values, isSubmitting, getFieldProps, handleChange, handleSubmit } = useForm(
    { email: '', password: '', remember: false },
    schema,
  );

  const onSubmit = handleSubmit(async (data) => {
    setAuthError(null);

    const result = await login(data.email, data.password, data.remember);

    if (!result.ok) {
      setAuthError(result.error);
      return;
    }

    navigate('/');
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Bienvenida de nuevo</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Inicia sesión para acceder a tu cuenta y tus pedidos.
        </p>
      </div>

      {authError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {authError}
        </p>
      )}

      <Input
        label="Correo electrónico"
        type="email"
        icon={Mail}
        placeholder="tucorreo@ejemplo.com"
        autoComplete="email"
        {...getFieldProps('email')}
      />

      <PasswordInput
        label="Contraseña"
        placeholder="Tu contraseña"
        {...getFieldProps('password')}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          name="remember"
          label="No cerrar sesión"
          checked={values.remember}
          onChange={handleChange}
          containerClassName="w-auto"
        />

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* El botón se mantiene activo: `handleSubmit` bloquea el envío inválido
          y revela los errores de todos los campos de una sola vez. */}
      <Button type="submit" variant="gradient" size="lg" fullWidth isLoading={isSubmitting}>
        <LogIn />
        Iniciar sesión
      </Button>

      <div className="relative py-1 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
        <span className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
          o
        </span>
      </div>

      <Button type="button" variant="outline" size="lg" fullWidth onClick={onCreateAccount}>
        Crear una cuenta
      </Button>
    </form>
  );
}

export default LoginForm;
