import { useState } from 'react';
import { CircleAlert, CircleCheck, FileSearch, MessageSquarePlus, Search, Send } from 'lucide-react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageHero from '../components/ui/PageHero';
import Select from '../components/ui/Select';
import { useAuth } from '../hooks/useAuth';
import useForm from '../hooks/useForm';
import * as pqrService from '../services/pqr.service';
import { contactSubjects, pqrTypes } from '../data/documentTypes';
import { emailRule, nameRule, phoneRule } from '../utils/validators';
import { cn } from '../utils/cn';

const TABS = [
  { value: 'radicar', label: 'Radicar una PQR', icon: MessageSquarePlus },
  { value: 'consultar', label: 'Consultar el estado', icon: FileSearch },
];

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  answered: 'Respondida',
  closed: 'Cerrada',
};

const pqrSchema = {
  type: {
    label: 'Tipo',
    required: true,
    messages: { required: 'Selecciona el tipo de tu mensaje.' },
  },
  subject: {
    label: 'Asunto',
    required: true,
    messages: { required: 'Selecciona el asunto de tu mensaje.' },
  },
  message: {
    label: 'Mensaje',
    required: true,
    minLength: 15,
    maxLength: 2000,
    messages: {
      required: 'Escribe tu mensaje.',
      minLength: 'Cuéntanos un poco más: mínimo 15 caracteres.',
      maxLength: 'El mensaje no puede superar los 2000 caracteres.',
    },
  },
  contactFirstName: nameRule('Nombre'),
  contactLastName: nameRule('Apellido'),
  contactEmail: emailRule,
  contactPhone: { ...phoneRule, required: false },
};

/** Área de texto del mensaje, con contador de caracteres. */
function MessageField({ error, isValid: _isValid, value, maxLength, ...field }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor="pqr-message" className="text-sm font-medium">
          Mensaje<span className="ml-0.5 text-primary">*</span>
        </label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      </div>

      <textarea
        id="pqr-message"
        rows={6}
        value={value}
        maxLength={maxLength}
        placeholder="Cuéntanos con detalle qué pasó y qué esperas de nosotros…"
        aria-invalid={Boolean(error)}
        className={cn(
          'w-full resize-y rounded-lg border bg-input/60 p-3.5 text-sm smooth-transition',
          'placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background',
          error
            ? 'border-destructive focus:ring-destructive/40'
            : 'border-border focus:border-primary focus:ring-ring/40',
        )}
        {...field}
      />

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function PqrRadicarForm() {
  const { user, isAuthenticated } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const { isSubmitting, getFieldProps, handleSubmit, reset } = useForm(
    {
      type: '',
      subject: '',
      message: '',
      contactFirstName: isAuthenticated ? user.firstName : '',
      contactLastName: isAuthenticated ? user.lastName : '',
      contactEmail: isAuthenticated ? user.email : '',
      contactPhone: isAuthenticated ? (user.phone ?? '') : '',
    },
    pqrSchema,
  );

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      const response = await pqrService.createPqr(data);
      setTicket(response.data);
      reset();
    } catch (error) {
      setSubmitError(error.message ?? 'No se pudo radicar tu PQR. Inténtalo de nuevo.');
    }
  });

  if (ticket) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CircleCheck className="size-8 text-primary" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-serif text-2xl font-semibold">PQR radicada</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Guarda tu número de seguimiento. Con él y tu correo puedes consultar el estado en
            cualquier momento, sin necesidad de iniciar sesión.
          </p>
        </div>
        <p className="rounded-lg bg-blush/40 px-6 py-3 font-serif text-2xl font-semibold text-primary">
          {ticket.ticketNumber}
        </p>
        <Button variant="outline" onClick={() => setTicket(null)}>
          Radicar otra PQR
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {submitError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Tipo" options={pqrTypes} placeholder="¿Qué quieres radicar?" {...getFieldProps('type')} />
        <Select
          label="Asunto"
          options={contactSubjects}
          placeholder="¿Sobre qué nos escribes?"
          {...getFieldProps('subject')}
        />
      </div>

      <MessageField {...getFieldProps('message')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre" {...getFieldProps('contactFirstName')} />
        <Input label="Apellido" {...getFieldProps('contactLastName')} />
        <Input label="Correo electrónico" type="email" {...getFieldProps('contactEmail')} />
        <Input label="Teléfono" hint="Opcional" {...getFieldProps('contactPhone')} />
      </div>

      <Button type="submit" variant="gradient" size="lg" isLoading={isSubmitting}>
        <Send />
        Radicar PQR
      </Button>
    </form>
  );
}

function PqrConsultarForm() {
  const [result, setResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [isLooking, setIsLooking] = useState(false);

  const { getFieldProps, handleSubmit } = useForm(
    { ticketNumber: '', email: '' },
    {
      ticketNumber: {
        label: 'Número de ticket',
        required: true,
        messages: { required: 'Escribe el número de tu PQR, por ejemplo PQR-2026-00001.' },
      },
      email: emailRule,
    },
  );

  const onSubmit = handleSubmit(async (data) => {
    setLookupError(null);
    setResult(null);
    setIsLooking(true);
    try {
      const response = await pqrService.getPqrByTicket(data.ticketNumber.trim(), data.email);
      setResult(response.data);
    } catch (error) {
      setLookupError(error.message ?? 'No encontramos una PQR con ese número y ese correo.');
    } finally {
      setIsLooking(false);
    }
  });

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input label="Número de ticket" placeholder="PQR-2026-00001" {...getFieldProps('ticketNumber')} />
        <Input label="Correo electrónico" type="email" {...getFieldProps('email')} />
        <Button type="submit" variant="gradient" isLoading={isLooking}>
          <Search />
          Consultar
        </Button>
      </form>

      {lookupError && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {lookupError}
        </p>
      )}

      {result && (
        <Card className="space-y-3 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-lg font-semibold">{result.ticketNumber}</h3>
            <span className="label-caps text-primary">{STATUS_LABELS[result.status] ?? result.status}</span>
          </div>
          <p className="text-sm text-muted-foreground">{result.subject}</p>
          <p className="text-sm leading-relaxed">{result.message}</p>

          {result.response ? (
            <div className="rounded-lg bg-blush/30 p-4">
              <p className="label-caps mb-1 text-muted-foreground">Respuesta de BeautyLux</p>
              <p className="text-sm leading-relaxed">{result.response}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Todavía no tiene respuesta. Nuestro equipo te escribirá lo antes posible.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

/**
 * Módulo público de PQR: radicar una petición, queja, reclamo o sugerencia,
 * y consultar el estado de una ya radicada sin necesidad de iniciar sesión.
 */
function Pqr() {
  const [tab, setTab] = useState('radicar');

  return (
    <>
      <PageHero
        eyebrow="PQR"
        title="Peticiones, quejas,"
        highlight="reclamos y sugerencias"
        subtitle="Cuéntanos qué pasó. Respondemos cada caso y puedes hacerle seguimiento con tu número de ticket."
      />

      <section className="container-app py-14 lg:py-16">
        <Card className="mx-auto max-w-2xl p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row" role="tablist" aria-label="Secciones de PQR">
            {TABS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={tab === value ? 'gradient' : 'outline'}
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                fullWidth
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>

          {tab === 'radicar' ? <PqrRadicarForm /> : <PqrConsultarForm />}
        </Card>
      </section>
    </>
  );
}

export default Pqr;
