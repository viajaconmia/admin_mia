import { round2 } from "./util";
import type { InvoiceResultImpuestos, NormalizedInvoice, Retencion, Traslado } from "./types";

function sumaPorCodigo(items: Array<{ impuesto: string; importe: number }>, codigo: string): number {
  return items
    .filter((i) => (i.impuesto ?? "").trim() === codigo)
    .reduce((acc, i) => acc + (i.importe || 0), 0);
}

// Compara tasas con tolerancia: en el XML pueden venir como "0.160000" o
// "0.16", toNumber ya las deja como float pero igual conviene no comparar
// floats con === directo.
function esTasa(traslado: Traslado, tasa: number): boolean {
  return traslado.tasaOCuota != null && Math.abs(traslado.tasaOCuota - tasa) < 0.0001;
}

function sumaImporte(items: Traslado[]): number {
  return items.reduce((acc, i) => acc + (i.importe || 0), 0);
}

// IVA/IEPS/retenciones son agnósticos al tipo de servicio: siempre salen de
// los traslados/retenciones a nivel comprobante (cfdi:Impuestos), no de la
// resta total-subtotal.
export function calcularImpuestosComunes(invoice: NormalizedInvoice) {
  const traslados: Traslado[] = invoice.traslados;
  const retenciones: Retencion[] = invoice.retenciones;
  const ivaTraslados = traslados.filter((t) => (t.impuesto ?? "").trim() === "002");

  return {
    iva: round2(sumaPorCodigo(traslados, "002")),
    ivaPorTasa: {
      tasa16: round2(sumaImporte(ivaTraslados.filter((t) => esTasa(t, 0.16)))),
      tasa8: round2(sumaImporte(ivaTraslados.filter((t) => esTasa(t, 0.08)))),
      otras: round2(
        sumaImporte(ivaTraslados.filter((t) => !esTasa(t, 0.16) && !esTasa(t, 0.08))),
      ),
    },
    ieps: round2(sumaPorCodigo(traslados, "003")),
    retenciones: {
      isr: round2(sumaPorCodigo(retenciones, "001")),
      iva: round2(sumaPorCodigo(retenciones, "002")),
      ieps: round2(sumaPorCodigo(retenciones, "003")),
    },
  };
}

export function sumaImpuestosLocalesTraslado(invoice: NormalizedInvoice): number {
  return round2(
    invoice.impuestosLocales
      .filter((i) => i.tipo === "traslado")
      .reduce((acc, i) => acc + (i.importe || 0), 0),
  );
}

// Impuestos "genéricos": para strategies sin lógica especial (RentaAuto,
// Unknown) y como base para las que sí la tienen (Hotel/Avion).
export function calcularImpuestosGenericos(invoice: NormalizedInvoice): InvoiceResultImpuestos {
  return {
    ...calcularImpuestosComunes(invoice),
    impuestosLocales: { ish: 0, otros: sumaImpuestosLocalesTraslado(invoice) },
    tua: 0,
    otrosCargosAerolinea: 0,
  };
}
