-- =====================================================================
-- BeautyLux — Esquema de base de datos (MySQL 8.0)
-- Tercer avance — Ficha 3406204
--
-- Equivalencias con el enunciado (que nombra las entidades en español):
--   users      = usuarios      products = productos   sessions        = sesiones
--   roles      = roles         services = servicios   password_resets = recuperación de contraseña
--   permissions= permisos      categories = categorías audit_logs     = bitácora de auditoría
--
-- Quinto avance — modulo de ventas (etapa 4), agenda (etapa 5),
-- facturacion (etapa 7), PQR (etapa 11) y chatbot con IA (etapa 12):
--   sales      = ventas        sale_details   = detalle de venta
--   appointments = citas       business_hours = horario de atencion
--   invoices   = facturas      invoice_details = detalle de factura
--   pqr        = peticiones, quejas, reclamos y sugerencias
--   conversations = conversaciones del chat   messages = mensajes del chat
-- =====================================================================

CREATE DATABASE IF NOT EXISTS db_beautylux_v2
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE db_beautylux_v2;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS pqr;
DROP TABLE IF EXISTS invoice_details;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS business_hours;
DROP TABLE IF EXISTS sale_details;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(20)  NOT NULL,
    label       VARCHAR(60)  NOT NULL,
    description VARCHAR(255) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------
CREATE TABLE permissions (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(60)  NOT NULL,
    module      VARCHAR(40)  NOT NULL,
    action      VARCHAR(40)  NOT NULL,
    description VARCHAR(255) NULL,
    CONSTRAINT uq_permissions_code UNIQUE (code)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- role_permissions (N:M)
-- ---------------------------------------------------------------------
CREATE TABLE role_permissions (
    role_id       INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- document_types (CC, CE, TI, PA, NIT)
-- ---------------------------------------------------------------------
CREATE TABLE document_types (
    code         VARCHAR(3)  NOT NULL PRIMARY KEY,
    label        VARCHAR(60) NOT NULL,
    min_length   TINYINT UNSIGNED NOT NULL,
    max_length   TINYINT UNSIGNED NOT NULL,
    pattern_kind ENUM('digits', 'alphanumeric') NOT NULL DEFAULT 'digits',
    CONSTRAINT chk_document_types_length CHECK (min_length <= max_length)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name          VARCHAR(40)  NOT NULL,
    last_name           VARCHAR(40)  NOT NULL,
    document_type_code  VARCHAR(3)   NOT NULL,
    document_number     VARCHAR(15)  NOT NULL,
    address             VARCHAR(80)  NOT NULL,
    phone               VARCHAR(10)  NOT NULL,
    email               VARCHAR(60)  NOT NULL,
    password_hash       VARCHAR(72)  NOT NULL,
    role_id             INT UNSIGNED NOT NULL,
    status              ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    last_login_at       DATETIME NULL,
    deleted_at          DATETIME NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_document UNIQUE (document_type_code, document_number),
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_users_document_type
        FOREIGN KEY (document_type_code) REFERENCES document_types (code) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_users_phone CHECK (phone REGEXP '^3[0-9]{9}$'),
    INDEX idx_users_role (role_id),
    INDEX idx_users_status (status),
    INDEX idx_users_deleted_at (deleted_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- sessions (refresh tokens)
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NOT NULL,
    refresh_token_hash  CHAR(64)     NOT NULL,
    user_agent          VARCHAR(255) NULL,
    ip_address          VARCHAR(45)  NULL,
    remember            TINYINT(1)   NOT NULL DEFAULT 0,
    expires_at          DATETIME     NOT NULL,
    revoked_at          DATETIME     NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sessions_token UNIQUE (refresh_token_hash),
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_expires_at (expires_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- password_resets
-- ---------------------------------------------------------------------
CREATE TABLE password_resets (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    token_hash  CHAR(64) NOT NULL,
    expires_at  DATETIME NOT NULL,
    used_at     DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_password_resets_token UNIQUE (token_hash),
    CONSTRAINT fk_password_resets_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_password_resets_user (user_id)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- categories (compartida por products y services)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(90)  NOT NULL,
    name        VARCHAR(80)  NOT NULL,
    description VARCHAR(255) NULL,
    image_url   VARCHAR(500) NULL,
    type        ENUM('product', 'service') NOT NULL,
    status      ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_categories_slug UNIQUE (slug)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
CREATE TABLE products (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku            VARCHAR(40)   NOT NULL,
    slug           VARCHAR(140)  NOT NULL,
    name           VARCHAR(120)  NOT NULL,
    description    TEXT NULL,
    category_id    INT UNSIGNED NULL,
    price          DECIMAL(12, 2) NOT NULL,
    old_price      DECIMAL(12, 2) NULL,
    stock          INT UNSIGNED NOT NULL DEFAULT 0,
    rating         DECIMAL(2, 1) NOT NULL DEFAULT 0,
    reviews_count  INT UNSIGNED NOT NULL DEFAULT 0,
    image_url      VARCHAR(500) NULL,
    badge          VARCHAR(40)  NULL,
    status         ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    deleted_at     DATETIME NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_products_sku UNIQUE (sku),
    CONSTRAINT uq_products_slug UNIQUE (slug),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_products_price CHECK (price >= 0),
    CONSTRAINT chk_products_rating CHECK (rating >= 0 AND rating <= 5),
    INDEX idx_products_category (category_id),
    INDEX idx_products_status (status),
    INDEX idx_products_deleted_at (deleted_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
CREATE TABLE services (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug              VARCHAR(140)  NOT NULL,
    name              VARCHAR(120)  NOT NULL,
    description       TEXT NULL,
    category_id       INT UNSIGNED NULL,
    price             DECIMAL(12, 2) NOT NULL,
    duration_minutes  SMALLINT UNSIGNED NOT NULL,
    image_url         VARCHAR(500) NULL,
    status            ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    deleted_at        DATETIME NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_services_slug UNIQUE (slug),
    CONSTRAINT fk_services_category
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_services_price CHECK (price >= 0),
    CONSTRAINT chk_services_duration CHECK (duration_minutes > 0),
    INDEX idx_services_category (category_id),
    INDEX idx_services_status (status),
    INDEX idx_services_deleted_at (deleted_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NULL,
    action      VARCHAR(60)  NOT NULL,
    entity      VARCHAR(40)  NOT NULL,
    entity_id   INT UNSIGNED NULL,
    changes     JSON NULL,
    ip_address  VARCHAR(45)  NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_entity (entity),
    INDEX idx_audit_logs_created_at (created_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- sales — cabecera de la venta (quinto avance, requisitos 1, 2, 3 y 14)
--
-- Los datos del cliente y del despacho se guardan como SNAPSHOT: si el
-- usuario cambia luego su direccion o su telefono, la venta ya emitida debe
-- seguir mostrando lo que se pacto en su momento. Por eso `user_id` puede
-- quedar en NULL (cliente eliminado, o venta de mostrador a consumidor final)
-- sin que la venta pierda a quien se le vendio.
--
-- Los totales estan en DECIMAL(12, 2), nunca en coma flotante, y los calcula
-- siempre el servidor: lo que mande el cliente en el body se ignora.
-- ---------------------------------------------------------------------
CREATE TABLE sales (
    id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_number              VARCHAR(20)  NOT NULL,
    user_id                  INT UNSIGNED NULL,
    staff_id                 INT UNSIGNED NULL,
    channel                  ENUM('web', 'pos') NOT NULL DEFAULT 'web',
    customer_first_name      VARCHAR(40)  NOT NULL,
    customer_last_name       VARCHAR(40)  NOT NULL,
    customer_document_type   VARCHAR(5)   NULL,
    customer_document_number VARCHAR(20)  NULL,
    customer_email           VARCHAR(60)  NULL,
    customer_phone           VARCHAR(20)  NULL,
    shipping_method          ENUM('standard', 'express', 'pickup') NOT NULL DEFAULT 'standard',
    shipping_address         VARCHAR(120) NULL,
    shipping_city            VARCHAR(60)  NULL,
    shipping_notes           VARCHAR(255) NULL,
    payment_method           ENUM('card', 'pse', 'nequi', 'cash') NOT NULL DEFAULT 'card',
    subtotal                 DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_total           DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_total                DECIMAL(12, 2) NOT NULL DEFAULT 0,
    shipping_cost            DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total                    DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status                   ENUM('pending', 'paid', 'processing', 'completed', 'cancelled')
                             NOT NULL DEFAULT 'pending',
    notes                    VARCHAR(255) NULL,
    sold_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at               DATETIME NULL,
    created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_sales_number UNIQUE (sale_number),
    CONSTRAINT fk_sales_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sales_staff
        FOREIGN KEY (staff_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_sales_totals CHECK (
        subtotal >= 0 AND discount_total >= 0 AND tax_total >= 0
        AND shipping_cost >= 0 AND total >= 0
    ),
    INDEX idx_sales_user (user_id),
    INDEX idx_sales_staff (staff_id),
    INDEX idx_sales_status (status),
    INDEX idx_sales_channel (channel),
    INDEX idx_sales_sold_at (sold_at),
    INDEX idx_sales_deleted_at (deleted_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- sale_details — una linea por producto o servicio vendido
--
-- `product_id` y `service_id` son excluyentes y ambos admiten NULL con
-- ON DELETE SET NULL: si manana se elimina un producto del catalogo, la
-- venta historica no se rompe, porque el nombre, el SKU y el precio quedaron
-- copiados en la propia linea. `duration_minutes` viaja aqui para que la
-- agenda de citas sepa cuanto dura el servicio que se compro, aunque despues
-- se edite la duracion en el catalogo.
-- ---------------------------------------------------------------------
CREATE TABLE sale_details (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_id          INT UNSIGNED NOT NULL,
    item_type        ENUM('product', 'service') NOT NULL,
    product_id       INT UNSIGNED NULL,
    service_id       INT UNSIGNED NULL,
    item_name        VARCHAR(120) NOT NULL,
    item_sku         VARCHAR(40)  NULL,
    unit_price       DECIMAL(12, 2) NOT NULL,
    quantity         INT UNSIGNED NOT NULL DEFAULT 1,
    discount         DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate         DECIMAL(5, 2)  NOT NULL DEFAULT 0,
    subtotal         DECIMAL(12, 2) NOT NULL,
    duration_minutes SMALLINT UNSIGNED NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sale_details_sale
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sale_details_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sale_details_service
        FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_sale_details_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sale_details_amounts CHECK (unit_price >= 0 AND discount >= 0 AND subtotal >= 0),
    -- Una linea es de un producto o de un servicio, nunca de los dos. No se
    -- puede expresar como CHECK: MySQL 8 rechaza un CHECK sobre una columna
    -- que participa en una FK con accion referencial (ON DELETE SET NULL),
    -- con el error 3823. La regla la garantiza SaleService._build_lines(),
    -- que es el unico camino por el que se escriben estas filas.
    INDEX idx_sale_details_item_pair (item_type, product_id, service_id),
    INDEX idx_sale_details_sale (sale_id),
    INDEX idx_sale_details_product (product_id),
    INDEX idx_sale_details_service (service_id),
    INDEX idx_sale_details_type (item_type)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- business_hours — horario de atencion del salon, una fila por dia
--
-- De aqui salen las franjas que ofrece la disponibilidad: desde `opens_at`
-- hasta `closes_at`, cada `slot_minutes`, con `capacity` citas simultaneas
-- (cuantas clientas se pueden atender a la vez). Es configuracion, no
-- catalogo: se edita en la base y la API la lee para generar los horarios.
-- ---------------------------------------------------------------------
CREATE TABLE business_hours (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- 1 = lunes ... 7 = domingo, siguiendo ISO-8601 (date.isoweekday()).
    weekday      TINYINT UNSIGNED NOT NULL,
    opens_at     TIME NOT NULL,
    closes_at    TIME NOT NULL,
    slot_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
    capacity     TINYINT UNSIGNED NOT NULL DEFAULT 1,
    is_open      TINYINT(1) NOT NULL DEFAULT 1,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_business_hours_weekday UNIQUE (weekday),
    CONSTRAINT chk_business_hours_weekday CHECK (weekday BETWEEN 1 AND 7),
    CONSTRAINT chk_business_hours_range CHECK (closes_at > opens_at),
    CONSTRAINT chk_business_hours_slot CHECK (slot_minutes > 0),
    CONSTRAINT chk_business_hours_capacity CHECK (capacity > 0)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- appointments — citas de los servicios (quinto avance, etapa 5)
--
-- Una cita nace en estado `hold`: una reserva temporal de pocos minutos que
-- sostiene la franja mientras la clienta termina el checkout. Si no se
-- confirma, `hold_expires_at` la deja vencer y la limpieza periodica la
-- descarta, de modo que el cupo vuelve a ofrecerse solo.
--
-- `sale_id` y `sale_detail_id` son nulos mientras la cita no pertenezca a una
-- venta: la agenda tambien se usa desde el panel, para citas registradas a
-- mano. El especialista que atiende no se modela: lo asigna BeautyLux
-- internamente.
-- ---------------------------------------------------------------------
CREATE TABLE appointments (
    id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_number       VARCHAR(20) NOT NULL,
    sale_id                  INT UNSIGNED NULL,
    sale_detail_id           INT UNSIGNED NULL,
    user_id                  INT UNSIGNED NULL,
    service_id               INT UNSIGNED NULL,
    customer_first_name      VARCHAR(40)  NOT NULL,
    customer_last_name       VARCHAR(40)  NOT NULL,
    customer_email           VARCHAR(60)  NULL,
    customer_phone           VARCHAR(20)  NULL,
    service_name             VARCHAR(120) NOT NULL,
    duration_minutes         SMALLINT UNSIGNED NOT NULL,
    scheduled_date           DATE NOT NULL,
    start_time               TIME NOT NULL,
    end_time                 TIME NOT NULL,
    location                 ENUM('atelier', 'home') NOT NULL DEFAULT 'atelier',
    status                   ENUM('hold', 'confirmed', 'completed', 'cancelled', 'no_show')
                             NOT NULL DEFAULT 'hold',
    hold_expires_at          DATETIME NULL,
    notes                    VARCHAR(255) NULL,
    cancelled_at             DATETIME NULL,
    created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_appointments_number UNIQUE (appointment_number),
    CONSTRAINT fk_appointments_sale
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_sale_detail
        FOREIGN KEY (sale_detail_id) REFERENCES sale_details (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_service
        FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_appointments_range CHECK (end_time > start_time),
    INDEX idx_appointments_user (user_id),
    INDEX idx_appointments_service (service_id),
    INDEX idx_appointments_sale (sale_id),
    INDEX idx_appointments_status (status),
    -- El indice que sostiene la consulta de disponibilidad: citas activas de
    -- un dia, ordenadas por hora de inicio.
    INDEX idx_appointments_agenda (scheduled_date, status, start_time),
    INDEX idx_appointments_hold_expires (hold_expires_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- invoices — factura de una venta (quinto avance, requisitos 7, 8 y 9)
--
-- `sale_id` es UNIQUE: una venta tiene a lo sumo una factura. Se emite
-- automaticamente cuando la venta pasa a `paid` (ver SaleService), pero
-- tambien puede emitirse a mano desde el panel.
--
-- Los datos fiscales del comprador se copian aqui, igual que en `sales`: si
-- la cuenta cambia despues su documento o su direccion, la factura ya
-- impresa no debe cambiar. `subtotal`/`discount_total`/`tax_total`/`total`
-- son una copia de los de la venta en el momento de emitir, no un enlace: la
-- factura queda congelada aunque la venta se cancele mas tarde.
-- ---------------------------------------------------------------------
CREATE TABLE invoices (
    id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number           VARCHAR(20)  NOT NULL,
    sale_id                  INT UNSIGNED NOT NULL,
    customer_first_name      VARCHAR(40)  NOT NULL,
    customer_last_name       VARCHAR(40)  NOT NULL,
    customer_document_type   VARCHAR(5)   NULL,
    customer_document_number VARCHAR(20)  NULL,
    customer_email           VARCHAR(60)  NULL,
    customer_phone           VARCHAR(20)  NULL,
    customer_address         VARCHAR(120) NULL,
    subtotal                 DECIMAL(12, 2) NOT NULL,
    discount_total           DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_total                DECIMAL(12, 2) NOT NULL,
    total                    DECIMAL(12, 2) NOT NULL,
    status                   ENUM('issued', 'paid', 'void') NOT NULL DEFAULT 'issued',
    issued_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    voided_at                DATETIME NULL,
    created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_invoices_number UNIQUE (invoice_number),
    CONSTRAINT uq_invoices_sale UNIQUE (sale_id),
    CONSTRAINT fk_invoices_sale
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_invoices_totals CHECK (
        subtotal >= 0 AND discount_total >= 0 AND tax_total >= 0 AND total >= 0
    ),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_issued_at (issued_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- invoice_details — lineas de la factura, snapshot de sale_details
--
-- Se copian en el momento de emitir para que la factura quede congelada:
-- si mas tarde se reimprime, muestra exactamente lo que se facturo, no lo
-- que diga hoy `sale_details` (que ni siquiera cambia, pero la copia es la
-- garantia de que nunca podria hacerlo).
-- ---------------------------------------------------------------------
CREATE TABLE invoice_details (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id   INT UNSIGNED NOT NULL,
    description  VARCHAR(160) NOT NULL,
    quantity     INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price   DECIMAL(12, 2) NOT NULL,
    discount     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate     DECIMAL(5, 2)  NOT NULL DEFAULT 0,
    subtotal     DECIMAL(12, 2) NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_details_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_invoice_details_quantity CHECK (quantity > 0),
    CONSTRAINT chk_invoice_details_amounts CHECK (unit_price >= 0 AND discount >= 0 AND subtotal >= 0),
    INDEX idx_invoice_details_invoice (invoice_id)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- pqr — peticiones, quejas, reclamos y sugerencias (quinto avance,
-- requisito 16)
--
-- `user_id` es opcional: la radicación es pública (no exige sesión), así que
-- una visitante sin cuenta también puede quejarse. Cuando hay sesión, se
-- guarda igual el snapshot de contacto (`contact_*`) para que el ticket no
-- dependa de que la cuenta siga existiendo ni de que sus datos no cambien
-- después — el mismo criterio que `sales.customer_*`.
--
-- La consulta pública de estado (`GET /api/pqr/{ticketNumber}`) exige el
-- número de ticket *y* el correo de contacto: sin la sesión de por medio, es
-- lo único que evita que cualquiera lea la PQR de otra persona adivinando
-- el consecutivo.
-- ---------------------------------------------------------------------
CREATE TABLE pqr (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number       VARCHAR(20)  NOT NULL,
    user_id             INT UNSIGNED NULL,
    sale_id             INT UNSIGNED NULL,
    type                ENUM('peticion', 'queja', 'reclamo', 'sugerencia') NOT NULL,
    subject             VARCHAR(160) NOT NULL,
    message             TEXT NOT NULL,
    contact_first_name  VARCHAR(40)  NOT NULL,
    contact_last_name   VARCHAR(40)  NOT NULL,
    contact_email       VARCHAR(60)  NOT NULL,
    contact_phone       VARCHAR(20)  NULL,
    status              ENUM('pending', 'in_progress', 'answered', 'closed')
                        NOT NULL DEFAULT 'pending',
    response            TEXT NULL,
    responded_by        INT UNSIGNED NULL,
    responded_at        DATETIME NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_pqr_ticket_number UNIQUE (ticket_number),
    CONSTRAINT fk_pqr_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pqr_sale
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pqr_responded_by
        FOREIGN KEY (responded_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_pqr_user (user_id),
    INDEX idx_pqr_status (status),
    INDEX idx_pqr_type (type),
    INDEX idx_pqr_created_at (created_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- conversations — sesiones del chatbot (quinto avance, etapa 12,
-- requisitos 17-19)
--
-- `user_id` es opcional: el chat funciona sin sesión, igual que la
-- radicación de PQR. `session_token` identifica la conversación en el
-- navegador de quien escribe (se guarda en `localStorage`, nunca es un
-- token de autenticación) y es lo que prueba la propiedad de una
-- conversación anónima al leerla o seguir escribiendo en ella; para una
-- conversación ligada a una cuenta, la propiedad la prueba `user_id`.
-- ---------------------------------------------------------------------
CREATE TABLE conversations (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED NULL,
    session_token  CHAR(36) NOT NULL,
    status         ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    started_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at      DATETIME NULL,
    CONSTRAINT uq_conversations_session_token UNIQUE (session_token),
    CONSTRAINT fk_conversations_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_conversations_user (user_id)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- messages — turnos del chat, en orden de `created_at`
-- ---------------------------------------------------------------------
CREATE TABLE messages (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id  INT UNSIGNED NOT NULL,
    role             ENUM('user', 'assistant', 'system') NOT NULL,
    content          TEXT NOT NULL,
    tokens_used      INT UNSIGNED NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_messages_conversation (conversation_id)
) ENGINE = InnoDB;
