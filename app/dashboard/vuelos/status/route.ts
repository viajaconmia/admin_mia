import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Schema = z.object({
  airlineCode: z.enum(["AM", "Y4"]),
  flightNumber: z.string().min(1).nullable().optional(),
  departureDateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  originIata: z.string().length(3).nullable().optional(),
  destinationIata: z.string().length(3).nullable().optional(),

  confirmationCode: z.string().min(1).nullable().optional(),
  passengerLastName: z.string().min(1).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad request", details: parsed.error.flatten() }, { status: 400 });
    }

    const p = parsed.data;

    // ✅ aquí decides la estrategia real:
    // 1) Si tienes flightNumber confiable -> consultar "flight status"
    // 2) Si NO -> intentar por confirmationCode + lastName (manage booking)
    // Por ahora mock:
    const now = new Date().toISOString();

    const resp = {
      airlineCode: p.airlineCode,
      fetchedAtISO: now,
      source: "mock",
      status: "UNKNOWN",
      statusText:
        p.flightNumber
          ? "Mock: status por número de vuelo"
          : "Mock: status por código confirmación",
      scheduledDeparture: undefined,
      estimatedDeparture: undefined,
      scheduledArrival: undefined,
      estimatedArrival: undefined,
      terminal: undefined,
      gate: undefined,
    };

    return NextResponse.json(resp, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e?.message ?? "Unknown" }, { status: 500 });
  }
}
