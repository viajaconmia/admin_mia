import * as xml2js from 'xml2js';

export interface ImpuestoDetalle {
  tipo: 'traslado' | 'retencion';
  impuesto: string; // IVA, IEPS, ISR, etc.
  tipoFactor: string; // Tasa, Cuota, Exento
  tasaOCuota?: number; // 0.16, 0.08, 0.00, etc.
  importe?: number;
  base?: number;
}

export interface ParsedInvoiceData {
  uuid: string;
  folio: string;
  serie?: string;
  fecha: string;
  total: number;
  subtotal: number;
  moneda: string;
  emisorRfc: string;
  emisorNombre?: string;
  receptorRfc: string;
  receptorNombre?: string;
  conceptos: any[];
  impuestos: ImpuestoDetalle[];
  totalImpuestosTrasladados?: number;
  totalImpuestosRetenidos?: number;
  xmlData: any;
}

export class InvoiceXMLParser {
  /**
   * Parsea un archivo XML de factura del SAT mexicano
   * @param xmlContent Contenido del archivo XML como string
   * @returns Datos estructurados de la factura
   */
  static async parseXMLInvoice(xmlContent: string): Promise<ParsedInvoiceData> {
    try {
      const parser = new xml2js.Parser({ 
        explicitArray: false, 
        mergeAttrs: true,
        trim: true 
      });
      
      const result = await parser.parseStringPromise(xmlContent);
      
      // Buscar el comprobante en diferentes estructuras posibles
      let comprobante = result['cfdi:Comprobante'] || 
                       result.Comprobante || 
                       result['tfd:TimbreFiscalDigital'] ||
                       result;

      if (!comprobante) {
        throw new Error('No se encontró la estructura del comprobante en el XML');
      }

      // Extraer datos básicos del comprobante
      const uuid = this.extractUUID(result);
      const folio = comprobante.Folio || comprobante.folio || '';
      const serie = comprobante.Serie || comprobante.serie || undefined;
      const fecha = comprobante.Fecha || comprobante.fecha || new Date().toISOString();
      const total = parseFloat(comprobante.Total || comprobante.total || '0');
      const subtotal = parseFloat(comprobante.SubTotal || comprobante.subtotal || '0');
      const moneda = comprobante.Moneda || comprobante.moneda || 'MXN';

      // Extraer datos del emisor
      const emisor = comprobante['cfdi:Emisor'] || comprobante.Emisor || {};
      const emisorRfc = emisor.Rfc || emisor.rfc || '';
      const emisorNombre = emisor.Nombre || emisor.nombre || undefined;

      // Extraer datos del receptor
      const receptor = comprobante['cfdi:Receptor'] || comprobante.Receptor || {};
      const receptorRfc = receptor.Rfc || receptor.rfc || '';
      const receptorNombre = receptor.Nombre || receptor.nombre || undefined;

      // Extraer conceptos
      const conceptos = this.extractConceptos(comprobante);

      // Extraer impuestos
      const { impuestos, totalImpuestosTrasladados, totalImpuestosRetenidos } = this.extractImpuestos(comprobante);

      return {
        uuid,
        folio,
        serie,
        fecha,
        total,
        subtotal,
        moneda,
        emisorRfc,
        emisorNombre,
        receptorRfc,
        receptorNombre,
        conceptos,
        impuestos,
        totalImpuestosTrasladados,
        totalImpuestosRetenidos,
        xmlData: result
      };

    } catch (error: any) {
      console.error('Error parsing XML:', error);
      throw new Error(`Error al parsear XML: ${error.message}`);
    }
  }

  /**
   * Extrae el UUID del timbre fiscal digital
   */
  private static extractUUID(xmlData: any): string {
    // Buscar en diferentes ubicaciones posibles
    const locations = [
      xmlData['cfdi:Comprobante']?.['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.UUID,
      xmlData['cfdi:Comprobante']?.['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.uuid,
      xmlData.Comprobante?.Complemento?.TimbreFiscalDigital?.UUID,
      xmlData.Comprobante?.Complemento?.TimbreFiscalDigital?.uuid,
      xmlData.UUID,
      xmlData.uuid
    ];

    for (const location of locations) {
      if (location) return location;
    }

    throw new Error('No se encontró el UUID en el XML');
  }

  /**
   * Extrae los impuestos de la factura (traslados y retenciones)
   * Incluye soporte para múltiples impuestos como IVA, ISH, y cuotas municipales
   */
  private static extractImpuestos(comprobante: any): {
    impuestos: ImpuestoDetalle[];
    totalImpuestosTrasladados?: number;
    totalImpuestosRetenidos?: number;
  } {
    const impuestos: ImpuestoDetalle[] = [];
    let totalImpuestosTrasladados = 0;
    let totalImpuestosRetenidos = 0;

    // Buscar la sección de impuestos en diferentes estructuras
    const impuestosSection = comprobante['cfdi:Impuestos'] || 
                            comprobante.Impuestos || 
                            comprobante.impuestos || 
                            {};

    // Extraer totales de impuestos del comprobante
    if (impuestosSection.TotalImpuestosTrasladados || impuestosSection.totalImpuestosTrasladados) {
      totalImpuestosTrasladados = parseFloat(impuestosSection.TotalImpuestosTrasladados || impuestosSection.totalImpuestosTrasladados || '0');
    }
    
    if (impuestosSection.TotalImpuestosRetenidos || impuestosSection.totalImpuestosRetenidos) {
      totalImpuestosRetenidos = parseFloat(impuestosSection.TotalImpuestosRetenidos || impuestosSection.totalImpuestosRetenidos || '0');
    }

    // Extraer impuestos trasladados (como IVA)
    let traslados = impuestosSection['cfdi:Traslados']?.['cfdi:Traslado'] ||
                   impuestosSection.Traslados?.Traslado ||
                   impuestosSection.traslados?.traslado ||
                   [];

    // Normalizar a array si es un solo elemento
    if (!Array.isArray(traslados)) {
      traslados = [traslados];
    }

    for (const traslado of traslados) {
      if (traslado) {
        impuestos.push({
          tipo: 'traslado',
          impuesto: traslado.Impuesto || traslado.impuesto || 'IVA',
          tipoFactor: traslado.TipoFactor || traslado.tipoFactor || 'Tasa',
          tasaOCuota: traslado.TasaOCuota ? parseFloat(traslado.TasaOCuota) : 
                     traslado.tasaOCuota ? parseFloat(traslado.tasaOCuota) : undefined,
          importe: traslado.Importe ? parseFloat(traslado.Importe) :
                  traslado.importe ? parseFloat(traslado.importe) : undefined,
          base: traslado.Base ? parseFloat(traslado.Base) :
               traslado.base ? parseFloat(traslado.base) : undefined
        });
      }
    }

    // Extraer impuestos retenidos (como ISR)
    let retenciones = impuestosSection['cfdi:Retenciones']?.['cfdi:Retencion'] ||
                     impuestosSection.Retenciones?.Retencion ||
                     impuestosSection.retenciones?.retencion ||
                     [];

    // Normalizar a array si es un solo elemento
    if (!Array.isArray(retenciones)) {
      retenciones = [retenciones];
    }

    for (const retencion of retenciones) {
      if (retencion) {
        impuestos.push({
          tipo: 'retencion',
          impuesto: retencion.Impuesto || retencion.impuesto || 'ISR',
          tipoFactor: retencion.TipoFactor || retencion.tipoFactor || 'Tasa',
          tasaOCuota: retencion.TasaOCuota ? parseFloat(retencion.TasaOCuota) : 
                     retencion.tasaOCuota ? parseFloat(retencion.tasaOCuota) : undefined,
          importe: retencion.Importe ? parseFloat(retencion.Importe) :
                  retencion.importe ? parseFloat(retencion.importe) : undefined,
          base: retencion.Base ? parseFloat(retencion.Base) :
               retencion.base ? parseFloat(retencion.base) : undefined
        });
      }
    }

    return {
      impuestos,
      totalImpuestosTrasladados: totalImpuestosTrasladados > 0 ? totalImpuestosTrasladados : undefined,
      totalImpuestosRetenidos: totalImpuestosRetenidos > 0 ? totalImpuestosRetenidos : undefined
    };
  }

  /**
   * Extrae los conceptos de la factura
   */
  private static extractConceptos(comprobante: any): any[] {
    const conceptos = [];
    
    // Buscar conceptos en diferentes estructuras
    let conceptosData = comprobante['cfdi:Conceptos']?.['cfdi:Concepto'] ||
                       comprobante.Conceptos?.Concepto ||
                       comprobante.conceptos?.concepto ||
                       [];

    // Normalizar a array si es un solo elemento
    if (!Array.isArray(conceptosData)) {
      conceptosData = [conceptosData];
    }

    for (const concepto of conceptosData) {
      if (concepto) {
        conceptos.push({
          cantidad: parseFloat(concepto.Cantidad || concepto.cantidad || '1'),
          unidad: concepto.Unidad || concepto.unidad || '',
          descripcion: concepto.Descripcion || concepto.descripcion || '',
          valorUnitario: parseFloat(concepto.ValorUnitario || concepto.valorUnitario || '0'),
          importe: parseFloat(concepto.Importe || concepto.importe || '0'),
          claveUnidad: concepto.ClaveUnidad || concepto.claveUnidad || '',
          claveProdServ: concepto.ClaveProdServ || concepto.claveProdServ || ''
        });
      }
    }

    return conceptos;
  }

  /**
   * Valida que el XML contenga los campos mínimos requeridos
   */
  static validateXML(parsedData: ParsedInvoiceData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parsedData.uuid) errors.push('UUID es requerido');
    if (!parsedData.folio) errors.push('Folio es requerido');
    if (!parsedData.emisorRfc) errors.push('RFC del emisor es requerido');
    if (!parsedData.receptorRfc) errors.push('RFC del receptor es requerido');
    if (parsedData.total <= 0) errors.push('Total debe ser mayor a 0');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatea los datos para mostrar en interfaz
   */
  static formatForDisplay(parsedData: ParsedInvoiceData) {
    const currency = parsedData.moneda || 'MXN';
    
    // Formatear impuestos para mostrar
    const impuestosFormateados = parsedData.impuestos.map(impuesto => {
      let tasaFormateada = 'N/A';
      
      if (impuesto.tasaOCuota !== undefined) {
        if (impuesto.tipoFactor === 'Tasa') {
          // Para tasas, mostrar como porcentaje
          tasaFormateada = (impuesto.tasaOCuota * 100).toFixed(2) + '%';
        } else if (impuesto.tipoFactor === 'Cuota') {
          // Para cuotas, mostrar como monto fijo
          tasaFormateada = new Intl.NumberFormat('es-MX', { 
            style: 'currency', 
            currency 
          }).format(impuesto.tasaOCuota);
        } else if (impuesto.tipoFactor === 'Exento') {
          tasaFormateada = 'Exento';
        } else {
          tasaFormateada = impuesto.tasaOCuota.toString();
        }
      }
      
      const importeFormateado = impuesto.importe ? 
        new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(impuesto.importe) : 
        'N/A';
      
      const baseFormateada = impuesto.base ?
        new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(impuesto.base) :
        'N/A';
      
      return {
        ...impuesto,
        tasaFormateada,
        importeFormateado,
        baseFormateada,
        descripcion: `${impuesto.impuesto} ${tasaFormateada} ${impuesto.tipo === 'traslado' ? '(Trasladado)' : '(Retenido)'}`
      };
    });

    return {
      ...parsedData,
      folioCompleto: parsedData.serie ? `${parsedData.serie}-${parsedData.folio}` : parsedData.folio,
      fechaFormateada: new Date(parsedData.fecha).toLocaleDateString('es-MX'),
      totalFormateado: new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency
      }).format(parsedData.total),
      subtotalFormateado: new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency
      }).format(parsedData.subtotal),
      totalImpuestosTrasladados: parsedData.totalImpuestosTrasladados ? 
        new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(parsedData.totalImpuestosTrasladados) : 
        undefined,
      totalImpuestosRetenidos: parsedData.totalImpuestosRetenidos ? 
        new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(parsedData.totalImpuestosRetenidos) : 
        undefined,
      impuestosFormateados
    };
  }
}