import { Leaf, Rabbit, RotateCcw, Truck } from 'lucide-react';

import { benefits } from '../../data/benefits';

const ICONS = { Truck, Rabbit, Leaf, RotateCcw };

function Benefits() {
  return (
    <section className="container-app py-16 lg:py-20">
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map(({ id, icon, title, description }) => {
          const Icon = ICONS[icon];

          return (
            <li key={id} className="text-center">
              <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-blush/50">
                <Icon className="size-6 text-primary" aria-hidden="true" />
              </span>
              <h3 className="font-serif text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default Benefits;
