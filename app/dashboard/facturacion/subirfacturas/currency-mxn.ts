// src/lib/currency-mxn.ts
export type ResolveTipoCambioParams = {
  moneda?: string | null;
  tipoCambioCFDI?: string | number | null;
  fecha?: string | Date | null;
};

export type ResolveTipoCambioResult = {
  currency: string;
  rate: number;
  source: "identity" | "cfdi" | "banxico";
};

const SESSION_PREFIX = "tc_mxn_";

export const round2 = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export const normalizeCurrency = (value: unknown) =>
  String(value ?? "").trim().toUpperCase();

export const isMXNCurrency = (value: unknown) => {
  const c = normalizeCurrency(value);
  return ["MXN", "MN", "MXP", "PESO", "PESOS"].includes(c);
};

export const safeCurrency = (value: unknown) =>
  normalizeCurrency(value) || "MXN";

const toIsoDate = (value?: string | Date | null) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const readSessionRate = (key: string): number | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const rate = Number(parsed?.rate);

    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
};

const writeSessionRate = (key: string, rate: number) => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(key, JSON.stringify({ rate, savedAt: Date.now() }));
  } catch {
    // noop
  }
};

export async function resolveTipoCambioToMXN(
  params: ResolveTipoCambioParams
): Promise<ResolveTipoCambioResult> {
  const currency = safeCurrency(params.moneda);

  if (isMXNCurrency(currency)) {
    return {
      currency: "MXN",
      rate: 1,
      source: "identity",
    };
  }

  const cfdiRate = Number(params.tipoCambioCFDI);
  if (Number.isFinite(cfdiRate) && cfdiRate > 0) {
    return {
      currency,
      rate: round2(cfdiRate),
      source: "cfdi",
    };
  }

  const isoDate = toIsoDate(params.fecha);
  const cacheKey = `${SESSION_PREFIX}${currency}_${isoDate || "latest"}`;

  const cached = readSessionRate(cacheKey);
  if (cached) {
    return {
      currency,
      rate: cached,
      source: "banxico",
    };
  }

  const qs = new URLSearchParams({ currency });
  if (isoDate) qs.set("date", isoDate);

  const resp = await fetch(`/api/tipo-cambio?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || "No se pudo consultar tipo de cambio.");
  }

  const json = await resp.json();
  const rate = Number(json?.rate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Tipo de cambio inválido.");
  }

  writeSessionRate(cacheKey, rate);

  return {
    currency,
    rate: round2(rate),
    source: "banxico",
  };
}

export const convertToMXN = (amount: unknown, rate: number) => {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return round2(n * rate);
};

export const convertFromMXN = (amountMXN: unknown, rate: number) => {
  const n = Number(amountMXN ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return round2(n / rate);
};