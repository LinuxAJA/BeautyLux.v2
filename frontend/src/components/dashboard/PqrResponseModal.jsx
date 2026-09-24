import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import PqrStatusBadge from './PqrStatusBadge';
import { pqrTypes } from '../../data/documentTypes';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'closed', label: 'Cerrada' },
];

/**
 * Detalle y respuesta de una PQR desde el panel de personal.
 *
 * Cambiar el estado y responder son dos acciones independientes: el
 * servicio pone el estado en `answered` automáticamente al responder, así
 * que el selector de estado solo sirve para mover la cola sin responder
 * todavía (`in_progress`) o cerrarla.
 */
function PqrResponseModal({ isOpen, onClose, pqr, onUpdateStatus, onRespond }) {
  const [status, setStatus] = useState('pending');
  const [response, setResponse] = useState('');
  const [statusError, setStatusError] = useState(null);
  const [responseError, setResponseError] = useState(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSendingResponse, setIsSendingResponse] = useState(false);

  useEffect(() => {
    if (isOpen && pqr?.status) {
      setStatus(pqr.status);
      setResponse('');
      setStatusError(null);
      setResponseError(null);
    }
  }, [isOpen, pqr?.id, pqr?.status]);

  if (!pqr) return null;

  const isClosed = pqr.status === 'closed';
  const typeLabel = pqrTypes.find((option) => option.value === pqr.type)?.label ?? pqr.type;

  const handleUpdateStatus = async () => {
    setIsSavingStatus(true);
    setStatusError(null);
    try {
      await onUpdateStatus(pqr.id, status);
    } catch (error) {
      setStatusError(error.message ?? 'No se pudo actualizar el estado.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSendResponse = async () => {
    if (response.trim().length < 5) {
      setResponseError('Escribe una respuesta antes de enviarla.');
      return;
    }
    setIsSendingResponse(true);
    setResponseError(null);
    try {
      await onRespond(pqr.id, response.trim());
      onClose();
    } catch (error) {
      setResponseError(error.message ?? 'No se pudo enviar la respuesta.');
    } finally {
      setIsSendingResponse(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pqr.ticketNumber} description={typeLabel}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <PqrStatusBadge status={pqr.status} />
          <span className="text-xs text-muted-foreground">
            {pqr.contactFirstName} {pqr.contactLastName} · {pqr.contactEmail}
            {pqr.contactPhone ? ` · ${pqr.contactPhone}` : ''}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="label-caps text-muted-foreground">{pqr.subject}</p>
          <p className="text-sm leading-relaxed">{pqr.message}</p>
        </div>

        {pqr.response && (
          <div className="rounded-lg bg-blush/30 p-4">
            <p className="label-caps mb-1 text-muted-foreground">Respuesta enviada</p>
            <p className="text-sm leading-relaxed">{pqr.response}</p>
          </div>
        )}

        <div className="flex items-end gap-2">
          <Select
            label="Estado"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            containerClassName="flex-1"
          />
          <Button variant="outline" isLoading={isSavingStatus} onClick={handleUpdateStatus}>
            Actualizar
          </Button>
        </div>
        {statusError && (
          <p role="alert" className="text-sm text-destructive">
            {statusError}
          </p>
        )}

        {isClosed ? (
          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            Esta PQR está cerrada. Reabre el estado antes de poder responderla.
          </p>
        ) : (
          <div className="space-y-2">
            <label htmlFor="pqr-response" className="text-sm font-medium">
              Respuesta
            </label>
            <textarea
              id="pqr-response"
              rows={5}
              value={response}
              maxLength={2000}
              placeholder="Escribe la respuesta que verá el cliente..."
              aria-invalid={Boolean(responseError)}
              onChange={(event) => setResponse(event.target.value)}
              className="w-full resize-y rounded-lg border border-border bg-input/60 p-3.5 text-sm smooth-transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            {responseError && (
              <p role="alert" className="text-sm text-destructive">
                {responseError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button variant="gradient" isLoading={isSendingResponse} onClick={handleSendResponse}>
                Enviar respuesta
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default PqrResponseModal;
