import { Link } from 'react-router';
import { ArrowRight, Eye, Heart, Target } from 'lucide-react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';
import storyImage from '../assets/images/mascarilla-arcilla.jpg';

const PILLARS = [
  {
    icon: Target,
    title: 'Misión',
    text: 'Democratizar la cosmética de alta calidad en Colombia, con productos honestos, seguros y accesibles que celebren la belleza real de cada persona.',
  },
  {
    icon: Eye,
    title: 'Visión',
    text: 'Ser en 2030 la marca de belleza consciente de mayor confianza en Latinoamérica, reconocida por su transparencia y su compromiso ambiental.',
  },
  {
    icon: Heart,
    title: 'Valores',
    text: 'Transparencia en cada fórmula, respeto absoluto por los animales, comercio justo con nuestros proveedores y empaques 100% reciclables.',
  },
];

const TIMELINE = [
  { year: '2019', title: 'El primer laboratorio', text: 'Nacemos en un pequeño taller en Bogotá con tres labiales artesanales.' },
  { year: '2021', title: 'Certificación vegana', text: 'Toda la línea obtiene el sello cruelty free y reformulamos sin parabenos.' },
  { year: '2023', title: 'Tienda en línea', text: 'Abrimos el canal digital y llegamos a las 32 ciudades principales del país.' },
  { year: '2026', title: '50 mil clientas', text: 'Superamos las 50 mil clientas y lanzamos la colección Sunset Glow.' },
];

const TEAM = [
  { name: 'Laura Mendoza', role: 'Fundadora y CEO', initials: 'LM' },
  { name: 'Andrés Gutiérrez', role: 'Director de laboratorio', initials: 'AG' },
  { name: 'Valentina Ríos', role: 'Directora creativa', initials: 'VR' },
  { name: 'Sofía Cardona', role: 'Jefa de experiencia', initials: 'SC' },
];

const STATS = [
  { value: '7', label: 'Años de trayectoria' },
  { value: '50 mil', label: 'Clientas atendidas' },
  { value: '100%', label: 'Fórmulas veganas' },
  { value: '32', label: 'Ciudades con cobertura' },
];

function About() {
  return (
    <>
      <PageHero
        eyebrow="¿Quiénes somos?"
        title="Belleza consciente,"
        highlight="hecha en Colombia"
        subtitle="Somos un equipo que cree que cuidarse no debería costar el planeta ni la salud de la piel."
      />

      <section className="container-app grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Nuestra historia"
            title="De un taller en Bogotá a"
            highlight="toda Colombia"
            className="max-w-none"
          />
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              BeautyLux empezó en 2019 con una pregunta incómoda: ¿por qué era tan difícil
              encontrar cosmética de calidad, libre de crueldad animal y a un precio justo?
              Laura Mendoza, nuestra fundadora, decidió formular ella misma los primeros
              tres labiales en un taller de 20 metros cuadrados.
            </p>
            <p>
              Siete años después mantenemos la misma obsesión: cada fórmula se desarrolla en
              nuestro laboratorio propio, se prueba con voluntarias reales y se publica con
              la lista completa de ingredientes. Sin promesas imposibles ni letra pequeña.
            </p>
          </div>
        </div>

        <img
          src={storyImage}
          alt="Sesión de cuidado facial en el laboratorio de BeautyLux"
          loading="lazy"
          className="w-full rounded-2xl object-cover shadow-elegant"
        />
      </section>

      <section className="subtle-gradient py-16 lg:py-20">
        <div className="container-app">
          <SectionHeading
            eyebrow="Lo que nos mueve"
            title="Misión, visión y"
            highlight="valores"
          />

          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Card hoverable className="h-full p-6">
                  <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-blush/50">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                  </span>
                  <h3 className="font-serif text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-app py-16 lg:py-20">
        <SectionHeading eyebrow="Trayectoria" title="Nuestro" highlight="recorrido" />

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIMELINE.map(({ year, title, text }) => (
            <li key={year} className="relative border-t-2 border-primary/30 pt-5">
              <span className="absolute -top-2 left-0 size-3.5 rounded-full bg-primary" aria-hidden="true" />
              <p className="font-serif text-2xl font-semibold text-primary">{year}</p>
              <h3 className="mt-1 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="gold-gradient">
        <div className="container-app grid gap-8 py-14 text-center sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="font-serif text-4xl font-semibold">{value}</p>
              <p className="mt-1 text-sm text-foreground/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-app py-16 lg:py-20">
        <SectionHeading
          eyebrow="Equipo"
          title="Las personas detrás de"
          highlight="BeautyLux"
          subtitle="Un equipo pequeño, obsesionado con los detalles y con responder cada mensaje."
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map(({ name, role, initials }) => (
            <li key={name}>
              <Card hoverable className="p-6 text-center">
                <span className="primary-gradient mx-auto mb-4 flex size-16 items-center justify-center rounded-full font-serif text-xl font-semibold text-primary-foreground">
                  {initials}
                </span>
                <h3 className="font-semibold">{name}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{role}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="subtle-gradient">
        <div className="container-app flex flex-col items-center gap-5 py-16 text-center">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            ¿Lista para empezar tu ritual?
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Explora el catálogo completo o escríbenos: te ayudamos a armar la rutina que
            tu piel necesita.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/productos">
              <Button variant="gradient" size="lg" fullWidth>
                Ver productos
                <ArrowRight />
              </Button>
            </Link>
            <Link to="/contacto">
              <Button variant="outline" size="lg" fullWidth>
                Contáctanos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
