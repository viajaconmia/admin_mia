import { ApiResponse, createApiClient } from "../apiClient";
import { EmpresaDatosFiscales } from "../../lib/cfdi/payload";
import { API_KEY, BACK_URL } from "../../lib/env";

const agentesApi = createApiClient("/v2/mia/agentes");

export type AgenteListado = {
  id_agente: string;
  nombre: string;
};

/**
 * TODO(pendiente): migrar a un endpoint v2 ligero (ej. GET /v2/mia/agentes/listado)
 * que devuelva solo {id_agente, nombre} — ver angel/PENDIENTES.md.
 *
 * Usa GET /mia/agentes/all (legacy, mismo que `services/agentes.ts#fetchAgentes`)
 * con fetch directo porque ese endpoint responde un array plano, no el envelope
 * {message, data} que exige `apiClient` — createApiClient lanzaría error de formato.
 */
export async function listarAgentes(): Promise<AgenteListado[]> {
  const res = await fetch(`${BACK_URL}/v1/mia/agentes/all`, {
    headers: {
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al cargar el catálogo de clientes");
  }

  const data = await res.json();
  const lista = Array.isArray(data) ? data : [];

  return lista.map(
    (agente: { id_agente: string; nombre_agente_completo: string }) => ({
      id_agente: agente.id_agente,
      nombre: agente.nombre_agente_completo,
    }),
  );
}

/**
 * Endpoint nuevo, pendiente de crear en backend:
 * GET /v2/mia/agentes/datos-fiscales?id_agente=<uuid>
 * → ApiResponse<EmpresaDatosFiscales[]>
 *
 * No reemplaza el fetch legacy (`GET /mia/agentes/empresas-con-datos-fiscales`,
 * usado hoy en varios lugares) — es un servicio nuevo, a propósito, para no
 * acoplar el nuevo componente CFDI a las llamadas existentes.
 */
export const agentesService = {
  getDatosFiscales: (
    id_agente: string,
  ): Promise<ApiResponse<EmpresaDatosFiscales[]>> =>
    agentesApi.get<EmpresaDatosFiscales[]>("/datos-fiscales", { id_agente }),
};
