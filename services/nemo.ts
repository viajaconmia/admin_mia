import { API_KEY, URL_BACK } from "@/lib/constants";

export interface NemoPassenger {
  ageType: "ADT" | "CHD" | "INF";
  roomSequence: number;
  age?: number;
}

export interface NemoRoom {
  roomSequence: number;
  roomType: string;
}

export interface SearchNemoHotelsDto {
  destinationId: string;
  checkIn: string;
  checkOut: string;
  rooms?: NemoRoom[];
  passengers?: NemoPassenger[];
}

export interface NemoRoomRate {
  roomSequence: number;
  roomType: string;
  boardCode: string;
  boardDescription: string;
}

export interface NemoCancellationPolicy {
  refundable: boolean;
  deadline?: string;
}

export interface NemoRate {
  tripProductId: string;
  rateClass: string;
  amount: number;
  currency: string;
  roomRates: NemoRoomRate[];
  cancellationPolicy: NemoCancellationPolicy;
  bookable: boolean;
  bookableReason?: string;
}

export interface NemoHotel {
  hotelCode: string;
  hotelName: string;
  rating: number;
  address: {
    street: string;
    city: string;
    postalCode: string;
    countryCode: string;
  };
  latitude: number;
  longitude: number;
  rates: NemoRate[];
}

export interface NemoSearchResult {
  transactionId: string;
  provider: string;
  totalItems: number;
  hotels: NemoHotel[];
  rawResponse?: string;
}

export async function searchNemoHotels(
  params: SearchNemoHotelsDto
): Promise<NemoSearchResult> {
  const payload = {
    destinationId: params.destinationId,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    rooms: params.rooms || [{ roomSequence: 1, roomType: "NMO.HTL.RMT.DBL" }],
    passengers: params.passengers || [
      { ageType: "ADT" as const, roomSequence: 1 },
      { ageType: "ADT" as const, roomSequence: 1 },
    ],
  };

  const response = await fetch(`${URL_BACK}/v2/mia/nemo/hotels/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY || "",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || data.message || "Error al buscar en Nemo");
  }

  return data;
}

export async function getNemoHotelDetails(hotelCode: string, language = "es") {
  const response = await fetch(
    `${URL_BACK}/v2/mia/nemo/hotels/${encodeURIComponent(hotelCode)}/details?language=${language}`,
    {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
      },
      cache: "no-store",
    }
  );

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || data.message || "Error al obtener detalles");
  }

  return data;
}

export interface CreateNemoReservationDto {
  bandera: 0 | 1;
  id_agente: string;
  id_viajero: string;
  check_in: string;
  check_out: string;
  noches?: number;
  habitacion?: string;
  hotel: {
    hotelCode: string;
    hotelName: string;
    address?: string;
    destinationName?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  rate: {
    rateId: string;
    roomDescription?: string;
    boardDescription?: string;
    total: number;
    currency: string;
  };
  venta?: {
    total: number;
    subtotal?: number;
    impuestos?: number;
  };
  proveedor?: {
    total: number;
    subtotal?: number;
    impuestos?: number;
  };
  comments?: string;
  ejemplo_saldos?: Array<{
    id_saldo: number;
    saldo_original: number;
    saldo_actual: number;
    aplicado: number;
    id_agente: string;
    metodo_de_pago?: string;
    fecha_pago?: string;
    concepto?: string | null;
    referencia?: string | null;
    currency?: string;
  }>;
}

export async function createNemoReservation(payload: CreateNemoReservationDto) {
  const response = await fetch(`${URL_BACK}/v2/mia/nemo/reservas/crear`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY || "",
    },
    credentials: "include",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || data.message || "Error al crear la reservación en MIA");
  }

  return data;
}
