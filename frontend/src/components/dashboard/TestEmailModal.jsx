import { useEffect, useState } from 'react';
import { CheckCircle, CircleAlert, Info } from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { emailRule } from '../../utils/validators';

/** Mismas reglas y mensajes que el resto de formularios (`emailRule`). */
function validateEmail(value) {
  if (value.length > emailRule.maxLength) return emailRule.messages.maxLength;
  if (!emailRule.pattern.test(value)) return emailRule.messages.pattern;
  return null;
}

const RESULT_STYLES = {
  sent: { icon: CheckCircle, className: 'bg-primary/10 text-primary' },
  skipped: { icon: Info, className: 'bg-muted text-muted-foreground' },
  failed: { icon: CircleAlert, className: 'bg-destructive/10 text-destructive' },
};

const RESULT_TEXT = {
  sent: (result) => `Brevo aceptó el correo para ${result.recipient}. Revisa la bandeja de entrada (y la de spam).`,
  skipped: () => 'El envío está desactivado (MAIL_ENABLED=false): el correo quedó en el log del servidor.',
  failed: (result) => `No se pudo enviar tras ${result.attempts} intento(s): ${result.error ?? 'error desconocido'}`,
};

/**
 * Correo de prueba desde el panel: comprueba la configuración de Brevo sin
 * disparar una recuperación de contraseña. El backend envía en la misma
 * petición y responde qué pasó, así que el resultado se muestra aquí mismo.
 */
function TestEmailModal({ isOpen, onClose, onSend }) {
  const { user } = useAuth();
  const [to, setTo] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [result, setResult] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTo('');
      setFieldError(null);
      setResult(null);
      setRequestError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = to.trim();
    const emailError = trimmed ? validateEmail(trimmed) : null;
    setFieldError(emailError);
    if (emailError) return;

    setIsSending(true);
    setResult(null);
    setRequestError(null);
    try {
      setResult(await onSend(trimmed || undefined));
    } catch (error) {
      setRequestError(error.message ?? 'No se pudo enviar el correo de prueba.');
    } finally {
      setIsSending(false);
    }
  };

  const style = result ? RESULT_STYLES[result.status] : null;
  const ResultIcon = style?.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar correo de prueba"
      description="Comprueba que la API puede enviar correos por Brevo."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          type="email"
          label="Destinatario (opcional)"
          placeholder={user.email}
          value={to}
          onChange={(event) => setTo(emailRule.sanitize(event.target.value))}
          error={fieldError}
          hint="Si lo dejas vacío, se envía a tu propio correo. Usa un buzón real: las cuentas de prueba @beautylux.com no existen."
        />

        {result && (
          <p
            role={result.status === 'failed' ? 'alert' : 'status'}
            className={cn('flex items-start gap-2 rounded-lg p-3 text-sm', style.className)}
          >
            <ResultIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {RESULT_TEXT[result.status](result)}
          </p>
        )}
        {requestError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {requestError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSending}>
            Enviar prueba
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TestEmailModal;
