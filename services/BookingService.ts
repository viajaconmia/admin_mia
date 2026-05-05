import { ApiResponse, ApiService } from "./ApiService";

export class BookingsService extends ApiService {
  private ENDPOINTS = {
    GET: {
      ITEMS: "/items",
      RERESVAS: "/services",
      COTIZACIONES: "/cotizaciones",
      CUPON: "/v2/cupon",
    },
    PUT: {
      ITEMS: "/items",
      CANCELAR: "/cancelar",
    },
  };

  constructor() {
    super("/mia/reservas");
  }

  public obtenerItemsDeHospedaje = async (
    id_hospedaje: string,
  ): Promise<ApiResponse<Item[]>> => {
    return this.get<Item[]>({
      path: this.formatPath(this.ENDPOINTS.GET.ITEMS),
      params: { id_hospedaje },
    });
  };

  public obtenerCupon = async (
    id: string,
  ): Promise<ApiResponse<SolicitudCupon>> =>
    this.get<any>({
      path: this.formatPath(this.ENDPOINTS.GET.CUPON),
      params: { id },
    });

  public obtenerCotizaciones = async (): Promise<ApiResponse<any>> => {
    return this.get({
      path: this.formatPath(this.ENDPOINTS.GET.COTIZACIONES),
    });
  };
  public actualizarItems = async (items: (Item & { edit: boolean })[]) => {
    return this.put({
      path: this.formatPath(this.ENDPOINTS.PUT.ITEMS),
      body: { items },
    });
  };

  public obtenerReservas = async (params: any) =>
    this.get<BookingAll[]>({
      path: this.formatPath(this.ENDPOINTS.GET.RERESVAS),
      params,
    });

  public cancelarBooking = async (id_booking, confirm = false) =>
    this.put<{ estatus: string }>({
      path: this.formatPath(this.ENDPOINTS.PUT.CANCELAR),
      body: { id_booking, confirm },
    });
}

export type Item = {
  id_item: string;
  id_catalogo_item: string | null;
  id_factura: string | null;
  total: string;
  subtotal: string;
  impuestos: string;
  is_facturado: number; // 0 o 1
  fecha_uso: string; // ISO date string
  id_hospedaje: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  costo_total: string;
  costo_subtotal: string;
  costo_impuestos: string;
  saldo: string;
  costo_iva: string;
};

export type BookingAll = {
  id_viajero: string;
  viajero: string;
  intermediario: string;
  id_intermediario: number;

  id_solicitud: string;
  id_hospedaje: string | null;
  id_renta_autos: string | null;
  id_viaje_aereo: string | null;
  id_booking: string;
  id_servicio: string;
  id_agente: string;
  estado_pago: string;
  estado_facturacion: string;
  id_proveedor: string;

  reservante: string;
  correo_cliente: string;
  telefono_cliente: string;

  estado: "Confirmada" | "En proceso" | "Cancelada";
  total: string;
  etapa_reservacion: string;

  check_in: string;
  check_out: string;
  created_at: string;

  horario_salida: string | null;
  horario_llegada: string | null;
  origen: string | null;
  destino: string | null;

  proveedor: string;
  agente: string;
  type: string;
  tipo_cuarto_vuelo: string;
  costo_total: string;
  metodo_pago: string;

  comments: string;
  nuevo_incluye_desayuno: boolean | null;
  codigo_confirmacion: string;
  usuario_creador: string;
};

type BaseSolicitud = {
  type: string;
};

export type SolicitudHotel = BaseSolicitud & {
  type: "hotel";

  check_in: string; // ISO date
  check_out: string; // ISO date
  codigo_confirmacion: string;
  comentarios: string;
  id_hotel_resuelto: string;
  direccion: string;
  hotel: string;
  acompañantes: string;
  huesped: string;
  id_solicitud: string;
  room: "SENCILLO" | "DOBLE" | "TRIPLE" | string;
  incluye_desayuno: 0 | 1;
  total_solicitud: string;
  created_at_solicitud: string; // ISO date
};

export type SolicitudCupon =
  | SolicitudHotel
  | SolicitudVuelo
  | SolicitudRentaCarros;

export type VueloDetalle = {
  id_vuelo: number;
  flight_number: string;
  airline: string;

  eq_mano: string | null;
  eq_personal: string | null;
  eq_documentado: string | null;

  departure_airport: string;
  departure_city: string;
  departure_date: string; // ISO date
  departure_time: string; // HH:mm:ss

  arrival_airport: string;
  arrival_city: string;
  arrival_date: string; // ISO date
  arrival_time: string; // HH:mm:ss

  parada: number;
  seat_number: string;
  fly_type: "ida" | "ida escala" | "vuelta" | "vuelta escala" | string;

  comentarios: string | null;
  rate_type: string;
  viajero: string;
};

export type SolicitudVuelo = {
  type: "vuelo";
  total: string;

  id_viaje_aereo: string;
  id_solicitud: string;
  origen: string;
  viajero: string;
  destino: string;
  tipo:
    | "SENCILLO"
    | "REDONDO"
    | "REDONDO CON ESCALA"
    | "SENCILLO CON ESCALA"
    | string;
  codigo_confirmacion: string;

  vuelos: VueloDetalle[];
};

export type ConductorAdicional = {
  activo: number; // 0 | 1
  correo: string | null;
  genero: string | null;
  is_user: number; // 0 | 1
  telefono: string | null;

  id_agente: string;
  id_viajero: string;

  created_at: string; // ISO
  updated_at: string; // ISO

  nacionalidad: string | null;
  primer_nombre: string;
  segundo_nombre: string | null;
  nombre_completo: string;

  apellido_paterno: string | null;
  apellido_materno: string | null;

  numero_empleado: string | null;
  fecha_nacimiento: string | null;
  numero_pasaporte: string | null;
};

export type SolicitudRentaCarros = {
  type: "renta_carros";

  nombre_proveedor: string;
  codigo_confirmation: string;

  id_conductor_principal: string;
  conductor_principal: string;
  viajero: string;

  check_in: string; // ISO date
  check_out: string; // ISO date

  conductores_adicionales: ConductorAdicional[];

  tipo_auto: string;
  transmission: "AUTOMATICO" | "MANUAL" | string;

  lugar_recoger_auto: string;
  hora_recoger_auto: string; // HH:mm
  id_sucursal_recoger_auto: string;

  lugar_dejar_auto: string;
  hora_dejar_auto: string; // HH:mm
  id_sucursal_dejar_auto: string;

  dias: number;

  seguro_incluido: string | null;
  additional_driver: number; // 0 | 1
};
