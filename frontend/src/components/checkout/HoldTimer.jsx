import { useEffect, useState } from 'react';
import { TimerReset } from 'lucide-react';

import { cn } from '../../utils/cn';

/** Segundos que faltan hasta `expiresAt`, nunca negativos. */
function secondsLeft(expiresAt) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

/**
 * Cuenta atrás de las reservas de cita.
 *
 * El servidor guarda un `holdExpiresAt` por reserva; si el checkout tarda más
 * que eso, la franja vuelve a estar libre y la venta será rechazada. Mostrar
 * el tiempo evita que eso ocurra por sorpresa.
 *
 * `onExpire` se dispara una sola vez, cuando la cuenta llega a cero.
 */
function HoldTimer({ expiresAt, onExpire, className }) {
  const [remaining, setRemaining] = useState(() => secondsLeft(expiresAt));

  useEffect(() => {
    setRemaining(secondsLeft(expiresAt));
    if (!expiresAt) return undefined;

    const interval = setInterval(() => {
      const left = secondsLeft(expiresAt);
      setRemaining(left);
      if (left === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
    // `onExpire` se deja fuera a propósito: cambia de identidad en cada render
    // del padre y reiniciaría la cuenta atrás cada segundo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  if (!expiresAt) return null;

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const isRunningOut = remaining > 0 && remaining <= 60;

  return (
    <p
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 rounded-lg p-3 text-sm',
        remaining === 0
          ? 'bg-destructive/10 text-destructive'
          : isRunningOut
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/60 text-muted-foreground',
        className,
      )}
    >
      <TimerReset className="size-4 shrink-0" aria-hidden="true" />
      {remaining === 0 ? (
        <span>La reserva del horario expiró. Vuelve a elegirlo para continuar.</span>
      ) : (
        <span>
          Guardamos tu horario durante{' '}
          <strong className="font-semibold tabular-nums">
            {minutes}:{seconds}
          </strong>
          .
        </span>
      )}
    </p>
  );
}

export default HoldTimer;
