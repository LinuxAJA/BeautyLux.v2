"""Servicio de ventas — quinto avance, requisitos 1, 2, 3 y 14.

Tres reglas que gobiernan este módulo:

1. **El servidor calcula los importes.** El cliente dice qué compra y cuántas
   unidades; los precios salen del catálogo en el momento de vender. Lo que
   llegue en el body sobre precios o totales se ignora.
2. **Los precios del catálogo son precios al público, con el IVA incluido**,
   que es como se cotiza en Colombia y como los muestra el frontend. Por eso
   `total` no suma impuestos encima: `tax_total` es el IVA *implícito* en esos
   precios, desglosado para que la factura de la etapa 7 pueda mostrarlo.
3. **El stock se descuenta dentro de la misma transacción**, con las filas de
   producto bloqueadas, para que dos compras simultáneas no vendan la misma
   última unidad.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.core.pagination import build_meta
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail
from app.models.service import Service
from app.repositories.sale import sale_repository
from app.repositories.user import user_repository
from app.schemas.sale import SaleOut
from app.services.audit import audit_service

CENT = Decimal("0.01")

# IVA general colombiano. Va incluido en el precio del catálogo, así que aquí
# solo sirve para desglosarlo: base = precio / 1.19, iva = precio - base.
TAX_RATE = Decimal("19.00")

# Tarifas de envío. El umbral coincide con el del carrito del frontend
# (`FREE_SHIPPING_THRESHOLD` en src/context/CartProvider.jsx): si se cambia
# uno, hay que cambiar el otro.
FREE_SHIPPING_THRESHOLD = Decimal("150000")
SHIPPING_COSTS = {
    "standard": Decimal("12000"),
    "express": Decimal("20000"),
    "pickup": Decimal("0"),
}

STAFF_ROLES = ("admin", "employee")

# Una venta cancelada o completada ya no se mueve: evita "descancelar" una
# venta cuyo stock ya se devolvió, o reabrir una entrega cerrada.
FINAL_STATUSES = ("completed", "cancelled")


def _money(value: Decimal) -> Decimal:
    """Redondea a dos decimales con el criterio comercial (0.5 hacia arriba)."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


class SaleService:
    # -----------------------------------------------------------------
    # Lectura
    # -----------------------------------------------------------------
    def list(
        self,
        db,
        *,
        actor,
        search: str | None = None,
        client_id: int | None = None,
        staff_id: int | None = None,
        status: str | None = None,
        channel: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        min_total: Decimal | None = None,
        max_total: Decimal | None = None,
        product_id: int | None = None,
        service_id: int | None = None,
        page: int = 1,
        per_page: int = 10,
        order_by: str | None = None,
        order_dir: str | None = None,
    ) -> dict:
        # Un cliente solo ve lo suyo, mande lo que mande en `clientId`.
        visible_user_id = actor.id if actor.role.name not in STAFF_ROLES else client_id

        rows, total = sale_repository.find_all_with_filters(
            db,
            search=search,
            user_id=visible_user_id,
            staff_id=staff_id,
            status=status,
            channel=channel,
            date_from=date_from,
            date_to=date_to,
            min_total=min_total,
            max_total=max_total,
            product_id=product_id,
            service_id=service_id,
            page=page,
            per_page=per_page,
            order_by=order_by,
            order_dir=order_dir or "DESC",
        )
        return {
            "data": [SaleOut.from_model(sale) for sale in rows],
            "meta": build_meta(page, per_page, total),
        }

    def get_by_id(self, db, sale_id: int, *, actor) -> SaleOut:
        sale = sale_repository.find_by_id_with_details(db, sale_id)
        self._ensure_visible(sale, actor)
        return SaleOut.from_model(sale, with_details=True)

    def get_by_number(self, db, sale_number: str, *, actor) -> SaleOut:
        sale = sale_repository.find_by_number(db, sale_number)
        self._ensure_visible(sale, actor)
        return SaleOut.from_model(sale, with_details=True)

    def _ensure_visible(self, sale: Sale | None, actor) -> None:
        if not sale:
            raise NotFoundError("La venta no existe.")
        if actor.role.name not in STAFF_ROLES and sale.user_id != actor.id:
            # Mismo mensaje que si no existiera: a un cliente no se le confirma
            # que la venta de otro está ahí.
            raise NotFoundError("La venta no existe.")

    # -----------------------------------------------------------------
    # Creación
    # -----------------------------------------------------------------
    def create(self, db, dto, *, actor, ip_address: str | None) -> SaleOut:
        is_staff = actor.role.name in STAFF_ROLES

        if not is_staff and (dto.client_id or dto.channel == "pos"):
            raise ForbiddenError("No puedes registrar ventas a nombre de otra persona.")

        customer = self._resolve_customer(db, dto, actor=actor, is_staff=is_staff)
        lines, products_subtotal, services_subtotal = self._build_lines(db, dto.items)

        shipping_method = dto.shipping.method if dto.shipping else "standard"
        shipping_cost = self._shipping_cost(shipping_method, products_subtotal)

        # Un envío a domicilio necesita dirección; recoger en tienda y una
        # compra solo de servicios, no. Si el checkout no manda una, se usa la
        # de la cuenta antes de rechazar la venta.
        shipping_address = dto.shipping.address if dto.shipping else None
        if not shipping_address:
            shipping_address = customer["address"]

        needs_address = shipping_method in ("standard", "express") and products_subtotal > 0
        if needs_address and not shipping_address:
            raise BadRequestError("Indica la dirección de entrega para el envío a domicilio.")

        subtotal = _money(products_subtotal + services_subtotal)
        # IVA implícito: los precios ya lo llevan dentro.
        base = subtotal / (Decimal("1") + TAX_RATE / Decimal("100"))
        tax_total = _money(subtotal - base)
        total = _money(subtotal + shipping_cost)

        sale = self._insert_with_number(
            db,
            {
                "user_id": customer["user_id"],
                "staff_id": actor.id if (dto.channel == "pos" and is_staff) else None,
                "channel": dto.channel if (dto.channel and is_staff) else "web",
                "customer_first_name": customer["first_name"],
                "customer_last_name": customer["last_name"],
                "customer_document_type": customer["document_type"],
                "customer_document_number": customer["document_number"],
                "customer_email": customer["email"],
                "customer_phone": customer["phone"],
                "shipping_method": shipping_method,
                "shipping_address": shipping_address,
                "shipping_city": dto.shipping.city if dto.shipping else None,
                "shipping_notes": dto.shipping.notes if dto.shipping else None,
                "payment_method": dto.payment_method,
                "subtotal": subtotal,
                "discount_total": Decimal("0"),
                "tax_total": tax_total,
                "shipping_cost": shipping_cost,
                "total": total,
                "status": "pending",
                "notes": dto.notes,
                "sold_at": datetime.now(),
            },
        )

        for line in lines:
            db.add(SaleDetail(sale_id=sale.id, **line["row"]))

        # El stock baja aquí, con las filas ya bloqueadas por `_build_lines`.
        for line in lines:
            if line["product"] is not None:
                line["product"].stock -= line["row"]["quantity"]

        db.flush()

        audit_service.record(
            db,
            user_id=actor.id,
            action="sale_created",
            entity="sales",
            entity_id=sale.id,
            changes={
                "after": {
                    "saleNumber": sale.sale_number,
                    "channel": sale.channel,
                    "total": str(sale.total),
                    "items": len(lines),
                }
            },
            ip_address=ip_address,
        )

        created = sale_repository.find_by_id_with_details(db, sale.id)
        return SaleOut.from_model(created, with_details=True)

    def _resolve_customer(self, db, dto, *, actor, is_staff: bool) -> dict:
        """Decide a nombre de quién queda la venta y congela sus datos.

        Tres casos: el cliente se compra a sí mismo, el personal vende a un
        cliente registrado (`clientId`), o el personal vende a consumidor final
        (sin cuenta, con los datos escritos a mano en el POS).
        """
        target = actor
        if is_staff and dto.client_id:
            target = user_repository.find_by_id(db, dto.client_id)
            if not target:
                raise BadRequestError("El cliente seleccionado no existe.")

        supplied = dto.customer
        is_walk_in = is_staff and not dto.client_id and supplied is not None

        if is_walk_in:
            if not supplied.first_name or not supplied.last_name:
                raise BadRequestError("Indica el nombre y el apellido de quien compra.")
            return {
                "user_id": None,
                "first_name": supplied.first_name,
                "last_name": supplied.last_name,
                "document_type": supplied.document_type,
                "document_number": supplied.document_number,
                "email": supplied.email,
                "phone": supplied.phone,
                "address": None,
            }

        # Los datos de la cuenta mandan; lo enviado solo completa lo que falte.
        return {
            "user_id": target.id,
            "first_name": target.first_name,
            "last_name": target.last_name,
            "document_type": target.document_type_code,
            "document_number": target.document_number,
            "email": target.email,
            "phone": target.phone or (supplied.phone if supplied else None),
            "address": target.address,
        }

    def _build_lines(self, db, items) -> tuple[list[dict], Decimal, Decimal]:
        """Valida el carrito contra el catálogo y arma las líneas de la venta.

        Bloquea con `FOR UPDATE` las filas de los productos implicados, en orden
        de id, para que dos ventas simultáneas no se pisen el stock ni provoquen
        un interbloqueo.
        """
        product_ids = sorted({i.item_id for i in items if i.item_type == "product"})
        service_ids = sorted({i.item_id for i in items if i.item_type == "service"})

        products: dict[int, Product] = {}
        if product_ids:
            rows = db.execute(
                select(Product)
                .where(Product.id.in_(product_ids), Product.deleted_at.is_(None))
                .order_by(Product.id)
                .with_for_update()
            ).scalars().all()
            products = {p.id: p for p in rows}

        services: dict[int, Service] = {}
        if service_ids:
            rows = db.execute(
                select(Service).where(Service.id.in_(service_ids), Service.deleted_at.is_(None))
            ).scalars().all()
            services = {s.id: s for s in rows}

        lines: list[dict] = []
        products_subtotal = Decimal("0")
        services_subtotal = Decimal("0")

        for item in items:
            if item.item_type == "product":
                product = products.get(item.item_id)
                if not product or product.status != "active":
                    raise BadRequestError(f"El producto con id {item.item_id} ya no está disponible.")
                if product.stock < item.quantity:
                    raise ConflictError(
                        f"No hay existencias suficientes de «{product.name}»: "
                        f"quedan {product.stock} unidades."
                    )

                line_subtotal = _money(product.price * item.quantity)
                products_subtotal += line_subtotal
                lines.append(
                    {
                        "product": product,
                        "row": {
                            "item_type": "product",
                            "product_id": product.id,
                            "service_id": None,
                            "item_name": product.name,
                            "item_sku": product.sku,
                            "unit_price": product.price,
                            "quantity": item.quantity,
                            "discount": Decimal("0"),
                            "tax_rate": TAX_RATE,
                            "subtotal": line_subtotal,
                            "duration_minutes": None,
                        },
                    }
                )
                continue

            service = services.get(item.item_id)
            if not service or service.status != "active":
                raise BadRequestError(f"El servicio con id {item.item_id} ya no está disponible.")
            # Una cita se reserva de a una, igual que en el carrito del frontend.
            if item.quantity != 1:
                raise BadRequestError(
                    f"«{service.name}» es un servicio con cita: solo puede reservarse una vez por compra."
                )

            line_subtotal = _money(service.price)
            services_subtotal += line_subtotal
            lines.append(
                {
                    "product": None,
                    "row": {
                        "item_type": "service",
                        "product_id": None,
                        "service_id": service.id,
                        "item_name": service.name,
                        "item_sku": None,
                        "unit_price": service.price,
                        "quantity": 1,
                        "discount": Decimal("0"),
                        "tax_rate": TAX_RATE,
                        "subtotal": line_subtotal,
                        "duration_minutes": service.duration_minutes,
                    },
                }
            )

        return lines, products_subtotal, services_subtotal

    def _shipping_cost(self, method: str, products_subtotal: Decimal) -> Decimal:
        """Una compra sin productos físicos no se despacha, así que no paga
        envío por mucho que sume en servicios."""
        if products_subtotal <= 0:
            return Decimal("0")
        if method == "standard" and products_subtotal >= FREE_SHIPPING_THRESHOLD:
            return Decimal("0")
        return SHIPPING_COSTS.get(method, SHIPPING_COSTS["standard"])

    def _insert_with_number(self, db, data: dict, *, attempts: int = 3) -> Sale:
        """Inserta la venta calculando su consecutivo del año.

        El índice UNIQUE de `sale_number` es la garantía real: si otra venta se
        adelanta entre el cálculo y el INSERT, MySQL rechaza el duplicado y se
        reintenta con el siguiente número.
        """
        year = datetime.now().year

        for attempt in range(attempts):
            last = sale_repository.last_number_of_year(db, year)
            sequence = int(last.rsplit("-", 1)[1]) + 1 if last else 1
            sale = Sale(sale_number=f"VTA-{year}-{sequence:05d}", **data)

            try:
                with db.begin_nested():
                    db.add(sale)
                    db.flush()
                return sale
            except IntegrityError:
                # `begin_nested()` ya deshizo su savepoint: la transacción sigue
                # viva y se puede reintentar con el número siguiente.
                if attempt == attempts - 1:
                    raise ConflictError(
                        "No se pudo asignar el número de venta. Inténtalo de nuevo."
                    ) from None

        raise ConflictError("No se pudo asignar el número de venta. Inténtalo de nuevo.")

    # -----------------------------------------------------------------
    # Cambio de estado
    # -----------------------------------------------------------------
    def update_status(self, db, sale_id: int, status: str, *, actor, ip_address: str | None) -> SaleOut:
        sale = sale_repository.find_by_id_with_details(db, sale_id)
        if not sale:
            raise NotFoundError("La venta no existe.")

        if sale.status == status:
            raise BadRequestError("La venta ya está en ese estado.")
        if sale.status in FINAL_STATUSES:
            raise BadRequestError(
                "Una venta completada o cancelada no puede cambiar de estado."
            )

        previous = sale.status

        # Cancelar devuelve al inventario lo que se había descontado. Solo se
        # reponen las líneas cuyo producto sigue existiendo.
        if status == "cancelled":
            for detail in sale.details:
                if detail.item_type != "product" or detail.product_id is None:
                    continue
                product = db.execute(
                    select(Product).where(Product.id == detail.product_id).with_for_update()
                ).scalars().first()
                if product is not None:
                    product.stock += detail.quantity

        sale.status = status
        db.flush()

        audit_service.record(
            db,
            user_id=actor.id,
            action="sale_status_changed",
            entity="sales",
            entity_id=sale.id,
            changes={"before": {"status": previous}, "after": {"status": status}},
            ip_address=ip_address,
        )

        updated = sale_repository.find_by_id_with_details(db, sale_id)
        return SaleOut.from_model(updated, with_details=True)


sale_service = SaleService()
