// lib/volaris.ts

export type VolarisLookupArgs = {
  confirmationCode: string;
  lastName: string; // "PATERNO MATERNO"
  debug?: boolean;  // habilita debug.attempts
};

export type DebugAttempt = {
  attempt: number;
  method: "POST" | "GET";
  url: string;
  lastNameUsed: string;
  authMode: "none" | "raw" | "bearer";
  requestBody?: any;
  httpStatus: number | "NETWORK_ERROR";
  contentType: string | null;
  ms: number;
  bodySnippet?: string;
  error?: string;
};

export type VolarisLookupOk = {
  ok: true;
  status: number;
  json: any;
  debug?: { attempts: DebugAttempt[] };
};

export type VolarisLookupErr = {
  ok: false;
  status: number;
  error: string;
  debug?: { attempts: DebugAttempt[] };
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

function lastNameCandidates(input: string) {
  const full = normalizeLastName(input);
  const first = full.split(" ")[0] || full;

  const uniq: string[] = [];
  for (const c of [full, first]) {
    if (c && !uniq.includes(c)) uniq.push(c);
  }
  return uniq;
}

function truncate(s: string, n = 240) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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
  // Ajusta a lo que realmente devuelve el endpoint cuando sí pega.
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

function looksLikeBotChallenge(text: string) {
  const t = (text || "").toLowerCase();
  return (
    t.includes("recaptcha") ||
    t.includes("incapsula") ||
    t.includes("access denied") ||
    t.includes("additional security check") ||
    t.includes("request unsuccessful") ||
    t.includes("enable javascript") ||
    t.includes("captcha")
  );
}

function makeAuthVariants(token?: string) {
  const t = (token || "").trim();
  if (!t) return [{ value: "", mode: "none" as const }];

  const isBearer = /^Bearer\s+/i.test(t);
  const variants = isBearer ? [t] : [t, `Bearer ${t}`];

  return variants.map((v) => ({
    value: v,
    mode: /^Bearer\s+/i.test(v) ? ("bearer" as const) : ("raw" as const),
  }));
}

function envHeader(name: string, fallback?: string) {
  const v = process.env[name];
  return (v ?? fallback ?? "").trim();
}

function parseExtraHeadersJson(): Record<string, string> {
  const raw = process.env.VOLARIS_EXTRA_HEADERS_JSON?.trim();
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string" && v.trim()) out[k.toLowerCase()] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

export async function volarisLookupBooking(args: VolarisLookupArgs): Promise<VolarisLookupResult> {
  // Prioridad: LOOKUP_URL (tu gateway) > ENDPOINT > default
  const endpoint =
    process.env.VOLARIS_LOOKUP_URL?.trim() ||
    process.env.VOLARIS_ENDPOINT?.trim() ||
    "https://apigw.volaris.com/prod/api/booking";

  const authEnv = process.env.VOLARIS_AUTHORIZATION?.trim(); // opcional
  const authVariants = makeAuthVariants(authEnv);

  const code = args.confirmationCode.trim().toUpperCase();
  const lasts = lastNameCandidates(args.lastName);

  const timeoutMs = Number(process.env.VOLARIS_TIMEOUT_MS || 12000);
  const ua =
    envHeader("VOLARIS_UA") ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

  const flow = envHeader("VOLARIS_FLOW", "MBS");
  const frontend = envHeader("VOLARIS_FRONTEND", "WEB");

  const origin = envHeader("VOLARIS_ORIGIN", "https://www.volaris.com");
  const referer = envHeader("VOLARIS_REFERER", "https://www.volaris.com/mytrips/home");

  const extraHeaders = parseExtraHeadersJson();

  // Bodies plausibles: deja sólo los que realmente existan cuando ya sepas cuál funciona.
  const buildPostBodies = (lastNameUsed: string) => [
    { recordLocator: code, lastName: lastNameUsed },
    { confirmationCode: code, lastName: lastNameUsed },
  ];

  const attempts: DebugAttempt[] = [];
  let attemptNo = 0;

  for (const auth of authVariants) {
    // OJO: no metemos el token en debug, solo el modo.
    const baseHeaders: Record<string, string> = {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "accept-language": "es-MX,es;q=0.9,en;q=0.8",
      "user-agent": ua,
      flow,
      frontend,
      origin,
      referer,
      ...extraHeaders,
    };

    if (auth.mode !== "none") {
      baseHeaders.authorization = auth.value;
    }

    // 1) POST intentos
    let postBrokeByMethod = false;
    let postBrokeByAuth = false;

    for (const lastNameUsed of lasts) {
      const bodies = buildPostBodies(lastNameUsed);

      for (const body of bodies) {
        attemptNo += 1;
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

          const ct = res.headers.get("content-type");
          const raw = await res.text();

          attempts.push({
            attempt: attemptNo,
            method: "POST",
            url: endpoint,
            lastNameUsed,
            authMode: auth.mode,
            requestBody: body,
            httpStatus: res.status,
            contentType: ct,
            ms: Date.now() - startedAt,
            bodySnippet: truncate(raw),
          });

          if (res.status === 405) {
            postBrokeByMethod = true;
            break;
          }
          if (res.status === 401 || res.status === 403) {
            postBrokeByAuth = true;
            break;
          }
          if (!res.ok) continue;

          // Si te devuelve HTML/captcha aunque sea 200, no sirve
          if (looksLikeBotChallenge(raw)) continue;
          if (ct && ct.toLowerCase().includes("text/html")) continue;

          const json = safeJsonParse(raw);
          if (looksLikeSuccessJson(json)) {
            return {
              ok: true,
              status: res.status,
              json,
              debug: args.debug ? { attempts } : undefined,
            };
          }
        } catch (e: any) {
          attempts.push({
            attempt: attemptNo,
            method: "POST",
            url: endpoint,
            lastNameUsed,
            authMode: auth.mode,
            requestBody: body,
            httpStatus: "NETWORK_ERROR",
            contentType: null,
            ms: Date.now() - startedAt,
            error: e?.name === "AbortError" ? "TIMEOUT" : (e?.message ?? "Unknown"),
          });
        }
      }

      if (postBrokeByMethod || postBrokeByAuth) break;
    }

    // Si POST no se puede por método o el endpoint real era GET
    // o si el endpoint original (curl) iba sin body:
    // 2) GET fallback
    for (const lastNameUsed of lasts) {
      attemptNo += 1;
      const startedAt = Date.now();

      try {
        const url = new URL(endpoint);
        // Query params típicos
        url.searchParams.set("recordLocator", code);
        url.searchParams.set("lastName", lastNameUsed);

        const res = await fetchWithTimeout(
          url.toString(),
          {
            method: "GET",
            headers: {
              accept: "application/json, text/plain, */*",
              "accept-language": "es-MX,es;q=0.9,en;q=0.8",
              "user-agent": ua,
              ...(auth.mode !== "none" ? { authorization: auth.value } : {}),
              flow,
              frontend,
              origin,
              referer,
              ...extraHeaders,
            },
            cache: "no-store",
            redirect: "follow",
          },
          timeoutMs
        );

        const ct = res.headers.get("content-type");
        const raw = await res.text();

        attempts.push({
          attempt: attemptNo,
          method: "GET",
          url: url.toString(),
          lastNameUsed,
          authMode: auth.mode,
          httpStatus: res.status,
          contentType: ct,
          ms: Date.now() - startedAt,
          bodySnippet: truncate(raw),
        });

        if (res.status === 401 || res.status === 403) break;
        if (!res.ok) continue;

        if (looksLikeBotChallenge(raw)) continue;
        if (ct && ct.toLowerCase().includes("text/html")) continue;

        const json = safeJsonParse(raw);
        if (looksLikeSuccessJson(json)) {
          return {
            ok: true,
            status: res.status,
            json,
            debug: args.debug ? { attempts } : undefined,
          };
        }
      } catch (e: any) {
        attempts.push({
          attempt: attemptNo,
          method: "GET",
          url: endpoint,
          lastNameUsed,
          authMode: auth.mode,
          httpStatus: "NETWORK_ERROR",
          contentType: null,
          ms: Date.now() - startedAt,
          error: e?.name === "AbortError" ? "TIMEOUT" : (e?.message ?? "Unknown"),
        });
      }
    }
  }

  // Diagnóstico final
  const numericStatuses = attempts
    .map((a) => (typeof a.httpStatus === "number" ? a.httpStatus : null))
    .filter((x): x is number => x !== null);

  const statusGuess = numericStatuses.length ? numericStatuses[numericStatuses.length - 1] : 500;

  let hint = "No se obtuvo JSON válido (endpoint/payload/headers) o fue bloqueado.";
  if (attempts.some((d) => d.httpStatus === 401 || d.httpStatus === 403)) {
    hint = "Unauthorized / Forbidden: token inválido/expirado o el endpoint requiere cookies/headers extra.";
  } else if (attempts.some((d) => d.bodySnippet && looksLikeBotChallenge(d.bodySnippet))) {
    hint = "Bloqueo anti-bot (captcha/WAF): la respuesta no es JSON utilizable.";
  } else if (attempts.some((d) => d.contentType?.toLowerCase().includes("text/html"))) {
    hint = "Respuesta HTML (no API): probablemente endpoint incorrecto o te sirvieron una página/challenge.";
  } else if (attempts.some((d) => d.httpStatus === 405)) {
    hint = "Method not allowed: el endpoint no acepta POST (o cambió).";
  } else if (attempts.some((d) => d.httpStatus === "NETWORK_ERROR")) {
    hint = "Network error/timeout: revisa conectividad, DNS, timeout y que el endpoint responda desde tu server.";
  }

  return {
    ok: false,
    status: statusGuess,
    error: hint,
    debug: args.debug ? { attempts } : undefined,
  };
}
