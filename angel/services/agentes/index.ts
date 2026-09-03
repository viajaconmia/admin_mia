import { ApiResponse, createApiClient } from "../apiClient";
import { EmpresaDatosFiscales } from "../../lib/cfdi/payload";

const agentesApi = createApiClient("/v2/mia/agentes");

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
  getDatosFiscales: (id_agente: string): Promise<ApiResponse<EmpresaDatosFiscales[]>> =>
    agentesApi.get<EmpresaDatosFiscales[]>("/datos-fiscales", { id_agente }),
};
