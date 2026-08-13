import { calcularValidacionTotales } from "../validacion";
import type { InvoiceResult, InvoiceResultImpuestos, NormalizedInvoice, TipoServicio } from "../types";

export function mapFactura(invoice: NormalizedInvoice): InvoiceResult["factura"] {
  return {
    uuid: invoice.comprobante.uuid,
    serie: invoice.comprobante.serie,
    folio: invoice.comprobante.folio,
    fecha: invoice.comprobante.fecha,
    moneda: invoice.comprobante.moneda,
    subtotal: invoice.comprobante.subtotal,
    total: invoice.comprobante.total,
    tipoComprobante: invoice.comprobante.tipoComprobante,
    metodoPago: invoice.comprobante.metodoPago,
    formaPago: invoice.comprobante.formaPago,
    lugarExpedicion: invoice.comprobante.lugarExpedicion,
  };
}

// Ensambla el InvoiceResult común a las 4 strategies; cada una solo calcula
// su propio bloque `impuestos` (ISH para Hotel, TUA para Avion, etc.).
export function construirResultadoBase(
  invoice: NormalizedInvoice,
  tipoServicio: TipoServicio,
  impuestos: InvoiceResultImpuestos,
): InvoiceResult {
  return {
    tipoServicio,
    factura: mapFactura(invoice),
    emisor: invoice.emisor,
    receptor: invoice.receptor,
    conceptos: invoice.conceptos,
    impuestos,
    detalleOriginal: {
      traslados: invoice.traslados,
      retenciones: invoice.retenciones,
      impuestosLocales: invoice.impuestosLocales,
      otrosCargosAerolinea: invoice.complementoAerolineas?.otrosCargos ?? [],
    },
    validacion: calcularValidacionTotales(invoice.comprobante, {
      traslados: invoice.traslados,
      retenciones: invoice.retenciones,
      impuestosLocales: invoice.impuestosLocales,
    }),
  };
}
