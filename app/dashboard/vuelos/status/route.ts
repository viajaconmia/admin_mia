import { NextResponse } from "next/server";
import { z } from "zod";
import { volarisLookupBooking } from "@/lib/volaris";

export const runtime = "nodejs";

const Schema = z.object({
  airlineCode: z.enum(["AM", "Y4"]),
  flightNumber: z.string().nullable().optional(),
  departureDateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  originIata: z.string().length(3).nullable().optional(),
  destinationIata: z.string().length(3).nullable().optional(),
  confirmationCode: z.string().nullable().optional(),
  passengerLastName: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const debugAllowed =
    !!req.headers.get("x-debug-key") &&
    !!process.env.INTERNAL_DEBUG_KEY &&
    req.headers.get("x-debug-key") === process.env.INTERNAL_DEBUG_KEY;

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const p = parsed.data;

    if (p.airlineCode !== "Y4") {
      return NextResponse.json(
        {
          airlineCode: p.airlineCode,
          fetchedAtISO: new Date().toISOString(),
          source: "mock",
          status: "UNKNOWN",
          statusText: "Aún no implementado",
        },
        { status: 200 }
      );
    }

    const conf = (p.confirmationCode ?? "").trim();
    const last = (p.passengerLastName ?? "").trim();

    if (!conf || !last) {
      return NextResponse.json(
        {
          airlineCode: "Y4",
          fetchedAtISO: new Date().toISOString(),
          source: "scrape",
          status: "UNKNOWN",
          statusText: "Faltan confirmationCode o passengerLastName",
        },
        { status: 200 }
      );
    }

   const r = await volarisLookupBooking({
    confirmationCode: conf,
    lastName: last,
      debug: debugAllowed, // ✅ clave
  });


    if (!r.ok) {
      return NextResponse.json(
        {
          airlineCode: "Y4",
          fetchedAtISO: new Date().toISOString(),
          source: "scrape",
          status: "UNKNOWN",
          statusText: r.error,
          debug: debugAllowed ? r.debug : undefined,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        airlineCode: "Y4",
        fetchedAtISO: new Date().toISOString(),
        source: "scrape",
        status: "OK",
        data: r.json,
        debug: debugAllowed ? r.debug : undefined,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", details: e?.message ?? "Unknown" },
      { status: 500 }
    );
  }
}
