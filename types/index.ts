export interface TypeFilters {
  id_booking?: "Active" | "Inactive";
  codigo_reservacion?: string | null;
  client?: string | null;
  traveler?: string | null;
  hotel?: string | null;
  nombre?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  recordCount?: string | null;
  empresa?: string | null;
  status?: "Confirmada" | "Pendiente" | "Cancelada" | "Todos" | null;
  reservationStage?: "Reservado" | "In house" | "Check-out" | null;
  paymentMethod?: "Credito" | "Contado" | null;
  filterType?: "Check-in" | "Check-out" | "Transaccion" | "Creacion" | null;
  active?: "Activo" | "Inactivo" | null;
  hay_convenio?: "SI" | "NO";
  tipo_negociacion?: string | null;
  estado?: string | null;
  ciudad?: string | null;
  sencilla_precio_min?: number | null;
  sencilla_precio_max?: number | null;
  sencilla_costo_min?: number | null;
  sencilla_costo_max?: number | null;
  doble_precio_min?: number | null;
  doble_precio_max?: number | null;
  doble_costo_min?: number | null;
  doble_costo_max?: number | null;
  incluye_desayuno?: boolean | "SI" | "NO" | null;
  acepta_mascotas?: "SI" | "NO";
  tiene_transportacion?: "SI" | "NO";
  tipo_pago?: "CREDITO" | "PREPAGO";
  rfc?: string | null;
  razon_social?: string | null;
  tipo_hospedaje?: string | null;
  correo?: string | null;
  infoCompleta?: string | null;
  activo?: boolean | "ACTIVO" | "INACTIVO" | null;
  pais?: string | null;
  reservante?: "Operaciones" | "Cliente";
  markUp?: number;
  id_client?: string | null;
  statusPagoProveedor?: null | string;
  markup_start?: null | number;
  markup_end?: null | number;
  telefono?: number | null;
  estado_credito?: "Activo" | "Inactivo" | null;
  vendedor?: string | null;
  notas?: string | null;
  startCantidad?: number | null;
  endCantidad?: number | null;
}

export type Solicitud = {
  id_servicio?: string;
  estado_reserva?: string;
  created_at?: string; // o Date si lo vas a convertir
  is_credito?: boolean | null;
  id_solicitud?: string;
  id_viajero?: string;
  comments?: string;
  hotel?: string;
  check_in?: string; // o Date
  check_out?: string; // o Date
  room?: string;
  costo_total?: string; // puede ser number si lo vas a convertir
  total?: string; // puede ser number si lo vas a convertir
  status?: "pending" | "confirmed" | "cancelled" | string;
  id_usuario_generador?: string;
  nombre_viajero?: string | null;
  id_booking?: string | null;
  id_hospedaje?: string | null; // <--- Propiedad añadida
  codigo_reservacion_hotel?: string | null;
  id_pago?: string | null;
  metodo_de_pago?: string | null;
  tipo_de_pago?: string | null;
  id_credito?: string | null;
  pendiente_por_cobrar?: string | null;
  monto_a_credito?: string | null;
  id_agente?: string;
  nombre_viajero_completo?: string;
  nombre_agente_completo?: string;
  correo?: string;
  telefono?: string | null; // <--- Tipo corregido para permitir null
  razon_social?: string;
  rfc?: string | null;
  tipo_persona?: string;
};
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

// Interfaz para los impuestos dentro de la entidad Hotel
export interface HotelTax {
  name: string;
  porcentaje?: string; // El JSON muestra strings, ej "16.00"
  monto?: string; // El JSON muestra strings, ej "0.00"
}

// Interfaz para los tipos de cuartos dentro de Hotel
export interface Room {
  id_tipo_cuarto: number;
  nombre_tipo_cuarto: string;
  id_tarifa: number;
  precio: string; // El JSON muestra string, ej "1513.80"
  costo: string | null; // AJUSTADO: El JSON muestra string "1249.50" o podría ser null
  id_agente: null | string;
}

// Interfaz para la entidad Hotel (usada en ReservaForm)
export interface Hotel {
  id_hotel: string;
  nombre_hotel: string;
  Estado: string;
  Ciudad_Zona: string;
  impuestos: HotelTax[]; // Usando la HotelTax definida arriba
  imagenes: (string | null)[]; // El JSON muestra "" que puede ser string vacío o null
  tipos_cuartos: Room[];
}

// Tipo para Viajero (usado en ReservaForm)
export type Viajero = {
  nombre_completo?: string;
  id_viajero?: string;
  correo?: string;
  genero?: string | null; // AJUSTADO: para permitir null como en el JSON
  fecha_nacimiento?: string | null; // AJUSTADO: para permitir null
  telefono?: string | null; // AJUSTADO: para permitir null
  nacionalidad?: string | null;
  numero_pasaporte?: string | null;
  numero_empleado?: string | null;
};

// Interfaz para los impuestos dentro de cada item de ReservaForm.items
export interface ItemLevelTax {
  name: string;
  rate: number;
  tipo_impuesto: string;
  monto: number;
  base: number;
  total: number;
}

export interface ReservaForm {
  codigo_reservacion_hotel?: string;
  hotel: {
    name: string; // Nombre del hotel, ej. "CHN MONTERREY NORTE"
    content?: Hotel; // Objeto Hotel detallado, opcional si a veces solo viene el nombre
  };
  habitacion: string;
  check_in: string; // Formato YYYY-MM-DD
  check_out: string; // Formato YYYY-MM-DD
  viajero?: Viajero; // Usando el tipo Viajero ajustado
  estado_reserva: "Confirmada" | "En proceso" | "Cancelada";
  comments: string;
  proveedor: {
    total: number | null;
    subtotal: number;
    impuestos: number;
  };
  impuestos: {
    // Impuestos generales a nivel de reserva
    iva: number;
    ish: number;
    otros_impuestos: number;
    otros_impuestos_porcentaje: number;
  };
  venta: {
    markup?: number;
    total: number;
    subtotal: number;
    impuestos: number;
  };
  items?: {
    id_item?: string;
    noche: number;
    costo: {
      total: number;
      subtotal: number;
      impuestos: number;
    };
    venta: {
      total: number;
      subtotal: number;
      impuestos: number;
    };
    impuestos?: ItemLevelTax[]; // Usando la ItemLevelTax definida arriba
  }[];
  noches: number;
  solicitud: Solicitud;
}

export interface EdicionForm {
  hotel?: {
    before: {
      name: string;
      content: Hotel;
    };
    current: {
      name: string;
      content: Hotel;
    };
  };
  habitacion?: {
    before: string;
    current: string;
  };
  check_in?: {
    before: string;
    current: string;
  };
  check_out?: {
    before: string;
    current: string;
  };
  codigo_reservacion_hotel?: {
    before: string;
    current: string;
  };
  viajero?: {
    before: Viajero;
    current: Viajero;
  };
  estado_reserva?: {
    before: "Confirmada" | "Cancelada" | "En proceso";
    current: "Confirmada" | "Cancelada" | "En proceso";
  };
  comments?: {
    before: string;
    current: string;
  };
  proveedor?: {
    before: {
      total: number;
      subtotal: number;
      impuestos: number;
    };
    current: {
      total: number;
      subtotal: number;
      impuestos: number;
    };
  };
  venta?: {
    before: {
      total: number;
      subtotal: number;
      impuestos: number;
      markup: number;
    };
    current: {
      total: number;
      subtotal: number;
      impuestos: number;
      markup: number;
    };
  };
  items?: {
    before: ReservaForm["items"];
    current: ReservaForm["items"];
  };
  noches?: {
    before: number;
    current: number;
  };
  impuestos?: {
    before: {
      iva: number;
      ish: number;
      otros_impuestos: number;
      otros_impuestos_porcentaje: number;
    };
    current: {
      iva: number;
      ish: number;
      otros_impuestos: number;
      otros_impuestos_porcentaje: number;
    };
  };
  solicitud?: Solicitud;
}

/**
 * Interfaz para los datos de actualización de una empresa.
 * Todas las propiedades son opcionales y pueden ser nulas.
 */
interface EmpresaUpdateData {
  tiene_credito?: number | null; // tinyint en la BD, usualmente 0 o 1
  monto_credito?: number | null; // decimal en la BD
}

/**
 * Interfaz para los datos de actualización de un viajero.
 * Todas las propiedades son opcionales y pueden ser nulas.
 */
interface ViajeroUpdateData {
  numero_pasaporte?: string | null;
  nacionalidad?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null; // Se espera una cadena en formato de fecha, ej: "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss"
  numero_empleado?: string | null;
}

/**
 * Interfaz para los datos de actualización de un agente.
 * Todas las propiedades son opcionales y pueden ser nulas.
 */
interface AgenteUpdateData {
  tiene_credito_consolidado?: number | null; // tinyint en la BD, usualmente 0 o 1
  monto_credito?: string | number | null; // decimal en la BD. Se permite string por tu ejemplo original ("54677").
  // Considera unificar a 'number | null' si siempre se espera un número.
  vendedor?: string | null;
  notas?: string | null;
}

/**
 * Interfaz para el cuerpo de la solicitud (request body) del endpoint de actualización.
 * Las claves principales ("empresas", "viajero", "agente") son opcionales.
 * Dentro de cada una, se espera un objeto donde las claves son los IDs (strings)
 * y los valores son los objetos de datos de actualización correspondientes.
 */
export interface UpdateRequestBody {
  empresas?: Record<string, EmpresaUpdateData>;
  viajero?: Record<string, ViajeroUpdateData>;
  agente?: Record<string, AgenteUpdateData>;
}
