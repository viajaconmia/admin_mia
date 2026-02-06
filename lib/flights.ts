import type { AirlineCode, VueloComprado } from "./../services/flights";

export type VueloDbRow = {
  id_vuelo: string;
  airline: string | null;        // "AEROMEXICO"
  airline_code: string | null;   // a veces viene vacío
  flight_number: string | null;

  departure_airport: string | null; // "Aarhus, Denmark (AAR/EKAH)"
  arrival_airport: string | null;   // "Allentown... (ABE/KABE ...)"
  departure_date: string | null;    // "2025-12-12"
  departure_time: string | null;    // "01:00:00"
  arrival_date: string | null;
  arrival_time: string | null;

  departure_city: string | null;
  arrival_city: string | null;

  codigo_confirmacion: string | null;

  nombre_completo: string | null;
  correo: string | null;
  apellido_paterno: string | null;
  apellido_materno:string|null;

  seat_number: string | null;
  seat_location: string | null;
};

export function normalizeAirlineCode(airline: string | null, airline_code: string | null): AirlineCode {
  const raw = (airline_code || "").trim().toUpperCase();
  if (raw === "AM") return "AM";
  if (raw === "Y4") return "Y4";

  const a = (airline || "").trim().toUpperCase();
  if (a.includes("AEROMEXICO")) return "AM";
  if (a.includes("VOLARIS")) return "Y4";

  // fallback seguro (ajusta si manejas más)
  return "AM";
}

export function extractIata(airportText: string | null): string | null {
  if (!airportText) return null;
  const t = airportText.trim();

  // ✅ Caso PDF: "GDL Don Miguel Hidalgo..."
  const start = t.match(/^([A-Z0-9]{3})\b/);
  if (start?.[1]) return start[1].toUpperCase();

  // Caso "Aarhus, Denmark (AAR/EKAH)"
  const paren = t.match(/\(([A-Z0-9]{3})\s*\//i);
  if (paren?.[1]) return paren[1].toUpperCase();

  // fallback suave
  const any = t.match(/\b([A-Z0-9]{3})\b/);
  return any?.[1]?.toUpperCase() ?? null;
}


export function mapVueloRowToComprado(r: VueloDbRow): VueloComprado {
  
  const airlineCode = normalizeAirlineCode(r.airline, r.airline_code);

  function normalizeLastNames(apPat?: string | null, apMat?: string | null) {
  const parts = [apPat, apMat]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  // normaliza espacios múltiples, mayúsculas opcional
  return parts.join(" ").replace(/\s+/g, " ");
}


  return {
    id: String(r.id_vuelo),
    airlineName: (r.airline || "").trim(),
    airlineCode,
    flightNumberRaw: r.flight_number?.trim() || null,

    departureDateISO: (r.departure_date || "").slice(0, 10),
    departureTime: r.departure_time,
    arrivalDateISO: (r.arrival_date || "").slice(0, 10),
    arrivalTime: r.arrival_time,

    originIata: extractIata(r.departure_airport),
    destinationIata: extractIata(r.arrival_airport),

    originCity: r.departure_city,
    destinationCity: r.arrival_city,

    confirmationCode: r.codigo_confirmacion,
    passengerFullName: r.nombre_completo || "Sin nombre",
    passengerEmail: r.correo,
    passengerLastName: normalizeLastNames(r.apellido_paterno, r.apellido_materno),

    seatNumber: r.seat_number,
    seatLocation: r.seat_location,
  };
}
