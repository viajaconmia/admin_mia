import { ApiResponse, createApiClient } from "../apiClient";

const cotizacionesIaApi = createApiClient("/v2/mia/cotizaciones-ia");

// ======================================================
// TIPOS — espejo del contrato de cotizaciones MIA (sin precios, a propósito)
// ======================================================

export type QuoteServiceType = "flight" | "car_rental" | "hotel" | "bus";

export type CotizacionIaEstado =
  | "nueva"
  | "en_proceso"
  | "cotizada"
  | "cerrada"
  | "cancelada";

export type CotizacionIaOrigenEntrada =
  | "texto"
  | "pdf"
  | "imagen"
  | "csv"
  | "excel"
  | "mixto";

type QuoteItemBase = {
  id: string;
  type: QuoteServiceType;
  travelers?: number;
  travelerNames?: string[];
  notes?: string;
};

// Opción encontrada por un agente de transporte de mia_ai (sin precio) y anexada al ítem.
export type QuoteFoundOption = {
  id: string;
  provider?: string;
  serviceName?: string;
  departurePoint?: string;
  arrivalPoint?: string;
  estimatedDuration?: string;
  frequencyOrSchedule?: string;
  departureTimes?: string[];
  serviceClass?: string;
  vehicleCategory?: string;
  highlights?: string[];
  sourceUrl?: string;
};

export type FlightQuoteItem = QuoteItemBase & {
  type: "flight";
  tripType?: "oneway" | "roundtrip" | "multicity";
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  airline?: string;
  cabin?: string;
  flightNumber?: string;
  foundOptions?: QuoteFoundOption[];
  preferredOptionId?: string | null;
};

export type CarRentalQuoteItem = QuoteItemBase & {
  type: "car_rental";
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  dropoffDate?: string;
  pickupTime?: string;
  dropoffTime?: string;
  carCategory?: string;
  withDriver?: boolean;
  foundOptions?: QuoteFoundOption[];
  preferredOptionId?: string | null;
};

export type HotelQuoteItem = QuoteItemBase & {
  type: "hotel";
  city?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: number;
  roomType?: string;
  guests?: number;
};

export type BusQuoteItem = QuoteItemBase & {
  type: "bus";
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  busLine?: string;
  serviceClass?: string;
  foundOptions?: QuoteFoundOption[];
  preferredOptionId?: string | null;
};

export type QuoteItem =
  | FlightQuoteItem
  | CarRentalQuoteItem
  | HotelQuoteItem
  | BusQuoteItem;

// ======================================================
// RESPUESTAS Y FILTROS
// ======================================================

export type FiltrosCotizacionesIa = {
  page?: number;
  length?: number;
  estado?: CotizacionIaEstado;
  tipo?: QuoteServiceType;
  q?: string;
};

export type CotizacionIaListItem = {
  id_cotizacion: string;
  estado: CotizacionIaEstado;
  solicitante_nombre: string | null;
  solicitante_correo: string | null;
  resumen: string | null;
  tipos: QuoteServiceType[];
  total_archivos: number;
  created_at: string;
};

export type CotizacionIaArchivo = {
  id: number;
  nombre_archivo: string;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  url_archivo: string;
};

export type CotizacionIaDetalleResponse = {
  id_cotizacion: string;
  id_usuario: string;
  id_agente: string | null;
  solicitante_nombre: string | null;
  solicitante_correo: string | null;
  origen_entrada: CotizacionIaOrigenEntrada;
  resumen: string | null;
  notas: string | null;
  items: QuoteItem[];
  tipos: QuoteServiceType[];
  estado: CotizacionIaEstado;
  created_at: string;
  updated_at: string;
  archivos: CotizacionIaArchivo[];
};

export type ArchivoUrlFirmadaResponse = {
  url: string;
  expiresIn: number;
};

// ======================================================
// SERVICIO (solo lectura)
// ======================================================

export const cotizacionesIaService = {
  listar: (
    filtros: FiltrosCotizacionesIa,
  ): Promise<ApiResponse<CotizacionIaListItem[]>> =>
    cotizacionesIaApi.get<CotizacionIaListItem[]>("", filtros),

  obtener: (id: string): Promise<ApiResponse<CotizacionIaDetalleResponse>> =>
    cotizacionesIaApi.get<CotizacionIaDetalleResponse>(
      `/${encodeURIComponent(id)}`,
    ),

  obtenerUrlArchivo: (
    id: string,
    idArchivo: number,
  ): Promise<ApiResponse<ArchivoUrlFirmadaResponse>> =>
    cotizacionesIaApi.get<ArchivoUrlFirmadaResponse>(
      `/${encodeURIComponent(id)}/archivos/${idArchivo}`,
    ),
};
