import {
  BookingsService,
  SolicitudVuelo,
  VueloDetalle,
} from "@/services/BookingService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STYLES = {
  COLORS: {
    PRIMARY: [0, 115, 185] as [number, number, number],
    TEXT_NORMAL: [0, 0, 0] as [number, number, number],
    TEXT_MUTED: [100, 100, 100] as [number, number, number],
    TABLE_HEADER: [0, 115, 185] as [number, number, number],
  },
  FONTS: {
    TITLE: 14,
    SUBTITLE: 11,
    BODY: 9,
    SMALL: 8,
  },
  MARGINS: { LEFT: 15, RIGHT: 15, TOP: 20 },
  SPACING: { LINE: 6, SECTION: 10 },
};

export async function generatePdf(id_solicitud: string): Promise<jsPDF> {
  const book = new BookingsService();
  const solicitud = (await book.obtenerCupon(id_solicitud))
    .data as SolicitudVuelo;

  const doc = new jsPDF("p", "mm", "a4");

  const pageW = doc.internal.pageSize.getWidth();
  let y = STYLES.MARGINS.TOP;

  drawHeader(doc, pageW);
  y += 10;

  y = drawEmitidoPor(doc, y);
  y = drawBoletoInfo(doc, solicitud, pageW, y);

  y += 8;

  y = drawTablaVuelos(doc, solicitud.vuelos, y);

  y += 5;

  drawEquipaje(doc, solicitud.vuelos, y);

  return doc;
}

function drawHeader(doc: jsPDF, pageW: number) {
  doc.setFillColor(...STYLES.COLORS.PRIMARY);
  doc.rect(0, 0, pageW, 12, "F");
}

function drawEmitidoPor(doc: jsPDF, y: number) {
  doc.setFontSize(STYLES.FONTS.SMALL);
  doc.setTextColor(...STYLES.COLORS.TEXT_MUTED);
  doc.text("EMITIDO POR:", STYLES.MARGINS.LEFT, y);

  y += 5;

  doc.setTextColor(...STYLES.COLORS.TEXT_NORMAL);
  doc.text("NOKTOS ALIANZA SA DE CV", STYLES.MARGINS.LEFT, y);

  y += 4;
  doc.text("CDMX", STYLES.MARGINS.LEFT, y);

  return y + 6;
}
function drawBoletoInfo(
  doc: jsPDF,
  solicitud: SolicitudVuelo,
  pageW: number,
  y: number,
) {
  const boxW = 70;
  const x = pageW - boxW - STYLES.MARGINS.RIGHT;

  doc.setFillColor(...STYLES.COLORS.PRIMARY);
  doc.rect(x, y, boxW, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(STYLES.FONTS.SMALL);
  doc.text("BOLETO AÉREO", x + 5, y + 5);

  y += 12;

  doc.setTextColor(0, 0, 0);
  doc.text("Código confirmación:", x, y);
  doc.text(solicitud.codigo_confirmacion, x, y + 5);

  return y + 10;
}
function drawTablaVuelos(doc: jsPDF, vuelos: VueloDetalle[], y: number) {
  const body = vuelos.map((v) => [
    v.airline,
    `${v.departure_airport} - ${v.departure_city}`,
    formatDate(v.departure_date),
    formatTime(v.departure_time),
    `${v.arrival_airport} - ${v.arrival_city}`,
    formatDate(v.arrival_date),
    formatTime(v.arrival_time),
    v.seat_number,
    v.viajero,
    v.flight_number,
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Aerolínea",
        "Origen",
        "Fecha Salida",
        "Hora",
        "Destino",
        "Fecha Llegada",
        "Hora",
        "Asiento",
        "Pasajero",
        "# Vuelo",
      ],
    ],
    body,
    styles: {
      fontSize: 7,
    },
    headStyles: {
      fillColor: STYLES.COLORS.TABLE_HEADER,
    },
    margin: { left: STYLES.MARGINS.LEFT, right: STYLES.MARGINS.RIGHT },
  });

  return (doc as any).lastAutoTable.finalY;
}
function drawEquipaje(doc: jsPDF, vuelos: VueloDetalle[], y: number) {
  const eq = vuelos[0];

  const equipaje = [
    eq.eq_personal && "Artículo personal",
    eq.eq_mano && `${eq.eq_mano} kg mano`,
    eq.eq_documentado && `${eq.eq_documentado} kg documentado`,
  ]
    .filter(Boolean)
    .join(" + ");

  doc.setFontSize(STYLES.FONTS.BODY);
  doc.text("EQUIPAJE:", STYLES.MARGINS.LEFT, y);
  doc.text(equipaje || "No especificado", STYLES.MARGINS.LEFT + 25, y);
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX");
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

// async function generatePdfmine(id_solicitud: string): Promise<jsPDF> {
//   const doc = new jsPDF("p", "mm", "a4");

//   const STYLES = {
//     COLORS: {
//       PRIMARY: [0, 115, 185],
//       TEXT_NORMAL: [0, 0, 0],
//       TEXT_MUTED: [100, 100, 100],
//       TEXT_HIGHLIGHT: [220, 38, 38],
//       TABLE_HEADER: [0, 115, 185],
//     },
//     FONTS: {
//       TITLE: 14,
//       SUBTITLE: 11,
//       BODY: 10,
//       SMALL: 9,
//     },
//     MARGINS: { LEFT: 15, RIGHT: 15, TOP: 20 },
//     SPACING: { LINE: 7, SECTION: 10 },
//   };

//   const pageW = doc.internal.pageSize.getWidth();
//   const pageH = doc.internal.pageSize.getHeight();
//   let y = STYLES.MARGINS.TOP;

//   //Esto es para generar un qr con un url
//   // const secureUrl = `https://admin.viajaconmia.com/secure-payment/${data.secureToken}`;
//   // const qrDataUrl = await QRCode.toDataURL(secureUrl, {
//   //   width: 256,
//   //   margin: 2,
//   // });
//   // try {
//   //   if (data.logoUrl) doc.addImage(data.logoUrl, "SVG", STYLES.MARGINS.LEFT, y - 10, 25, 15);
//   // } catch (e) {
//   //   console.error("No se pudo cargar el logo:", e);
//   // }
//   // =================================================================
//   // 2. CUERPO DEL DOCUMENTO
//   // =================================================================

//   doc.setFontSize(STYLES.FONTS.BODY);
//   doc.setTextColor(...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]));
//   const fechaActual = currentDate();
//   doc.text(`Fecha: ${fechaActual}`, pageW - STYLES.MARGINS.RIGHT, y, {
//     align: "right",
//   });
//   y += STYLES.SPACING.LINE;
//   doc.text(`Código: ${data.codigoDocumento}`, pageW - STYLES.MARGINS.RIGHT, y, {
//     align: "right",
//   });

//   // --- Título ---
//   y += STYLES.SPACING.SECTION;
//   doc.setFontSize(STYLES.FONTS.TITLE);
//   doc.setFont("helvetica", "bold");
//   doc.text("CARTA INSTRUCCIÓN DE PAGO", pageW / 2, y, { align: "center" });
//   y += STYLES.SPACING.SECTION;

//   // --- Párrafos de Introducción y Datos de la Empresa ---
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(STYLES.FONTS.BODY);
//   doc.text("A QUIEN CORRESPONDA", STYLES.MARGINS.LEFT, y);
//   y += STYLES.SPACING.SECTION;

//   const introText = `Por medio de la presente solicito de la manera más atenta, se facturen las siguientes reservaciones, a nombre de la empresa:`;
//   const splitIntro = doc.splitTextToSize(
//     introText,
//     pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
//   );
//   doc.text(splitIntro, STYLES.MARGINS.LEFT, y);
//   y += splitIntro.length * STYLES.SPACING.LINE;

//   doc.setFont("helvetica", "bold");
//   doc.text(`RAZÓN SOCIAL:`, STYLES.MARGINS.LEFT, y);
//   doc.setFont("helvetica", "normal");
//   doc.text(data.empresa.razonSocial, STYLES.MARGINS.LEFT + 35, y);
//   y += STYLES.SPACING.LINE;

//   // Repetimos para los demás datos...
//   doc.setFont("helvetica", "bold");
//   doc.text(`RFC:`, STYLES.MARGINS.LEFT, y);
//   doc.setFont("helvetica", "normal");
//   doc.text(data.empresa.rfc, STYLES.MARGINS.LEFT + 35, y);
//   y += STYLES.SPACING.LINE;

//   //codigo postal
//   doc.setFont("helvetica", "bold");
//   doc.text(`CÓDIGO POSTAL:`, STYLES.MARGINS.LEFT, y);
//   doc.setFont("helvetica", "normal");
//   doc.text(data.empresa.codigoPostal, STYLES.MARGINS.LEFT + 35, y);
//   y += STYLES.SPACING.LINE;

//   doc.setFont("helvetica", "bold");
//   doc.text(`DIRECCIÓN:`, STYLES.MARGINS.LEFT, y);
//   doc.setFont("helvetica", "normal");
//   const splitDirec = doc.splitTextToSize(
//     data.empresa.direccion,
//     pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT - 35,
//   );
//   doc.text(splitDirec, STYLES.MARGINS.LEFT + 35, y);
//   y += splitDirec.length * STYLES.SPACING.LINE;

//   // --- Tabla de Reservaciones ---
//   const tableHead = [
//     [
//       "Tipo Habitación",
//       "Nombre",
//       "Check in",
//       "Check out",
//       "Reservación",
//       "Monto a Pagar",
//     ],
//   ];
//   const tableBody = data.reservations.map((r) => [
//     r.tipoHabitacion,
//     r.nombre,
//     r.checkIn,
//     r.checkOut,
//     r.reservacionId,
//     `${data.currency} ${r.monto.toFixed(2)}`,
//   ]);

//   autoTable(doc, {
//     head: tableHead,
//     body: tableBody,
//     startY: y,
//     theme: "grid",
//     headStyles: {
//       fillColor: STYLES.COLORS.TABLE_HEADER as [number, number, number],
//       textColor: [255, 255, 255],
//       fontStyle: "bold",
//     },
//     styles: {
//       fontSize: STYLES.FONTS.SMALL,
//       cellPadding: 2,
//     },
//     margin: { left: STYLES.MARGINS.LEFT, right: STYLES.MARGINS.RIGHT },
//   });

//   y = (doc as any).lastAutoTable.finalY + STYLES.SPACING.SECTION;

//   // --- Párrafos Finales (con texto resaltado) ---
//   const finalText1 = `Así mismo le informo que ${
//     data.empresa.nombre
//   } proporcionará la siguiente Tarjeta para realizar el cargo de ${
//     data.cargo || ""
//   }.`;
//   const splitFinalText1 = doc.splitTextToSize(
//     finalText1,
//     pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
//   );
//   doc.text(splitFinalText1, STYLES.MARGINS.LEFT, y);
//   y += splitFinalText1.length * STYLES.SPACING.LINE;

//   // Para la línea con texto de diferente color, lo hacemos por partes
//   const part1 =
//     "Solicitamos de su apoyo para que el cargo se haga al check out del cliente y se hagan únicamente por las noches efectivas, es decir, las noches dormidas. ";
//   const part2_highlight =
//     "NO COMENTAR NADA AL VIAJERO SOBRE PAGOS Y FACTURACION";
//   doc.setFontSize(STYLES.FONTS.BODY);
//   doc.setTextColor(...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]));
//   doc.text(part1, STYLES.MARGINS.LEFT, y, {
//     maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
//   });
//   // Medimos la altura del texto anterior para saber si hubo salto de línea
//   const part1Height = doc.getTextDimensions(part1, {
//     maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
//   }).h;
//   y += part1Height + 2;

//   doc.setTextColor(
//     ...(STYLES.COLORS.TEXT_HIGHLIGHT as [number, number, number]),
//   );
//   doc.setFont("helvetica", "bold");
//   doc.text(part2_highlight, STYLES.MARGINS.LEFT, y, {
//     maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
//   });
//   const part2Height = doc.getTextDimensions(part2_highlight, {
//     maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
//   }).h;
//   y += part2Height + STYLES.SPACING.SECTION;

//   //--- aviso si el codigo esta oculto ---
//   if (!data.isSecureCode) {
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(
//       ...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]),
//     );
//     const splitAnuncioText1 = doc.splitTextToSize(
//       "Les pedimos que al momento de hacer el cargo favor de comunicarse por los siguientes medios, para brindarles el CVV",
//       pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
//     );
//     doc.text(splitAnuncioText1, STYLES.MARGINS.LEFT, y);
//     y += splitAnuncioText1.length * STYLES.SPACING.LINE;
//   }
//   let y_contact;
//   // --- Datos de la Tarjeta o Codigo QR---
//   if (data.type == "code") {
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(
//       ...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]),
//     );
//     doc.text(`BANCO EMISOR: ${data.bancoEmisor}`, STYLES.MARGINS.LEFT, y);
//     y += STYLES.SPACING.LINE;
//     doc.text(`Nombre: ${data.nombreTarjeta}`, STYLES.MARGINS.LEFT, y);
//     y += STYLES.SPACING.LINE;
//     doc.text(
//       `Número de Tarjeta: ${data.numeroTarjeta}`,
//       STYLES.MARGINS.LEFT,
//       y,
//     );
//     y += STYLES.SPACING.LINE;
//     doc.text(
//       `Fecha de expiración: ${data.fechaExpiracion}`,
//       STYLES.MARGINS.LEFT,
//       y,
//     );
//     y += STYLES.SPACING.LINE;
//     if (data.isSecureCode) {
//       doc.text(`CVV: ${data.cvv}`, STYLES.MARGINS.LEFT, y);
//       y += STYLES.SPACING.LINE;
//     }
//     y_contact = y;
//   } else if (data.type == "qr") {
//     y_contact = y;
//     const qrSize = 50;
//     const qrX = STYLES.MARGINS.LEFT; // Del lado izquierdo
//     doc.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);
//     y += qrSize + STYLES.SPACING.LINE;

//     doc.setFontSize(STYLES.FONTS.BODY);
//     doc.setTextColor(
//       ...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]),
//     );
//     doc.text("Escanear para pago seguro", STYLES.MARGINS.LEFT + qrSize / 2, y, {
//       align: "center",
//     });
//   }

//   //Imagenes y links
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]));
//   const textContacto =
//     "Cualquier duda o aclaración favor de \ncontactarse por los siguientes medios:";
//   const x_contact =
//     pageW - STYLES.MARGINS.RIGHT - doc.getTextWidth(textContacto) / 2 - 10;
//   doc.text(textContacto, x_contact, y_contact);
//   y_contact += STYLES.SPACING.LINE * 2;
//   doc.setTextColor(...(STYLES.COLORS.PRIMARY as [number, number, number]));
//   doc.addImage(
//     "https://luiscastaneda-tos.github.io/log/files/wa.png",
//     "PNG",
//     x_contact,
//     y_contact - 4,
//     6,
//     6,
//   );
//   const contactWa = "Por WhatsApp: 55 1044 5254";
//   doc.textWithLink(contactWa, x_contact + 7, y_contact, {
//     url: "https://wa.me/525510445254",
//   });

//   y_contact += STYLES.SPACING.LINE;
//   doc.addImage(
//     "https://luiscastaneda-tos.github.io/log/files/fon.png",
//     "PNG",
//     x_contact,
//     y_contact - 4,
//     6,
//     6,
//   );
//   doc.textWithLink("Por llamada: 800 666 5867", x_contact + 7, y_contact, {
//     url: "tel:8006665867",
//   });
//   y_contact += STYLES.SPACING.LINE;
//   doc.addImage(
//     "https://cdn-icons-png.flaticon.com/512/561/561127.png", // Ícono de email
//     "PNG",
//     x_contact,
//     y_contact - 4,
//     6,
//     6,
//   );

//   doc.textWithLink(
//     "Por correo: operaciones@noktos.com",
//     x_contact + 7,
//     y_contact,
//     {
//       url: "mailto:operaciones@noktos.com",
//     },
//   );

//   y_contact += STYLES.SPACING.LINE;

//   // --- Footer ---
//   // Este se mantiene al final de la página, sin importar la altura del contenido
//   doc.setFontSize(STYLES.FONTS.SMALL);
//   doc.setTextColor(...(STYLES.COLORS.TEXT_MUTED as [number, number, number]));
//   doc.text(
//     `Documento generado automáticamente por el sistema`,
//     pageW / 2,
//     pageH - 10,
//     { align: "center" },
//   );

//   doc.addPage();
//   //ESTA ES LA EXTRA
//   doc.addImage(
//     data.documento,
//     "PNG",
//     STYLES.MARGINS.LEFT,
//     STYLES.MARGINS.TOP,
//     pageW - STYLES.MARGINS.LEFT * 4,
//     150,
//   );

//   // =================================================================
//   // 3. RETORNAR EL DOCUMENTO
//   // =================================================================
//   return doc;
// }
