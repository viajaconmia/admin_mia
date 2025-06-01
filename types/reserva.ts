export interface ReservaCompleta {
  booking: Booking;
  hospedaje: Hospedaje;
  servicio: Servicio;
  items: Item[];
}

export interface Booking {
  id_booking: string;
  id_servicio: string;
  check_in: string; // ISO date
  check_out: string; // ISO date
  total: string;
  subtotal: string;
  impuestos: string;
  estado: string;
  fecha_pago_proveedor: string | null;
  costo_total: string;
  costo_subtotal: string;
  costo_impuestos: string;
  fecha_limite_cancelacion: string | null;
  created_at: string; // ISO date
  updated_at: string; // ISO date
  id_solicitud: string;
}

export interface Hospedaje {
  id_hospedaje: string;
  id_booking: string;
  id_hotel: string | null;
  nombre_hotel: string;
  cadena_hotel: string | null;
  codigo_reservacion_hotel: string;
  tipo_cuarto: string;
  noches: number;
  is_rembolsable: boolean | null;
  monto_penalizacion: string | null;
  conciliado: boolean | null;
  credito: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id_servicio: string;
  total: string;
  impuestos: string;
  otros_impuestos: string | null;
  is_credito: boolean | null;
  fecha_limite_pago: string | null;
}

export interface Item {
  id_item: string;
  id_catalogo_item: string | null;
  id_factura: string | null;
  total: string;
  subtotal: string;
  impuestos: string;
  is_facturado: boolean | null;
  fecha_uso: string;
  id_hospedaje: string;
  created_at: string;
  updated_at: string;
  costo_total: string;
  costo_subtotal: string;
  costo_impuestos: string;
  saldo: string | null;
  costo_iva: string;
  impuestos_detalle: ImpuestoDetalle[];
  pagos: Pago[];
}

export interface ImpuestoDetalle {
  id_impuesto: number;
  id_item: string;
  base: string;
  total: string;
}

export interface Pago {
  id_item: string;
  id_pago: string;
  monto: string;
}
