import { URL as FECTH, API_KEY } from "@/lib/constants/index";

const AUTH = {
  "x-api-key": API_KEY,
};

const SESSION_PREFIX = "tc_mxn_";

export const round2 = (n) => {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const normalizeCurrency = (value) =>
  String(value ?? "").trim().toUpperCase();

export const isMXNCurrency = (value) => {
  const c = normalizeCurrency(value);
  return ["MXN", "MN", "MXP", "PESO", "PESOS"].includes(c);
};

export const safeCurrency = (value) =>
  normalizeCurrency(value) || "MXN";

const toIsoDate = (value) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const readSessionRate = (key) => {
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

const writeSessionRate = (key, rate) => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(key, JSON.stringify({ rate, savedAt: Date.now() }));
  } catch {}
};

export const resolveTipoCambioToMXN = async ({ moneda, fecha }) => {
  const currency = safeCurrency(moneda);

  console.log("[currency-mxn] moneda:", currency);
  console.log("[currency-mxn] fecha:", fecha);

  if (isMXNCurrency(currency)) {
    return {
      currency: "MXN",
      rate: 1,
      source: "identity",
    };
  }

  const isoDate = toIsoDate(fecha);
  const cacheKey = `${SESSION_PREFIX}${currency}_${isoDate || "latest"}`;

  const cached = readSessionRate(cacheKey);
  if (cached) {
    console.log("[currency-mxn] usando session cache:", cached);
    return {
      currency,
      rate: cached,
      source: "banxico",
    };
  }

  const qs = new URLSearchParams({ currency });
  if (isoDate) qs.set("date", isoDate);

  const url = `${FECTH}/mia/pago_proveedor/tipo_cambio?${qs.toString()}`;
  console.log("[currency-mxn] consultando:", url);

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...AUTH,
    },
  });

  const json = await resp.json();

  if (!resp.ok || !json?.ok) {
    console.error("[currency-mxn] error:", json);
    throw new Error(json?.error || "No se pudo consultar tipo de cambio");
  }

  const rate = Number(json?.rate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Tipo de cambio inválido");
  }

  writeSessionRate(cacheKey, rate);

  return {
    currency,
    rate: round2(rate),
    source: "banxico",
  };
};

export const convertToMXN = (amount, rate) => {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return round2(n * rate);
};

export const convertFromMXN = (amountMXN, rate) => {
  const n = Number(amountMXN ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return round2(n / rate);
};