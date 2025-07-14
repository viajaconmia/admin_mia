import { Express, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { InvoiceXMLParser } from './invoice-xml-parser';

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/invoices';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'xml' && file.mimetype === 'text/xml') {
      cb(null, true);
    } else if (file.fieldname === 'pdf' && file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  }
});

export interface InvoiceUploadConfig {
  // Middleware de autenticación (opcional)
  authMiddleware?: (req: Request, res: Response, next: any) => void;
  // Middleware de autorización (opcional)
  authzMiddleware?: (req: Request, res: Response, next: any) => void;
  // Función para guardar la factura en la base de datos
  saveInvoice?: (invoiceData: any) => Promise<any>;
  // Función para obtener facturas por cliente
  getInvoicesByClient?: (clientId: number) => Promise<any[]>;
  // Función para obtener una factura específica
  getInvoiceById?: (invoiceId: number) => Promise<any>;
  // Función para asociar facturas con reservaciones
  associateInvoice?: (invoiceId: number, reservationIds: number[]) => Promise<void>;
  // Configuración de rutas personalizadas
  routes?: {
    preview?: string;
    upload?: string;
    list?: string;
    detail?: string;
    associate?: string;
  };
}

export class InvoiceUploadRoutes {
  private config: InvoiceUploadConfig;
  private upload = upload;

  constructor(config: InvoiceUploadConfig = {}) {
    this.config = {
      routes: {
        preview: '/api/preview-invoice',
        upload: '/api/uploaded-invoices',
        list: '/api/clients/:clientId/uploaded-invoices',
        detail: '/api/uploaded-invoices/:id',
        associate: '/api/uploaded-invoices/:id/associate',
        ...config.routes
      },
      ...config
    };
  }

  /**
   * Registra todas las rutas de subida de facturas
   */
  registerRoutes(app: Express): void {
    this.registerPreviewRoute(app);
    this.registerUploadRoute(app);
    
    if (this.config.getInvoicesByClient) {
      this.registerListRoute(app);
    }
    
    if (this.config.getInvoiceById) {
      this.registerDetailRoute(app);
    }
    
    if (this.config.associateInvoice) {
      this.registerAssociateRoute(app);
    }
  }

  /**
   * Ruta para previsualizar XML sin guardar
   */
  private registerPreviewRoute(app: Express): void {
    const middlewares = this.getMiddlewares();
    
    app.post(
      this.config.routes!.preview!,
      ...middlewares,
      this.upload.single('xml'),
      this.handlePreview.bind(this)
    );
  }

  /**
   * Ruta para subir y guardar factura completa
   */
  private registerUploadRoute(app: Express): void {
    const middlewares = this.getMiddlewares();
    
    app.post(
      this.config.routes!.upload!,
      ...middlewares,
      this.upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'xml', maxCount: 1 }
      ]),
      this.handleUpload.bind(this)
    );
  }

  /**
   * Ruta para listar facturas por cliente
   */
  private registerListRoute(app: Express): void {
    const middlewares = this.getMiddlewares();
    
    app.get(
      this.config.routes!.list!,
      ...middlewares,
      this.handleList.bind(this)
    );
  }

  /**
   * Ruta para obtener detalle de factura
   */
  private registerDetailRoute(app: Express): void {
    const middlewares = this.getMiddlewares();
    
    app.get(
      this.config.routes!.detail!,
      ...middlewares,
      this.handleDetail.bind(this)
    );
  }

  /**
   * Ruta para asociar factura con reservaciones
   */
  private registerAssociateRoute(app: Express): void {
    const middlewares = this.getMiddlewares();
    
    app.post(
      this.config.routes!.associate!,
      ...middlewares,
      this.handleAssociate.bind(this)
    );
  }

  /**
   * Handler para previsualización de XML
   */
  private async handlePreview(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'Archivo XML es requerido' });
        return;
      }

      // Leer y parsear XML
      const xmlContent = fs.readFileSync(req.file.path, 'utf-8');
      const parsedData = await InvoiceXMLParser.parseXMLInvoice(xmlContent);

      // Validar datos
      const validation = InvoiceXMLParser.validateXML(parsedData);
      if (!validation.valid) {
        res.status(400).json({ 
          message: 'XML inválido', 
          errors: validation.errors 
        });
        return;
      }

      // Limpiar archivo temporal
      fs.unlinkSync(req.file.path);

      // Formatear para mostrar
      const formattedData = InvoiceXMLParser.formatForDisplay(parsedData);

      res.json({
        success: true,
        data: formattedData,
        message: 'XML parseado exitosamente'
      });

    } catch (error: any) {
      console.error('Error in preview:', error);
      res.status(500).json({ 
        message: 'Error al parsear XML',
        error: error.message 
      });
    }
  }

  /**
   * Handler para subida completa
   */
  private async handleUpload(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.body;
      
      if (!clientId) {
        res.status(400).json({ message: 'Client ID es requerido' });
        return;
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.xml || !files.xml[0]) {
        res.status(400).json({ message: 'Archivo XML es requerido' });
        return;
      }

      const xmlFile = files.xml[0];
      const pdfFile = files.pdf ? files.pdf[0] : null;

      // Parsear XML
      const xmlContent = fs.readFileSync(xmlFile.path, 'utf-8');
      const parsedData = await InvoiceXMLParser.parseXMLInvoice(xmlContent);

      // Validar
      const validation = InvoiceXMLParser.validateXML(parsedData);
      if (!validation.valid) {
        res.status(400).json({ 
          message: 'XML inválido', 
          errors: validation.errors 
        });
        return;
      }

      // Preparar datos para guardar
      const invoiceData = {
        clientId: parseInt(clientId),
        uuid: parsedData.uuid,
        folio: parsedData.folio,
        serie: parsedData.serie,
        fecha: parsedData.fecha,
        total: parsedData.total.toString(),
        subtotal: parsedData.subtotal.toString(),
        moneda: parsedData.moneda,
        emisorRfc: parsedData.emisorRfc,
        emisorNombre: parsedData.emisorNombre,
        receptorRfc: parsedData.receptorRfc,
        receptorNombre: parsedData.receptorNombre,
        conceptos: parsedData.conceptos,
        xmlPath: xmlFile.path,
        pdfPath: pdfFile ? pdfFile.path : null,
        xmlData: parsedData.xmlData,
        status: "uploaded" as const,
        associatedReservations: []
      };

      // Guardar si se proporciona función
      let savedInvoice = invoiceData;
      if (this.config.saveInvoice) {
        savedInvoice = await this.config.saveInvoice(invoiceData);
      }

      res.json({
        success: true,
        invoice: savedInvoice,
        message: 'Factura subida y procesada exitosamente'
      });

    } catch (error: any) {
      console.error('Error in upload:', error);
      res.status(500).json({ 
        message: 'Error al subir factura',
        error: error.message 
      });
    }
  }

  /**
   * Handler para listar facturas
   */
  private async handleList(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      
      if (!this.config.getInvoicesByClient) {
        res.status(501).json({ message: 'Funcionalidad no implementada' });
        return;
      }

      const invoices = await this.config.getInvoicesByClient(parseInt(clientId));
      res.json(invoices);

    } catch (error: any) {
      console.error('Error listing invoices:', error);
      res.status(500).json({ 
        message: 'Error al obtener facturas',
        error: error.message 
      });
    }
  }

  /**
   * Handler para detalle de factura
   */
  private async handleDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!this.config.getInvoiceById) {
        res.status(501).json({ message: 'Funcionalidad no implementada' });
        return;
      }

      const invoice = await this.config.getInvoiceById(parseInt(id));
      
      if (!invoice) {
        res.status(404).json({ message: 'Factura no encontrada' });
        return;
      }

      res.json(invoice);

    } catch (error: any) {
      console.error('Error getting invoice:', error);
      res.status(500).json({ 
        message: 'Error al obtener factura',
        error: error.message 
      });
    }
  }

  /**
   * Handler para asociar factura
   */
  private async handleAssociate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reservationIds } = req.body;
      
      if (!this.config.associateInvoice) {
        res.status(501).json({ message: 'Funcionalidad no implementada' });
        return;
      }

      await this.config.associateInvoice(parseInt(id), reservationIds);
      
      res.json({
        success: true,
        message: 'Factura asociada exitosamente'
      });

    } catch (error: any) {
      console.error('Error associating invoice:', error);
      res.status(500).json({ 
        message: 'Error al asociar factura',
        error: error.message 
      });
    }
  }

  /**
   * Obtiene middlewares según configuración
   */
  private getMiddlewares(): any[] {
    const middlewares: any[] = [];
    
    if (this.config.authMiddleware) {
      middlewares.push(this.config.authMiddleware);
    }
    
    if (this.config.authzMiddleware) {
      middlewares.push(this.config.authzMiddleware);
    }
    
    return middlewares;
  }
}

// Export para uso directo
export const createInvoiceUploadRoutes = (config: InvoiceUploadConfig = {}) => {
  return new InvoiceUploadRoutes(config);
};