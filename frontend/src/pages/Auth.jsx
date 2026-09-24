import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Star } from 'lucide-react';

import FloatingActions from '../components/chat/FloatingActions';
import BrandLogo from '../components/ui/BrandLogo';
import LoginForm from '../components/auth/LoginForm';
import RecoverPassword from '../components/auth/RecoverPassword';
import RegisterModal from '../components/auth/RegisterModal';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import useDisclosure from '../hooks/useDisclosure';

/**
 * Página de acceso a la cuenta.
 *
 * Alterna entre el inicio de sesión, la recuperación de contraseña y (al
 * llegar desde el enlace del correo) el formulario para crear la contraseña
 * nueva, y abre el modal de registro. Usa su propio diseño a dos columnas en
 * lugar del MainLayout para mantener el foco en el formulario.
 *
 * `initialView='reset'` la monta la ruta `/restablecer-contrasena`.
 */
function Auth({ initialView = 'login' }) {
  const [view, setView] = useState(initialView);
  const registerModal = useDisclosure();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      {/* Columna decorativa: se oculta en móvil para dar todo el ancho al formulario. */}
      <aside className="hero-gradient relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -left-20 top-20 size-72 rounded-full bg-champagne/50 blur-3xl animate-float"
          aria-hidden="true"
        />

        <Link to="/" className="relative inline-flex" aria-label="BeautyLux, ir al inicio">
          <BrandLogo />
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-serif text-4xl font-semibold leading-tight xl:text-5xl">
            Tu belleza merece un <span className="text-gradient">ritual propio</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/70">
            Accede a tu cuenta para seguir tus pedidos, guardar tus favoritos y recibir
            recomendaciones personalizadas.
          </p>
        </div>

        <figure className="relative rounded-xl bg-card/85 p-5 shadow-card backdrop-blur-sm">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className="size-4 fill-accent text-accent" aria-hidden="true" />
            ))}
          </div>
          <blockquote className="mt-3 text-sm leading-relaxed text-foreground/80">
            “Llevo tres años comprando aquí y nunca me han fallado. La calidad y la
            atención son excelentes.”
          </blockquote>
          <figcaption className="mt-3 text-xs text-muted-foreground">
            Valentina Ríos · Maquilladora profesional
          </figcaption>
        </figure>
      </aside>

      <main className="flex w-full flex-col bg-card lg:w-1/2">
        <div className="p-5 sm:p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground smooth-transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a la tienda
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-md">
            {view === 'login' && (
              <LoginForm
                onForgotPassword={() => setView('recover')}
                onCreateAccount={registerModal.open}
              />
            )}
            {view === 'recover' && <RecoverPassword onBack={() => setView('login')} />}
            {view === 'reset' && (
              <ResetPasswordForm
                onBack={() => setView('login')}
                onDone={() => {
                  setView('login');
                  navigate('/login', { replace: true });
                }}
              />
            )}
          </div>
        </div>
      </main>

      <RegisterModal
        isOpen={registerModal.isOpen}
        onClose={registerModal.close}
        onRegistered={() => setView('login')}
      />

      <FloatingActions />
    </div>
  );
}

export default Auth;
