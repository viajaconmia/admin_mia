import { ApiResponse, createApiClient } from "../apiClient";

const dispersionApi = createApiClient("/v2/mia/dispersion");

export type CrearDispersionSolicitud = {
  id_solicitud_proveedor: number;
  id_proveedor_cuenta: number;
  monto_dispersar: number;
  fecha_pago?: string | null;
  // informativos — el backend no los usa en lógica, los regresa tal cual
  id_solicitud?: string;
  id_proveedor?: number;
  clave_proveedor?: string;
  cuenta_de_deposito?: string;
  tipo_cuenta?: string;
  costo_proveedor?: number;
  codigo_hotel?: string | null;
};

export type CrearDispersionBody = {
  referencia_numerica?: string;
  motivo_pago?: string;
  layoutUrl?: string;
  solicitudes: CrearDispersionSolicitud[];
};

export type SolicitudDispersionProcesada = {
  id_pago: string;
  id_solicitud_proveedor: number;
  id_proveedor_cuenta: number;
  monto_dispersar: number;
  saldo_dispersion_db: number;
  fecha_pago: string | null;
  id_solicitud: string | null;
  id_proveedor: number | null;
  clave_proveedor: string | null;
  cuenta_de_deposito: string | null;
  tipo_cuenta: string | null;
  costo_proveedor: number | null;
  codigo_hotel: string | null;
};

export type CrearDispersionResponse = {
  id_dispersion: string;
  referencia_numerica: string | null;
  motivo_pago: string | null;
  layoutUrl: string | null;
  ids: number[];
  id_pagos: string[];
  solicitudes_procesadas: SolicitudDispersionProcesada[];
  correo_enviado: boolean;
};

export const dispersionService = {
  crear: (
    body: CrearDispersionBody,
  ): Promise<ApiResponse<CrearDispersionResponse>> =>
    dispersionApi.post<CrearDispersionResponse>("", body),
};
