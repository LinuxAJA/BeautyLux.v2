import { useState } from 'react';
import { ChevronDown, CircleCheck, Clock, Mail, MapPin, Phone, Send, UserRound } from 'lucide-react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';
import Select from '../components/ui/Select';
import SocialIcon from '../components/ui/SocialIcon';
import useForm from '../hooks/useForm';
import { contactSubjects } from '../data/documentTypes';
import { contactInfo, socialLinks } from '../data/navLinks';
import { emailRule, nameRule, phoneRule } from '../utils/validators';
import { cn } from '../utils/cn';

const schema = {
  name: nameRule('Nombre'),
  email: emailRule,
  phone: { ...phoneRule, required: false },
  subject: {
    label: 'Asunto',
    required: true,
    messages: { required: 'Selecciona el asunto de tu mensaje.' },
  },
  message: {
    label: 'Mensaje',
    required: true,
    minLength: 15,
    maxLength: 500,
    messages: {
      required: 'Escribe tu mensaje.',
      minLength: 'Cuéntanos un poco más: mínimo 15 caracteres.',
      maxLength: 'El mensaje no puede superar los 500 caracteres.',
    },
  },
};

const CONTACT_CARDS = [
  { icon: MapPin, title: 'Dirección', value: contactInfo.address },
  { icon: Phone, title: 'Teléfono', value: contactInfo.phone, href: `tel:${contactInfo.phone.replace(/\s/g, '')}` },
  { icon: Mail, title: 'Correo', value: contactInfo.email, href: `mailto:${contactInfo.email}` },
  { icon: Clock, title: 'Horario', value: contactInfo.schedule },
];

const FAQS = [
  {
    question: '¿Cuánto tarda el envío?',
    answer: 'Entre 2 y 5 días hábiles según la ciudad. En Bogotá, Medellín y Cali entregamos en 24 horas si compras antes de la 1:00 p.m.',
  },
  {
    question: '¿Puedo devolver un producto?',
    answer: 'Sí. Tienes 30 días desde la entrega para solicitar la devolución, siempre que el producto conserve su empaque original.',
  },
  {
    question: '¿Los productos son aptos para piel sensible?',
    answer: 'Toda nuestra línea de cuidado facial está testada dermatológicamente. En cada ficha encontrarás la lista completa de ingredientes.',
  },
  {
    question: '¿Hacen ventas al por mayor?',
    answer: 'Sí, trabajamos con salones y tiendas de belleza. Escríbenos seleccionando el asunto "Compras al por mayor".',
  },
];

/**
 * Área de texto del mensaje.
 * Recibe las props de `getFieldProps` y descarta las que no pertenecen al
 * DOM (`error`, `isValid`) antes de pasarlas al <textarea>.
 */
function MessageField({ error, isValid: _isValid, value, maxLength, ...field }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor="contact-message" className="text-sm font-medium">
          Mensaje<span className="ml-0.5 text-primary">*</span>
        </label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      </div>

      <textarea
        id="contact-message"
        rows={5}
        value={value}
        maxLength={maxLength}
        placeholder="Cuéntanos en qué podemos ayudarte…"
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

function Contact() {
  const [isSent, setIsSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const { isSubmitting, getFieldProps, handleSubmit, reset } = useForm(
    { name: '', email: '', phone: '', subject: '', message: '' },
    schema,
  );

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsSent(true);
    reset();
  });

  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Hablemos de tu"
        highlight="rutina"
        subtitle="Escríbenos y te respondemos en menos de 24 horas hábiles. Sin bots ni respuestas automáticas."
      />

      <section className="container-app grid gap-8 py-14 lg:grid-cols-3 lg:py-16">
        <Card className="p-6 sm:p-8 lg:col-span-2">
          {isSent ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-success/10">
                <CircleCheck className="size-8 text-success" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-semibold">Mensaje enviado</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Gracias por escribirnos. Nuestro equipo te responderá al correo que nos
                  dejaste en menos de 24 horas hábiles.
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsSent(false)}>
                Enviar otro mensaje
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <SectionHeading
                align="left"
                title="Envíanos un"
                highlight="mensaje"
                className="max-w-none"
              />

              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <Input
                  label="Nombre"
                  icon={UserRound}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  {...getFieldProps('name')}
                />

                <Input
                  label="Correo electrónico"
                  type="email"
                  icon={Mail}
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                  {...getFieldProps('email')}
                />

                <Input
                  label="Teléfono"
                  icon={Phone}
                  inputMode="numeric"
                  placeholder="3204567890"
                  hint="Opcional"
                  autoComplete="tel"
                  {...getFieldProps('phone')}
                />

                <Select
                  label="Asunto"
                  options={contactSubjects}
                  placeholder="¿Sobre qué nos escribes?"
                  {...getFieldProps('subject')}
                />
              </div>

              <MessageField {...getFieldProps('message')} />

              <Button type="submit" variant="gradient" size="lg" isLoading={isSubmitting}>
                <Send />
                Enviar mensaje
              </Button>
            </form>
          )}
        </Card>

        <div className="space-y-4">
          {CONTACT_CARDS.map(({ icon: Icon, title, value, href }) => (
            <Card key={title} className="flex gap-3.5 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blush/50">
                <Icon className="size-4.5 text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                {href ? (
                  <a href={href} className="text-sm text-muted-foreground hover:text-primary">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">{value}</p>
                )}
              </div>
            </Card>
          ))}

          <Card className="p-5">
            <p className="text-sm font-semibold">Síguenos</p>
            <ul className="mt-3 flex gap-2">
              {socialLinks.map(({ label, icon, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70 smooth-transition hover:bg-primary hover:text-primary-foreground"
                  >
                    <SocialIcon name={icon} />
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="subtle-gradient py-16 lg:py-20">
        <div className="container-app">
          <SectionHeading eyebrow="Ayuda" title="Preguntas" highlight="frecuentes" />

          <ul className="mx-auto mt-10 max-w-3xl space-y-3">
            {FAQS.map(({ question, answer }, index) => {
              const isOpen = openFaq === index;

              return (
                <li key={question}>
                  <Card className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="text-sm font-semibold sm:text-base">{question}</span>
                      <ChevronDown
                        className={cn(
                          'size-4 shrink-0 text-muted-foreground smooth-transition',
                          isOpen && 'rotate-180',
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                        {answer}
                      </p>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}

export default Contact;
