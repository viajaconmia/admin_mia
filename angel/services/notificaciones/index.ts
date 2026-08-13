import { ApiResponse, createApiClient } from "../apiClient";

const notificacionesApi = createApiClient("/v2/mia/notificaciones");

export type ConteoNotificaciones = {
  conteo: number;
};

// Cada dominio con badge expone su propio endpoint /notificaciones/{dominio}/conteo
// (no es un endpoint genérico con query param). Agregar un método aquí por
// cada dominio nuevo.
export const notificacionesService = {
  getConteoComisionables: (): Promise<ApiResponse<ConteoNotificaciones>> =>
    notificacionesApi.get<ConteoNotificaciones>("/comisionables/conteo"),
};
