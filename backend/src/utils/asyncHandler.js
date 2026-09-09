/**
 * Envuelve un controlador async para propagar sus rechazos a `next(error)`.
 * Express 5 ya reenvía promesas rechazadas automáticamente, pero se
 * mantiene explícito por claridad y para no depender de ese detalle interno.
 */
export function asyncHandler(fn) {
    return function wrapped(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

export default asyncHandler;
