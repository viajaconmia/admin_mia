import { IvaRate } from "./constants";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const splitIva = (total: number, ivaRate: IvaRate) => {
  const ivaFactor = 1 + ivaRate;
  const t = round2(Number(total) || 0);
  const subtotal = round2(t / ivaFactor);
  const iva = round2(t - subtotal);
  return { subtotal, iva, total: t };
};

const num = (v: any) => Number.parseFloat(String(v ?? 0)) || 0;

/**
 * Valida que Subtotal + IVA = Total en cada línea del CFDI y en el global,
 * y que el total de las líneas coincida con el total de los ítems seleccionados.
 * Devuelve los mensajes de error (vacío si todo cuadra) en vez de mostrar
 * una notificación directamente, para mantenerse como función pura.
 */
export const preflightCfdi = (
  cfdiItems: any[],
  itemsSeleccionados: { total: number }[],
): string[] => {
  const errs: string[] = [];
  const sum = (arr: any[], pick: (x: any) => number) =>
    round2(arr.reduce((s, x) => s + pick(x), 0));

  const totalSelected = sum(itemsSeleccionados, (x) => num(x.total));
  const totalCfdi = sum(cfdiItems, (x) => num(x.Total));
  const subtotalCfdi = sum(cfdiItems, (x) => num(x.Subtotal));
  const taxCfdi = sum(cfdiItems, (x) =>
    sum(x?.Taxes ?? [], (t: any) => num(t.Total)),
  );

  if (Math.abs(totalSelected - totalCfdi) > 0.01) {
    errs.push(
      `Total seleccionado (${totalSelected.toFixed(2)}) != Total CFDI (${totalCfdi.toFixed(2)})`,
    );
  }

  if (Math.abs(round2(subtotalCfdi + taxCfdi) - totalCfdi) > 0.01) {
    errs.push(
      `Global: Subtotal(${subtotalCfdi.toFixed(2)}) + IVA(${taxCfdi.toFixed(2)}) != Total(${totalCfdi.toFixed(2)})`,
    );
  }

  cfdiItems.forEach((it, idx) => {
    const sub = round2(num(it.Subtotal));
    const total = round2(num(it.Total));
    const taxes = it?.Taxes ?? [];
    const taxSum = round2(taxes.reduce((s: number, t: any) => s + num(t.Total), 0));
    const expectedTotal = round2(sub + taxSum);

    if (Math.abs(expectedTotal - total) > 0.01) {
      errs.push(
        `Item#${idx + 1}: Subtotal(${sub.toFixed(2)}) + IVA(${taxSum.toFixed(2)}) != Total(${total.toFixed(2)})`,
      );
    }

    taxes.forEach((t: any) => {
      const base = round2(num(t.Base));
      const rate = Number.parseFloat(String(t.Rate ?? 0));
      const tax = round2(num(t.Total));
      const expectedTax = round2(base * rate);

      if (expectedTax - tax > 0.01) {
        errs.push(
          `Item#${idx + 1} TAX: Base(${base.toFixed(2)})*Rate(${rate})=${expectedTax.toFixed(2)} != Tax(${tax.toFixed(2)})`,
        );
      }
    });
  });

  return errs;
};

const dateToMs = (v: any) => {
  if (!v) return Number.POSITIVE_INFINITY;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;

  const s = String(v).trim();
  if (!s) return Number.POSITIVE_INFINITY;

  const t = Date.parse(s);
  if (!Number.isNaN(t)) return t;

  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`).getTime();

  return Number.POSITIVE_INFINITY;
};

export const sortByDateAsc = <T extends Record<string, any>>(
  arr: T[],
  dateKey: keyof T,
) => [...arr].sort((a, b) => dateToMs(a[dateKey]) - dateToMs(b[dateKey]));

export type ItemAgrupable = {
  id_item: string;
  id_origen: string;
  id_relacion?: string | null;
  total: number;
  fecha_uso?: string;
  contexto?: {
    titulo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    referencia?: string;
  };
};

export type GrupoRelacion<T extends ItemAgrupable> = {
  key: string;
  id_relacion: string | null;
  items: T[];
  total: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  referencia: string;
};

/**
 * Agrupa ítems por `id_relacion` (con fallback a `id_origen` si no viene),
 * ordena cada grupo por `fecha_uso` y ordena los grupos por su fecha más
 * antigua. Generaliza `groupByHospedaje` del legacy para cualquier origen
 * (reservas, pagos, comisiones).
 */
export const groupByRelacion = <T extends ItemAgrupable>(
  items: T[],
): GrupoRelacion<T>[] => {
  const map = new Map<string, T[]>();

  for (const it of items) {
    const key = it.id_relacion ?? `origen:${it.id_origen}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }

  const groups = Array.from(map.entries()).map(([key, arr]) => {
    const arrSorted = sortByDateAsc(arr, "fecha_uso" as keyof T);

    const groupDateMs =
      dateToMs(arrSorted[0]?.fecha_uso) !== Number.POSITIVE_INFINITY
        ? dateToMs(arrSorted[0]?.fecha_uso)
        : dateToMs(arrSorted.find((x) => x.contexto?.fechaInicio)?.contexto?.fechaInicio);

    return {
      key,
      id_relacion: arrSorted[0]?.id_relacion ?? null,
      items: arrSorted,
      total: arrSorted.reduce((s, x) => s + Number(x.total || 0), 0),
      titulo: arrSorted.find((x) => x.contexto?.titulo)?.contexto?.titulo ?? "",
      fechaInicio:
        arrSorted.find((x) => x.contexto?.fechaInicio)?.contexto?.fechaInicio ?? "",
      fechaFin: arrSorted.find((x) => x.contexto?.fechaFin)?.contexto?.fechaFin ?? "",
      referencia:
        arrSorted.find((x) => x.contexto?.referencia)?.contexto?.referencia ?? "",
      _groupDateMs: groupDateMs,
    };
  });

  groups.sort((a, b) => (a._groupDateMs ?? Infinity) - (b._groupDateMs ?? Infinity));

  return groups.map(({ _groupDateMs, ...rest }) => rest);
};
