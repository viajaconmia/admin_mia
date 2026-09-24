import { useCallback, useEffect, useState } from "react";
import { pagosService, PagoPrepagoFacturable } from "@/angel/services/pagos";

export function usePagosPrepagoFacturables() {
  const [data, setData] = useState<PagoPrepagoFacturable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    pagosService
      .getPrepagoFacturables()
      .then(({ data }) => {
        setData(data ?? []);
        setError(null);
      })
      .catch((err) =>
        setError(err.message || "No se pudieron cargar los pagos."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
