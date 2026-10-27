import { useCallback, useEffect, useRef, useState } from "react";
import { usePaginacion } from "@/angel/hooks/usePaginacion";
import { mensajeErrorCotizaciones } from "@/angel/lib/cotizacionesIa";
import {
  CotizacionIaEstado,
  CotizacionIaListItem,
  QuoteServiceType,
  cotizacionesIaService,
} from "@/angel/services/cotizacionesIa";

export const COTIZACIONES_IA_PAGE_SIZE = 25;

export type FiltrosListaCotizacionesIa = {
  q?: string;
  estado?: CotizacionIaEstado;
  tipo?: QuoteServiceType;
};

/**
 * Los filtros NO disparan petición al cambiar (regla del CLAUDE.md): se consulta
 * una vez al montar y luego solo por acción explícita (`consultar`) o al cambiar
 * de página / actualizar (`irAPagina`), siempre con los últimos filtros aplicados.
 */
export function useCotizacionesIa() {
  const [rows, setRows] = useState<CotizacionIaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { paginacion, actualizarDesdeMetadata, resetear } = usePaginacion(
    COTIZACIONES_IA_PAGE_SIZE,
  );
  const filtrosAplicados = useRef<FiltrosListaCotizacionesIa>({});

  const cargar = useCallback(
    (page: number) => {
      const { q, estado, tipo } = filtrosAplicados.current;
      setLoading(true);
      setError(null);
      cotizacionesIaService
        .listar({
          page,
          length: COTIZACIONES_IA_PAGE_SIZE,
          ...(q?.trim() ? { q: q.trim() } : {}),
          ...(estado ? { estado } : {}),
          ...(tipo ? { tipo } : {}),
        })
        .then(({ data, metadata }) => {
          const lista = data ?? [];
          setRows(lista);
          actualizarDesdeMetadata(metadata?.total ?? lista.length, page);
        })
        .catch((err) => {
          setRows([]);
          resetear();
          setError(mensajeErrorCotizaciones(err));
        })
        .finally(() => setLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const consultar = useCallback(
    (filtros: FiltrosListaCotizacionesIa) => {
      filtrosAplicados.current = filtros;
      cargar(1);
    },
    [cargar],
  );

  const irAPagina = useCallback(
    (page?: number) => cargar(page ?? paginacion.page),
    [cargar, paginacion.page],
  );

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  return { rows, loading, error, paginacion, consultar, irAPagina };
}
