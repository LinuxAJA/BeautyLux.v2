import { useCallback, useEffect, useState } from 'react';

/** Detecta si el usuario pidió reducir las animaciones del sistema. */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Lógica de un carrusel cíclico con reproducción automática.
 *
 * @param {number} total      Cantidad de diapositivas.
 * @param {Object} options
 * @param {boolean} options.autoPlay  Avance automático (por defecto true).
 * @param {number}  options.interval  Milisegundos entre diapositivas.
 *
 * El avance automático se detiene cuando el usuario pasa el ratón por encima,
 * enfoca un control con el teclado o pide reducir el movimiento.
 */
export function useCarousel(total, { autoPlay = true, interval = 5000 } = {}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback(
    (index) => {
      if (total === 0) return;
      // El módulo con `+ total` mantiene el índice positivo al retroceder desde 0.
      setCurrent(((index % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  // Avance automático: el temporizador se reinicia en cada cambio de diapositiva,
  // así el usuario siempre dispone del intervalo completo tras navegar a mano.
  useEffect(() => {
    if (!autoPlay || isPaused || total <= 1 || prefersReducedMotion()) return undefined;

    const timer = setInterval(() => {
      setCurrent((index) => (index + 1) % total);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, total, current]);

  return { current, goTo, next, prev, isPaused, pause, resume };
}

export default useCarousel;
