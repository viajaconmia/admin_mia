import { ApiResponse, ApiService } from "./ApiService";

export class BookingsService extends ApiService {
  private ENDPOINTS = {
    GET: {
      ITEMS: "/items",
      RERESVAS: "/services",
      COTIZACIONES: "/cotizaciones",
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
    id_hospedaje: string
  ): Promise<ApiResponse<Item[]>> => {
    return this.get<Item[]>({
      path: this.formatPath(this.ENDPOINTS.GET.ITEMS),
      params: { id_hospedaje },
    });
  };
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

  public obtenerReservas = async (page, length) =>
    this.get<BookingAll[]>({
      path: this.formatPath(this.ENDPOINTS.GET.RERESVAS),
      params: { page, length },
    });

  public cancelarBooking = async (id_booking) =>
    this.put<{}>({
      path: this.formatPath(this.ENDPOINTS.PUT.CANCELAR),
      body: { id_booking },
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

  id_solicitud: string;
  id_hospedaje: string | null;
  id_renta_autos: string | null;
  id_viaje_aereo: string | null;
  id_booking: string;
  id_servicio: string;
  id_agente: string;

  reservante: string;
  correo_cliente: string;
  telefono_cliente: string;

  status_reserva: string;
  total_booking: string;
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
  usuario_creador:string;
};
