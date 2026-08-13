import type { InvoiceResult, NormalizedInvoice } from "../types";

export interface InvoiceStrategy {
  procesar(invoice: NormalizedInvoice): InvoiceResult;
}
