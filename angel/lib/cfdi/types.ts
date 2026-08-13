export type TipoServicio = "HOTEL" | "AVION" | "RENTA_AUTO" | "DESCONOCIDO";

// Catálogo SAT c_Impuesto (solo los 3 códigos usados en CFDI 4.0)
export const IMPUESTO_CODES: Record<string, string> = {
  "001": "ISR",
  "002": "IVA",
  "003": "IEPS",
};

export type Traslado = {
  base?: number;
  impuesto: string;
  tipoFactor?: string;
  tasaOCuota?: number;
  importe: number;
};

export type Retencion = {
  impuesto: string;
  importe: number;
};

export type ImpuestoLocal = {
  tipo: "traslado" | "retencion";
  nombre: string;
  tasa?: number;
  importe: number;
};

// Complemento SAT "Aerolineas" (xmlns:aerolineas="http://www.sat.gob.mx/aerolineas").
// Aquí es donde suele venir el TUA de verdad (atributo, no un Concepto).
export type OtroCargoAerolinea = {
  codigo?: string;
  importe: number;
};

export type ComplementoAerolineas = {
  tua?: number;
  otrosCargos: OtroCargoAerolinea[];
};

export type Concepto = {
  claveProdServ?: string;
  noIdentificacion?: string;
  cantidad?: number;
  claveUnidad?: string;
  unidad?: string;
  descripcion?: string;
  valorUnitario?: number;
  importe?: number;
  objetoImp?: string;
  traslados: Traslado[];
  retenciones: Retencion[];
};

export interface ComprobanteInfo {
  uuid?: string;
  serie?: string;
  folio?: string;
  fecha?: string;
  moneda?: string;
  subtotal: number;
  total: number;
  metodoPago?: string;
  formaPago?: string;
  tipoComprobante?: string;
  lugarExpedicion?: string;
}

export interface EmisorInfo {
  rfc?: string;
  nombre?: string;
  regimenFiscal?: string;
}

export interface ReceptorInfo {
  rfc?: string;
  nombre?: string;
  codigoPostal?: string;
  regimenFiscal?: string;
  usoCfdi?: string;
}

export interface TimbreFiscalInfo {
  uuid?: string;
  fechaTimbrado?: string;
  selloCFD?: string;
  selloSAT?: string;
  noCertificadoSAT?: string;
  rfcProvCertif?: string;
  version?: string;
}

// Representación fiel de lo encontrado en el XML. No decide tipo de servicio.
export interface NormalizedInvoice {
  comprobante: ComprobanteInfo;
  emisor: EmisorInfo;
  receptor: ReceptorInfo;
  conceptos: Concepto[];
  traslados: Traslado[];
  retenciones: Retencion[];
  impuestosLocales: ImpuestoLocal[];
  timbreFiscal?: TimbreFiscalInfo;
  complementoAerolineas?: ComplementoAerolineas;
}

export interface ValidacionTotales {
  subtotal: number;
  totalImpuestos: number;
  totalCalculado: number;
  totalXml: number;
  diferencia: number;
  cuadra: boolean;
}

export interface InvoiceResultImpuestos {
  iva: number;
  // Desglose por tasa: en México solo existen 3 tasas de IVA (16% general,
  // 8% zona fronteriza, 0%/exento), así que a diferencia de los cargos de
  // aerolínea (códigos abiertos) aquí sí conviene un desglose fijo.
  ivaPorTasa: {
    tasa16: number;
    tasa8: number;
    otras: number;
  };
  ieps: number;
  retenciones: {
    isr: number;
    iva: number;
    ieps: number;
  };
  impuestosLocales: {
    ish: number;
    otros: number;
  };
  tua: number;
  // Suma de todos los cargos de aerolínea del complemento SAT que NO son TUA
  // (YQ, YR, etc.). El TUA se maneja aparte porque para tablas/reportes se
  // quiere separado de "cargos aéreos".
  otrosCargosAerolinea: number;
}

export interface InvoiceResult {
  tipoServicio: TipoServicio;
  factura: {
    uuid?: string;
    serie?: string;
    folio?: string;
    fecha?: string;
    moneda?: string;
    subtotal: number;
    total: number;
    tipoComprobante?: string;
    metodoPago?: string;
    formaPago?: string;
    lugarExpedicion?: string;
  };
  emisor: EmisorInfo;
  receptor: ReceptorInfo;
  conceptos: Concepto[];
  impuestos: InvoiceResultImpuestos;
  detalleOriginal: {
    traslados: Traslado[];
    retenciones: Retencion[];
    impuestosLocales: ImpuestoLocal[];
    otrosCargosAerolinea: OtroCargoAerolinea[];
  };
  validacion: ValidacionTotales;
}
