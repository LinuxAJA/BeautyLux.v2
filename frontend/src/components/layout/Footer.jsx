import { Link } from 'react-router';
import { Mail, MapPin, Phone } from 'lucide-react';

import NewsletterForm from '../home/NewsletterForm';
import BrandLogo from '../ui/BrandLogo';
import SocialIcon from '../ui/SocialIcon';
import { contactInfo, footerColumns, legalLinks, socialLinks } from '../../data/navLinks';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="subtle-gradient border-t border-border">
      <div className="container-app grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-3">
          <Link to="/" className="inline-flex" aria-label="BeautyLux, ir al inicio">
            <BrandLogo />
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cosmética consciente para realzar tu belleza natural. Fórmulas veganas,
            libres de crueldad animal y desarrolladas con ingredientes de origen natural.
          </p>
          <ul className="flex gap-2">
            {socialLinks.map(({ label, icon, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-background text-foreground/70 shadow-card smooth-transition hover:bg-primary hover:text-primary-foreground"
                >
                  <SocialIcon name={icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {footerColumns.map(({ title, links }) => (
          <nav key={title} aria-label={title} className="lg:col-span-2">
            <h3 className="mb-4 text-base font-semibold">{title}</h3>
            <ul className="space-y-2.5">
              {links.map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground smooth-transition hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="space-y-4 lg:col-span-3">
          <h3 className="text-base font-semibold">Contacto</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{contactInfo.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                {contactInfo.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <a href={`mailto:${contactInfo.email}`} className="hover:text-primary">
                {contactInfo.email}
              </a>
            </li>
          </ul>
          <NewsletterForm variant="compact" />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-app flex flex-col items-center gap-3 py-5 text-center text-xs text-muted-foreground lg:flex-row lg:justify-between lg:text-left">
          <p>© {year} BeautyLux. Todos los derechos reservados.</p>

          <nav aria-label="Enlaces legales">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
              {legalLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="smooth-transition hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p>SENA · Ficha 3406204 · Trimestre 03 · Competencia React</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
