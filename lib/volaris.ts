// lib/volaris.ts
export type VolarisLookupArgs = {
  confirmationCode: string;
  lastName: string; // "PATERNO MATERNO"
};

export type VolarisLookupOk = {
  ok: true;
  status: number;
  json: any;
  debug: any[];
};

export type VolarisLookupErr = {
  ok: false;
  status: number;
  error: string;
  debug: any[];
};

export type VolarisLookupResult = VolarisLookupOk | VolarisLookupErr;

function normalizeLastName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function truncate(s: string, n = 240) {
  return s && s.length > n ? s.slice(0, n) + "…" : s;
}

function safeJsonParse(raw: string) {
  try { return JSON.parse(raw); } catch { return null; }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function looksLikeSuccessJson(json: any) {
  if (!json) return false;
  return Boolean(
    json.booking ||
    json.reservation ||
    json.itinerary ||
    json.journeys ||
    json.segments ||
    json.passengers ||
    json.data
  );
}

function makeAuthVariants(token: string) {
  const t = token.trim();
  const isBearer = /^Bearer\s+/i.test(t);
  // Intentamos: como viene + Bearer si no lo trae
  return isBearer ? [t] : [t, `Bearer ${t}`];
}

// lib/volaris.ts
export async function volarisLookupBooking(args: { confirmationCode: string; lastName: string }) {
  const base =
    process.env.VOLARIS_BOOKING_ENDPOINT?.trim() ||
    "https://apigw.volaris.com/prod/api/v1/booking/getbookingbyrecordlocatorandlastname";

  const authEnv = process.env.VOLARIS_AUTHORIZATION;
  if (!authEnv) {
    return { ok: false as const, status: 500, error: "Missing VOLARIS_AUTHORIZATION env var", debug: [] as any[] };
  }

  const code = args.confirmationCode.trim().toUpperCase();
  const last = args.lastName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const url = new URL(base);
  // 👇 OJO: params exactos de tu captura
  url.searchParams.set("recordlocator", code);
  url.searchParams.set("lastname", last);

  const timeoutMs = Number(process.env.VOLARIS_TIMEOUT_MS || 12000);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  const debug: any[] = [];
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
        "accept-language": "es-MX,es;q=0.9,en;q=0.8",
        // No metas cookies de analytics; normalmente no ayudan
        authorization: authEnv.trim(), // si tu token requiere "Bearer", ponlo ya en el env
        origin: "https://www.volaris.com",
        referer: "https://www.volaris.com/",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await res.text();
    debug.push({ url: url.toString(), status: res.status, sample: raw.slice(0, 240) });

    if (!res.ok) {
      const hint = (res.status === 401 || res.status === 403)
        ? "Unauthorized: token inválido/expirado o no permitido"
        : `HTTP ${res.status}`;
      return { ok: false as const, status: res.status, error: hint, debug };
    }

    let json: any = null;
    try { json = JSON.parse(raw); } catch {}
    return { ok: true as const, status: res.status, json, debug };
  } catch (e: any) {
    debug.push({ status: "NETWORK_ERROR", error: e?.name === "AbortError" ? "TIMEOUT" : (e?.message ?? "Unknown") });
    return { ok: false as const, status: 504, error: "Network error/timeout", debug };
  } finally {
    clearTimeout(t);
  }
}

