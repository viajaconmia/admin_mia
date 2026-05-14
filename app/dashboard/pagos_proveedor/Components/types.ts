import { SolicitudProveedor } from "@/types";

export type SolicitudSeleccionadaComprobante = {
  id_solicitud_proveedor: string;
  monto_solicitado: number;
  monto_pagado: string;
  codigo_confirmacion?: string | null;
};

export type CategoriaEstatus =
  | "spei"
  | "pago_tdc"
  | "pago_link"
  | "pendiente_credito"
  | "ap_credito"
  | "pagada"
  | "notificados"
  | "canceladas";

export type SolicitudesPorFiltro = Record<CategoriaEstatus, SolicitudProveedor[]> & {
  todos: SolicitudProveedor[];
};

export type ItemSolicitud = SolicitudProveedor & {
  pagos?: any[];
  facturas?: any[];
  estatus_pagos?: string | null;
  filtro_pago?: string | null;
  cuenta_de_deposito?: string | null;
  codigo_confirmacion?: string | null;
};

export type DatosDispersion = {
  codigo_reservacion_hotel: string | null;
  costo_proveedor: number;
  id_solicitud: string | number | null;
  id_solicitud_proveedor: string | number | null;
  monto_solicitado: number;
  razon_social: string | null;
  cuenta_banco: string | null;
  rfc: string | null;
};

export type MetodoPagoPopoverProps = {
  idSolProv: string;
  currentMethod: string;
  onSetMethod: (nextMethod: "transfer" | "card") => Promise<boolean>;
  onSetCard: (data: { id_tarjeta_solicitada: string | null }) => Promise<boolean>;
};
