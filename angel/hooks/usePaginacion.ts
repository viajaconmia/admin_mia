import { useState } from "react";

export type Paginacion = {
  total: number;
  page: number;
  total_pages: number;
};

const INICIAL: Paginacion = { total: 0, page: 1, total_pages: 1 };

export function usePaginacion(pageSize: number) {
  const [paginacion, setPaginacion] = useState<Paginacion>(INICIAL);

  const actualizarDesdeMetadata = (total: number, page: number) =>
    setPaginacion({ total, page, total_pages: Math.ceil(total / pageSize) });

  const resetear = () => setPaginacion(INICIAL);

  return { paginacion, actualizarDesdeMetadata, resetear };
}
