import { useEffect, useState } from "react";
import {
  facturasService,
  FiltrosReservasPendientes,
  ReservaPendienteFacturar,
} from "@/angel/services/facturas";

type Tracking = { total: number; page: number; total_pages: number };

export function useReservasPendientesData(filtros: FiltrosReservasPendientes) {
  const [reservas, setReservas] = useState<ReservaPendienteFacturar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Tracking>({ total: 0, page: 1, total_pages: 1 });

  const fetchReservas = async (page = 1) => {
    setLoading(true);
    setError(null);
    facturasService
      .getReservasPendientesFacturar(filtros)
      .then(({ data }) => {
        const result = data ?? [];
        setReservas(result);
        setTracking({ total: result.length, page, total_pages: 1 });
      })
      .catch((err) => setError(err.message || "Error al cargar reservas"))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReservas(1); }, [JSON.stringify(filtros)]);

  return { reservas, loading, error, tracking, fetchReservas };
}
