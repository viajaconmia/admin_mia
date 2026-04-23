// constants/solicitudConstants.ts
import { currentDate } from "@/lib/utils";
import { TypeFilters } from "@/types";

export type EditableField =
  | "costo_proveedor"
  | "estatus_pagos"
  | "monto_solicitado"
  | "consolidado";

export const FIELD_TO_API: Record<EditableField, string> = {
  costo_proveedor: "costo_total",
  estatus_pagos: "estatus_pagos",
  monto_solicitado: "monto_solicitado",
  consolidado: "consolidado",
};

export const defaultSort = { key: "creado", sort: false };

export const defaultFiltersSolicitudes: TypeFilters = {
  codigo_reservacion: null,
  client: null,
  reservante: null,
  reservationStage: null,
  hotel: null,
  status: "Confirmada",
  startDate: currentDate(),
  endDate: currentDate(),
  traveler: null,
  paymentMethod: null,
  id_client: null,
  statusPagoProveedor: null,
  filterType: "Transaccion",
  markup_end: null,
  markup_start: null,
  uuid_factura: null,
};