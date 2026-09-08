import { useCallback, useEffect, useState } from "react";
import {
  AgentesReportFiltros,
  AgenteReportRow,
  getReporteAgente,
} from "@/angel/services/facturas/agentesReport";

/**
 * El fetch NO reacciona a cambios de `filtros` (regla del CLAUDE.md: los filtros
 * solo disparan petición por acción explícita del usuario). Se dispara una vez
 * al montar con los filtros iniciales, y luego solo vía `fetchReporte(filtros)`
 * — que la página llama desde el botón "Consultar".
 */
export function useAgentesReportData(filtrosIniciales: AgentesReportFiltros) {
  const [rows, setRows] = useState<AgenteReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReporte = (filtros: AgentesReportFiltros) => {
    setLoading(true);
    setError(null);
    getReporteAgente(filtros)
      .then(setRows)
      .catch((err) => {
        setRows([]);
        setError(err.message || "Error al consultar");
      })
      .finally(() => setLoading(false));
  };

  // Actualiza una fila en memoria tras un PATCH exitoso, sin re-disparar el
  // reporte completo (evita una petición extra por cada campo editado).
  const actualizarFila = useCallback(
    (id_booking: string, patch: Partial<AgenteReportRow>) => {
      setRows((prev) =>
        prev.map((fila) =>
          fila.id_booking === id_booking ? { ...fila, ...patch } : fila,
        ),
      );
    },
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchReporte(filtrosIniciales);
  }, []);

  return { rows, loading, error, fetchReporte, actualizarFila };
}
