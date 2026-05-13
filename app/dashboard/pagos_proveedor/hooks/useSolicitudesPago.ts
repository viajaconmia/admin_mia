import { useState, useEffect, useCallback } from "react";
import { TypeFilters } from "@/types";
import {
  fetchGetSolicitudesFiltradas,
  fetchConteosRapidos,
  fetchBucketSolicitudes,
} from "@/services/pago_proveedor";
import { defaultFiltersSolicitudes2 } from "@/constant/solicitudConstants";
import { normalizeApiBuckets } from "../Components/dataUtils";
import { SolicitudesPorFiltro } from "../Components/types";

export function useSolicitudesPago() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [bucketData, setBucketData] = useState<Partial<SolicitudesPorFiltro>>({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(defaultFiltersSolicitudes2);
  const [limiteInput, setLimiteInput] = useState<string>("50");
  const [pag, setPag] = useState<number>(1);
  const [metaPag, setMetaPag] = useState<{ pag: number; limite: number; count: number } | null>(null);

  const fetchCounts = useCallback(async (filtersArg: TypeFilters) => {
    const data = await fetchConteosRapidos(filtersArg as Record<string, any>);
    setCounts(data);
  }, []);

  const fetchBucket = useCallback(
    async (
      bucket: string,
      filtersArg: TypeFilters,
      limiteArg: number | null,
      pagArg: number,
    ) => {
      setLoading(true);
      try {
        let json: any;

        if (bucket === "all") {
          await new Promise<void>((resolve) => {
            fetchGetSolicitudesFiltradas(
              (data) => {
                json = data;
                resolve();
              },
              filtersArg as Record<string, any>,
              limiteArg,
              pagArg,
            );
          });
          const b = normalizeApiBuckets(json?.data ?? {});
          setBucketData((prev) => ({ ...prev, todos: b.todos, ...b }));
        } else {
          json = await fetchBucketSolicitudes(
            bucket,
            filtersArg as Record<string, any>,
            limiteArg,
            pagArg,
          );
          const rows =
            normalizeApiBuckets(json?.data ?? {})[bucket as keyof SolicitudesPorFiltro] ?? [];
          setBucketData((prev) => ({ ...prev, [bucket]: rows }));
        }

        if (json?.meta) setMetaPag(json.meta);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Al cambiar filters: resetear datos y re-obtener conteos
  useEffect(() => {
    setBucketData({});
    setCounts({});
    fetchCounts(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return {
    counts,
    bucketData,
    fetchBucket,
    loading,
    filters,
    setFilters,
    limiteInput,
    setLimiteInput,
    pag,
    setPag,
    metaPag,
  };
}
