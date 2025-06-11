import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface QRPaymentData {
  reservationId: string;
  amount: number;
  currency: string;
  hotelName: string;
  clientName: string;
  cardType: string;
  secureToken: string;
}

export async function generateSecureQRPaymentPDF(data: QRPaymentData) {
  const doc = new jsPDF();

  // Generate secure URL for QR
  const secureUrl = `${window.location.origin}/secure-payment/${data.secureToken}`;

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(secureUrl, {
    width: 150,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // Blue color
  doc.text("INSTRUCCIONES DE PAGO SEGURO", 20, 30);

  // Divider line
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Payment details
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("DETALLES DE LA RESERVACIÓN:", 20, 50);

  doc.setFontSize(12);
  doc.text(`Hotel: ${data.hotelName}`, 25, 60);
  doc.text(`Cliente: ${data.clientName}`, 25, 68);
  doc.text(`Monto a pagar: ${data.currency} ${data.amount.toFixed(2)}`, 25, 76);
  doc.text(`Reservación ID: ${data.reservationId}`, 25, 84);

  // Instructions
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text("INSTRUCCIONES PARA EL PAGO:", 20, 100);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const instructions = [
    "1. Escanee el código QR con su dispositivo móvil",
    "2. Se abrirá una página segura con los datos de la tarjeta",
    "3. Los datos incluyen: número de tarjeta, fecha de vencimiento y CVV",
    "4. Ingrese estos datos en el sistema de pago del hotel",
    "5. Confirme el pago por el monto exacto indicado arriba",
  ];

  instructions.forEach((instruction, index) => {
    doc.text(instruction, 25, 110 + index * 8);
  });

  // Add actual QR Code
  doc.addImage(qrDataUrl, "PNG", 140, 100, 40, 40);

  // QR Code label
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Escanear con móvil", 145, 150);

  // Security notice
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38); // Red color
  doc.text("AVISO DE SEGURIDAD:", 20, 170);
  doc.setTextColor(0, 0, 0);
  doc.text(
    "• Este código QR es único y tiene validez limitada (30 minutos)",
    25,
    178
  );
  doc.text("• No comparta este documento con terceros", 25, 185);
  doc.text(
    "• Los datos de la tarjeta solo son visibles al escanear el código",
    25,
    192
  );
  doc.text("• El acceso expira automáticamente por seguridad", 25, 199);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Documento generado automáticamente - Sistema de Facturación",
    20,
    270
  );
  doc.text(
    `Fecha: ${new Date().toLocaleDateString(
      "es-MX"
    )} - Hora: ${new Date().toLocaleTimeString("es-MX")}`,
    20,
    278
  );

  // Token reference (for technical support)
  doc.setFontSize(7);
  doc.text(`Token: ${data.secureToken}...`, 20, 260);

  return doc;
}

export function generateSecureToken(
  reservationId: string,
  amount: number,
  cardType: string
): string {
  // Generate a secure token combining reservation data with timestamp and random elements
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const dataStr = `${reservationId}-${amount}-${cardType}-${timestamp}`;

  // In production, this should be properly encrypted on the backend
  // For demo purposes, we'll use base64 encoding with additional obfuscation
  const token = btoa(dataStr + "-" + randomStr)
    .replace(/[+/=]/g, (match) => {
      return { "+": "-", "/": "_", "=": "" }[match] || match;
    })
    .replaceAll("=", "");
  console.log(token);
  return token;
}

export function validateSecureToken(token: string): {
  valid: boolean;
  data?: any;
} {
  console.log("vemos?");
  try {
    console.log("vemos?2");
    // Reverse the token generation process
    const decoded = atob(
      token.replace(/[-_]/g, (match) => {
        return { "-": "+", _: "/" }[match] || match;
      })
    );
    console.log("vemos?3");
    console.log(decoded);

    const parts = decoded.split("-");
    if (parts.length >= 5) {
      return {
        valid: true,
        data: {
          reservationId: parseInt(parts[0]),
          amount: parseFloat(parts[1]),
          cardType: parts[2],
          timestamp: parseInt(parts[3]),
        },
      };
    }
    console.log(parts);
    return { valid: false };
  } catch (error) {
    console.log(error);
    return { valid: false };
  }
}
