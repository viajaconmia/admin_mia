// // helpers/generarFacturaPDF.ts
// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// export async function generarFacturaPDF(facturaData: any): Promise<string> {
//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([595.28, 841.89]); // A4

//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//   const { width, height } = page.getSize();

//   const drawText = (text: string, x: number, y: number, size = 12) => {
//     page.drawText(text, {
//       x,
//       y,
//       size,
//       font,
//       color: rgb(0, 0, 0),
//     });
//   };

//   // Encabezado
//   drawText(`Factura: ${facturaData.comprobante.folio}`, 50, height - 50);
//   drawText(`Fecha: ${facturaData.comprobante.fecha.split("T")[0]}`, 400, height - 50);

//   drawText(`Emisor: ${facturaData.emisor.nombre} - ${facturaData.emisor.rfc}`, 50, height - 80);
//   drawText(`Receptor: ${facturaData.receptor.nombre} - ${facturaData.receptor.rfc}`, 50, height - 100);

//   drawText(`Subtotal: $${facturaData.comprobante.subtotal}`, 50, height - 130);
//   drawText(`Impuesto: $${facturaData.impuestos.traslado.importe}`, 50, height - 150);
//   drawText(`Total: $${facturaData.comprobante.total}`, 50, height - 170);

//   drawText(`UUID: ${facturaData.timbreFiscal.uuid}`, 50, height - 200);

//   // Conceptos
//   drawText("Conceptos:", 50, height - 230);
//   facturaData.conceptos.forEach((c: any, i: number) => {
//     drawText(`- ${c.descripcion} $${c.valorUnitario}`, 60, height - 250 - i * 20);
//   });

//   const pdfBytes = await pdfDoc.save();
//   const base64 = Buffer.from(pdfBytes).toString('base64');
//   return `data:application/pdf;base64,${base64}`;
// }

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarFacturaPDF = async (facturaData: any) => {
  const doc = new jsPDF();
  
  // Configuración inicial
  const margin = 15;
  let y = margin;
  
  // Logo (opcional)
  // doc.addImage(logo, 'JPEG', margin, y, 40, 20);
  y += 10;
  
  // Encabezado
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(facturaData.emisor.nombre, margin, y);
  doc.setFontSize(10);
  doc.text(`RFC: ${facturaData.emisor.rfc}`, margin, y + 5);
  
  // Datos de la factura (lado derecho)
  doc.setFontSize(14);
  doc.text('FACTURA', 160, y);
  doc.setFontSize(10);
  doc.text(`No. ${facturaData.comprobante.folio}`, 160, y + 5);
  doc.text(`Fecha: ${formatPDFDate(facturaData.comprobante.fecha)}`, 160, y + 10);
  
  y += 20;
  
  // Datos del receptor
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('DATOS DEL RECEPTOR:', margin, y);
  doc.setFontSize(10);
  doc.text(facturaData.receptor.nombre, margin, y + 5);
  doc.text(`RFC: ${facturaData.receptor.rfc}`, margin, y + 10);
  
  y += 20;
  
  // Tabla de conceptos
  doc.setFontSize(12);
  doc.text('CONCEPTOS:', margin, y);
  y += 5;
  
  const conceptosData = facturaData.conceptos.map((concepto: any) => [
    concepto.descripcion,
    concepto.cantidad,
    formatCurrency(concepto.valorUnitario),
    formatCurrency(concepto.importe)
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cantidad', 'P. Unitario', 'Importe']],
    body: conceptosData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240] }
  });
  
  // Obtener la posición Y final de la tabla
  y = (doc as any).lastAutoTable.finalY + 10;
  
  // Totales
  doc.setFontSize(10);
  doc.text(`Subtotal: ${formatCurrency(facturaData.comprobante.subtotal)}`, 140, y);
  doc.text(`IVA (${facturaData.impuestos.traslado.tasa * 100}%): ${formatCurrency(facturaData.impuestos.traslado.importe)}`, 140, y + 5);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total: ${formatCurrency(facturaData.comprobante.total)}`, 140, y + 10);
  
  // Timbre fiscal
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('TIMBRE FISCAL DIGITAL', margin, y);
  doc.text(`UUID: ${facturaData.timbreFiscal.uuid}`, margin, y + 5);
  doc.text(`Fecha de timbrado: ${formatPDFDate(facturaData.timbreFiscal.fechaTimbrado)}`, margin, y + 10);
  
  // Generar URL del PDF
  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
};

// Funciones de ayuda
const formatCurrency = (value: string) => {
  return `$${parseFloat(value).toFixed(2)}`;
};

const formatPDFDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
