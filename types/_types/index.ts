export interface Company {
  id_empresa: string;
  razon_social: string;
  rfc: string;
  nombre_comercial: string;
  direccion: string;
  direccion_fiscal: string;
  codigo_postal_fiscal: string;
  regimen_fiscal: string;
  status: "active" | "inactive";
}

export interface Traveler {
  id_viajero: string;
  id_empresa: string;
  primer_nombre: string;
  segundo_nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  fecha_nacimiento: string;
  genero: "m" | "f";
  telefono: number;
  status: "active" | "inactive";
}

export interface Tax {
  id_impuesto: number;
  name: string;
  rate: number;
}

export type Agente = {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    email: string;
    email_verified: boolean;
    full_name: string;
    phone: string;
    phone_verified: boolean;
    sub: string;
  };
  identities: any; // o null, o un tipo más específico si los llegas a usar
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
};

export type Factura = {
  id_factura: string;
  fecha_emision: Date | string;
  estado_factura: 'Confirmada' | 'Cancelada' | 'En proceso';
  usuario_creador: string;
  total_factura?: number | null;
  subtotal_factura?: number | null;
  impuestos_factura?: number | null;
  saldo?: number | null;
  factura_created_at?: Date | string;
  factura_updated_at?: Date | string;
  id_facturama?: string | null;
  id_pago?: string | null;
  monto_pago?: number | null;
  fecha_pago?: Date | string | null;
  fecha_transaccion?: Date | string | null;
  metodo_de_pago?: string | null;
  tipo_de_pago?: string | null;
  banco?: string | null;
  autorizacion_stripe?: string | null;
  last_digits?: string | null;
  currency?: string;
  tipo_de_tarjeta?: string | null;
  spei?: string | null;
  referencia?: string | null;
  concepto?: string | null;
  responsable_pago_empresa?: string | null;
  responsable_pago_agente?: string | null;
  total_pago?: number | null;
  subtotal_pago?: number | null;
  impuestos_pago?: number | null;
  pendiente_por_cobrar?: boolean;
  pago_created_at?: Date | string;
  pago_updated_at?: Date | string;
  monto_aplicado_factura?: number | null;
  id_servicio?: string | null;
  total_servicio?: number | null;
  subtotal_servicio?: number | null;
  impuestos_servicio?: number | null;
  otros_impuestos?: number | null;
  is_credito?: boolean;
  fecha_limite_pago?: Date | string | null;
  id_booking?: string | null;
  check_in?: Date | string | null;
  check_out?: Date | string | null;
  estado_booking?: 'Confirmada' | 'Cancelada' | 'En proceso';
  fecha_pago_proveedor?: Date | string | null;
  costo_total?: number | null;
  costo_subtotal?: number | null;
  costo_impuestos?: number | null;
  fecha_limite_cancelacion?: Date | string | null;
  id_solicitud?: string | null;
  confirmation_code?: string | null;
  id_viajero?: string | null;
  hotel?: string | null;
  room?: string | null;
  status_solicitud?: 'pending' | 'complete' | 'canceled';
  id_usuario_generador?: string | null;
  id_agente?: string | null;
  nombre_agente?: string | null;
  tiene_credito_consolidado?: boolean;
  id_empresa?: string | null;
  rfc?:string|null
}