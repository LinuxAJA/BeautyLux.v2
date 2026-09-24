"""Repositorio de citas — quinto avance, etapa 5."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.orm import Session

from app.models.appointment import ACTIVE_STATUSES, Appointment
from app.models.business_hours import BusinessHours
from app.repositories.base import BaseRepository

SORTABLE = {
    "id": Appointment.id,
    "appointmentNumber": Appointment.appointment_number,
    "appointment_number": Appointment.appointment_number,
    "scheduledDate": Appointment.scheduled_date,
    "scheduled_date": Appointment.scheduled_date,
    "startTime": Appointment.start_time,
    "start_time": Appointment.start_time,
    "status": Appointment.status,
    "createdAt": Appointment.created_at,
    "created_at": Appointment.created_at,
}


def active_clause(now: datetime):
    """Citas que ocupan sitio en la agenda.

    Una reserva temporal solo cuenta mientras no haya vencido: pasado
    `hold_expires_at` la franja vuelve a estar libre aunque la fila siga ahí,
    porque la limpieza periódica puede tardar en pasar.
    """
    return and_(
        Appointment.status.in_(ACTIVE_STATUSES),
        or_(
            Appointment.status != "hold",
            Appointment.hold_expires_at.is_(None),
            Appointment.hold_expires_at > now,
        ),
    )


class AppointmentRepository(BaseRepository[Appointment]):
    def __init__(self) -> None:
        super().__init__(Appointment, soft_delete=False, sortable_columns=SORTABLE)

    def find_by_number(self, db: Session, number: str) -> Appointment | None:
        return self.find_one_by(db, Appointment.appointment_number, number)

    def last_number_of_year(self, db: Session, year: int) -> str | None:
        stmt = select(func.max(Appointment.appointment_number)).where(
            Appointment.appointment_number.like(f"CIT-{year}-%")
        )
        return db.execute(stmt).scalar_one_or_none()

    def business_hours_for(self, db: Session, weekday: int) -> BusinessHours | None:
        stmt = select(BusinessHours).where(BusinessHours.weekday == weekday)
        return db.execute(stmt).scalars().first()

    def find_active_of_day(
        self, db: Session, day: date, *, now: datetime, for_update: bool = False
    ) -> list[Appointment]:
        """Citas que ocupan agenda ese día.

        Con `for_update=True` bloquea esas filas hasta el final de la
        transacción: es lo que impide que dos checkouts simultáneos se lleven
        el último cupo de la misma franja.
        """
        stmt = (
            select(Appointment)
            .where(Appointment.scheduled_date == day, active_clause(now))
            .order_by(Appointment.start_time)
        )
        if for_update:
            stmt = stmt.with_for_update()
        return list(db.execute(stmt).scalars().all())

    def purge_expired_holds(self, db: Session, *, now: datetime) -> int:
        """Borra las reservas temporales vencidas. Devuelve cuántas quitó."""
        result = db.execute(
            delete(Appointment).where(
                Appointment.status == "hold",
                Appointment.hold_expires_at.is_not(None),
                Appointment.hold_expires_at <= now,
            )
        )
        return result.rowcount or 0

    def find_all_with_filters(
        self,
        db: Session,
        *,
        search: str | None = None,
        user_id: int | None = None,
        service_id: int | None = None,
        sale_id: int | None = None,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        include_holds: bool = True,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = "scheduled_date",
        order_dir: str = "DESC",
    ) -> tuple[list[Appointment], int]:
        clauses = []

        if search:
            like = f"%{search}%"
            clauses.append(
                or_(
                    Appointment.appointment_number.like(like),
                    Appointment.customer_first_name.like(like),
                    Appointment.customer_last_name.like(like),
                    Appointment.customer_email.like(like),
                    Appointment.service_name.like(like),
                )
            )
        if user_id is not None:
            clauses.append(Appointment.user_id == user_id)
        if service_id is not None:
            clauses.append(Appointment.service_id == service_id)
        if sale_id is not None:
            clauses.append(Appointment.sale_id == sale_id)
        if status:
            clauses.append(Appointment.status == status)
        elif not include_holds:
            # Las reservas temporales son ruido en la agenda del panel: no son
            # citas todavía.
            clauses.append(Appointment.status != "hold")
        if date_from is not None:
            clauses.append(Appointment.scheduled_date >= date_from)
        if date_to is not None:
            clauses.append(Appointment.scheduled_date <= date_to)

        base_stmt = select(Appointment)
        count_stmt = select(func.count()).select_from(Appointment)
        for clause in clauses:
            base_stmt = base_stmt.where(clause)
            count_stmt = count_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        order_column = SORTABLE.get(order_by or "", Appointment.scheduled_date)
        safe_dir = "ASC" if (order_dir or "").upper() == "ASC" else "DESC"
        base_stmt = base_stmt.order_by(
            order_column.asc() if safe_dir == "ASC" else order_column.desc(),
            Appointment.start_time.asc(),
        )

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).scalars().all())
        return rows, total


appointment_repository = AppointmentRepository()
