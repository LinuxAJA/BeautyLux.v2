import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

import Button from '../ui/Button';
import { useApi } from '../../hooks/useApi';
import * as appointmentsService from '../../services/appointments.service';
import { formatDuration } from '../../utils/duration';
import { cn } from '../../utils/cn';

const WEEKDAY_LABELS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTH_LABELS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** `AAAA-MM-DD` en hora local: `toISOString()` cambiaría el día según la zona. */
function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Selector de fecha y hora para reservar un servicio.
 *
 * Muestra una semana de días y, para el elegido, las franjas que devuelve
 * `GET /appointments/availability`. Las ocupadas se pintan deshabilitadas en
 * vez de esconderse: así se ve que ese día sí hay horario y lo que falta es
 * cupo.
 *
 * `value` es `{ date, startTime }` o `null`, y `onChange` recibe la franja
 * elegida con esa misma forma. `defaultDate` (`AAAA-MM-DD`) abre el calendario
 * en otra semana: al reprogramar interesa empezar por la fecha que la cita
 * tiene hoy, no por el día de hoy.
 */
function SlotPicker({ serviceId, value, onChange, defaultDate, className }) {
  const today = useMemo(startOfToday, []);
  const initialDate = value?.date ?? defaultDate ?? toIsoDate(today);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  // La semana arranca en el día elegido, salvo que ya haya pasado.
  const [weekStart, setWeekStart] = useState(() => {
    const parsed = new Date(`${initialDate}T00:00:00`);
    return Number.isNaN(parsed.getTime()) || parsed < today ? today : parsed;
  });

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const { data, error, isLoading } = useApi(
    () => appointmentsService.getAvailability(selectedDate, serviceId),
    [selectedDate, serviceId],
  );

  const slots = data?.slots ?? [];
  const isFirstWeek = toIsoDate(weekStart) === toIsoDate(today);

  const handleSelectDay = (date) => {
    setSelectedDate(toIsoDate(date));
    // Cambiar de día invalida la hora elegida: puede no existir en el nuevo.
    onChange(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          Elige el día
        </h3>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={isFirstWeek}
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label="Semana anterior"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="Semana siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {MONTH_LABELS[weekStart.getMonth()]} de {weekStart.getFullYear()}
      </p>

      <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Días disponibles">
        {days.map((day) => {
          const iso = toIsoDate(day);
          const isSelected = iso === selectedDate;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => handleSelectDay(day)}
              aria-pressed={isSelected}
              aria-label={`${WEEKDAY_LABELS[day.getDay()]} ${day.getDate()} de ${MONTH_LABELS[day.getMonth()]}`}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg border py-2 text-xs smooth-transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary hover:bg-blush/30',
              )}
            >
              <span className="uppercase opacity-80">{WEEKDAY_LABELS[day.getDay()]}</span>
              <span className="text-base font-semibold">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Clock className="size-4 text-primary" aria-hidden="true" />
          Elige la hora
          {data?.durationMinutes && (
            <span className="font-normal text-muted-foreground">
              ({formatDuration(data.durationMinutes)} de sesión)
            </span>
          )}
        </h3>

        {isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground" aria-live="polite">
            Consultando horarios...
          </p>
        )}

        {!isLoading && error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error.message ?? 'No se pudieron cargar los horarios.'}
          </p>
        )}

        {!isLoading && !error && slots.length === 0 && (
          <p className="rounded-lg bg-muted/60 p-3 text-center text-sm text-muted-foreground">
            {data?.message ?? 'No hay horarios para este día.'}
          </p>
        )}

        {!isLoading && !error && slots.length > 0 && (
          <div
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
            role="group"
            aria-label="Horarios disponibles"
          >
            {slots.map((slot) => {
              const isSelected = value?.date === selectedDate && value?.startTime === slot.startTime;

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!slot.available}
                  aria-pressed={isSelected}
                  onClick={() => onChange({ date: selectedDate, startTime: slot.startTime })}
                  className={cn(
                    'rounded-lg border py-2 text-sm font-medium smooth-transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:cursor-not-allowed disabled:border-border disabled:bg-muted/50 disabled:text-muted-foreground disabled:line-through',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary hover:bg-blush/30',
                  )}
                >
                  {slot.startTime}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground" aria-live="polite">
          {value?.startTime
            ? `Seleccionaste el ${value.date} a las ${value.startTime}.`
            : 'Todavía no has elegido un horario.'}
        </p>
      </div>
    </div>
  );
}

export default SlotPicker;
