import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

// export async function generarFacturaPDF(facturaData: any): Promise<string> {
//   const doc = new jsPDF({
//     orientation: 'portrait',
//     unit: 'mm',
//     format: 'letter'
//   });

//   const {
//     comprobante,
//     emisor,
//     receptor,
//     conceptos,
//     impuestos,
//     timbreFiscal
//   } = facturaData;

//   // Generar QR con enlace de verificación SAT
//   const qrText = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?re=${emisor.rfc}&rr=${receptor.rfc}&tt=${comprobante.total}&id=${timbreFiscal.uuid}`;
//   const qrDataUrl = await QRCode.toDataURL(qrText);

//   // Configuración de página
//   const marginLeft = 15;
//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();

//   // --- Encabezado ---
//   // Logo y título
//   doc.setFillColor(0, 51, 102);
//   doc.rect(0, 0, pageWidth, 20, 'F');
//   doc.setTextColor(255, 255, 255);
//   doc.setFontSize(16);
//   doc.setFont('helvetica', 'bold');
//   doc.text('FACTURA', marginLeft, 15);
  
//   // Datos del emisor
//   doc.text(emisor.nombre, pageWidth - marginLeft, 15, { align: 'right' });
//   doc.setFontSize(10);
//   doc.text(`RFC: ${emisor.rfc}`, pageWidth - marginLeft, 20, { align: 'right' });
//   doc.text(`Regimen Fiscal: ${emisor.regimenFiscal} - ${getRegimenDesc(emisor.regimenFiscal)}`,
//            pageWidth - marginLeft, 25, { align: 'right' });

//   // Folio fiscal
//   doc.setTextColor(0, 0, 0);
//   doc.setFontSize(12);
//   doc.setFont('helvetica', 'bold');
//   doc.text(`Folio Fiscal: ${timbreFiscal.uuid}`, 105, 35, { align: 'center' });

//   // --- Sección de datos principales ---
//   doc.setFontSize(10);
//   doc.setFont('helvetica', 'normal');
  
//   // Datos del comprobante (2 columnas)
//   doc.text(`Serie: ${comprobante.serie || ''}`, marginLeft, 45);
//   doc.text(`Folio: ${comprobante.folio}`, marginLeft, 50);
//   doc.text(`Fecha y Hora: ${formatDateTime(comprobante.fecha)}`, marginLeft, 55);
//   doc.text(`Lugar de Expedición: ${comprobante.lugarExpedicion}`, marginLeft, 60);
  
//   doc.text(`Tipo de Comprobante: ${comprobante.tipoDeComprobante} - ${getTipoComprobanteDesc(comprobante.tipoDeComprobante)}`,
//            pageWidth/2 + 10, 45);
//   doc.text(`Exportación: ${comprobante.exportacion} - ${getExportacionDesc(comprobante.exportacion)}`,
//            pageWidth/2 + 10, 50);
//   doc.text(`Método de Pago: ${comprobante.metodoPago} - ${getMetodoPagoDesc(comprobante.metodoPago)}`,
//            pageWidth/2 + 10, 55);
//   doc.text(`Forma de Pago: ${comprobante.formaPago} - ${getFormaPagoDesc(comprobante.formaPago)}`,
//            pageWidth/2 + 10, 60);

//   // --- Datos del Emisor ---
//   doc.setFont('helvetica', 'bold');
//   doc.text('Emisor:', marginLeft, 70);
//   doc.setFont('helvetica', 'normal');
//   doc.text(`Nombre: ${emisor.nombre}`, marginLeft, 75);
//   doc.text(`RFC: ${emisor.rfc}`, marginLeft, 80);
//   doc.text(`Regimen Fiscal: ${emisor.regimenFiscal} - ${getRegimenDesc(emisor.regimenFiscal)}`, marginLeft, 85);
//   // Agregar dirección y teléfono si están disponibles

//   // --- Datos del Receptor ---
//   doc.setFont('helvetica', 'bold');
//   doc.text('Receptor:', pageWidth/2 + 10, 70);
//   doc.setFont('helvetica', 'normal');
//   doc.text(`Nombre: ${receptor.nombre}`, pageWidth/2 + 10, 75);
//   doc.text(`RFC: ${receptor.rfc}`, pageWidth/2 + 10, 80);
//   doc.text(`Uso CFDI: ${receptor.usoCFDI} - ${getUsoCFDIDesc(receptor.usoCFDI)}`, pageWidth/2 + 10, 85);
//   doc.text(`Regimen Fiscal: ${receptor.regimenFiscal} - ${getRegimenDesc(receptor.regimenFiscal)}`, pageWidth/2 + 10, 90);
//   doc.text(`Domicilio Fiscal: ${receptor.domicilioFiscal}`, pageWidth/2 + 10, 95);

//   // --- Tabla de Conceptos ---
//   doc.setFont('helvetica', 'bold');
//   doc.text('Conceptos', marginLeft, 105);
  
//   autoTable(doc, {
//     startY: 110,
//     head: [
//       [
//         { content: 'Cant.', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
//         { content: 'Clave Unidad', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
//         { content: 'Unidad', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
//         { content: 'Clave Prod.', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
//         { content: 'Descripción', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
//         { content: 'P. Unitario', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
//         { content: 'Importe', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } }
//       ]
//     ],
//     body: conceptos.map((c: any) => [
//       { content: c.cantidad, styles: { halign: 'center' } },
//       { content: c.claveUnidad, styles: { halign: 'center' } },
//       c.unidad,
//       { content: c.claveProdServ, styles: { halign: 'center' } },
//       c.descripcion,
//       { content: `$${parseFloat(c.valorUnitario).toFixed(2)}`, styles: { halign: 'right' } },
//       { content: `$${parseFloat(c.importe).toFixed(2)}`, styles: { halign: 'right' } }
//     ]),
//     styles: {
//       fontSize: 8,
//       cellPadding: 2,
//       lineWidth: 0.1
//     },
//     headStyles: {
//       fillColor: [0, 51, 102],
//       textColor: [255, 255, 255],
//       fontStyle: 'bold'
//     },
//     alternateRowStyles: {
//       fillColor: [240, 240, 240]
//     },
//     margin: { left: marginLeft }
//   });

//   const afterConceptsY = (doc as any).lastAutoTable.finalY + 10;

//   // --- Impuestos ---
//   doc.setFontSize(10);
//   doc.setFont('helvetica', 'bold');
//   doc.text('Desglose de impuestos trasladados:', marginLeft, afterConceptsY);
  
//   autoTable(doc, {
//     startY: afterConceptsY + 5,
//     head: [
//       [
//         { content: 'Impuesto', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
//         { content: 'Tasa o Cuota', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
//         { content: 'Importe', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } }
//       ]
//     ],
//     body: [
//       [
//         `${impuestos.traslado.impuesto} - ${getImpuestoDesc(impuestos.traslado.impuesto)}`,
//         impuestos.traslado.tasa,
//         `$${parseFloat(impuestos.traslado.importe).toFixed(2)}`
//       ]
//     ],
//     styles: {
//       fontSize: 9,
//       cellPadding: 3
//     },
//     headStyles: {
//       fillColor: [0, 51, 102],
//       textColor: [255, 255, 255],
//       fontStyle: 'bold'
//     },
//     margin: { left: marginLeft }
//   });

//   const afterTaxesY = (doc as any).lastAutoTable.finalY + 10;

//   // --- Totales ---
//   doc.setFontSize(10);
//   doc.setFont('helvetica', 'bold');
//   doc.text(`Subtotal: $${parseFloat(comprobante.subtotal).toFixed(2)}`, pageWidth - 50, afterTaxesY);
//   doc.text(`IVA (16%): $${parseFloat(impuestos.traslado.importe).toFixed(2)}`, pageWidth - 50, afterTaxesY + 5);
//   doc.text(`Total: $${parseFloat(comprobante.total).toFixed(2)}`, pageWidth - 50, afterTaxesY + 10);
  
//   // Cantidad con letra
//   doc.text(`(${numeroALetras(parseFloat(comprobante.total))} MXN)`, marginLeft, afterTaxesY + 15);

//   // --- Timbre Fiscal ---
//   doc.setFontSize(8);
//   doc.setFont('helvetica', 'bold');
//   doc.text('Timbre Fiscal Digital:', marginLeft, afterTaxesY + 25);
//   doc.setFont('helvetica', 'normal');
//   doc.text(`UUID: ${timbreFiscal.uuid}`, marginLeft, afterTaxesY + 30);
//   doc.text(`Fecha Timbrado: ${formatDateTime(timbreFiscal.fechaTimbrado)}`, marginLeft, afterTaxesY + 35);
//   doc.text(`No. Certificado SAT: ${timbreFiscal.noCertificadoSAT}`, marginLeft, afterTaxesY + 40);
//   doc.text(`RFC Proveedor Certificación: ${timbreFiscal.rfcProvCertif}`, marginLeft, afterTaxesY + 45);

//   // --- Sellos Digitales ---
//   doc.setFontSize(7);
//   doc.text(`Sello Digital del CFDI: ${timbreFiscal.selloCFD}`, marginLeft, afterTaxesY + 55, { maxWidth: pageWidth - 2*marginLeft });
//   doc.text(`Sello Digital del SAT: ${timbreFiscal.selloSAT}`, marginLeft, afterTaxesY + 70, { maxWidth: pageWidth - 2*marginLeft });

//   // --- QR Code ---
// // Posicionar el QR abajo del timbre fiscal (ajusta Y si lo necesitas)
//   doc.addImage(qrDataUrl, 'PNG', 150, doc.internal.pageSize.getHeight() - 60, 40, 40);
//   doc.setFontSize(6);
//   doc.text('Código de Verificación SAT', pageWidth - 32.5, afterTaxesY + 56, { align: 'center' });

//   // --- Pie de página ---
//   doc.setFontSize(8);
//   doc.setTextColor(100, 100, 100);
//   doc.text('Este documento es una representación impresa de un CFDI', 105, pageHeight - 10, { align: 'center' });
//   doc.text('Página 1 de 1', pageWidth - marginLeft, pageHeight - 10, { align: 'right' });

//   // Devolver como URL
//   return new Promise((resolve) => {
//     const blob = doc.output('blob');
//     const url = URL.createObjectURL(blob);
//     resolve(url);
//   });
// }

export const generarFacturaPDF = async (facturaData: any): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const { comprobante, emisor, receptor, conceptos, impuestos, timbreFiscal } = facturaData;

  // Generar QR
  const qrText = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?re=${emisor.rfc}&rr=${receptor.rfc}&tt=${comprobante.total}&id=${timbreFiscal.uuid}`;
  const qrDataUrl = await QRCode.toDataURL(qrText);
  console.log(qrText)

  // Configuración
  const marginLeft = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Encabezado mejorado ---
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 30, 'F'); // Aumenté la altura a 30mm
  doc.setTextColor(255, 255, 255);
  
  // Logo (simulado)
  // doc.addImage(logoDataUrl, 'PNG', marginLeft, 5, 30, 15);
  
  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', marginLeft, 20);
  
  // Datos emisor en encabezado
  doc.setFontSize(10);
  doc.text(emisor.nombre, pageWidth - marginLeft, 15, { align: 'right' });
  doc.text(`RFC: ${emisor.rfc}`, pageWidth - marginLeft, 20, { align: 'right' });
  doc.text(`Regimen: ${emisor.regimenFiscal} - ${getRegimenDesc(emisor.regimenFiscal)}`, 
           pageWidth - marginLeft, 25, { align: 'right' });

  // --- Datos principales ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Folio Fiscal: ${timbreFiscal.uuid}`, 105, 40, { align: 'center' });

  // Sección en 2 columnas
  const column1 = marginLeft;
  const column2 = pageWidth / 2 + 10;
  let currentY = 50;

  // Datos comprobante
  doc.setFontSize(10);
  doc.text(`Serie: ${comprobante.serie || 'N/A'}`, column1, currentY);
  doc.text(`Folio: ${comprobante.folio}`, column1, currentY + 5);
  doc.text(`Fecha: ${formatDateTime(comprobante.fecha)}`, column1, currentY + 10);
  doc.text(`Lugar Expedición: ${comprobante.lugarExpedicion}`, column1, currentY + 15);
  
  doc.text(`Tipo: ${comprobante.tipoDeComprobante} - ${getTipoComprobanteDesc(comprobante.tipoDeComprobante)}`, column2, currentY);
  doc.text(`Método Pago: ${comprobante.metodoPago} - ${getMetodoPagoDesc(comprobante.metodoPago)}`, column2, currentY + 5);
  doc.text(`Forma Pago: ${comprobante.formaPago} - ${getFormaPagoDesc(comprobante.formaPago)}`, column2, currentY + 10);
  doc.text(`Moneda: ${comprobante.moneda}`, column2, currentY + 15);

  currentY += 25;

  // --- Receptor ---
  doc.setFont('helvetica', 'bold');
  doc.text('RECEPTOR', marginLeft, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${receptor.nombre}`, marginLeft, currentY + 5);
  doc.text(`RFC: ${receptor.rfc}`, marginLeft, currentY + 10);
  doc.text(`Uso CFDI: ${receptor.usoCFDI} - ${getUsoCFDIDesc(receptor.usoCFDI)}`, marginLeft, currentY + 15);
  doc.text(`Regimen: ${receptor.regimenFiscal} - ${getRegimenDesc(receptor.regimenFiscal)}`, marginLeft, currentY + 20);
  doc.text(`Domicilio: ${receptor.domicilioFiscal}`, marginLeft, currentY + 25);

  currentY += 35;

  // --- Conceptos ---
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        { content: 'Cant.', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
        { content: 'Unidad', styles: { halign: 'center', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
        { content: 'Descripción', styles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
        { content: 'P. Unitario', styles: { halign: 'right', fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
        { content: 'Importe', styles: { halign: 'right', fillColor: [0, 51, 102], textColor: [255, 255, 255] } }
      ]
    ],
    body: conceptos.map((c: any) => [
      { content: c.cantidad, styles: { halign: 'center' } },
      c.unidad,
      c.descripcion,
      { content: `$${parseFloat(c.valorUnitario).toFixed(2)}`, styles: { halign: 'right' } },
      { content: `$${parseFloat(c.importe).toFixed(2)}`, styles: { halign: 'right' } }
    ]),
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    margin: { left: marginLeft }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- Impuestos ---
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        { content: 'Impuesto', styles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
        { content: 'Tasa', styles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] } },
        { content: 'Importe', styles: { halign: 'right', fillColor: [0, 51, 102], textColor: [255, 255, 255] } }
      ]
    ],
    body: [
      [
        `${impuestos.traslado.impuesto} - ${getImpuestoDesc(impuestos.traslado.impuesto)}`,
        `${(impuestos.traslado.tasa * 100).toFixed(2)}%`,
        { content: `$${parseFloat(impuestos.traslado.importe).toFixed(2)}`, styles: { halign: 'right' } }
      ]
    ],
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    margin: { left: marginLeft }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- Totales ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Subtotal: $${parseFloat(comprobante.subtotal).toFixed(2)}`, pageWidth - 50, currentY);
  doc.text(`IVA (${impuestos.traslado.tasa * 100}%): $${parseFloat(impuestos.traslado.importe).toFixed(2)}`, pageWidth - 50, currentY + 5);
  doc.setFontSize(12);
  doc.text(`Total: $${parseFloat(comprobante.total).toFixed(2)}`, pageWidth - 50, currentY + 12);
  
  // Cantidad con letra
  doc.setFontSize(10);
  doc.text(`(${numeroALetras(parseFloat(comprobante.total))})`, marginLeft, currentY + 20);

  currentY += 30;

  // --- Timbre Fiscal ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TIMBRE FISCAL DIGITAL', marginLeft, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`UUID: ${timbreFiscal.uuid}`, marginLeft, currentY + 5);
  doc.text(`Fecha Timbrado: ${formatDateTime(timbreFiscal.fechaTimbrado)}`, marginLeft, currentY + 10);
  doc.text(`Certificado SAT: ${timbreFiscal.noCertificadoSAT}`, marginLeft, currentY + 15);
  doc.text(`RFC Proveedor: ${timbreFiscal.rfcProvCertif}`, marginLeft, currentY + 20);

  // Posicionar QR en esquina inferior derecha sin tapar contenido
  // const qrSize = 35;
  // const qrX = pageWidth - qrSize - 10;
  // const qrY = pageHeight - qrSize - 10;
  // doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  // doc.setFontSize(6);
  // doc.text('Código de Verificación SAT', qrX + qrSize/2, qrY + qrSize + 3, { align: 'center' });

  // // Sellos (más compactos)
  // doc.setFontSize(6);
  // doc.text(`Sello CFD: ${timbreFiscal.selloCFD.substring(0, 50)}...`, marginLeft, pageHeight - 15, { maxWidth: pageWidth - 2*marginLeft });
  // doc.text(`Sello SAT: ${timbreFiscal.selloSAT.substring(0, 50)}...`, marginLeft, pageHeight - 10, { maxWidth: pageWidth - 2*marginLeft });

  // //--- Pie de página ---
  // doc.setFontSize(8);
  // doc.setTextColor(100, 100, 100);
  // doc.text('Este documento es una representación impresa de un CFDI', 105, pageHeight - 10, { align: 'center' });
  // doc.text('Página 1 de 1', pageWidth - marginLeft, pageHeight - 10, { align: 'right' });

  // Devolver como URL
  return doc.output('blob');  
}


// Funciones auxiliares para descripciones
function getTipoComprobanteDesc(codigo: string): string {
  const tipos: Record<string, string> = {
    'I': 'Ingreso',
    'E': 'Egreso',
    'T': 'Traslado',
    'N': 'Nómina',
    'P': 'Pago'
  };
  return tipos[codigo] || codigo;
}

function getFormaPagoDesc(codigo: string): string {
  const formas: Record<string, string> = {
    '01': 'Efectivo',
    '02': 'Cheque nominativo',
    '03': 'Transferencia electrónica de fondos',
    '04': 'Tarjeta de crédito',
    '05': 'Monedero electrónico',
    '06': 'Dinero electrónico',
    '08': 'Vales de despensa',
    '12': 'Dación en pago',
    '13': 'Pago por subrogación',
    '14': 'Pago por consignación',
    '15': 'Condonación',
    '17': 'Compensación',
    '23': 'Novación',
    '24': 'Confusión',
    '25': 'Remisión de deuda',
    '26': 'Prescripción o caducidad',
    '27': 'A satisfacción del acreedor',
    '28': 'Tarjeta de débito',
    '29': 'Tarjeta de servicios',
    '30': 'Aplicación de anticipos',
    '31': 'Intermediario pagos',
    '99': 'Por definir'
  };
  return formas[codigo] || codigo;
}

function getMetodoPagoDesc(codigo: string): string {
  const metodos: Record<string, string> = {
    'PUE': 'Pago en una sola exhibición',
    'PPD': 'Pago en parcialidades o diferido'
  };
  return metodos[codigo] || codigo;
}

function getUsoCFDIDesc(codigo: string): string {
  const usos: Record<string, string> = {
    'G01': 'Adquisición de mercancías',
    'G02': 'Devoluciones, descuentos o bonificaciones',
    'G03': 'Gastos en general',
    'I01': 'Construcciones',
    'I02': 'Mobilario y equipo de oficina por inversiones',
    'I03': 'Equipo de transporte',
    'I04': 'Equipo de cómputo y accesorios',
    'I05': 'Dados, troqueles, moldes, matrices y herramental',
    'I06': 'Comunicaciones telefónicas',
    'I07': 'Comunicaciones satelitales',
    'I08': 'Otra maquinaria y equipo',
    'D01': 'Honorarios médicos, dentales y gastos hospitalarios',
    'D02': 'Gastos médicos por incapacidad o discapacidad',
    'D03': 'Gastos funerales',
    'D04': 'Donativos',
    'D05': 'Intereses reales efectivamente pagados por créditos hipotecarios',
    'D06': 'Aportaciones voluntarias al SAR',
    'D07': 'Primas por seguros de gastos médicos',
    'D08': 'Gastos de transportación escolar obligatoria',
    'D09': 'Depósitos en cuentas para el ahorro',
    'D10': 'Pagos por servicios educativos',
    'S01': 'Sin efectos fiscales',
    'CP01': 'Pagos',
    'CN01': 'Nómina'
  };
  return usos[codigo] || codigo;
}

function getRegimenDesc(codigo: string): string {
  const regimenes: Record<string, string> = {
    '601': 'General de Ley Personas Morales',
    '603': 'Personas Morales con Fines no Lucrativos',
    '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
    '606': 'Arrendamiento',
    '607': 'Régimen de Enajenación o Adquisición de Bienes',
    '608': 'Demás ingresos',
    '610': 'Residentes en el Extranjero sin Establecimiento Permanente en México',
    '611': 'Ingresos por Dividendos (socios y accionistas)',
    '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
    '614': 'Ingresos por intereses',
    '615': 'Régimen de los ingresos por obtención de premios',
    '616': 'Sin obligaciones fiscales',
    '620': 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
    '621': 'Incorporación Fiscal',
    '622': 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
    '623': 'Opcional para Grupos de Sociedades',
    '624': 'Coordinados',
    '625': 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
    '626': 'Régimen Simplificado de Confianza'
  };
  return regimenes[codigo] || codigo;
}

function getExportacionDesc(codigo: string): string {
  const exportaciones: Record<string, string> = {
    '01': 'No aplica',
    '02': 'Definitiva',
    '03': 'Temporal'
  };
  return exportaciones[codigo] || codigo;
}

function getImpuestoDesc(codigo: string): string {
  const impuestos: Record<string, string> = {
    '001': 'ISR',
    '002': 'IVA',
    '003': 'IEPS'
  };
  return impuestos[codigo] || codigo;
}

function formatDateTime(dateTimeStr: string): string {
  const date = new Date(dateTimeStr);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

// Función para convertir número a letras (simplificada)
function numeroALetras(numero: number): string {
  // Implementación básica - deberías usar una librería más completa
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  
  const entero = Math.floor(numero);
  const decimal = Math.round((numero - entero) * 100);
  
  let letras = '';
  
  if (entero === 0) {
    letras = 'cero';
  } else if (entero < 10) {
    letras = unidades[entero];
  } else if (entero < 20) {
    letras = especiales[entero - 11];
  } else if (entero < 100) {
    letras = decenas[Math.floor(entero / 10)];
    if (entero % 10 !== 0) {
      letras += ' y ' + unidades[entero % 10];
    }
  } else if (entero < 1000) {
    letras = unidades[Math.floor(entero / 100)] + 'cientos';
    if (entero % 100 !== 0) {
      letras += ' ' + numeroALetras(entero % 100);
    }
  } else if (entero < 1000000) {
    letras = numeroALetras(Math.floor(entero / 1000)) + ' mil';
    if (entero % 1000 !== 0) {
      letras += ' ' + numeroALetras(entero % 1000);
    }
  } else {
    letras = 'Número demasiado grande';
  }
  
  return letras + ' pesos ' + decimal.toString().padStart(2, '0') + '/100';
}