export interface Tax {
  id_impuesto: number;
  name: string;
  rate: number;
  mount: number;
  base: number;
  total: number;
}

export interface NightCost {
  night: number;
  baseCost: number;
  taxes: Tax[];
  totalWithTaxes: number;
}

export interface PaymentMethod {
  type: "spei" | "credit_card" | "balance";
  paymentDate: string;
  cardLastDigits?: string;
  comments: string;
}

export interface Tax {
  name: string;
  porcentaje?: string;
  monto?: string;
}

export interface Room {
  id_tipo_cuarto: number;
  nombre_tipo_cuarto: string;
  id_tarifa: number;
  precio: string;
  id_agente: null | string;
  costo: number | null;
}

export interface Hotel {
  id_hotel: string;
  nombre_hotel: string;
  Estado: string;
  Ciudad_Zona: string;
  impuestos: Tax[];
  imagenes: (string | null)[];
  tipos_cuartos: Room[];
}
export interface ReservationFormProps {
  solicitud: Solicitud;
  hotels: Hotel[];
  travelers: Traveler[];
  onClose: () => void;
}

export interface Traveler {
  id_viajero: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  created_at: string;
  updated_at: string;
  nacionalidad: string | null;
  numero_pasaporte: string | null;
  numero_empleado: string | null;
}

export type Solicitud = {
  id_servicio: string;
  estado_reserva: string;
  created_at: string; // o Date si lo vas a convertir
  is_credito: boolean | null;
  id_solicitud: string;
  id_viajero: string;
  hotel: string;
  check_in: string; // o Date
  check_out: string; // o Date
  room: string;
  total: string; // puede ser number si lo vas a convertir
  status: "pending" | "confirmed" | "cancelled" | string;
  id_usuario_generador: string;
  nombre_viajero: string | null;
  id_booking: string | null;
  id_hospedaje: string | null; // <--- Propiedad añadida
  codigo_reservacion_hotel: string | null;
  id_pago: string | null;
  metodo_de_pago: string | null;
  tipo_de_pago: string | null;
  id_credito: string | null;
  pendiente_por_cobrar: string | null;
  monto_a_credito: string | null;
  id_agente: string;
  nombre_viajero_completo: string;
  nombre_agente_completo: string;
  correo: string;
  telefono: string | null; // <--- Tipo corregido para permitir null
  razon_social: string;
  rfc: string | null;
  tipo_persona: string;
};
