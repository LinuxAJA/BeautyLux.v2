"""Repositorio de usuarios — equivalente de backend/src/repositories/usuario.repository.js."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.role import Role
from app.models.user import User
from app.repositories.base import BaseRepository

SORTABLE = {
    "id": User.id,
    "firstName": User.first_name,
    "lastName": User.last_name,
    "email": User.email,
    "status": User.status,
    "createdAt": User.created_at,
    "first_name": User.first_name,
    "last_name": User.last_name,
    "created_at": User.created_at,
}


class UserRepository(BaseRepository[User]):
    def __init__(self) -> None:
        super().__init__(User, soft_delete=True, sortable_columns=SORTABLE)

    def find_by_id_with_role(self, db: Session, user_id: int) -> User | None:
        stmt = (
            select(User)
            .options(joinedload(User.role))
            .where(User.id == user_id, User.deleted_at.is_(None))
        )
        return db.execute(stmt).scalars().first()

    def find_by_email_with_password(self, db: Session, email: str) -> User | None:
        """Único punto que trae `password_hash`: exclusivo para el login."""
        stmt = (
            select(User)
            .options(joinedload(User.role))
            .where(User.email == email, User.deleted_at.is_(None))
        )
        return db.execute(stmt).scalars().first()

    def find_all_with_role(
        self,
        db: Session,
        *,
        search: str | None = None,
        role_name: str | None = None,
        status: str | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = "created_at",
        order_dir: str = "DESC",
    ) -> tuple[list[User], int]:
        clauses = [User.deleted_at.is_(None)]
        if search:
            like = f"%{search}%"
            clauses.append(
                or_(
                    User.first_name.like(like),
                    User.last_name.like(like),
                    User.email.like(like),
                    User.document_number.like(like),
                )
            )
        if status:
            clauses.append(User.status == status)

        base_stmt = select(User).options(joinedload(User.role)).join(Role, User.role_id == Role.id)
        count_stmt = select(func.count()).select_from(User).join(Role, User.role_id == Role.id)
        if role_name:
            clauses.append(Role.name == role_name)

        for clause in clauses:
            base_stmt = base_stmt.where(clause)
            count_stmt = count_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        order_column = SORTABLE.get(order_by or "", User.created_at)
        safe_dir = "ASC" if (order_dir or "").upper() == "ASC" else "DESC"
        base_stmt = base_stmt.order_by(order_column.asc() if safe_dir == "ASC" else order_column.desc())

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).scalars().unique().all())
        return rows, total

    def email_exists(self, db: Session, email: str, *, exclude_id: int | None = None) -> bool:
        return self.exists_by(db, User.email, email, exclude_id=exclude_id)

    def document_exists(
        self, db: Session, document_type: str, document_number: str, *, exclude_id: int | None = None
    ) -> bool:
        stmt = select(User.id).where(
            User.document_type_code == document_type,
            User.document_number == document_number,
            User.deleted_at.is_(None),
        )
        if exclude_id is not None:
            stmt = stmt.where(User.id != exclude_id)
        return db.execute(stmt.limit(1)).first() is not None

    def count_active_admins(self, db: Session, *, exclude_id: int | None = None) -> int:
        stmt = (
            select(func.count())
            .select_from(User)
            .join(Role, User.role_id == Role.id)
            .where(Role.name == "admin", User.status == "active", User.deleted_at.is_(None))
        )
        if exclude_id is not None:
            stmt = stmt.where(User.id != exclude_id)
        return db.execute(stmt).scalar_one()

    def update_password(self, db: Session, user_id: int, password_hash: str) -> bool:
        return self.update(db, user_id, {"password_hash": password_hash})

    def update_status(self, db: Session, user_id: int, status: str) -> bool:
        return self.update(db, user_id, {"status": status})

    def touch_last_login(self, db: Session, user_id: int) -> None:
        self.update(db, user_id, {"last_login_at": datetime.utcnow()})


user_repository = UserRepository()
