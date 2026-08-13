import { normalizeCfdi } from "./normalizer";
import { detectarTipoServicio } from "./serviceDetector";
import { invoiceStrategyFactory } from "./strategies/factory";
import { parseCfdiXml } from "./xmlParser";
import { UrlXmlSource } from "./xmlSource";
import type { InvoiceResult, NormalizedInvoice } from "./types";

export interface ResultadoAnalisis {
  normalizado: NormalizedInvoice;
  resultado: InvoiceResult;
}

// Orquestación pura (sin React): string → NormalizedInvoice → InvoiceResult.
// Parser → Normalizer → ServiceDetector → Factory → Strategy.
export function analizarFacturaXmlDesdeString(xmlString: string): ResultadoAnalisis {
  const parsed = parseCfdiXml(xmlString);
  const normalizado = normalizeCfdi(parsed);
  const tipoServicio = detectarTipoServicio(normalizado);
  const resultado = invoiceStrategyFactory.crear(tipoServicio).procesar(normalizado);
  return { normalizado, resultado };
}

export async function analizarFacturaXmlDesdeUrl(url: string): Promise<ResultadoAnalisis> {
  const xmlString = await new UrlXmlSource(url).getXml();
  return analizarFacturaXmlDesdeString(xmlString);
}
