import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { FileWarning, Send, X } from 'lucide-react';

import BrandLogo from '../ui/BrandLogo';
import Button from '../ui/Button';
import * as chatService from '../../services/chat.service';
import { cn } from '../../utils/cn';

const STORAGE_KEY = 'beautylux-chat-session';

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage puede fallar en modo privado; el chat sigue funcionando
    // en memoria durante esta visita, solo no persiste entre recargas.
  }
}

/**
 * Panel del chatbot. Guarda `{conversationId, sessionToken}` en
 * `localStorage` para retomar la misma conversación entre recargas, tanto
 * con sesión de cuenta como sin ella: la propiedad de una conversación
 * anónima la prueba el `sessionToken`, no el estado de autenticación.
 *
 * En escritorio es una ventana anclada abajo a la derecha, al mismo origen
 * que la torre de `FloatingActions`; en móvil ocupa la pantalla completa.
 */
function ChatWidget({ onClose }) {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const dialogRef = useRef(null);

  // Al abrir, el foco entra al panel; Escape lo cierra igual que la X.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      setError(null);
      try {
        const stored = readStoredSession();
        if (stored) {
          const response = await chatService.listMessages(stored.conversationId, stored.sessionToken);
          if (cancelled) return;
          setSession(stored);
          setMessages(response.data);
          return;
        }

        const response = await chatService.openConversation();
        if (cancelled) return;
        const next = { conversationId: response.data.id, sessionToken: response.data.sessionToken };
        storeSession(next);
        setSession(next);
        setMessages([]);
      } catch {
        // Una conversación guardada que ya no existe (o de otra cuenta) empieza una nueva.
        try {
          const response = await chatService.openConversation();
          if (cancelled) return;
          const next = { conversationId: response.data.id, sessionToken: response.data.sessionToken };
          storeSession(next);
          setSession(next);
          setMessages([]);
        } catch (openError) {
          if (!cancelled) setError(openError.message ?? 'No se pudo abrir el chat.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !session || isSending) return;

    setInput('');
    setError(null);
    setMessages((current) => [
      ...current,
      { id: `optimistic-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString() },
    ]);
    setIsSending(true);

    try {
      const response = await chatService.sendMessage(session.conversationId, content, session.sessionToken);
      setMessages((current) => [
        ...current.filter((message) => !String(message.id).startsWith('optimistic-')),
        response.data.userMessage,
        response.data.assistantMessage,
      ]);
    } catch (sendError) {
      setError(sendError.message ?? 'No se pudo enviar el mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Chat de BeautyLux"
      className="fixed inset-0 z-50 flex flex-col bg-background shadow-elegant focus:outline-none sm:inset-auto sm:bottom-5 sm:right-5 sm:h-125 sm:w-96 sm:rounded-2xl sm:border sm:border-border"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <BrandLogo variant="mark" size="sm" />
          <div>
            <h2 className="font-serif text-base font-semibold leading-tight">Asistente BeautyLux</h2>
            <p className="text-xs text-muted-foreground">Respuestas al instante</p>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar el chat">
          <X />
        </Button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {isLoading && <p className="text-center text-sm text-muted-foreground">Abriendo el chat…</p>}

        {!isLoading &&
          messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <p
                className={cn(
                  'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'primary-gradient text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                {message.content}
              </p>
            </div>
          ))}

        {isSending && (
          <div className="flex justify-start">
            <p className="max-w-[80%] rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
              Escribiendo…
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <Link
          to="/pqr"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <FileWarning className="size-3.5" aria-hidden="true" />
          ¿Tienes una queja o reclamo? Radica una PQR
        </Link>

        {error && (
          <p role="alert" className="mb-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Escribe tu mensaje
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe tu mensaje..."
            maxLength={1000}
            disabled={isLoading || !session}
            className="h-10 w-full rounded-lg border border-border bg-input/60 px-3 text-sm smooth-transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <Button
            type="submit"
            variant="gradient"
            size="icon"
            aria-label="Enviar mensaje"
            disabled={isLoading || !session || !input.trim()}
            isLoading={isSending}
          >
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ChatWidget;
