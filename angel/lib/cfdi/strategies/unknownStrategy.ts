import { calcularImpuestosGenericos } from "../impuestosComunes";
import { construirResultadoBase } from "./shared";
import type { InvoiceResult, NormalizedInvoice } from "../types";
import type { InvoiceStrategy } from "./types";

export class UnknownStrategy implements InvoiceStrategy {
  procesar(invoice: NormalizedInvoice): InvoiceResult {
    return construirResultadoBase(invoice, "DESCONOCIDO", calcularImpuestosGenericos(invoice));
  }
}
