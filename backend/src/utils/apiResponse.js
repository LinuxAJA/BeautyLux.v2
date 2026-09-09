/** Respuesta de éxito estándar: { success, message, data, meta? }. */
export function ok(res, { data = null, message = 'Operación exitosa', meta } = {}, status = 200) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(status).json(body);
}

export function created(res, { data = null, message = 'Recurso creado correctamente' } = {}) {
    return ok(res, { data, message }, 201);
}

export function noContent(res) {
    return res.status(204).send();
}
