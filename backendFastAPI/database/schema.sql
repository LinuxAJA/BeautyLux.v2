-- =====================================================================
-- BeautyLux — Esquema de base de datos (MySQL 8.0)
-- Tercer avance — Ficha 3406204
--
-- Equivalencias con el enunciado (que nombra las entidades en español):
--   users      = usuarios      products = productos   sessions        = sesiones
--   roles      = roles         services = servicios   password_resets = recuperación de contraseña
--   permissions= permisos      categories = categorías audit_logs     = bitácora de auditoría
-- =====================================================================

CREATE DATABASE IF NOT EXISTS db_beautylux_v2
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE db_beautylux_v2;

SET FOREIGN_KEY_CHECKS = 0;

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
