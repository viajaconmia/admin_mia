export type TypesSaldoWallet = "transferencia" | "tarjeta" | "wallet";

export type Saldo = {
  id_saldos: number;
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
