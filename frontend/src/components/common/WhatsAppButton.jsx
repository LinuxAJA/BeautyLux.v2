import { MessageCircle } from 'lucide-react';

const DEFAULT_MESSAGE = 'Hola BeautyLux, quisiera más información sobre sus productos.';

/**
 * Botón flotante de WhatsApp. Fijo en la esquina inferior derecha,
 * visible en toda la aplicación (se monta una sola vez por layout).
 */
function WhatsAppButton() {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER;
  if (!number) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant smooth-transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-pulse"
    >
      <MessageCircle className="size-7" aria-hidden="true" />
    </a>
  );
}

export default WhatsAppButton;
