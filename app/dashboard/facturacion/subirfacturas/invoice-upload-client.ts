// Tipos para la funcionalidad de subida de facturas
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
  conceptos: ConceptoFiscal[];
  impuestos: ImpuestoDetalle[];
  totalImpuestosTrasladados?: number;
  totalImpuestosRetenidos?: number;
}

export interface ConceptoFiscal {
  cantidad: number;
  unidad: string;
  descripcion: string;
  valorUnitario: number;
  importe: number;
  claveUnidad?: string;
  claveProdServ?: string;
}

export interface UploadedInvoice {
  id: number;
  clientId: number;
  uuid: string;
  folio: string;
  serie?: string;
  fecha: string;
  total: string;
  subtotal: string;
  moneda: string;
  emisorRfc: string;
  emisorNombre?: string;
  receptorRfc: string;
  receptorNombre?: string;
  conceptos: ConceptoFiscal[];
  xmlPath: string;
  pdfPath?: string;
  status: 'uploaded' | 'processed' | 'associated';
  associatedReservations: number[];
  createdAt: string;
}

export interface InvoiceUploadConfig {
  // URLs de los endpoints
  endpoints?: {
    preview: string;
    upload: string;
    list: string;
    detail: string;
    associate: string;
  };
  // Función para obtener el token de autenticación
  getAuthToken?: () => string | null;
  // Headers adicionales para las peticiones
  headers?: Record<string, string>;
  // Configuración de archivos
  fileConfig?: {
    maxSize: number; // en bytes
    allowedTypes: {
      xml: string[];
      pdf: string[];
    };
  };
}

export class InvoiceUploadClient {
  private config: Required<InvoiceUploadConfig>;

  constructor(config: InvoiceUploadConfig = {}) {
    this.config = {
      endpoints: {
        preview: '/api/preview-invoice',
        upload: '/api/uploaded-invoices',
        list: '/api/clients/{clientId}/uploaded-invoices',
        detail: '/api/uploaded-invoices/{id}',
        associate: '/api/uploaded-invoices/{id}/associate',
        ...config.endpoints
      },
      getAuthToken: config.getAuthToken || (() => localStorage.getItem('auth_token')),
      headers: config.headers || {},
      fileConfig: {
        maxSize: 10 * 1024 * 1024, // 10MB por defecto
        allowedTypes: {
          xml: ['text/xml', 'application/xml'],
          pdf: ['application/pdf']
        },
        ...config.fileConfig
      }
    };
  }

  /**
   * Valida un archivo antes de subirlo
   */
  validateFile(file: File, type: 'xml' | 'pdf'): { valid: boolean; error?: string } {
    // Validar tamaño
    if (file.size > this.config.fileConfig.maxSize) {
      return {
        valid: false,
        error: `El archivo excede el tamaño máximo de ${this.config.fileConfig.maxSize / 1024 / 1024}MB`
      };
    }

    // Validar tipo
    const allowedTypes = this.config.fileConfig.allowedTypes[type];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Obtiene headers para las peticiones
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.config.headers
    };

    const token = this.config.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Previsualiza un archivo XML sin guardarlo
   */
  async previewXML(xmlFile: File): Promise<ParsedInvoiceData> {
    // Validar archivo
    const validation = this.validateFile(xmlFile, 'xml');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('xml', xmlFile);

    const response = await fetch(this.config.endpoints.preview, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al previsualizar XML');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Sube una factura completa (XML + PDF opcional)
   */
  async uploadInvoice(params: {
    clientId: number;
    xmlFile: File;
    pdfFile?: File;
  }): Promise<UploadedInvoice> {
    const { clientId, xmlFile, pdfFile } = params;

    // Validar archivos
    const xmlValidation = this.validateFile(xmlFile, 'xml');
    if (!xmlValidation.valid) {
      throw new Error(`XML: ${xmlValidation.error}`);
    }

    if (pdfFile) {
      const pdfValidation = this.validateFile(pdfFile, 'pdf');
      if (!pdfValidation.valid) {
        throw new Error(`PDF: ${pdfValidation.error}`);
      }
    }

    const formData = new FormData();
    formData.append('clientId', clientId.toString());
    formData.append('xml', xmlFile);
    if (pdfFile) {
      formData.append('pdf', pdfFile);
    }

    const response = await fetch(this.config.endpoints.upload, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir factura');
    }

    const result = await response.json();
    return result.invoice;
  }

  /**
   * Obtiene facturas de un cliente
   */
  async getInvoicesByClient(clientId: number): Promise<UploadedInvoice[]> {
    const url = this.config.endpoints.list.replace('{clientId}', clientId.toString());
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener facturas');
    }

    return response.json();
  }

  /**
   * Obtiene el detalle de una factura específica
   */
  async getInvoiceDetail(invoiceId: number): Promise<UploadedInvoice> {
    const url = this.config.endpoints.detail.replace('{id}', invoiceId.toString());
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener factura');
    }

    return response.json();
  }

  /**
   * Asocia una factura con reservaciones
   */
  async associateInvoice(invoiceId: number, reservationIds: number[]): Promise<void> {
    const url = this.config.endpoints.associate.replace('{id}', invoiceId.toString());
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(),
      },
      body: JSON.stringify({ reservationIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al asociar factura');
    }
  }
}

// Función helper para formatear moneda
export const formatCurrency = (amount: string | number, currency: string = 'MXN'): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

// Función helper para formatear fecha
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Export de configuración por defecto
export const defaultInvoiceUploadConfig: InvoiceUploadConfig = {
  endpoints: {
    preview: '/api/preview-invoice',
    upload: '/api/uploaded-invoices',
    list: '/api/clients/{clientId}/uploaded-invoices',
    detail: '/api/uploaded-invoices/{id}',
    associate: '/api/uploaded-invoices/{id}/associate'
  },
  getAuthToken: () => localStorage.getItem('auth_token'),
  headers: {},
  fileConfig: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: {
      xml: ['text/xml', 'application/xml'],
      pdf: ['application/pdf']
    }
  }
};