import type { NormalizedInvoice, TipoServicio } from "./types";

// Heurística aislada e intencionalmente ajustable: si no hay señal suficiente
// devuelve DESCONOCIDO en vez de inventar una clasificación. Los prefijos de
// ClaveProdServ son una señal secundaria aproximada (catálogo SAT c_ClaveProdServ);
// las palabras clave sobre la Descripcion son la señal principal.
const HOTEL_KEYWORDS = [/hotel/i, /hosped/i, /alojamiento/i, /habitaci[oó]n/i];
const HOTEL_CLAVEPRODSERV_PREFIXES = ["9011"];

const AVION_KEYWORDS = [
  // [oa] al final: "aéreo" (transporte aéreo) y "aérea" (tarifa aérea) son
  // ambos válidos en español según el sustantivo que acompañen.
  /a[eé]re[oa]/i,
  /aerol[ií]nea/i,
  /\bvuelo\b/i,
  /boleto\s*a[eé]reo/i,
  /aeropuerto/i,
  /aeroportuari[oa]/i,
  /\btua\b/i,
];
// Confirmado con un CFDI real de aerolínea: ClaveProdServ 78111500 = tarifa
// aérea (familia "7811" del catálogo SAT).
const AVION_CLAVEPRODSERV_PREFIXES = ["7811"];

const RENTA_AUTO_KEYWORDS = [
  /renta\s+de\s+auto/i,
  /arrendadora/i,
  /alquiler\s+de\s+veh[ií]culo/i,
  /rent\s*a\s*car/i,
  /renta\s+vehicular/i,
];
// Familia "78101" (alquiler/leasing de vehículos) del catálogo SAT — distinta
// de "7811" (transporte aéreo) para no volver a cruzarse con AVION.
const RENTA_AUTO_CLAVEPRODSERV_PREFIXES = ["78101"];

function textoConceptos(invoice: NormalizedInvoice): string {
  return invoice.conceptos.map((c) => c.descripcion ?? "").join(" | ");
}

function algunoCoincide(texto: string, patrones: RegExp[]): boolean {
  return patrones.some((p) => p.test(texto));
}

function algunaClavePrefix(invoice: NormalizedInvoice, prefixes: string[]): boolean {
  return invoice.conceptos.some((c) =>
    prefixes.some((prefix) => (c.claveProdServ ?? "").startsWith(prefix)),
  );
}

function tieneImpuestoLocalIsh(invoice: NormalizedInvoice): boolean {
  return invoice.impuestosLocales.some((i) => /ish|hospedaje/i.test(i.nombre));
}

export function detectarTipoServicio(invoice: NormalizedInvoice): TipoServicio {
  const texto = textoConceptos(invoice);

  if (
    tieneImpuestoLocalIsh(invoice) ||
    algunoCoincide(texto, HOTEL_KEYWORDS) ||
    algunaClavePrefix(invoice, HOTEL_CLAVEPRODSERV_PREFIXES)
  ) {
    return "HOTEL";
  }

  // El complemento SAT "aerolineas:Aerolineas" (con o sin TUA) es una señal
  // estructural: si está presente, es una factura de aerolínea.
  if (
    invoice.complementoAerolineas != null ||
    algunoCoincide(texto, AVION_KEYWORDS) ||
    algunaClavePrefix(invoice, AVION_CLAVEPRODSERV_PREFIXES)
  ) {
    return "AVION";
  }

  if (
    algunoCoincide(texto, RENTA_AUTO_KEYWORDS) ||
    algunaClavePrefix(invoice, RENTA_AUTO_CLAVEPRODSERV_PREFIXES)
  ) {
    return "RENTA_AUTO";
  }

  return "DESCONOCIDO";
}
