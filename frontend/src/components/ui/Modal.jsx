import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { cn } from '../../utils/cn';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

/**
 * Ventana modal reutilizable.
 *
 * Se puede cerrar de tres formas, tal como exige el requerimiento:
 * con la tecla Escape, pulsando fuera del contenido o con el botón X.
 * Mientras está abierta bloquea el scroll de la página de fondo.
 */
function Modal({ isOpen, onClose, title, description, size = 'lg', children }) {
  const contentRef = useRef(null);

  // `onClose` casi siempre llega como una función nueva en cada render del
  // padre (p. ej. RegisterModal la define sin useCallback). Si el efecto de
  // abajo dependiera de `onClose`, se volvería a ejecutar en cada tecla que
  // el usuario escribe dentro del modal, y `contentRef.current?.focus()`
  // le robaría el foco al input justo después de escribir. Guardamos la
  // versión más reciente en una ref para no depender de su identidad.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Lleva el foco al contenido para que el lector de pantalla anuncie el diálogo.
    contentRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-elegant animate-scale-in sm:rounded-2xl',
          SIZE_CLASSES[size] ?? SIZE_CLASSES.lg,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div>
            {title && (
              <h2 id="modal-title" className="font-serif text-2xl font-semibold">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground smooth-transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
