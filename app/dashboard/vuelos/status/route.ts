import { NextResponse } from "next/server";
import { z } from "zod";
import makeFetchCookie from "fetch-cookie";
import { CookieJar } from "tough-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  airlineCode: z.literal("Y4"),
  confirmationCode: z.string().min(4).max(12),
  passengerLastName: z.string().min(2).max(60),
  debug: z.boolean().optional(),
});

type LookupInput = z.infer<typeof Schema>;

type NormalizedBooking = {
  airlineCode: "Y4";
  confirmationCode: string;
  passengerLastName: string;
  status: string | null;
  passengers?: Array<{ name: string }>;
  segments?: Array<{
    origin?: string | null;
    destination?: string | null;
    flightNumber?: string | null;
    departureTime?: string | null;
    arrivalTime?: string | null;
  }>;
  raw?: {
    httpStatus?: number;
    contentType?: string;
    finalUrl?: string;
    safeHeaders?: Record<string, string>;
    errorBodySample?: string;
    // SOLO debug: respuesta completa (puede ser grande)
    volarisResponse?: any;
  };
};

function normalizeLastName(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function pickStatus(payload: any): string | null {
  return (
    payload?.status ??
    payload?.bookingStatus ??
    payload?.booking?.status ??
    payload?.data?.status ??
    null
  );
}

function safeHeaderDump(headers: Headers) {
  // evita set-cookie y cosas sensibles; deja solo algo útil para debug
  const allow = new Set([
    "content-type",
    "server",
    "date",
    "via",
    "x-cache",
    "x-amz-cf-id",
    "x-amz-cf-pop",
    "x-correlation-id",
    "x-request-id",
  ]);

  const out: Record<string, string> = {};
  headers.forEach((v, k) => {
    const key = k.toLowerCase();
    if (allow.has(key)) out[key] = v;
  });
  return out;
}

async function doFetch(
  fetchWithCookies: typeof fetch,
  url: string,
  init?: RequestInit
) {
  const res = await fetchWithCookies(url, {
    ...init,
    redirect: "follow",
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text().catch(() => "");
  return {
    ok: res.ok,
    status: res.status,
    finalUrl: res.url,
    contentType,
    text,
    safeHeaders: safeHeaderDump(res.headers),
  };
}

async function lookupVolaris(input: LookupInput): Promise<NormalizedBooking> {
  const auth = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJEb3RSZXoiLCJqdGkiOiIzMjNhMjQwOC00ZTY2LWE5ZTgtNWNmMi1iZjE3MGZmMTI0YmIiLCJpc3MiOiJkb3RSRVogQVBJIn0.dq9b5Jeymh0LNXoxr24Y2g0QkKeupsPwEO_18sAKi_s"; // <-- ponlo en Vercel
  if (!auth) {
    throw new Error("Falta VOLARIS_AUTHORIZATION en env vars (solo server).");
  }

  const recordLocator = input.confirmationCode.trim().toUpperCase();
  const lastName = normalizeLastName(input.passengerLastName);

  const jar = new CookieJar();
  const fetchWithCookies = makeFetchCookie(fetch, jar) as unknown as typeof fetch;

  // 1) Warm-up para obtener cookies antibot en .volaris.com
  //    (esto suele ser lo que te faltaba vs el navegador)
  const warm = await doFetch(fetchWithCookies, "https://www.volaris.com/mytrips/home", {
    method: "GET",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "es-ES,es;q=0.9",
    },
  });

  // 2) Llamada real al API gateway (la que copiaste)
  const url =
    "https://apigw.volaris.com/prod/api/v1/booking/getbookingbyrecordlocatorandlastname" +
    `?recordlocator=${encodeURIComponent(recordLocator)}` +
    `&lastname=${encodeURIComponent(lastName)}`;

  const r = await doFetch(fetchWithCookies, url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json", // sí, aunque sea GET, a veces el WAF es picky
      "accept-language": "es-ES,es;q=0.9",
      authorization: auth, // sin "Bearer" (igual al copy)
      flow: "MBS",
      frontend: "WEB",
      origin: "https://www.volaris.com",
      referer: "https://www.volaris.com/mytrips/home",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
    },
  });

  // Si falla, regresa debug útil
  if (!r.ok) {
    return {
      airlineCode: "Y4",
      confirmationCode: recordLocator,
      passengerLastName: lastName,
      status: null,
      raw: {
        httpStatus: r.status,
        contentType: r.contentType,
        finalUrl: r.finalUrl,
        safeHeaders: input.debug ? r.safeHeaders : undefined,
        errorBodySample: (r.text || "").slice(0, 1500),
      },
    };
  }

  // Parse JSON
  let payload: any;
  try {
    payload = JSON.parse(r.text);
  } catch {
    return {
      airlineCode: "Y4",
      confirmationCode: recordLocator,
      passengerLastName: lastName,
      status: null,
      raw: {
        httpStatus: r.status,
        contentType: r.contentType,
        finalUrl: r.finalUrl,
        safeHeaders: input.debug ? r.safeHeaders : undefined,
        errorBodySample: (r.text || "").slice(0, 1500),
      },
    };
  }

  return {
    airlineCode: "Y4",
    confirmationCode: recordLocator,
    passengerLastName: lastName,
    status: pickStatus(payload),
    raw: input.debug
      ? {
          httpStatus: r.status,
          contentType: r.contentType,
          finalUrl: r.finalUrl,
          safeHeaders: r.safeHeaders,
          volarisResponse: payload,
        }
      : {
          httpStatus: r.status,
          contentType: r.contentType,
          finalUrl: r.finalUrl,
        },
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Bad request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = await lookupVolaris(parsed.data);
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
