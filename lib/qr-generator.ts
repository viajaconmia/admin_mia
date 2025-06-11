import jsPDF from "jspdf";
import QRCode from "qrcode";
import autoTable from "jspdf-autotable";
import { currentDate } from "./utils";

// Define una interfaz para una sola reservación en la tabla
interface ReservationLine {
  tipoHabitacion: string;
  nombre: string;
  checkIn: string;
  checkOut: string;
  reservacionId: string;
  monto: number;
}

// Actualiza tu interfaz principal
export interface QRPaymentData {
  // Datos para el QR
  secureToken: string;

  // Datos de la empresa/documento
  codigoDocumento: string;
  logoUrl: string; // URL a tu logo
  empresa: {
    nombre: string;
    razonSocial: string;
    rfc: string;
    codigoPostal: string;
    direccion: string;
  };

  // Datos de la tabla (ahora es un array)
  reservations: ReservationLine[];

  // Datos de la tarjeta de pago
  bancoEmisor: string;
  nombreTarjeta: string;
  numeroTarjeta: string;
  fechaExpiracion: string;

  // Para el monto total
  currency: string;
}

export async function generateSecureQRPaymentPDF(
  data: QRPaymentData
): Promise<jsPDF> {
  const doc = new jsPDF("p", "mm", "a4"); // Usamos 'mm' para más precisión y tamaño A4

  // --- Generación del QR ---
  const secureUrl = `${window.location.origin}/secure-payment/${data.secureToken}`;
  const qrDataUrl = await QRCode.toDataURL(secureUrl, {
    width: 256,
    margin: 2,
  });

  // =================================================================
  // 1. CONSTANTES DE ESTILO Y CONFIGURACIÓN
  // =================================================================
  const STYLES = {
    COLORS: {
      PRIMARY: [0, 115, 185], // Un azul similar al de la imagen
      TEXT_NORMAL: [0, 0, 0],
      TEXT_MUTED: [100, 100, 100],
      TEXT_HIGHLIGHT: [220, 38, 38], // Rojo para destacar
      TABLE_HEADER: [0, 115, 185], // Azul para la cabecera de la tabla
    },
    FONTS: {
      TITLE: 14,
      SUBTITLE: 11,
      BODY: 10,
      SMALL: 9,
    },
    MARGINS: { LEFT: 20, RIGHT: 20, TOP: 20 },
    SPACING: { LINE: 7, SECTION: 10 },
  };

  const pageW = doc.internal.pageSize.getWidth();
  let y = STYLES.MARGINS.TOP;

  // =================================================================
  // 2. CUERPO DEL DOCUMENTO
  // =================================================================

  // --- Logo y Datos Superiores ---
  // Para el logo, necesitas tenerlo accesible como URL o DataURL
  try {
    // Intenta añadir el logo si la URL es válida. Si no, no hagas nada.
    if (data.logoUrl) {
      doc.addImage(data.logoUrl, "PNG", STYLES.MARGINS.LEFT, y - 10, 30, 15);
    }
  } catch (e) {
    console.error("No se pudo cargar el logo:", e);
  }

  doc.setFontSize(STYLES.FONTS.BODY);
  doc.setTextColor(...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]));
  const fechaActual = currentDate();
  doc.text(`Fecha: ${fechaActual}`, pageW - STYLES.MARGINS.RIGHT, y, {
    align: "right",
  });
  y += STYLES.SPACING.LINE;
  doc.text(`Código: ${data.codigoDocumento}`, pageW - STYLES.MARGINS.RIGHT, y, {
    align: "right",
  });

  // --- Título ---
  y += STYLES.SPACING.SECTION * 2;
  doc.setFontSize(STYLES.FONTS.TITLE);
  doc.setFont("helvetica", "bold");
  doc.text("CARTA INSTRUCCIÓN DE PAGO", pageW / 2, y, { align: "center" });
  y += STYLES.SPACING.SECTION * 1.5;

  // --- Párrafos de Introducción y Datos de la Empresa ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(STYLES.FONTS.BODY);
  doc.text("A QUIEN CORRESPONDA", STYLES.MARGINS.LEFT, y);
  y += STYLES.SPACING.SECTION;

  const introText = `Por medio de la presente solicito de la manera más atenta, se facturen las siguientes reservaciones, a nombre de la empresa:`;
  const splitIntro = doc.splitTextToSize(
    introText,
    pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT
  );
  doc.text(splitIntro, STYLES.MARGINS.LEFT, y);
  y += splitIntro.length * STYLES.SPACING.LINE + STYLES.SPACING.LINE;

  doc.setFont("helvetica", "bold");
  doc.text(`RAZÓN SOCIAL:`, STYLES.MARGINS.LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.empresa.razonSocial, STYLES.MARGINS.LEFT + 35, y);
  y += STYLES.SPACING.LINE;

  // Repetimos para los demás datos...
  doc.setFont("helvetica", "bold");
  doc.text(`RFC:`, STYLES.MARGINS.LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.empresa.rfc, STYLES.MARGINS.LEFT + 35, y);
  y += STYLES.SPACING.LINE;

  doc.setFont("helvetica", "bold");
  doc.text(`DIRECCIÓN:`, STYLES.MARGINS.LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.empresa.direccion, STYLES.MARGINS.LEFT + 35, y);
  y += STYLES.SPACING.SECTION;

  // --- Tabla de Reservaciones ---
  const tableHead = [
    [
      "Tipo Habitación",
      "Nombre",
      "Check in",
      "Check out",
      "Reservación",
      "Monto a Pagar",
    ],
  ];
  const tableBody = data.reservations.map((r) => [
    r.tipoHabitacion,
    r.nombre,
    r.checkIn,
    r.checkOut,
    r.reservacionId,
    `${data.currency} ${r.monto.toFixed(2)}`,
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: y,
    theme: "grid",
    headStyles: {
      fillColor: STYLES.COLORS.TABLE_HEADER as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: STYLES.FONTS.SMALL,
      cellPadding: 2,
    },
    margin: { left: STYLES.MARGINS.LEFT, right: STYLES.MARGINS.RIGHT },
  });

  y = (doc as any).lastAutoTable.finalY + STYLES.SPACING.SECTION;

  // --- Párrafos Finales (con texto resaltado) ---
  const finalText1 = `Así mismo le informo que ${data.empresa.nombre} proporcionará la siguiente Tarjeta para realizar el cargo de RENTA HABITACION.`;
  const splitFinalText1 = doc.splitTextToSize(
    finalText1,
    pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT
  );
  doc.text(splitFinalText1, STYLES.MARGINS.LEFT, y);
  y += splitFinalText1.length * STYLES.SPACING.LINE + STYLES.SPACING.LINE;

  // Para la línea con texto de diferente color, lo hacemos por partes
  const part1 =
    "Solicitamos de su apoyo para que el cargo se haga al check in del cliente y se hagan únicamente por las noches efectivas, es decir, las noches dormidas. ";
  const part2_highlight =
    "NO COMENTAR NADA AL VIAJERO SOBRE PAGOS Y FACTURACION";
  doc.setFontSize(STYLES.FONTS.BODY);
  doc.setTextColor(...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]));
  doc.text(part1, STYLES.MARGINS.LEFT, y, {
    maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
  });
  // Medimos la altura del texto anterior para saber si hubo salto de línea
  const part1Height = doc.getTextDimensions(part1, {
    maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
  }).h;
  y += part1Height;

  doc.setTextColor(
    ...(STYLES.COLORS.TEXT_HIGHLIGHT as [number, number, number])
  );
  doc.setFont("helvetica", "bold");
  doc.text(part2_highlight, STYLES.MARGINS.LEFT, y, {
    maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
  });
  const part2Height = doc.getTextDimensions(part2_highlight, {
    maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
  }).h;
  y += part2Height + STYLES.SPACING.SECTION;

  // --- Datos de la Tarjeta ---
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]));
  doc.text(`BANCO EMISOR: ${data.bancoEmisor}`, STYLES.MARGINS.LEFT, y);
  y += STYLES.SPACING.LINE;
  doc.text(`Nombre: ${data.nombreTarjeta}`, STYLES.MARGINS.LEFT, y);
  y += STYLES.SPACING.LINE;
  doc.text(`Número de Tarjeta: ${data.numeroTarjeta}`, STYLES.MARGINS.LEFT, y);
  y += STYLES.SPACING.LINE;
  doc.text(
    `Fecha de expiración: ${data.fechaExpiracion}`,
    STYLES.MARGINS.LEFT,
    y
  );
  y += STYLES.SPACING.SECTION * 2; // Más espacio antes del QR

  // --- CÓDIGO QR ---
  const qrSize = 50;
  const qrX = (pageW - qrSize) / 2; // Centrado
  doc.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);
  y += qrSize + STYLES.SPACING.LINE;

  doc.setFontSize(STYLES.FONTS.BODY);
  doc.text("Escanear para pago seguro", pageW / 2, y, { align: "center" });

  // --- Footer ---
  // Este se mantiene al final de la página, sin importar la altura del contenido
  const footerY = pageW - 15;
  doc.setFontSize(STYLES.FONTS.SMALL);
  doc.setTextColor(...(STYLES.COLORS.TEXT_MUTED as [number, number, number]));
  doc.text(
    `Documento generado automáticamente por el sistema. Token: ${data.secureToken.substring(
      0,
      8
    )}...`,
    pageW / 2,
    footerY,
    { align: "center" }
  );

  // =================================================================
  // 3. RETORNAR EL DOCUMENTO
  // =================================================================
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
