import { round2 } from "./util";
import type { ImpuestoLocal, Retencion, Traslado, ValidacionTotales } from "./types";

export interface ImpuestosDetalle {
  traslados: Traslado[];
  retenciones: Retencion[];
  impuestosLocales: ImpuestoLocal[];
}

// Los impuestos siempre se extraen de los nodos reales del XML (nunca por
// resta). Esto solo reconcilia esa extracción contra el Total del comprobante,
// como señal de auditoría/QA al probar XML de proveedores distintos.
export function calcularValidacionTotales(
  comprobante: { subtotal: number; total: number },
  detalle: ImpuestosDetalle,
): ValidacionTotales {
  const sumaTraslados = detalle.traslados.reduce((acc, t) => acc + (t.importe || 0), 0);
  const sumaRetenciones = detalle.retenciones.reduce((acc, r) => acc + (r.importe || 0), 0);
  const sumaLocalesTraslados = detalle.impuestosLocales
    .filter((i) => i.tipo === "traslado")
    .reduce((acc, i) => acc + (i.importe || 0), 0);
  const sumaLocalesRetenciones = detalle.impuestosLocales
    .filter((i) => i.tipo === "retencion")
    .reduce((acc, i) => acc + (i.importe || 0), 0);

  const totalImpuestos =
    sumaTraslados - sumaRetenciones + sumaLocalesTraslados - sumaLocalesRetenciones;
  const totalCalculado = comprobante.subtotal + totalImpuestos;
  const diferencia = round2(comprobante.total - totalCalculado);

  return {
    subtotal: comprobante.subtotal,
    totalImpuestos: round2(totalImpuestos),
    totalCalculado: round2(totalCalculado),
    totalXml: comprobante.total,
    diferencia,
    cuadra: Math.abs(diferencia) < 0.01,
  };
}
