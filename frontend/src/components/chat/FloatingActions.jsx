import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

import ChatWidget from './ChatWidget';
import WhatsAppButton from '../common/WhatsAppButton';

/**
 * Torre vertical de acciones flotantes: el FAB del chat arriba, el de
 * WhatsApp abajo. Reemplaza los 3 montajes sueltos de `WhatsAppButton`
 * (`MainLayout`, `DashboardLayout`, `Auth`).
 *
 * Al abrir el chat, la torre entera se oculta — nada de dejar WhatsApp
 * flotando junto al panel, donde se vería roto y el usuario podría
 * pulsarlo por accidente mientras escribe.
 */
function FloatingActions() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (isChatOpen) {
    return <ChatWidget onClose={() => setIsChatOpen(false)} />;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        aria-label="Abrir el chat de BeautyLux"
        className="flex size-14 items-center justify-center rounded-full primary-gradient text-primary-foreground shadow-elegant smooth-transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageCircle className="size-7" aria-hidden="true" />
      </button>

      <WhatsAppButton />
    </div>
  );
}

export default FloatingActions;
