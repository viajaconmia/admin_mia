import { useEffect, useState } from "react";
import {
  AgentesReportFiltros,
  AgenteReportRow,
  getAgentesReportFac,
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
    getAgentesReportFac(filtros)
      .then(setRows)
      .catch((err) => {
        setRows([]);
        setError(err.message || "Error al consultar");
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchReporte(filtrosIniciales);
  }, []);

  return { rows, loading, error, fetchReporte };
}
