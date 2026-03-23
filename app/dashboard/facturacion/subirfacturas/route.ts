// app/api/tipo-cambio/route.ts
import { NextRequest, NextResponse } from "next/server";

const SERIES_MAP: Record<string, string> = {
  USD: "SF43718", // FIX
  EUR: "SF46410",
  JPY: "SF46406",
  GBP: "SF46407",
  CAD: "SF60632",
};

const memoryCache = new Map<
  string,
  { expiresAt: number; payload: Record<string, unknown> }
>();

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hora

const normalizeCurrency = (value: unknown) =>
  String(value ?? "").trim().toUpperCase();

const isMXNCurrency = (value: unknown) => {
  const c = normalizeCurrency(value);
  return ["MXN", "MN", "MXP", "PESO", "PESOS"].includes(c);
};

const toBanxicoDate = (value: string | Date) => {
  const d = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
};

const addDays = (value: string | Date, days: number) => {
  const d = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d;
};

const parseRate = (value: unknown): number | null => {
  const str = String(value ?? "").replace(/,/g, "").trim();
  const n = Number(str);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const extractLastValidRate = (json: any) => {
  const datos = json?.bmx?.series?.[0]?.datos;
  if (!Array.isArray(datos)) return null;

  const valid = datos
    .map((x: any) => ({
      fecha: x?.fecha ?? null,
      rate: parseRate(x?.dato),
    }))
    .filter((x: any) => x.rate !== null);

  if (!valid.length) return null;
  return valid[valid.length - 1];
};

async function fetchBanxico(url: string, token: string) {
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "Bmx-Token": token,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `Banxico respondió ${resp.status}`);
  }

  return resp.json();
}

export async function GET(req: NextRequest) {
  try {
    const currency = normalizeCurrency(req.nextUrl.searchParams.get("currency"));
    const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD opcional

    if (!currency) {
      return NextResponse.json(
        { error: "Falta currency." },
        { status: 400 }
      );
    }

    if (isMXNCurrency(currency)) {
      return NextResponse.json({
        currency: "MXN",
        rate: 1,
        source: "identity",
      });
    }

    const seriesId = SERIES_MAP[currency];
    if (!seriesId) {
      return NextResponse.json(
        { error: `Moneda no soportada por Banxico: ${currency}` },
        { status: 400 }
      );
    }

    const token = process.env.BANXICO_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Falta configurar BANXICO_TOKEN en el servidor." },
        { status: 500 }
      );
    }

    const cacheKey = `${currency}:${date || "latest"}`;
    const now = Date.now();

    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.payload);
    }

    let payload: Record<string, unknown>;

    if (date) {
      const end = toBanxicoDate(date);
      const start = toBanxicoDate(addDays(date, -7));

      if (!start || !end) {
        return NextResponse.json(
          { error: "Fecha inválida." },
          { status: 400 }
        );
      }

      const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${seriesId}/datos/${start}/${end}?mediaType=json`;
      const json = await fetchBanxico(url, token);
      const lastValid = extractLastValidRate(json);

      if (!lastValid) {
        return NextResponse.json(
          { error: `No hubo tipo de cambio disponible para ${currency}.` },
          { status: 404 }
        );
      }

      payload = {
        currency,
        rate: lastValid.rate,
        source: "banxico",
        requestedDate: date,
        appliedDate: lastValid.fecha,
      };
    } else {
      const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${seriesId}/datos/oportuno?mediaType=json`;
      const json = await fetchBanxico(url, token);
      const lastValid = extractLastValidRate(json);

      if (!lastValid) {
        return NextResponse.json(
          { error: `No hubo tipo de cambio oportuno para ${currency}.` },
          { status: 404 }
        );
      }

      payload = {
        currency,
        rate: lastValid.rate,
        source: "banxico",
        appliedDate: lastValid.fecha,
      };
    }

    memoryCache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      payload,
    });

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error resolviendo tipo de cambio." },
      { status: 500 }
    );
  }
}