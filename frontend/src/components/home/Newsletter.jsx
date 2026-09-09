import { Mail } from 'lucide-react';

import NewsletterForm from './NewsletterForm';

function Newsletter() {
  return (
    <section className="primary-gradient">
      <div className="container-app flex flex-col items-center gap-6 py-16 text-center lg:py-20">
        <span className="flex size-14 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm">
          <Mail className="size-6 text-primary-foreground" aria-hidden="true" />
        </span>

        <div className="max-w-xl">
          <h2 className="font-serif text-3xl font-semibold text-primary-foreground sm:text-4xl">
            Únete al club BeautyLux
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
            Recibe lanzamientos exclusivos, consejos de nuestras maquilladoras y un
            <strong className="font-semibold"> 15% de descuento</strong> en tu primera compra.
          </p>
        </div>

        <div className="w-full max-w-md rounded-xl bg-background/95 p-4 shadow-elegant backdrop-blur-sm">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
