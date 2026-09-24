import { useState } from 'react';
import { CalendarCheck, Sparkles } from 'lucide-react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import HoldTimer from './HoldTimer';
import SlotPicker from '../booking/SlotPicker';
import * as appointmentsService from '../../services/appointments.service';
import { formatDuration } from '../../utils/duration';

/**
 * Paso 1: elegir el horario de cada servicio de la bolsa.
 *
 * Al confirmar una franja se pide una reserva temporal al servidor
 * (`POST /appointments/hold`), que sostiene el cupo mientras dura el resto del
 * checkout. `holds` es un mapa `{ [claveDelItem]: cita }` que la página guarda
 * para enviarlo después con la venta.
 */
function ServiceBooking({ item, hold, onHold, onRelease }) {
  const [slot, setSlot] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleReserve = async () => {
    if (!slot) {
      setError('Elige un día y una hora.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await appointmentsService.holdAppointment({
        serviceId: item.itemId,
        scheduledDate: slot.date,
        startTime: slot.startTime,
      });
      onHold(item.key, response.data);
    } catch (holdError) {
      setError(holdError.message ?? 'No se pudo reservar el horario.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            {item.name}
          </h3>
          {item.durationMinutes && (
            <p className="text-sm text-muted-foreground">
              {formatDuration(item.durationMinutes)} de sesión
            </p>
          )}
        </div>
      </div>

      {hold ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-lg bg-blush/40 p-3 text-sm">
            <CalendarCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Reservado para el <strong>{hold.scheduledDate}</strong> a las{' '}
              <strong>{hold.startTime}</strong>, hasta las {hold.endTime}.
            </span>
          </p>

          <Button variant="outline" size="sm" onClick={() => onRelease(item.key)}>
            Cambiar el horario
          </Button>
        </div>
      ) : (
        <>
          <SlotPicker serviceId={item.itemId} value={slot} onChange={setSlot} />

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button variant="gradient" onClick={handleReserve} isLoading={isSaving} disabled={!slot}>
            Reservar este horario
          </Button>
        </>
      )}
    </Card>
  );
}

function AppointmentStep({ serviceItems, holds, onHold, onRelease, earliestExpiry, onExpire }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-semibold">Tu cita</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige cuándo quieres recibir cada servicio. Guardamos el horario unos minutos mientras
          terminas la compra.
        </p>
      </div>

      {earliestExpiry && <HoldTimer expiresAt={earliestExpiry} onExpire={onExpire} />}

      {serviceItems.map((item) => (
        <ServiceBooking
          key={item.key}
          item={item}
          hold={holds[item.key]}
          onHold={onHold}
          onRelease={onRelease}
        />
      ))}
    </div>
  );
}

export default AppointmentStep;
