import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';
import SlotPicker from '../booking/SlotPicker';

/**
 * Mueve una cita a otro horario.
 *
 * Reutiliza el mismo `SlotPicker` del checkout, así que el panel y la tienda
 * ofrecen exactamente los mismos huecos: la disponibilidad la decide el
 * servidor, no cada pantalla.
 */
function RescheduleModal({ isOpen, onClose, onSubmit, appointment }) {
  const [slot, setSlot] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Al abrir con otra cita, la selección anterior no vale.
  useEffect(() => {
    if (isOpen) {
      setSlot(null);
      setError(null);
    }
  }, [isOpen, appointment?.id]);

  const handleSubmit = async () => {
    if (!slot) {
      setError('Elige un día y una hora para la cita.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ scheduledDate: slot.date, startTime: slot.startTime });
      onClose();
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo reprogramar la cita.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reprogramar cita"
      description={
        appointment
          ? `${appointment.appointmentNumber} — ${appointment.serviceName}, hoy agendada para el ${appointment.scheduledDate} a las ${appointment.startTime}.`
          : undefined
      }
    >
      <div className="space-y-4">
        {appointment?.serviceId ? (
          <SlotPicker
            serviceId={appointment.serviceId}
            value={slot}
            onChange={setSlot}
            defaultDate={appointment.scheduledDate}
          />
        ) : (
          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            Esta cita quedó sin servicio asociado, así que no se pueden calcular sus horarios.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={handleSubmit} isLoading={isSaving} disabled={!slot}>
            Guardar el nuevo horario
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RescheduleModal;
