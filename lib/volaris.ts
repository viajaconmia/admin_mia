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

export async function volarisLookupBooking(args: VolarisLookupArgs): Promise<VolarisLookupResult> {
  const endpoint =
    process.env.VOLARIS_ENDPOINT?.trim() ||
    "https://apigw.volaris.com/prod/api/booking";

  const authEnv = process.env.VOLARIS_AUTHORIZATION;
  if (!authEnv) {
    return { ok: false, status: 500, error: "Missing VOLARIS_AUTHORIZATION env var", debug: [] };
  }

  const code = args.confirmationCode.trim().toUpperCase();
  const lastFull = normalizeLastName(args.lastName);
  const lastPaterno = lastFull.split(" ")[0] || lastFull;

  const timeoutMs = Number(process.env.VOLARIS_TIMEOUT_MS || 12000);
  const ua =
    process.env.VOLARIS_UA ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

  // 👇 OJO: aquí debes dejar SOLO los bodies que realmente sean plausibles.
  // Cuando veas cuál funciona, te quedas con UNO.
  const postBodies = [
    { recordLocator: code, lastName: lastFull },
    { recordLocator: code, lastName: lastPaterno },
    { confirmationCode: code, lastName: lastFull }, // por si usan este nombre
  ];

  const debug: any[] = [];

  // Probamos con auth raw y Bearer
  for (const auth of makeAuthVariants(authEnv)) {
    const baseHeaders: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
      "accept-language": "es-MX,es;q=0.9,en;q=0.8",
      "user-agent": ua,
      authorization: auth,
      flow: process.env.VOLARIS_FLOW || "MBS",
      frontend: process.env.VOLARIS_FRONTEND || "WEB",
      origin: "https://www.volaris.com",
      referer: "https://www.volaris.com/mytrips/home",
    };

    // 1) POST
    for (const body of postBodies) {
      const startedAt = Date.now();
      try {
        const res = await fetchWithTimeout(
          endpoint,
          {
            method: "POST",
            headers: baseHeaders,
            body: JSON.stringify(body),
            cache: "no-store",
            redirect: "follow",
          },
          timeoutMs
        );

        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        debug.push({
          authMode: auth.startsWith("Bearer ") ? "bearer" : "raw",
          method: "POST",
          triedBody: body,
          status: res.status,
          ms: Date.now() - startedAt,
          contentType: ct,
          sample: truncate(raw),
        });

        // Si el endpoint no acepta POST, salimos a GET
        if (res.status === 405) break;

        // Auth mala: prueba siguiente auth variant
        if (res.status === 401 || res.status === 403) break;

        if (!res.ok) continue;

        const json = safeJsonParse(raw);
        if (looksLikeSuccessJson(json)) {
          return { ok: true, status: res.status, json, debug };
        }
      } catch (e: any) {
        debug.push({
          authMode: auth.startsWith("Bearer ") ? "bearer" : "raw",
          method: "POST",
          triedBody: body,
          status: "NETWORK_ERROR",
          ms: Date.now() - startedAt,
          error: e?.name === "AbortError" ? "TIMEOUT" : (e?.message ?? "Unknown"),
        });
      }
    }

    // 2) GET fallback (porque tu cURL NO trae body)
    const getCombos = [
      { code, last: lastFull },
      { code, last: lastPaterno },
    ];

    for (const q of getCombos) {
      const startedAt = Date.now();
      try {
        const url = new URL(endpoint);
        // intenta params típicos
        url.searchParams.set("recordLocator", q.code);
        url.searchParams.set("lastName", q.last);

        const res = await fetchWithTimeout(
          url.toString(),
          {
            method: "GET",
            headers: {
              accept: "application/json",
              "accept-language": "es-MX,es;q=0.9,en;q=0.8",
              "user-agent": ua,
              authorization: auth,
              flow: baseHeaders.flow,
              frontend: baseHeaders.frontend,
              origin: baseHeaders.origin,
              referer: baseHeaders.referer,
            },
            cache: "no-store",
            redirect: "follow",
          },
          timeoutMs
        );

        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        debug.push({
          authMode: auth.startsWith("Bearer ") ? "bearer" : "raw",
          method: "GET",
          url: url.toString(),
          status: res.status,
          ms: Date.now() - startedAt,
          contentType: ct,
          sample: truncate(raw),
        });

        if (res.status === 401 || res.status === 403) break;
        if (!res.ok) continue;

        const json = safeJsonParse(raw);
        if (looksLikeSuccessJson(json)) {
          return { ok: true, status: res.status, json, debug };
        }
      } catch (e: any) {
        debug.push({
          authMode: auth.startsWith("Bearer ") ? "bearer" : "raw",
          method: "GET",
          status: "NETWORK_ERROR",
          ms: Date.now() - startedAt,
          error: e?.name === "AbortError" ? "TIMEOUT" : (e?.message ?? "Unknown"),
        });
      }
    }
  }

  // Diagnóstico final: mira debug[].status y debug[].sample
  const last = debug[debug.length - 1];
  const statusGuess = typeof last?.status === "number" ? last.status : 404;

  let hint = "No match / blocked / payload keys mismatch";
  if (debug.some((d) => d.status === 401 || d.status === 403)) hint = "Unauthorized (token inválido/expirado o bloqueado)";
  if (debug.some((d) => d.status === 405)) hint = "Method not allowed (el endpoint no acepta POST; usa GET real)";
  if (debug.some((d) => String(d.sample || "").toLowerCase().includes("captcha"))) hint = "Blocked (captcha/bot protection)";

  return { ok: false, status: statusGuess, error: hint, debug };
}
