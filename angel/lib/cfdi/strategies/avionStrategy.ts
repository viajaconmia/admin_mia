import { round2 } from "../util";
import { calcularImpuestosGenericos } from "../impuestosComunes";
import { construirResultadoBase } from "./shared";
import type { Concepto, InvoiceResult, NormalizedInvoice } from "../types";
import type { InvoiceStrategy } from "./types";

// TUA no es un impuesto CFDI. Su fuente más confiable es el atributo TUA del
// complemento SAT "aerolineas:Aerolineas" (normalizer.ts ya lo extrae); pero
// no todas las aerolíneas usan ese complemento, así que como respaldo también
// se busca un Concepto suelto que lo describa. Cada aerolínea lo redacta
// distinto, por eso esta lista de patrones vive aislada aquí y es lo primero
// a ajustar cuando aparezca un formato nuevo.
const TUA_PATTERNS: RegExp[] = [
  /\btua\b/i,
  /tarifa\s+de\s+uso\s+de\s+aeropuerto/i,
  /derecho\s+de\s+uso\s+de\s+aeropuerto/i,
  /airport\s+use\s+fee/i,
];

function esConceptoTua(concepto: Concepto): boolean {
  const texto = concepto.descripcion ?? "";
  return TUA_PATTERNS.some((p) => p.test(texto));
}

function detectarTuaEnConceptos(conceptos: Concepto[]): number {
  return round2(
    conceptos.filter(esConceptoTua).reduce((acc, c) => acc + (c.importe || 0), 0),
  );
}

// Todo lo que el complemento de aerolínea reporte como cargo que NO sea TUA
// (YQ, YR, XF, etc.) se suma en un solo total. El detalle línea por línea se
// conserva aparte en detalleOriginal.otrosCargosAerolinea para auditar.
function sumaOtrosCargosAerolinea(invoice: NormalizedInvoice): number {
  return round2(
    (invoice.complementoAerolineas?.otrosCargos ?? []).reduce(
      (acc, c) => acc + (c.importe || 0),
      0,
    ),
  );
}

export class AvionStrategy implements InvoiceStrategy {
  procesar(invoice: NormalizedInvoice): InvoiceResult {
    const tua = invoice.complementoAerolineas?.tua ?? detectarTuaEnConceptos(invoice.conceptos);

    return construirResultadoBase(invoice, "AVION", {
      ...calcularImpuestosGenericos(invoice),
      tua,
      otrosCargosAerolinea: sumaOtrosCargosAerolinea(invoice),
    });
  }
}
