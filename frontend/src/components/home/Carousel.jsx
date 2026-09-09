import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import CarouselSlide from './CarouselSlide';
import useCarousel from '../../hooks/useCarousel';
import { cn } from '../../utils/cn';

/** Distancia mínima, en píxeles, para que un deslizamiento cuente como swipe. */
const SWIPE_THRESHOLD = 50;

/**
 * Carrusel reutilizable de imágenes con título y descripción.
 *
 * @param {Array}   slides    Diapositivas a mostrar.
 * @param {number}  interval  Milisegundos entre diapositivas.
 * @param {boolean} autoPlay  Activa el avance automático.
 */
function Carousel({ slides, interval = 5000, autoPlay = true }) {
  const total = slides.length;
  const { current, goTo, next, prev, pause, resume } = useCarousel(total, { autoPlay, interval });
  const containerRef = useRef(null);
  const touchStartX = useRef(null);

  // Navegación con las flechas del teclado cuando el carrusel tiene el foco.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
      }
    };

    node.addEventListener('keydown', handleKeyDown);
    return () => node.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0].clientX;
    pause();
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;

    const distance = touchStartX.current - event.changedTouches[0].clientX;
    if (Math.abs(distance) > SWIPE_THRESHOLD) {
      if (distance > 0) next();
      else prev();
    }

    touchStartX.current = null;
    resume();
  };

  if (total === 0) return null;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Productos destacados de BeautyLux"
      tabIndex={0}
      className="group relative overflow-hidden rounded-2xl shadow-elegant focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pista: todas las diapositivas en fila, desplazada según el índice actual. */}
      <div
        className="flex h-[380px] transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] sm:h-[480px] lg:h-[600px]"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <CarouselSlide
            key={slide.id}
            slide={slide}
            isActive={index === current}
            isFirst={index === 0}
          />
        ))}
      </div>

      {/* Anuncia el cambio de diapositiva a los lectores de pantalla. */}
      <p aria-live="polite" className="sr-only">
        Diapositiva {current + 1} de {total}: {slides[current].title}
      </p>

      <button
        type="button"
        onClick={prev}
        aria-label="Diapositiva anterior"
        className="absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/25 text-background backdrop-blur-md smooth-transition hover:bg-background/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background sm:flex"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="Diapositiva siguiente"
        className="absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/25 text-background backdrop-blur-md smooth-transition hover:bg-background/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background sm:flex"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>

      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4">
        <ul className="flex items-center gap-2">
          {slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ir a la diapositiva ${index + 1}: ${slide.title}`}
                aria-current={index === current}
                className={cn(
                  'h-1.5 rounded-full smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background',
                  index === current
                    ? 'w-8 bg-background'
                    : 'w-1.5 bg-background/50 hover:bg-background/80',
                )}
              />
            </li>
          ))}
        </ul>

        <span className="hidden text-xs font-medium tabular-nums text-background/80 sm:block">
          {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

export default Carousel;
