# Imágenes servidas como estáticos

**No borrar esta carpeta.** Aunque parezca duplicar `src/assets/images/`, cumple
otra función: la base de datos guarda las imágenes de categorías, productos y
servicios como rutas públicas absolutas (`/images/labial-mate.jpg`, ver
`backendFastAPI/database/seed.sql`). El navegador las resuelve contra el origen
del frontend, así que tienen que existir aquí para que el catálogo se vea.

`src/assets/images/` es distinto: son las imágenes del contenido estático (hero,
carrusel, página "Nosotros") y se importan como módulos para que Vite las
procese, optimice y versione.
