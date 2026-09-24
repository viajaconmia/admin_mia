import { useCallback, useEffect, useState } from "react";
import { pagosService, BalancePagosFacturas } from "@/angel/services/pagos";

export function useBalancePagosFacturas() {
  const [data, setData] = useState<BalancePagosFacturas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    pagosService
      .getBalancePagosFacturas()
      .then(({ data }) => {
        setData(data ?? null);
        setError(null);
      })
      .catch((err) =>
        setError(err.message || "No se pudieron cargar los saldos de pagos."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
