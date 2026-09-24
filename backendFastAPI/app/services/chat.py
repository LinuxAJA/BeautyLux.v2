"""Servicio del chatbot — quinto avance, etapa 12, requisitos 17-19.

Construye el system prompt con contexto real del negocio (consultado en
BD en cada mensaje: catálogo activo, horario, política de envío, cómo
radicar una PQR), llama a Gemini con el historial de la conversación y
persiste la respuesta. Si `AI_ENABLED=false` o la API falla,
`ai_client.generate_reply` devuelve `None` y aquí se usa un FAQ local por
palabras clave, para que el chat nunca se caiga en la sustentación.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import ai_client
from app.core.config import settings
from app.core.errors import NotFoundError
from app.models.business_hours import BusinessHours
from app.models.conversation import Conversation
from app.models.user import User
from app.repositories.chat import conversation_repository, message_repository
from app.repositories.product import product_repository
from app.repositories.service import service_repository

HISTORY_LIMIT = 20
CATALOG_LIMIT = 8

WEEKDAY_LABELS = {1: "lunes", 2: "martes", 3: "miércoles", 4: "jueves", 5: "viernes", 6: "sábado", 7: "domingo"}

_FAQ_RULES: list[tuple[tuple[str, ...], str]] = [
    (
        ("envio", "envío", "domicilio", "despacho"),
        "El envío es gratis en compras superiores a $150.000 y aplica solo a productos físicos "
        "(los servicios se agendan como cita, no se envían).",
    ),
    (
        ("horario", "hora", "abren", "abierto", "atencion", "atención"),
        "Puedes ver nuestro horario de atención más abajo, o agendar tu cita desde /servicios.",
    ),
    (
        ("queja", "reclamo", "pqr", "peticion peticion", "sugerencia", "problema"),
        "Para radicar una petición, queja, reclamo o sugerencia, usa el formulario de /pqr: "
        "recibirás un número de ticket para hacerle seguimiento.",
    ),
    (
        ("cita", "agendar", "reservar", "turno"),
        "Puedes agendar un servicio desde /servicios eligiendo el día y la hora disponibles.",
    ),
    (
        ("pedido", "compra", "orden", "factura"),
        "Puedes ver tus pedidos y descargar tus facturas desde tu panel, en 'Mis pedidos'.",
    ),
]

_FAQ_DEFAULT = (
    "Gracias por escribirnos. Ahora mismo no puedo darte una respuesta más específica, pero puedes "
    "explorar nuestro catálogo en /productos y /servicios, o radicar una PQR en /pqr si necesitas "
    "ayuda con un pedido o una queja."
)


def _money(value: Decimal | float) -> str:
    return f"$ {int(round(float(value))):,}".replace(",", ".")


class ChatService:
    def open_conversation(self, db: Session, *, actor: User | None) -> Conversation:
        session_token = str(uuid.uuid4())
        conversation = conversation_repository.create(
            db,
            {
                "user_id": actor.id if actor else None,
                "session_token": session_token,
                "status": "open",
            },
        )
        return conversation

    def list_messages(self, db: Session, conversation_id: int, *, actor: User | None, session_token: str | None):
        conversation = self._visible_or_404(db, conversation_id, actor=actor, session_token=session_token)
        return message_repository.find_by_conversation(db, conversation.id, limit=HISTORY_LIMIT)

    def send_message(
        self,
        db: Session,
        conversation_id: int,
        content: str,
        *,
        actor: User | None,
        session_token: str | None,
    ) -> dict:
        conversation = self._visible_or_404(db, conversation_id, actor=actor, session_token=session_token)

        user_message = message_repository.create(
            db, {"conversation_id": conversation.id, "role": "user", "content": content}
        )

        history = message_repository.find_by_conversation(db, conversation.id, limit=HISTORY_LIMIT)
        history_pairs = [(message.role, message.content) for message in history if message.role != "system"]

        system_prompt = self._build_system_prompt(db)
        result = ai_client.generate_reply(
            system_prompt=system_prompt, history=history_pairs[:-1], user_message=content
        )
        reply_text, tokens_used = result if result else (self._faq_reply(content), None)

        assistant_message = message_repository.create(
            db,
            {
                "conversation_id": conversation.id,
                "role": "assistant",
                "content": reply_text,
                "tokens_used": tokens_used,
            },
        )

        return {"userMessage": user_message, "assistantMessage": assistant_message}

    def _faq_reply(self, content: str) -> str:
        lowered = content.lower()
        for keywords, answer in _FAQ_RULES:
            if any(keyword in lowered for keyword in keywords):
                return answer
        return _FAQ_DEFAULT

    def _visible_or_404(
        self, db: Session, conversation_id: int, *, actor: User | None, session_token: str | None
    ) -> Conversation:
        conversation = conversation_repository.find_by_id(db, conversation_id)
        if conversation is None:
            raise NotFoundError("La conversación no existe.")

        if conversation.user_id is not None:
            if not actor or actor.id != conversation.user_id:
                raise NotFoundError("La conversación no existe.")
        elif not session_token or session_token != conversation.session_token:
            raise NotFoundError("La conversación no existe.")

        return conversation

    def _build_system_prompt(self, db: Session) -> str:
        products = product_repository.find_all_with_category(
            db, status="active", page=1, per_page=CATALOG_LIMIT, order_by="rating", order_dir="DESC"
        )[0]
        services = service_repository.find_all_with_category(
            db, status="active", page=1, per_page=CATALOG_LIMIT, order_by="created_at", order_dir="DESC"
        )[0]
        hours = list(
            db.execute(
                select(BusinessHours).where(BusinessHours.is_open.is_(True)).order_by(BusinessHours.weekday)
            ).scalars()
        )

        products_text = "\n".join(f"- {p.name}: {_money(p.price)}" for p in products) or "Sin datos disponibles."
        services_text = "\n".join(
            f"- {s.name}: {_money(s.price)} ({s.duration_minutes} min)" for s in services
        ) or "Sin datos disponibles."
        hours_text = "\n".join(
            f"- {WEEKDAY_LABELS[h.weekday].capitalize()}: {h.opens_at.strftime('%H:%M')} a {h.closes_at.strftime('%H:%M')}"
            for h in hours
        ) or "Consulta el horario en la página de contacto."

        return f"""Eres el asistente virtual de {settings.BUSINESS_NAME}, una tienda y salón de belleza en Colombia.
Responde siempre en español, de forma breve, cálida y profesional. No inventes productos, precios ni
políticas que no aparezcan en este contexto.

Algunos de nuestros productos destacados:
{products_text}

Algunos de nuestros servicios:
{services_text}

Horario de atención:
{hours_text}

Política de envío: gratis en compras superiores a $150.000, solo para productos físicos (los
servicios se agendan como cita, no se envían).

Si la persona tiene una queja, reclamo, petición o sugerencia, indícale que puede radicarla en la
página /pqr, donde recibirá un número de ticket para hacerle seguimiento sin necesidad de iniciar
sesión. Si pregunta por sus pedidos o facturas, dile que los encuentra en su panel de cliente.
Contacto directo: {settings.BUSINESS_PHONE} · {settings.BUSINESS_EMAIL}."""


chat_service = ChatService()
