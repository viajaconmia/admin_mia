export type TypesSaldoWallet = "transferencia" | "tarjeta" | "wallet";

export type Saldo = {
  id_saldos: number;
  nombre?: string;
  id_agente: string;
  fecha_creacion: string;
  saldo: string;
  monto: string;
  metodo_pago: TypesSaldoWallet;
  fecha_pago: string;
  concepto: string | null;
  referencia: string | null;
  currency: string;
  tipo_tarjeta: "credito" | "debito" | null;
  comentario: string | null;
  link_stripe: string | null;
  is_facturable: 0 | 1;
  is_descuento: 0 | 1;
  comprobante: string;
  activo: 0 | 1;
  ult_digits: number;
  numero_autorizacion: string;
  banco_tarjeta: string;
};

export type SaldoFacturaItem = {
  id_saldos: number;
  rfc: string;
  id_agente: string;
  agente: string;
  monto_asignado: string; // viene como string (decimal)
  total: string; // string decimal
  uuid_factura: string;
  saldo_insoluto: string; // string decimal
  parcialidad: number;
  pagos_complemento: any[]; // puedes tiparlo después si sabes la estructura
};

export type CorreoHotel = {
  hotel_id: string;
  hotel_name: string;
  price_per_night: number;
  raw_price: string;
  source: string;
  currency: string;
};

export type CorreoProcesado = {
  id: number;
  id_correo: string;
  thread_id: string | null;
  subject: string | null;
  from_email: string | null;
  body_email: string | null;
  procesado: 0 | 1;
  fecha_procesado: string | null;
  status: string;
  error: string | null;
  created_at: string;
  updated_at: string;
  agent_process: AgentProcess;
  hoteles: CorreoHotel[] | null;
};

export type AgentProcess =
  | {
      hotel: string | null;
      ciudad: string | null;
      check_in: string | null;
      check_out: string | null;
      codigo_postal: string | null;
    }
  | {};

export type Item = {
  id_item: string;
  id_catalogo_item: string | null;
  id_factura: string;
  total: string;
  subtotal: string;
  impuestos: string;
  is_facturado: 0 | 1;
  fecha_uso: string;
  id_hospedaje: string;
  created_at: string;
  updated_at: string;
  costo_total: string;
  costo_subtotal: string;
  costo_impuestos: string;
  saldo: string;
  costo_iva: string;
  is_ajuste: 0 | 1;
};
