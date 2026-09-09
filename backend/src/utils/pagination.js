const MAX_PER_PAGE = 100;
const DEFAULT_PER_PAGE = 10;

/** Normaliza page/perPage desde la query string. */
export function parsePagination(query = {}) {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const perPage = Math.min(
        MAX_PER_PAGE,
        Math.max(1, Number.parseInt(query.perPage, 10) || DEFAULT_PER_PAGE),
    );
    return { page, perPage, offset: (page - 1) * perPage };
}

/** Arma el bloque `meta` de la respuesta paginada. */
export function buildMeta({ page, perPage, total }) {
    return {
        page,
        perPage,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / perPage),
    };
}

export default { parsePagination, buildMeta };
