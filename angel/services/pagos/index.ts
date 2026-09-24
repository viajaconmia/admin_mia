import { ApiResponse, createApiClient } from "../apiClient";

const pagosApi = createApiClient("/v2/mia/factura/pagos");

export type PagoPrepagoFacturable = {
  id_movimiento: number;
  tipo_pago: string;
  raw_id: string;
  id_agente: string;
  nombre_agente: string | null;
  fecha_creacion: string;
  fecha_pago: string | null;
  monto: number;
  monto_facturado: number;
  monto_por_facturar: number;
  saldo: string;
  currency: string;
  metodo: string;
  tipo: string | null;
  referencia: string | null;
  concepto: string | null;
  link_pago: string | null;
  autorizacion: string | null;
  last_digits: string | null;
  banco: string | null;
  origen_pago: string;
  is_facturado: number;
  is_wallet_credito: string | number;
  estado_pago: string | number;
  facturas_asociadas: string;
};

export type BalancePagosFacturas = {
  total_pagos: number | null;
  total_facturado: number | null;
  restante: number | null;
  total_reservas_confirmadas: number | null;
};

export const pagosService = {
  /** GET /v2/mia/factura/pagos/prepago-facturables — solo pagos/saldos con
   * fecha_pago de 2026 en adelante (filtro ya viene metido en la vista). */
  getPrepagoFacturables: (): Promise<ApiResponse<PagoPrepagoFacturable[]>> =>
    pagosApi.get<PagoPrepagoFacturable[]>("/prepago-facturables"),

  getBalancePagosFacturas: (): Promise<ApiResponse<BalancePagosFacturas | null>> =>
    pagosApi.get<BalancePagosFacturas | null>("/balance"),
};
