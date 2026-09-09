import { cn } from '../../utils/cn';

/**
 * Encabezado estándar de sección: etiqueta superior, título y subtítulo.
 * Unifica el ritmo tipográfico de todas las secciones de la aplicación.
 */
function SectionHeading({ eyebrow, title, highlight, subtitle, align = 'center', className }) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </span>
      )}

      <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
        {title} {highlight && <span className="text-gradient">{highlight}</span>}
      </h2>

      {subtitle && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;
