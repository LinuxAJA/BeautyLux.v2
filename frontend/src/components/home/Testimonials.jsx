import { Quote } from 'lucide-react';

import Card from '../ui/Card';
import Rating from '../ui/Rating';
import SectionHeading from '../ui/SectionHeading';
import { testimonials } from '../../data/testimonials';

function Testimonials() {
  return (
    <section className="subtle-gradient py-16 lg:py-20">
      <div className="container-app">
        <SectionHeading
          eyebrow="Testimonios"
          title="Lo que dicen nuestras"
          highlight="clientas"
          subtitle="Miles de personas ya transformaron su rutina de belleza con BeautyLux."
        />

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map(({ id, name, role, initials, rating, text }) => (
            <li key={id}>
              <Card hoverable className="flex h-full flex-col p-6">
                <Quote className="size-7 text-primary/30" aria-hidden="true" />

                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/80">“{text}”</p>

                <Rating value={rating} className="mt-5" />

                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <span className="primary-gradient flex size-10 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground">
                    {initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Testimonials;
