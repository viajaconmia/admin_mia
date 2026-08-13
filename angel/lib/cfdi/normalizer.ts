import {
  getAttr,
  getDirectChildByLocalName,
  getDirectChildrenByLocalName,
  getFirstByLocalName,
  toNumber,
  type ParsedCfdiDocument,
} from "./xmlParser";
import type {
  ComplementoAerolineas,
  Concepto,
  ImpuestoLocal,
  NormalizedInvoice,
  OtroCargoAerolinea,
  Retencion,
  Traslado,
} from "./types";

function mapTraslado(n: Element): Traslado {
  const base = getAttr(n, "Base");
  const tasa = getAttr(n, "TasaOCuota");
  return {
    base: base ? toNumber(base) : undefined,
    impuesto: getAttr(n, "Impuesto") ?? "",
    tipoFactor: getAttr(n, "TipoFactor"),
    tasaOCuota: tasa ? toNumber(tasa) : undefined,
    importe: toNumber(getAttr(n, "Importe")),
  };
}

function mapRetencion(n: Element): Retencion {
  return {
    impuesto: getAttr(n, "Impuesto") ?? "",
    importe: toNumber(getAttr(n, "Importe")),
  };
}

// Los Traslado/Retencion pueden venir envueltos en Traslados/Retenciones o,
// según el XML, directo como hijos de Impuestos. Se toleran ambas formas.
function trasladosDeNodoImpuestos(impuestosNode: Element | null): Traslado[] {
  if (!impuestosNode) return [];
  const contenedor = getDirectChildByLocalName(impuestosNode, "Traslados");
  const nodos = contenedor
    ? getDirectChildrenByLocalName(contenedor, "Traslado")
    : getDirectChildrenByLocalName(impuestosNode, "Traslado");
  return nodos.map(mapTraslado);
}

function retencionesDeNodoImpuestos(impuestosNode: Element | null): Retencion[] {
  if (!impuestosNode) return [];
  const contenedor = getDirectChildByLocalName(impuestosNode, "Retenciones");
  const nodos = contenedor
    ? getDirectChildrenByLocalName(contenedor, "Retencion")
    : getDirectChildrenByLocalName(impuestosNode, "Retencion");
  return nodos.map(mapRetencion);
}

function mapConcepto(conceptoEl: Element): Concepto {
  // Impuestos hijo directo del propio Concepto: no cruza con otros conceptos
  // ni con el Impuestos del comprobante.
  const impuestosNode = getDirectChildByLocalName(conceptoEl, "Impuestos");
  const cantidad = getAttr(conceptoEl, "Cantidad");
  const valorUnitario = getAttr(conceptoEl, "ValorUnitario");
  const importe = getAttr(conceptoEl, "Importe");

  return {
    claveProdServ: getAttr(conceptoEl, "ClaveProdServ"),
    noIdentificacion: getAttr(conceptoEl, "NoIdentificacion"),
    cantidad: cantidad ? toNumber(cantidad) : undefined,
    claveUnidad: getAttr(conceptoEl, "ClaveUnidad"),
    unidad: getAttr(conceptoEl, "Unidad"),
    descripcion: getAttr(conceptoEl, "Descripcion"),
    valorUnitario: valorUnitario ? toNumber(valorUnitario) : undefined,
    importe: importe ? toNumber(importe) : undefined,
    objetoImp: getAttr(conceptoEl, "ObjetoImp"),
    traslados: trasladosDeNodoImpuestos(impuestosNode),
    retenciones: retencionesDeNodoImpuestos(impuestosNode),
  };
}

function mapImpuestoLocal(n: Element, tipo: "traslado" | "retencion"): ImpuestoLocal {
  const nombreAttr = tipo === "traslado" ? "ImpLocTrasladado" : "ImpLocRetenido";
  const tasaAttr = tipo === "traslado" ? "TasadeTraslado" : "TasadeRetencion";
  const tasa = getAttr(n, tasaAttr);
  return {
    tipo,
    nombre: getAttr(n, nombreAttr) ?? "",
    tasa: tasa ? toNumber(tasa) : undefined,
    importe: toNumber(getAttr(n, "Importe")),
  };
}

// Complemento SAT "aerolineas:Aerolineas": ahí suele venir el TUA real (como
// atributo), no como Concepto. No siempre está presente.
function mapComplementoAerolineas(comprobante: Element): ComplementoAerolineas | undefined {
  const aerolineasNode = getFirstByLocalName(comprobante, "Aerolineas");
  if (!aerolineasNode) return undefined;

  const tua = getAttr(aerolineasNode, "TUA");
  const otrosCargosWrapper = getDirectChildByLocalName(aerolineasNode, "OtrosCargos");
  const cargoNodos = otrosCargosWrapper
    ? getDirectChildrenByLocalName(otrosCargosWrapper, "Cargo")
    : [];

  const otrosCargos: OtroCargoAerolinea[] = cargoNodos.map((n) => ({
    codigo: getAttr(n, "CodigoCargo"),
    importe: toNumber(getAttr(n, "Importe")),
  }));

  return {
    tua: tua ? toNumber(tua) : undefined,
    otrosCargos,
  };
}

export function normalizeCfdi(parsed: ParsedCfdiDocument): NormalizedInvoice {
  // cfdi:Comprobante es la raíz del documento.
  const comprobante = parsed.doc.documentElement;

  const emisor = getFirstByLocalName(comprobante, "Emisor");
  const receptor = getFirstByLocalName(comprobante, "Receptor");
  const timbre = getFirstByLocalName(comprobante, "TimbreFiscalDigital");
  const impuestosLocalesWrapper = getFirstByLocalName(comprobante, "ImpuestosLocales");

  // Hijos directos del Comprobante: evita confundir el Impuestos/Conceptos del
  // comprobante con los que puedan aparecer anidados dentro de cada Concepto.
  const conceptosWrapper = getDirectChildByLocalName(comprobante, "Conceptos");
  const conceptoNodos = conceptosWrapper
    ? getDirectChildrenByLocalName(conceptosWrapper, "Concepto")
    : [];
  const impuestosGlobal = getDirectChildByLocalName(comprobante, "Impuestos");

  const trasladosLocales = impuestosLocalesWrapper
    ? getDirectChildrenByLocalName(impuestosLocalesWrapper, "TrasladosLocales").map((n) =>
        mapImpuestoLocal(n, "traslado"),
      )
    : [];
  const retencionesLocales = impuestosLocalesWrapper
    ? getDirectChildrenByLocalName(impuestosLocalesWrapper, "RetencionesLocales").map((n) =>
        mapImpuestoLocal(n, "retencion"),
      )
    : [];

  const uuid = getAttr(timbre, "UUID");

  return {
    comprobante: {
      uuid,
      serie: getAttr(comprobante, "Serie"),
      folio: getAttr(comprobante, "Folio"),
      fecha: getAttr(comprobante, "Fecha"),
      moneda: getAttr(comprobante, "Moneda"),
      subtotal: toNumber(getAttr(comprobante, "SubTotal")),
      total: toNumber(getAttr(comprobante, "Total")),
      metodoPago: getAttr(comprobante, "MetodoPago"),
      formaPago: getAttr(comprobante, "FormaPago"),
      tipoComprobante: getAttr(comprobante, "TipoDeComprobante"),
      lugarExpedicion: getAttr(comprobante, "LugarExpedicion"),
    },
    emisor: {
      rfc: getAttr(emisor, "Rfc"),
      nombre: getAttr(emisor, "Nombre"),
      regimenFiscal: getAttr(emisor, "RegimenFiscal"),
    },
    receptor: {
      rfc: getAttr(receptor, "Rfc"),
      nombre: getAttr(receptor, "Nombre"),
      codigoPostal: getAttr(receptor, "DomicilioFiscalReceptor"),
      regimenFiscal: getAttr(receptor, "RegimenFiscalReceptor"),
      usoCfdi: getAttr(receptor, "UsoCFDI"),
    },
    conceptos: conceptoNodos.map(mapConcepto),
    traslados: trasladosDeNodoImpuestos(impuestosGlobal),
    retenciones: retencionesDeNodoImpuestos(impuestosGlobal),
    impuestosLocales: [...trasladosLocales, ...retencionesLocales],
    complementoAerolineas: mapComplementoAerolineas(comprobante),
    timbreFiscal: timbre
      ? {
          uuid,
          fechaTimbrado: getAttr(timbre, "FechaTimbrado"),
          selloCFD: getAttr(timbre, "SelloCFD"),
          selloSAT: getAttr(timbre, "SelloSAT"),
          noCertificadoSAT: getAttr(timbre, "NoCertificadoSAT"),
          rfcProvCertif: getAttr(timbre, "RfcProvCertif"),
          version: getAttr(timbre, "Version"),
        }
      : undefined,
  };
}
