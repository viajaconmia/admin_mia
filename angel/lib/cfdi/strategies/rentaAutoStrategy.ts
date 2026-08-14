import { calcularImpuestosGenericos } from "../impuestosComunes";
import { construirResultadoBase } from "./shared";
import type { InvoiceResult, NormalizedInvoice } from "../types";
import type { InvoiceStrategy } from "./types";

export class RentaAutoStrategy implements InvoiceStrategy {
  procesar(invoice: NormalizedInvoice): InvoiceResult {
    return construirResultadoBase(invoice, "RENTA_AUTO", calcularImpuestosGenericos(invoice));
  }
}
