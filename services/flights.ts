export type AirlineCode = "AM" | "Y4";

export type VueloComprado = {
  id: string; // id_vuelo
  airlineName: string; // "AEROMEXICO" | "VOLARIS" | etc
  airlineCode: AirlineCode; // "AM" o "Y4"
  flightNumberRaw: string | null; // lo que venga en BD (puede ser raro)
  departureDateISO: string; // YYYY-MM-DD
  departureTime?: string | null;  // HH:mm:ss
  arrivalDateISO: string;
  arrivalTime?: string | null;

  originIata: string | null;
  destinationIata: string | null;

  originCity?: string | null;
  destinationCity?: string | null;

  confirmationCode?: string | null; // codigo_confirmacion
  passengerFullName: string;
  passengerEmail?: string | null;
  passengerLastName?: string | null;

  // por si lo necesitas en el PDF
  seatNumber?: string | null;
  seatLocation?: string | null;
};

export type FlightStatusRequest = {
  airlineCode: AirlineCode;
  // Puedes mandar ambos: si no hay flight number confiable, usa confirmation + lastName
  flightNumber?: string | null;
  departureDateISO: string;
  originIata?: string | null;
  destinationIata?: string | null;

  confirmationCode?: string | null;
  passengerLastName?: string | null;
};

export type FlightStatusResponse = {
  airlineCode: AirlineCode;
  fetchedAtISO: string;
  source: "mock" | "scrape";

  status: "ON_TIME" | "DELAYED" | "CANCELLED" | "BOARDING" | "UNKNOWN";
  statusText?: string;

  scheduledDeparture?: string;
  estimatedDeparture?: string;
  scheduledArrival?: string;
  estimatedArrival?: string;

  terminal?: string;
  gate?: string;
};
