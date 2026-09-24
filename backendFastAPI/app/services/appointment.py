"""Servicio de agenda — quinto avance, etapa 5.

Cómo se decide si una franja está libre:

El horario del día (`business_hours`) da la hora de apertura, la de cierre, el
paso entre franjas y la **capacidad**, que son los puestos de trabajo que
atienden a la vez. Una franja cabe si, durante todo el rato que dura el
servicio, el número de citas simultáneas no llega a la capacidad. Eso se mide
con un barrido de eventos sobre las citas activas del día, no contando citas
que empiecen a la misma hora: un servicio de 150 minutos pisa varias franjas y
hay que verlo entero.

Contra dos reservas a la vez por el mismo cupo, la comprobación y la inserción
ocurren dentro de la misma transacción con las citas del día bloqueadas
(`SELECT … FOR UPDATE`), así la segunda espera y vuelve a contar ya con la
primera puesta.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta

from sqlalchemy.exc import IntegrityError

from app.core.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.core.pagination import build_meta
from app.models.appointment import Appointment
from app.repositories.appointment import appointment_repository
from app.repositories.service import service_repository
from app.repositories.user import user_repository
from app.schemas.appointment import AppointmentOut, AvailabilityOut
from app.services.audit import audit_service

STAFF_ROLES = ("admin", "employee")

# Lo que dura una reserva temporal mientras la clienta termina el checkout.
HOLD_MINUTES = 10

# Hasta cuándo se puede agendar. Evita que alguien reserve para dentro de años
# y llene la agenda de huecos imposibles de gestionar.
MAX_DAYS_AHEAD = 90


def _as_time(value: str | time) -> time:
    if isinstance(value, time):
        return value
    hour, minute = (int(part) for part in value.split(":")[:2])
    return time(hour, minute)


def _add_minutes(day: date, moment: time, minutes: int) -> datetime:
    return datetime.combine(day, moment) + timedelta(minutes=minutes)


def _max_overlap(intervals: list[tuple[datetime, datetime]], start: datetime, end: datetime) -> int:
    """Mayor número de citas simultáneas dentro de [start, end).

    Barrido de eventos: +1 al empezar una cita, -1 al terminar. El máximo que
    alcanza el contador dentro del intervalo pedido es la ocupación que hay que
    comparar con la capacidad.
    """
    events: list[tuple[datetime, int]] = []
    for busy_start, busy_end in intervals:
        # Solo interesan las citas que pisan el intervalo consultado.
        if busy_start < end and busy_end > start:
            events.append((max(busy_start, start), 1))
            events.append((min(busy_end, end), -1))

    if not events:
        return 0

    # A igual instante, primero las salidas: una cita que termina a las 10:00
    # no estorba a otra que empieza a las 10:00.
    events.sort(key=lambda event: (event[0], event[1]))

    current = peak = 0
    for _, delta in events:
        current += delta
        peak = max(peak, current)
    return peak


class AppointmentService:
    # -----------------------------------------------------------------
    # Disponibilidad
    # -----------------------------------------------------------------
    def availability(self, db, *, day: date, service_id: int) -> AvailabilityOut:
        service = service_repository.find_by_id(db, service_id)
        if not service or service.status != "active":
            raise NotFoundError("El servicio no existe o no está disponible.")

        self._ensure_bookable_date(day)

        weekday = day.isoweekday()
        hours = appointment_repository.business_hours_for(db, weekday)

        if not hours or not hours.is_open:
            return AvailabilityOut.model_validate(
                {
                    "date": day,
                    "weekday": weekday,
                    "isOpen": False,
                    "serviceId": service.id,
                    "serviceName": service.name,
                    "durationMinutes": service.duration_minutes,
                    "slots": [],
                    "message": "El salón no atiende este día.",
                }
            )

        now = datetime.now()
        busy = [
            (
                datetime.combine(appointment.scheduled_date, appointment.start_time),
                datetime.combine(appointment.scheduled_date, appointment.end_time),
            )
            for appointment in appointment_repository.find_active_of_day(db, day, now=now)
        ]

        slots = []
        cursor = datetime.combine(day, hours.opens_at)
        closing = datetime.combine(day, hours.closes_at)
        step = timedelta(minutes=hours.slot_minutes)
        duration = timedelta(minutes=service.duration_minutes)

        while cursor + duration <= closing:
            slot_end = cursor + duration
            # Una franja que ya pasó no se ofrece, aunque el salón siga abierto.
            in_the_past = cursor <= now
            remaining = hours.capacity - _max_overlap(busy, cursor, slot_end)

            slots.append(
                {
                    "startTime": cursor.strftime("%H:%M"),
                    "endTime": slot_end.strftime("%H:%M"),
                    "available": remaining > 0 and not in_the_past,
                    "remaining": max(remaining, 0) if not in_the_past else 0,
                }
            )
            cursor += step

        libres = sum(1 for slot in slots if slot["available"])
        return AvailabilityOut.model_validate(
            {
                "date": day,
                "weekday": weekday,
                "isOpen": True,
                "serviceId": service.id,
                "serviceName": service.name,
                "durationMinutes": service.duration_minutes,
                "opensAt": hours.opens_at.strftime("%H:%M"),
                "closesAt": hours.closes_at.strftime("%H:%M"),
                "capacity": hours.capacity,
                "slots": slots,
                "message": None if libres else "No quedan horarios libres para este día.",
            }
        )

    def _ensure_bookable_date(self, day: date) -> None:
        today = date.today()
        if day < today:
            raise BadRequestError("No se puede agendar una cita en una fecha pasada.")
        if day > today + timedelta(days=MAX_DAYS_AHEAD):
            raise BadRequestError(
                f"Solo se puede agendar con hasta {MAX_DAYS_AHEAD} días de anticipación."
            )

    # -----------------------------------------------------------------
    # Reserva y confirmación
    # -----------------------------------------------------------------
    def hold(self, db, dto, *, actor, ip_address: str | None) -> AppointmentOut:
        appointment = self._book(
            db,
            service_id=dto.service_id,
            day=dto.scheduled_date,
            start=_as_time(dto.start_time),
            location=dto.location,
            notes=dto.notes,
            customer=self._customer_from(actor),
            user_id=actor.id,
            status="hold",
        )

        audit_service.record(
            db,
            user_id=actor.id,
            action="appointment_held",
            entity="appointments",
            entity_id=appointment.id,
            changes={
                "after": {
                    "appointmentNumber": appointment.appointment_number,
                    "scheduledDate": str(appointment.scheduled_date),
                    "startTime": appointment.start_time.strftime("%H:%M"),
                }
            },
            ip_address=ip_address,
        )
        return AppointmentOut.from_model(appointment)

    def create(self, db, dto, *, actor, ip_address: str | None) -> AppointmentOut:
        is_staff = actor.role.name in STAFF_ROLES

        if not is_staff and dto.client_id:
            raise ForbiddenError("No puedes agendar citas a nombre de otra persona.")

        # Confirmar una reserva ya hecha: la franja es suya, no hay que
        # volver a disputarla.
        if dto.hold_id:
            return self._confirm_hold(db, dto, actor=actor, ip_address=ip_address)

        target = actor
        if is_staff and dto.client_id:
            target = user_repository.find_by_id(db, dto.client_id)
            if not target:
                raise BadRequestError("El cliente seleccionado no existe.")

        customer = self._customer_from(target)
        # El personal puede agendar a alguien sin cuenta escribiendo sus datos.
        if is_staff and not dto.client_id and dto.customer_first_name:
            if not dto.customer_last_name:
                raise BadRequestError("Indica el nombre y el apellido de quien asiste.")
            customer = {
                "first_name": dto.customer_first_name,
                "last_name": dto.customer_last_name,
                "email": dto.customer_email,
                "phone": dto.customer_phone,
            }
            target = None

        appointment = self._book(
            db,
            service_id=dto.service_id,
            day=dto.scheduled_date,
            start=_as_time(dto.start_time),
            location=dto.location,
            notes=dto.notes,
            customer=customer,
            user_id=target.id if target else None,
            status="confirmed",
            sale_id=dto.sale_id,
            sale_detail_id=dto.sale_detail_id,
        )

        audit_service.record(
            db,
            user_id=actor.id,
            action="appointment_created",
            entity="appointments",
            entity_id=appointment.id,
            changes={
                "after": {
                    "appointmentNumber": appointment.appointment_number,
                    "scheduledDate": str(appointment.scheduled_date),
                    "startTime": appointment.start_time.strftime("%H:%M"),
                    "serviceName": appointment.service_name,
                }
            },
            ip_address=ip_address,
        )
        return AppointmentOut.from_model(appointment)

    def _confirm_hold(self, db, dto, *, actor, ip_address: str | None) -> AppointmentOut:
        appointment = appointment_repository.find_by_id(db, dto.hold_id)
        if not appointment or appointment.status != "hold":
            raise NotFoundError("La reserva no existe o ya no está vigente.")
        if actor.role.name not in STAFF_ROLES and appointment.user_id != actor.id:
            raise NotFoundError("La reserva no existe o ya no está vigente.")
        if appointment.hold_expires_at and appointment.hold_expires_at <= datetime.now():
            raise ConflictError("La reserva expiró. Vuelve a elegir un horario.")

        appointment.status = "confirmed"
        appointment.hold_expires_at = None
        appointment.sale_id = dto.sale_id or appointment.sale_id
        appointment.sale_detail_id = dto.sale_detail_id or appointment.sale_detail_id
        if dto.notes:
            appointment.notes = dto.notes
        db.flush()

        audit_service.record(
            db,
            user_id=actor.id,
            action="appointment_created",
            entity="appointments",
            entity_id=appointment.id,
            changes={"before": {"status": "hold"}, "after": {"status": "confirmed"}},
            ip_address=ip_address,
        )
        return AppointmentOut.from_model(appointment)

    def _customer_from(self, user) -> dict:
        return {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
        }

    def _validate_slot(
        self, db, *, duration_minutes: int, day: date, start: time, exclude_id: int | None = None
    ) -> datetime:
        """Comprueba que la franja pedida existe, está dentro del horario y
        tiene cupo. Devuelve el instante en que terminaría la cita.

        `exclude_id` deja fuera del recuento a una cita concreta: al
        reprogramar, la propia cita no debe estorbarse a sí misma.
        """
        self._ensure_bookable_date(day)

        weekday = day.isoweekday()
        hours = appointment_repository.business_hours_for(db, weekday)
        if not hours or not hours.is_open:
            raise BadRequestError("El salón no atiende ese día.")

        start_at = datetime.combine(day, start)
        end_at = start_at + timedelta(minutes=duration_minutes)

        if start_at <= datetime.now():
            raise BadRequestError("Elige un horario que aún no haya pasado.")
        if start < hours.opens_at or end_at > datetime.combine(day, hours.closes_at):
            raise BadRequestError(
                f"Ese horario queda fuera de la atención del día "
                f"({hours.opens_at.strftime('%H:%M')} a {hours.closes_at.strftime('%H:%M')})."
            )
        # La hora debe caer en una franja del horario, no a mitad de camino.
        minutes_from_open = int(
            (start_at - datetime.combine(day, hours.opens_at)).total_seconds() // 60
        )
        if minutes_from_open % hours.slot_minutes != 0:
            raise BadRequestError(
                f"Las citas empiezan cada {hours.slot_minutes} minutos desde las "
                f"{hours.opens_at.strftime('%H:%M')}."
            )

        # Bloquea las citas del día: desde aquí hasta el commit, ninguna otra
        # petición puede colarse en el mismo cupo.
        busy = [
            (
                datetime.combine(appointment.scheduled_date, appointment.start_time),
                datetime.combine(appointment.scheduled_date, appointment.end_time),
            )
            for appointment in appointment_repository.find_active_of_day(
                db, day, now=datetime.now(), for_update=True
            )
            if appointment.id != exclude_id
        ]

        if _max_overlap(busy, start_at, end_at) >= hours.capacity:
            raise ConflictError("Ese horario ya está ocupado. Elige otro, por favor.")

        return end_at

    def _book(
        self,
        db,
        *,
        service_id: int,
        day: date,
        start: time,
        location: str,
        notes: str | None,
        customer: dict,
        user_id: int | None,
        status: str,
        sale_id: int | None = None,
        sale_detail_id: int | None = None,
    ) -> Appointment:
        service = service_repository.find_by_id(db, service_id)
        if not service or service.status != "active":
            raise NotFoundError("El servicio no existe o no está disponible.")

        end_at = self._validate_slot(
            db, duration_minutes=service.duration_minutes, day=day, start=start
        )

        return self._insert_with_number(
            db,
            {
                "sale_id": sale_id,
                "sale_detail_id": sale_detail_id,
                "user_id": user_id,
                "service_id": service.id,
                "customer_first_name": customer["first_name"],
                "customer_last_name": customer["last_name"],
                "customer_email": customer.get("email"),
                "customer_phone": customer.get("phone"),
                "service_name": service.name,
                "duration_minutes": service.duration_minutes,
                "scheduled_date": day,
                "start_time": start,
                "end_time": end_at.time(),
                "location": location,
                "status": status,
                "hold_expires_at": (
                    datetime.now() + timedelta(minutes=HOLD_MINUTES) if status == "hold" else None
                ),
                "notes": notes,
            },
        )

    def _insert_with_number(self, db, data: dict, *, attempts: int = 3) -> Appointment:
        """Igual que en ventas: el consecutivo se calcula y el índice único
        arbitra; si dos citas coinciden, se reintenta con el siguiente."""
        year = datetime.now().year

        for attempt in range(attempts):
            last = appointment_repository.last_number_of_year(db, year)
            sequence = int(last.rsplit("-", 1)[1]) + 1 if last else 1
            appointment = Appointment(appointment_number=f"CIT-{year}-{sequence:05d}", **data)

            try:
                with db.begin_nested():
                    db.add(appointment)
                    db.flush()
                return appointment
            except IntegrityError:
                if attempt == attempts - 1:
                    raise ConflictError(
                        "No se pudo asignar el número de la cita. Inténtalo de nuevo."
                    ) from None

        raise ConflictError("No se pudo asignar el número de la cita. Inténtalo de nuevo.")

    # -----------------------------------------------------------------
    # Lectura y gestión
    # -----------------------------------------------------------------
    def list(
        self,
        db,
        *,
        actor,
        search: str | None = None,
        client_id: int | None = None,
        service_id: int | None = None,
        sale_id: int | None = None,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = None,
        order_dir: str | None = None,
    ) -> dict:
        is_staff = actor.role.name in STAFF_ROLES
        visible_user_id = client_id if is_staff else actor.id

        rows, total = appointment_repository.find_all_with_filters(
            db,
            search=search,
            user_id=visible_user_id,
            service_id=service_id,
            sale_id=sale_id,
            status=status,
            date_from=date_from,
            date_to=date_to,
            # Las reservas temporales solo las ve quien las hizo.
            include_holds=not is_staff,
            page=page,
            per_page=per_page,
            order_by=order_by,
            order_dir=order_dir or "DESC",
        )
        return {
            "data": [AppointmentOut.from_model(row) for row in rows],
            "meta": build_meta(page, per_page, total),
        }

    def get_by_id(self, db, appointment_id: int, *, actor) -> AppointmentOut:
        appointment = self._visible_or_404(db, appointment_id, actor)
        return AppointmentOut.from_model(appointment)

    def _visible_or_404(self, db, appointment_id: int, actor) -> Appointment:
        appointment = appointment_repository.find_by_id(db, appointment_id)
        if not appointment:
            raise NotFoundError("La cita no existe.")
        if actor.role.name not in STAFF_ROLES and appointment.user_id != actor.id:
            raise NotFoundError("La cita no existe.")
        return appointment

    def reschedule(self, db, appointment_id: int, dto, *, actor, ip_address: str | None) -> AppointmentOut:
        """Mueve la cita a otra fecha y hora conservando su número.

        Es la misma cita, así que el comprobante que tiene la clienta —y el
        `sale_detail` del que cuelga— siguen siendo válidos. La franja nueva se
        valida dejando fuera esta cita, para que no se estorbe a sí misma al
        moverse a un horario que se solapa con el que ya ocupaba.
        """
        appointment = self._visible_or_404(db, appointment_id, actor)

        if appointment.status in ("cancelled", "completed", "no_show"):
            raise BadRequestError("Esta cita ya está cerrada y no puede reprogramarse.")

        start = _as_time(dto.start_time)
        previous = {
            "scheduledDate": str(appointment.scheduled_date),
            "startTime": appointment.start_time.strftime("%H:%M"),
        }

        end_at = self._validate_slot(
            db,
            duration_minutes=appointment.duration_minutes,
            day=dto.scheduled_date,
            start=start,
            exclude_id=appointment.id,
        )

        appointment.scheduled_date = dto.scheduled_date
        appointment.start_time = start
        appointment.end_time = end_at.time()
        # Reprogramar una reserva temporal la deja confirmada: quien mueve una
        # cita ya decidió tomarla.
        if appointment.status == "hold":
            appointment.status = "confirmed"
            appointment.hold_expires_at = None
        db.flush()

        audit_service.record(
            db,
            user_id=actor.id,
            action="appointment_rescheduled",
            entity="appointments",
            entity_id=appointment.id,
            changes={
                "before": previous,
                "after": {
                    "scheduledDate": str(appointment.scheduled_date),
                    "startTime": appointment.start_time.strftime("%H:%M"),
                },
            },
            ip_address=ip_address,
        )
        return AppointmentOut.from_model(appointment)

    def cancel(self, db, appointment_id: int, *, actor, ip_address: str | None) -> AppointmentOut:
        appointment = self._visible_or_404(db, appointment_id, actor)

        if appointment.status == "cancelled":
            raise BadRequestError("La cita ya estaba cancelada.")
        if appointment.status in ("completed", "no_show"):
            raise BadRequestError("Una cita ya cerrada no puede cancelarse.")

        appointment.status = "cancelled"
        appointment.cancelled_at = datetime.now()
        appointment.hold_expires_at = None
        db.flush()

        audit_service.record(
            db,
            user_id=actor.id,
            action="appointment_cancelled",
            entity="appointments",
            entity_id=appointment.id,
            changes={"after": {"status": "cancelled"}},
            ip_address=ip_address,
        )
        return AppointmentOut.from_model(appointment)

    def update_status(
        self, db, appointment_id: int, status: str, *, actor, ip_address: str | None
    ) -> AppointmentOut:
        appointment = appointment_repository.find_by_id(db, appointment_id)
        if not appointment:
            raise NotFoundError("La cita no existe.")
        if appointment.status == status:
            raise BadRequestError("La cita ya está en ese estado.")

        previous = appointment.status
        appointment.status = status
        if status == "cancelled":
            appointment.cancelled_at = datetime.now()
        if status != "hold":
            appointment.hold_expires_at = None
        db.flush()

        audit_service.record(
            db,
            user_id=actor.id,
            action="appointment_status_changed",
            entity="appointments",
            entity_id=appointment.id,
            changes={"before": {"status": previous}, "after": {"status": status}},
            ip_address=ip_address,
        )
        return AppointmentOut.from_model(appointment)


appointment_service = AppointmentService()
