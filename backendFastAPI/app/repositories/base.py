"""
Repositorio base — equivalente de backend/src/repositories/base.repository.js.

A diferencia de Node (SQL parametrizado a mano), aquí se usa `select()` de
SQLAlchemy 2.0, pero el contrato es el mismo: ningún método decide reglas de
negocio, solo consulta. `sortable_columns` sigue siendo una whitelist contra
inyección en el `ORDER BY` (aquí no hace falta porque solo se aceptan
`InstrumentedAttribute`, pero se conserva para paridad con Node).
"""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import InstrumentedAttribute, Session

ModelT = TypeVar("ModelT")


class BaseRepository(Generic[ModelT]):
    def __init__(
        self,
        model: type[ModelT],
        *,
        soft_delete: bool = False,
        sortable_columns: dict[str, InstrumentedAttribute] | None = None,
    ) -> None:
        self.model = model
        self.soft_delete = soft_delete
        self.sortable_columns = sortable_columns or {}

    def _not_deleted(self):
        if self.soft_delete:
            return self.model.deleted_at.is_(None)  # type: ignore[attr-defined]
        return None

    def find_by_id(self, db: Session, entity_id: Any) -> ModelT | None:
        stmt = select(self.model).where(self.model.id == entity_id)  # type: ignore[attr-defined]
        not_deleted = self._not_deleted()
        if not_deleted is not None:
            stmt = stmt.where(not_deleted)
        return db.execute(stmt).scalars().first()

    def find_one_by(self, db: Session, column: InstrumentedAttribute, value: Any) -> ModelT | None:
        stmt = select(self.model).where(column == value)
        not_deleted = self._not_deleted()
        if not_deleted is not None:
            stmt = stmt.where(not_deleted)
        return db.execute(stmt).scalars().first()

    def exists_by(
        self, db: Session, column: InstrumentedAttribute, value: Any, *, exclude_id: Any = None
    ) -> bool:
        stmt = select(self.model.id).where(column == value)  # type: ignore[attr-defined]
        not_deleted = self._not_deleted()
        if not_deleted is not None:
            stmt = stmt.where(not_deleted)
        if exclude_id is not None:
            stmt = stmt.where(self.model.id != exclude_id)  # type: ignore[attr-defined]
        return db.execute(stmt.limit(1)).first() is not None

    def count(self, db: Session) -> int:
        stmt = select(func.count()).select_from(self.model)
        not_deleted = self._not_deleted()
        if not_deleted is not None:
            stmt = stmt.where(not_deleted)
        return db.execute(stmt).scalar_one()

    def find_all(
        self,
        db: Session,
        *,
        search_columns: list[InstrumentedAttribute] | None = None,
        search: str | None = None,
        filters: dict[InstrumentedAttribute, Any] | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = None,
        order_dir: str = "ASC",
        extra_clauses: list | None = None,
    ) -> tuple[list[ModelT], int]:
        clauses = []
        not_deleted = self._not_deleted()
        if not_deleted is not None:
            clauses.append(not_deleted)

        if search and search_columns:
            like = f"%{search}%"
            clauses.append(_or_like(search_columns, like))

        if filters:
            for column, value in filters.items():
                if value is None or value == "":
                    continue
                clauses.append(column == value)

        if extra_clauses:
            clauses.extend(extra_clauses)

        base_stmt = select(self.model)
        count_stmt = select(func.count()).select_from(self.model)
        for clause in clauses:
            base_stmt = base_stmt.where(clause)
            count_stmt = count_stmt.where(clause)

        total = db.execute(count_stmt).scalar_one()

        order_column = self.sortable_columns.get(order_by) if order_by else None
        if order_column is None:
            order_column = self.model.id  # type: ignore[attr-defined]
        safe_dir = "DESC" if (order_dir or "").upper() == "DESC" else "ASC"
        base_stmt = base_stmt.order_by(order_column.desc() if safe_dir == "DESC" else order_column.asc())

        offset = (max(1, page) - 1) * per_page
        base_stmt = base_stmt.limit(per_page).offset(offset)

        rows = list(db.execute(base_stmt).scalars().all())
        return rows, total

    def create(self, db: Session, data: dict[str, Any]) -> ModelT:
        instance = self.model(**data)
        db.add(instance)
        db.flush()
        # Recarga todas las columnas desde MySQL: sin esto, un campo que ya
        # veníamos con un valor en Python (p. ej. `price`) se queda con la
        # representación tal cual la mandó el cliente (Decimal('19900')) en
        # vez de la que MySQL realmente almacena (Decimal('19900.00')),
        # porque el identity map de SQLAlchemy no pisa atributos ya
        # poblados. Node siempre re-consulta con SQL crudo, así que esto
        # conserva la misma paridad de formato en la respuesta.
        db.refresh(instance)
        return instance

    def update(self, db: Session, entity_id: Any, data: dict[str, Any]) -> bool:
        if not data:
            return False
        instance = self.find_by_id(db, entity_id)
        if instance is None:
            return False
        for key, value in data.items():
            setattr(instance, key, value)
        db.flush()
        db.refresh(instance)  # misma razón que en create(): recarga desde MySQL
        return True

    def soft_delete_by_id(self, db: Session, entity_id: Any) -> bool:
        from datetime import datetime

        instance = self.find_by_id(db, entity_id)
        if instance is None:
            return False
        instance.deleted_at = datetime.utcnow()  # type: ignore[attr-defined]
        db.flush()
        return True

    def hard_delete(self, db: Session, entity_id: Any) -> bool:
        instance = db.get(self.model, entity_id)
        if instance is None:
            return False
        db.delete(instance)
        db.flush()
        return True


def _or_like(columns: list[InstrumentedAttribute], like: str):
    from sqlalchemy import or_

    return or_(*[column.like(like) for column in columns])
