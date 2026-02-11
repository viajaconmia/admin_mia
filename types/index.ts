export interface TypeFilters {
  id_booking?: "Active" | "Inactive";
  codigo_reservacion?: string | null;
  client?: string | null;
  id_movimiento?: number | null;
  raw_id?: string | null;
  proveedor?: string | null;
  traveler?: string | null;
  hotel?: string | null;
  nombre?: string | null;
  nombre_agente?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  cliente?: string | null;
  recordCount?: string | null;
  empresa?: string | null;
  hasDiscount?: string | null;
  is_facturado?: number | null;
  origen_pago?: string | null;
  nombre_cliente?: string | null;
  estatus_pagos?: string | null;
  link_pago?: string | null;
  status?: "Confirmada" | "Pendiente" | "Cancelada" | "Todos" | null;
  reservationStage?: "Reservado" | "In house" | "Check-out" | null;
  paymentMethod?:
    | "Credito"
    | "Tarjeta"
    | "Contado"
    | "Wallet"
    | "Tranferencia"
    | ""
    | null;
  filterType?:
    | "Check-in"
    | "Check-out"
    | "Transaccion"
    | "Creacion"
    | "Actualizacion"
    | null;
  active?: "Activo" | "Inactivo" | null;
  metodo?: "Credito" | "Contado" | null;
  hay_convenio?: "SI" | "NO";
  tipo_negociacion?: string | null;
  estado?: string | null;
  ciudad?: string | null;
  banco?: string | null;
  last_digits?: string | null;
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
  activo?: boolean | "ACTIVO" | "INACTIVO" | 1 | 0 | null;
  pais?: string | null;
  reservante?: "Operaciones" | "Cliente";
  markUp?: number;
  id_client?: string | null;
  id_agente?: string | null;
  id_cliente?: string | null;
  statusPagoProveedor?: null | string;
  markup_start?: null | number;
  markup_end?: null | number;
  telefono?: number | null;
  estado_credito?: "Activo" | "Inactivo" | null;
  vendedor?: string | null;
  notas?: string | null;
  startCantidad?: number | null;
  endCantidad?: number | null;
  id_stripe?: string | null;
  facturable?: boolean | null;
  comprobante?: boolean | null;
  paydate?: string | null;
  fecha_creacion?: string | null;
  uuid?: string | null;
  fecha_pago?: string | null;
  estatusFactura?:
    | "Confirmada"
    | "Cancelada"
    | "En proceso"
    | "Sin Asignar"
    | null;
  id_factura?: string | null;
}

export interface EmpresaFromAgent {
  id?: string | null;
  razon_social?: string | null;
  rfc?: string | null;
  [key: string]: any; // Para propiedades adicionales
}

export interface Agente {
  id_agente: string;
  nombre_agente_completo: string;
  correo: string;
  telefono: string;
  created_at: string;
  tiene_credito_consolidado: boolean | number; // Acepta ambos tipos
  saldo?: number;
  wallet?: string;
  notas?: string;
  vendedor?: string;
}

export interface AgenteConSaldos extends Agente {
  saldos_facturables: Array<{
    id_saldos: number;
    fecha_creacion: string;
    saldo: number;
    monto: number;
    metodo_pago: string;
    fecha_pago: string;
    concepto: string;
    referencia: string;
    currency: string;
    tipo_tarjeta: string;
    ult_digits: string;
    comentario: string;
    link_stripe: string;
    is_facturable: boolean;
    is_descuento: boolean;
    comprobante: string;
    activo: boolean;
    numero_autorizacion: string;
    banco_tarjeta: string;
  }>;
}

export type Solicitud = {
  nuevo_incluye_desayuno?: boolean | null;
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
  //viajeros_adicionales ?: string[];
  viajeros_adicionales?: string[];
};
//TEMPORAL

export interface Solicitud2 {
  id_hotel: string | null;
  id_agente: string;
  id_servicio: string;
  id_solicitud: string;
  id_hospedaje: string;
  id_hotel_solicitud: string;
  id_hotel_reserva: string;
  id_viajero_solicitud: string;
  id_viajero_reserva: string;
  id_booking: string;
  id_pago: string | null;
  id_credito: string | null;
  id_factura: string | null;
  id_facturama: string | null;
  status_solicitud: string;
  status_reserva: string;
  etapa_reservacion: string;
  created_at_solicitud: string;
  created_at_reserva: string;
  hotel_solicitud: string;
  hotel_reserva: string;
  check_in: string;
  check_out: string;

  room: string;
  tipo_cuarto: string;
  total: string;
  quien_reservó: string;
  nombre_viajero_solicitud: string;
  nombre_viajero_reservacion: string;
  updated_at: string;
  costo_total: string;
  comments: string;
  confirmation_code: string;
  codigo_reservacion_hotel: string;
  metodo_pago_dinamico: "Credito" | "Contado";
  nombre_cliente: string;
  correo: string;
  telefono: string;
  rfc: string | null;
  tipo_persona: string;
  viajeros_acompañantes: string[] | null;
  items_reserva: string[];
  items_de_la_reserva: string[];
  origen: string;
}

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
  incluye_desayuno?: number;
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
  is_user: 1 | 0;
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
  metadata: Solicitud;
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
  saldo?: number | null; // decimal en la BD
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
  saldo?: string | number | null; // decimal en la BD. Se permite string por tu ejemplo original ("54677").
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

export interface CreditCardInfo {
  id: string;
  alias: string;
  nombre_titular: string;
  ultimos_4: string;
  numero_completo: string;
  banco_emisor: string | null;
  tipo_tarjeta: "credit" | "debit" | null;
  fecha_vencimiento: string;
  activa: boolean;
  cvv: string;
  url_identificacion: string | null;
}

export type SuccessResponse<T = any> = {
  ok: true;
  message: string;
  data: T;
};

type ErrorDetails = {
  message: string;
  [key: string]: unknown;
};

export type ErrorResponse = {
  ok: false;
  error: string;
  details: ErrorDetails;
};

export type GeneralResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// --- Tipos para Pagos ---

// Basado en la tabla 'pagos_proveedor'
export type PagoProveedor = {
  id_pago_proveedor: number;
  monto_pagado: string; // DECIMAL(12,2) -> string en JSON
  forma_pago_ejecutada: string | null; // VARCHAR(50)
  id_tarjeta_pagada: string | null; // CHAR(36)
  id_cuenta_bancaria: string | null; // CHAR(36)
  url_comprobante_pago: string | null; // TEXT
  fecha_pago: string; // TIMESTAMP -> string (ISO 8601)
  fecha_transaccion_tesoreria: string; // TIMESTAMP -> string (ISO 8601)
  usuario_tesoreria_pago: string | null; // CHAR(36)
  comentarios_tesoreria: string | null; // TEXT
  numero_autorizacion: string | null; // VARCHAR(100)
  creado_en: string; // TIMESTAMP
  actualizado_en: string; // TIMESTAMP
  estado_pago: string | null;
  estatus_pagos?: string | null;
  // Ten en cuenta que tu JSON de ejemplo también incluye id_solicitud_proveedor
  // y monto_aplicado directamente en los objetos 'pagos'.
  id_solicitud_proveedor: number; // de pagos_solicitudes
  monto_aplicado: string; // de pagos_solicitudes
};

// --- Tipos para Facturas ---

// Basado en la tabla 'facturas_pago_proveedor'
export type FacturaProveedor = {
  id_factura_proveedor: number;
  uuid_cfdi: string; // VARCHAR(36) NOT NULL
  rfc_emisor: string; // VARCHAR(13) NOT NULL
  razon_social_emisor: string | null; // TEXT
  monto_facturado: string | null; // DECIMAL(12,2) -> string en JSON
  url_xml: string | null; // TEXT
  url_pdf: string | null; // TEXT
  fecha_factura: string | null; // DATE -> string (YYYY-MM-DD) o (ISO 8601)
  es_credito: boolean | 0 | 1; // BOOLEAN -> 0 o 1 en MySQL, boolean en TS
  estado_factura: string | null; // VARCHAR(50)

  // También incluye las propiedades de la tabla intermedia si se anidan directamente
  id_solicitud_proveedor: number; // de facturas_solicitudes
  monto_aplicado: string | null; // de facturas_solicitudes
};

// --- Tipo para la información principal de SolicitudProveedor (los campos que se fusionan) ---
// Estos son los campos de la tabla `solicitudes_pago_proveedor` que vienen en el nivel principal
// junto con los campos de tu tipo 'Solicitud' original.
export type SolicitudProveedorCore = {
  id_solicitud: any;
  codigo_dispersion: string | null;
  id_solicitud_proveedor: number;
  fecha_solicitud: string; // TIMESTAMP -> string (ISO 8601)
  monto_solicitado: string; // DECIMAL(12,2) -> string
  saldo: string; // DECIMAL(12,2) -> string
  forma_pago_solicitada: "credit" | "transfer" | "card" | "link" | string; // ENUM
  id_tarjeta_solicitada: string | null; // CHAR(36)
  usuario_solicitante: string | null; // CHAR(36)
  usuario_generador: string | null; // CHAR(36)
  comentarios: string | null; // TEXT
  estado_solicitud: string; // ENUM "pendiente","pagada", etc.
  estado_consolidado: "pendiente" | "parcial" | "completado" | string; // ENUM
  estado_facturacion: string; // Asumo string para este campo añadido
};

export type TarjetaInfo = {
  ultimos_4: string | null;
  banco_emisor: string | null;
  tipo_tarjeta: string | null;
};

export type ProveedorInfo = {
  rfc: string | null;
  razon_social: string | null;
};

// --- El nuevo tipo que representa la Solicitud con todos los detalles anidados ---
// Combina tu tipo 'Solicitud' existente con SolicitudProveedorCore y los arrays de sub-recursos.
export type SolicitudProveedor = Solicitud & {
  solicitud_proveedor: SolicitudProveedorCore;
  // Nuevos objetos anidados
  tarjeta: TarjetaInfo;
  proveedor: ProveedorInfo;
  pagos: PagoProveedor[];
  facturas: FacturaProveedor[];
  codigo_dispersion?: string | null;
  cuenta_de_deposito?: string | null;
};
