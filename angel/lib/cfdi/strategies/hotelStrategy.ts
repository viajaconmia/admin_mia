import { round2 } from "../util";
import { calcularImpuestosComunes } from "../impuestosComunes";
import { construirResultadoBase } from "./shared";
import type { InvoiceResult, NormalizedInvoice } from "../types";
import type { InvoiceStrategy } from "./types";

// Coincidencia flexible: cada estado/hotel puede nombrar el impuesto local de
// distinta forma (ISH, ISH2%, "Impuesto Sobre Hospedaje", etc.)
const ISH_PATTERN = /ish|hospedaje/i;

export class HotelStrategy implements InvoiceStrategy {
  procesar(invoice: NormalizedInvoice): InvoiceResult {
    const comunes = calcularImpuestosComunes(invoice);
    const localesTraslado = invoice.impuestosLocales.filter((i) => i.tipo === "traslado");

    const ish = round2(
      localesTraslado
        .filter((i) => ISH_PATTERN.test(i.nombre))
        .reduce((acc, i) => acc + i.importe, 0),
    );
    const otros = round2(
      localesTraslado
        .filter((i) => !ISH_PATTERN.test(i.nombre))
        .reduce((acc, i) => acc + i.importe, 0),
    );

    return construirResultadoBase(invoice, "HOTEL", {
      ...comunes,
      impuestosLocales: { ish, otros },
      tua: 0,
      otrosCargosAerolinea: 0,
    });
  }
}
