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
