-- =====================================================================
-- BeautyLux — Datos semilla (MySQL 8.0)
-- Ejecutar siempre después de schema.sql (npm run db:seed / db:reset).
-- Usa subconsultas por código/slug en vez de IDs fijos, así el script
-- es seguro de re-ejecutar sin depender del valor exacto de AUTO_INCREMENT.
-- =====================================================================

USE db_beautylux_v2;

-- ---------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------
INSERT INTO roles (name, label, description) VALUES
    ('admin',    'Administrador', 'Gestión completa de usuarios, productos, servicios y categorías.'),
    ('employee', 'Empleado',      'Gestiona clientes, productos y servicios; sin privilegios de administración.'),
    ('client',   'Cliente',       'Consulta el catálogo y administra su propio perfil.');

-- ---------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------
INSERT INTO permissions (code, module, action, description) VALUES
    ('users.read',        'users',       'read',   'Consultar usuarios'),
    ('users.create',      'users',       'create', 'Crear usuarios'),
    ('users.update',      'users',       'update', 'Editar usuarios'),
    ('users.status',      'users',       'status', 'Cambiar el estado activo/inactivo de un usuario'),
    ('users.delete',      'users',       'delete', 'Eliminar (soft delete) usuarios'),
    ('products.read',     'products',    'read',   'Consultar productos'),
    ('products.create',   'products',    'create', 'Crear productos'),
    ('products.update',   'products',    'update', 'Editar productos'),
    ('products.delete',   'products',    'delete', 'Eliminar productos'),
    ('services.read',     'services',    'read',   'Consultar servicios'),
    ('services.create',   'services',    'create', 'Crear servicios'),
    ('services.update',   'services',    'update', 'Editar servicios'),
    ('services.delete',   'services',    'delete', 'Eliminar servicios'),
    ('categories.read',   'categories',  'read',   'Consultar categorías'),
    ('categories.create', 'categories',  'create', 'Crear categorías'),
    ('categories.update', 'categories',  'update', 'Editar categorías'),
    ('categories.delete', 'categories',  'delete', 'Eliminar categorías'),
    ('roles.read',        'roles',       'read',   'Consultar roles'),
    ('permissions.read',  'permissions', 'read',   'Consultar permisos'),
    ('audit.read',        'audit',       'read',   'Consultar la bitácora de auditoría'),
    ('sales.read',        'sales',       'read',   'Consultar ventas'),
    ('sales.create',      'sales',       'create', 'Registrar ventas'),
    ('sales.update',      'sales',       'update', 'Editar ventas'),
    ('sales.status',      'sales',       'status', 'Cambiar el estado de una venta'),
    ('appointments.read',   'appointments', 'read',   'Consultar citas'),
    ('appointments.create', 'appointments', 'create', 'Agendar citas'),
    ('appointments.update', 'appointments', 'update', 'Reprogramar o cancelar citas'),
    ('invoices.read',       'invoices',    'read',   'Consultar facturas'),
    ('invoices.create',     'invoices',    'create', 'Emitir facturas'),
    ('profile.read',      'profile',     'read',   'Consultar el propio perfil'),
    ('profile.update',    'profile',     'update', 'Editar el propio perfil');

-- ---------------------------------------------------------------------
-- role_permissions — matriz de la sección 3.4 del plan
-- ---------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'employee' AND p.code IN (
    'users.read', 'users.update',
    'products.read', 'products.create', 'products.update',
    'services.read', 'services.create', 'services.update',
    'categories.read',
    'sales.read', 'sales.create', 'sales.update', 'sales.status',
    'appointments.read', 'appointments.create', 'appointments.update',
    'invoices.read', 'invoices.create',
    'profile.read', 'profile.update'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'client' AND p.code IN (
    'products.read', 'services.read', 'categories.read',
    -- El cliente compra y consulta, pero solo sus propias ventas: el filtro
    -- por user_id lo aplica SaleService, no la matriz de permisos.
    'sales.read', 'sales.create',
    'appointments.read', 'appointments.create', 'appointments.update',
    -- El cliente solo consulta y descarga sus propias facturas, nunca las
    -- emite: eso es tarea del personal cuando marca la venta como pagada.
    'invoices.read',
    'profile.read', 'profile.update'
);

-- ---------------------------------------------------------------------
-- document_types — idénticos a frontend/src/data/documentTypes.js
-- ---------------------------------------------------------------------
INSERT INTO document_types (code, label, min_length, max_length, pattern_kind) VALUES
    ('CC',  'Cédula de ciudadanía',    6, 12, 'digits'),
    ('CE',  'Cédula de extranjería',   6, 15, 'digits'),
    ('TI',  'Tarjeta de identidad',    6, 12, 'digits'),
    ('PA',  'Pasaporte',               6, 15, 'alphanumeric'),
    ('NIT', 'NIT',                     6, 12, 'digits');

-- ---------------------------------------------------------------------
-- users — contraseñas ya hasheadas con bcrypt (12 rondas)
-- admin@beautylux.com     → Admin123*
-- empleado@beautylux.com  → Empleado123*
-- cliente@beautylux.com   → Cliente123*
-- ---------------------------------------------------------------------
INSERT INTO users (first_name, last_name, document_type_code, document_number, address, phone, email, password_hash, role_id, status)
SELECT 'Valentina', 'Restrepo', 'CC', '1020304050', 'Cra 45 # 12-30, Medellín', '3001234567',
       'admin@beautylux.com', '$2b$12$PIQxZjvKBNJxPPhEXKsYweTsPoxmruqnZHDCTbqD2q3vWrsxBxD.6', r.id, 'active'
FROM roles r WHERE r.name = 'admin';

INSERT INTO users (first_name, last_name, document_type_code, document_number, address, phone, email, password_hash, role_id, status)
SELECT 'Camila', 'Gómez', 'CC', '1030405060', 'Cl 50 # 20-15, Medellín', '3012345678',
       'empleado@beautylux.com', '$2b$12$wiiztNi7yfab9ybPh7Ekk.Fk/A/XaYZwbR8VEVZmr5wVT8MVfZhQG', r.id, 'active'
FROM roles r WHERE r.name = 'employee';

INSERT INTO users (first_name, last_name, document_type_code, document_number, address, phone, email, password_hash, role_id, status)
SELECT 'Juliana', 'Torres', 'CC', '1040506070', 'Cra 70 # 33-10, Medellín', '3023456789',
       'cliente@beautylux.com', '$2b$12$/y.TX/.6htIaKXSQ7wdXqujQ6BYDM34a1f1mc7WIA9Mt/yBpzX7tG', r.id, 'active'
FROM roles r WHERE r.name = 'client';

-- ---------------------------------------------------------------------
-- categories — 4 de producto + 4 de servicio
-- ---------------------------------------------------------------------
INSERT INTO categories (slug, name, description, image_url, type, status) VALUES
    ('maquillaje',     'Maquillaje',      'Labiales, sombras, bases y brochas',       '/images/paleta-sombras.jpg', 'product', 'active'),
    ('cuidado-facial', 'Cuidado facial',  'Sérums, cremas y mascarillas',             '/images/serum-facial.jpg',   'product', 'active'),
    ('fragancias',     'Fragancias',      'Perfumes y brumas corporales',             '/images/perfume.jpg',        'product', 'active'),
    ('cabello',        'Cabello',         'Tratamientos y rituales capilares',        '/images/cuidado-cabello.jpg','product', 'active'),
    ('servicios-faciales',   'Servicios faciales',   'Limpiezas, hidratación y tratamientos de rostro', '/images/serum-facial.jpg',    'service', 'active'),
    ('servicios-manos-pies', 'Manos y pies',         'Manicure, pedicure y esmaltado semipermanente',    '/images/rubor-iluminador.jpg','service', 'active'),
    ('servicios-cabello',    'Servicios de cabello', 'Corte, peinado y tratamientos capilares',          '/images/cuidado-cabello.jpg', 'service', 'active'),
    ('servicios-maquillaje', 'Maquillaje social',    'Maquillaje profesional para eventos',              '/images/labial-mate.jpg',     'service', 'active');

-- ---------------------------------------------------------------------
-- products — migrados de frontend/src/data/products.js
-- ---------------------------------------------------------------------
INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-LBL-001', 'labial-mate-luxe', 'Labial Mate Luxe', 'Pigmentación intensa de larga duración en 12 tonos.', c.id, 68900, 82000, 120, 4.9, 214, '/images/labial-mate.jpg', 'Más vendido', 'active' FROM categories c WHERE c.slug = 'maquillaje';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-PAL-002', 'paleta-sunset-glow', 'Paleta Sunset Glow', '18 sombras cálidas con acabados mate, satinado y metálico.', c.id, 129900, NULL, 80, 4.8, 168, '/images/paleta-sombras.jpg', 'Nuevo', 'active' FROM categories c WHERE c.slug = 'maquillaje';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-MAS-003', 'mascara-volumen-extremo', 'Máscara Volumen Extremo', 'Efecto pestañas postizas, resistente al agua.', c.id, 54900, 64900, 150, 4.7, 302, '/images/mascara-pestanas.jpg', 'Oferta', 'active' FROM categories c WHERE c.slug = 'maquillaje';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-RUB-004', 'duo-rubor-iluminador', 'Dúo Rubor & Iluminador', 'Mejillas radiantes con acabado luminoso.', c.id, 72500, NULL, 95, 4.6, 96, '/images/rubor-iluminador.jpg', NULL, 'active' FROM categories c WHERE c.slug = 'maquillaje';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-BRO-005', 'set-brochas-rose-gold', 'Set de Brochas Rose Gold', '12 brochas de fibra vegana ultra suave.', c.id, 158000, 189000, 60, 4.9, 141, '/images/hero-beautylux.jpg', 'Oferta', 'active' FROM categories c WHERE c.slug = 'maquillaje';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-SER-006', 'serum-vitamina-c', 'Sérum Vitamina C', 'Ilumina y unifica el tono con ácido hialurónico.', c.id, 96000, NULL, 110, 4.9, 387, '/images/serum-facial.jpg', 'Más vendido', 'active' FROM categories c WHERE c.slug = 'cuidado-facial';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-CRE-007', 'crema-hidratante-rose', 'Crema Hidratante Rosé', 'Hidratación 48 h con agua de rosas y ceramidas.', c.id, 84500, 95000, 130, 4.8, 259, '/images/crema-hidratante.jpg', NULL, 'active' FROM categories c WHERE c.slug = 'cuidado-facial';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-LIM-008', 'espuma-limpiadora-suave', 'Espuma Limpiadora Suave', 'Limpieza profunda sin resecar la piel.', c.id, 49900, NULL, 140, 4.7, 178, '/images/limpiador-facial.jpg', NULL, 'active' FROM categories c WHERE c.slug = 'cuidado-facial';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-MAC-009', 'mascarilla-detox-arcilla', 'Mascarilla Detox de Arcilla', 'Purifica y minimiza los poros visiblemente.', c.id, 62000, 71000, 70, 4.5, 84, '/images/mascarilla-arcilla.jpg', 'Oferta', 'active' FROM categories c WHERE c.slug = 'cuidado-facial';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-PER-010', 'eau-de-parfum-blush', 'Eau de Parfum Blush', 'Notas de peonía, vainilla y ámbar.', c.id, 245000, NULL, 40, 5.0, 132, '/images/perfume.jpg', 'Edición limitada', 'active' FROM categories c WHERE c.slug = 'fragancias';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-BRU-011', 'bruma-corporal-champagne', 'Bruma Corporal Champagne', 'Fragancia ligera para uso diario.', c.id, 78000, 89000, 90, 4.6, 67, '/images/perfume.jpg', NULL, 'active' FROM categories c WHERE c.slug = 'fragancias';

INSERT INTO products (sku, slug, name, description, category_id, price, old_price, stock, rating, reviews_count, image_url, badge, status)
SELECT 'SKU-CAP-012', 'ritual-capilar-nutritivo', 'Ritual Capilar Nutritivo', 'Aceite de argán y keratina para brillo espejo.', c.id, 112000, NULL, 75, 4.8, 203, '/images/cuidado-cabello.jpg', 'Nuevo', 'active' FROM categories c WHERE c.slug = 'cabello';

-- ---------------------------------------------------------------------
-- services — 8 servicios del salón
-- ---------------------------------------------------------------------
INSERT INTO services (slug, name, description, category_id, price, duration_minutes, image_url, status)
SELECT 'limpieza-facial-profunda', 'Limpieza Facial Profunda', 'Extracción, exfoliación y mascarilla calmante.', c.id, 85000, 60, '/images/serum-facial.jpg', 'active' FROM categories c WHERE c.slug = 'servicios-faciales';

INSERT INTO services (slug, name, description, category_id, price, duration_minutes, image_url, status)
SELECT 'hidratacion-facial-vip', 'Hidratación Facial VIP', 'Ácido hialurónico y masaje facial relajante.', c.id, 110000, 75, '/images/crema-hidratante.jpg', 'active' FROM categories c WHERE c.slug = 'servicios-faciales';

INSERT INTO services (slug, name, description, category_id, price, duration_minutes, image_url, status)
SELECT 'manicure-semipermanente', 'Manicure Semipermanente', 'Esmaltado de larga duración con cuidado de cutícula.', c.id, 45000, 50, '/images/rubor-iluminador.jpg', 'active' FROM categories c WHERE c.slug = 'servicios-manos-pies';

INSERT INTO services (slug, name, description, category_id, price, duration_minutes, image_url, status)
SELECT 'pedicure-spa', 'Pedicure Spa', 'Exfoliación, masaje e hidratación profunda de pies.', c.id, 55000, 60, '/images/rubor-iluminador.jpg', 'active' FROM categories c WHERE c.slug = 'servicios-manos-pies';

INSERT INTO services (slug, name, description, category_id, price, duration_minutes, image_url, status)
SELECT 'corte-y-peinado', 'Corte y Peinado', 'Corte personalizado con peinado profesional.', c.id, 60000, 45, '/images/cuidado-cabello.jpg', 'active' FROM categories c WHERE c.slug = 'servicios-cabello';

INSERT INTO services (slug, name, description, category_id, price, duration_minutes, image_url, status)
SELECT 'tratamiento-keratina', 'Tratamiento de Keratina', 'Alisado y nutrición profunda para brillo espejo.', c.id, 180000, 150, '/images/cuidado-cabello.jpg', 'active' FROM categories c WHERE c.slug = 'servicios-cabello';

INSERT INTO services (slug, name, description, category_id, price, duration_minutes, image_url, status)
SELECT 'maquillaje-social', 'Maquillaje Social', 'Maquillaje profesional para eventos y fiestas.', c.id, 95000, 60, '/images/labial-mate.jpg', 'active' FROM categories c WHERE c.slug = 'servicios-maquillaje';

INSERT INTO services (slug, name, description, category_id, price, duration_minutes, image_url, status)
SELECT 'diseno-de-cejas', 'Diseño de Cejas', 'Perfilado, depilación y tinte de cejas.', c.id, 35000, 30, '/images/labial-mate.jpg', 'active' FROM categories c WHERE c.slug = 'servicios-maquillaje';

-- ---------------------------------------------------------------------
-- business_hours — horario de atencion del salon
--
-- Lunes a viernes de 9:00 a 19:00, sabado de 9:00 a 17:00 y domingo cerrado.
-- Franjas de 30 minutos y dos clientas en simultaneo (dos puestos de trabajo).
-- ---------------------------------------------------------------------
INSERT INTO business_hours (weekday, opens_at, closes_at, slot_minutes, capacity, is_open) VALUES
    (1, '09:00:00', '19:00:00', 30, 2, 1),
    (2, '09:00:00', '19:00:00', 30, 2, 1),
    (3, '09:00:00', '19:00:00', 30, 2, 1),
    (4, '09:00:00', '19:00:00', 30, 2, 1),
    (5, '09:00:00', '19:00:00', 30, 2, 1),
    (6, '09:00:00', '17:00:00', 30, 2, 1),
    (7, '09:00:00', '13:00:00', 30, 1, 0);
