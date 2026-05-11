import { useState, useEffect, useCallback } from "react";
import { TypeFilters } from "@/types";
import { fetchGetSolicitudesFiltradas } from "@/services/pago_proveedor";
import { defaultFiltersSolicitudes2 } from "@/constant/solicitudConstants";
import { normalizeApiBuckets } from "../Components/dataUtils";
import { SolicitudesPorFiltro } from "../Components/types";

const DEFAULT_SOLICITUDES: SolicitudesPorFiltro = {
  todos: [],
  spei: [],
  pago_tdc: [],
  pago_link: [],
  pendiente_credito: [],
  ap_credito: [],
  pagada: [],
  notificados: [],
  canceladas: [],
};

export function useSolicitudesPago() {
  const [solicitudesPago, setSolicitudesPago] = useState<SolicitudesPorFiltro>(DEFAULT_SOLICITUDES);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(defaultFiltersSolicitudes2);
  const [limiteInput, setLimiteInput] = useState<string>("50");
  const [pag, setPag] = useState<number>(1);
  const [metaPag, setMetaPag] = useState<{ pag: number; limite: number; count: number } | null>(null);

  const handleFetchSolicitudesPago = useCallback(
    (filtersArg?: TypeFilters, limiteArg?: number | null, pagArg?: number) => {
      const activeFilters = filtersArg ?? filters;
      const activeLimite = limiteArg !== undefined ? limiteArg : (limiteInput ? Number(limiteInput) : null);
      const activePag = pagArg !== undefined ? pagArg : pag;
      setLoading(true);

      fetchGetSolicitudesFiltradas(
        (data) => {
          try {
            const apiData = data?.data || {};
            const buckets = normalizeApiBuckets(apiData);
            setSolicitudesPago({
              todos: buckets.todos,
              spei: buckets.spei,
              pago_tdc: buckets.pago_tdc,
              pago_link: buckets.pago_link,
              pendiente_credito: buckets.pendiente_credito,
              ap_credito: buckets.ap_credito,
              pagada: buckets.pagada,
              notificados: buckets.notificados,
              canceladas: buckets.canceladas,
            });
            if (data?.meta) setMetaPag(data.meta);
          } finally {
            setLoading(false);
          }
        },
        activeFilters as Record<string, any>,
        activeLimite,
        activePag,
      );
    },
    [filters, limiteInput, pag],
  );

  useEffect(() => {
    setPag(1);
    handleFetchSolicitudesPago(filters, null, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return {
    solicitudesPago,
    loading,
    filters,
    setFilters,
    limiteInput,
    setLimiteInput,
    pag,
    setPag,
    metaPag,
    handleFetchSolicitudesPago,
  };
}
