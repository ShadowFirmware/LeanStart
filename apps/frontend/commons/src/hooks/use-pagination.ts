import { useEffect, useMemo, useState } from "react";

interface UsePaginationOptions {
  /** Cantidad de elementos por página. */
  pageSize?: number;
  /** Cuando cambia, la página vuelve a 1 (úsalo con tus filtros/búsqueda). */
  resetKey?: unknown;
}

/** Pagina un arreglo ya filtrado/ordenado. Vuelve a la página 1 cuando cambia `resetKey`. */
export function usePagination<T>(items: T[], { pageSize = 30, resetKey }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { page, setPage, totalPages, pageItems, pageSize, totalItems: items.length };
}
