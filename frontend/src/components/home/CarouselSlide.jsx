import { cn } from '../../utils/cn';

/**
 * Una diapositiva del carrusel: imagen de fondo con su título y descripción.
 * El texto se mantiene siempre visible sobre un degradado oscuro que
 * garantiza el contraste, sin importar la fotografía.
 */
function CarouselSlide({ slide, isActive, isFirst }) {
  const { image, alt, tag, title, description } = slide;

  return (
    <div className="relative h-full w-full shrink-0 grow-0 basis-full overflow-hidden">
      <img
        src={image}
        alt={alt}
        // La primera imagen se carga con prioridad: es la que ve el usuario al entrar.
        loading={isFirst ? 'eager' : 'lazy'}
        fetchPriority={isFirst ? 'high' : 'auto'}
        className="absolute inset-0 size-full object-cover"
      />

      <div
        className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/45 to-transparent"
        aria-hidden="true"
      />

      <div className="container-app relative flex h-full flex-col justify-end pb-14 sm:pb-16 lg:pb-20">
        <div className={cn('max-w-2xl', isActive && 'animate-fade-up')}>
          <span className="mb-3 inline-flex items-center rounded-full bg-background/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-background backdrop-blur-sm">
            {tag}
          </span>

          <h3 className="font-serif text-3xl font-semibold text-background sm:text-4xl lg:text-5xl">
            {title}
          </h3>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-background/85 sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CarouselSlide;
