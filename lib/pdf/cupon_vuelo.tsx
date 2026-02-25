import {
  formatDate,
  formatNumberWithCommas,
  formatTime,
} from "@/helpers/formater";
import {
  BookingsService,
  SolicitudVuelo,
  VueloDetalle,
} from "@/services/BookingService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { currentDate } from "../utils";

const STYLES = {
  COLORS: {
    PRIMARY: [0, 115, 185] as [number, number, number],
    TEXT_NORMAL: [0, 0, 0] as [number, number, number],
    TEXT_MUTED: [220, 220, 220] as [number, number, number],
    RECT: [0, 181, 226] as [number, number, number],
    TABLE_HEADER: [47, 84, 150] as [number, number, number],
    WHITE: [255, 255, 255] as [number, number, number],
  },
  FONTS: {
    TITLE: 14,
    SUBTITLE: 11,
    BODY: 9,
    SMALL: 8,
    XS: 6,
  },
  MARGINS: { LEFT: 8, RIGHT: 8, TOP: 20 },
  SPACING: { LINE: 6, SECTION: 10 },
};

export async function generatePdf(id_solicitud: string): Promise<jsPDF> {
  const book = new BookingsService();
  const solicitud = (await book.obtenerCupon(id_solicitud))
    .data as SolicitudVuelo;

  const doc = new jsPDF("p", "mm", "a4");

  const pageW = doc.internal.pageSize.getWidth();
  let y = STYLES.MARGINS.TOP - 4;

  drawHeader(doc, pageW);

  drawEmitidoPor(doc, y);
  drawImage(
    doc,
    "https://luiscastaneda-tos.github.io/log/files/312974093_187206343834287_6123587238863977470_n.jpg",
    pageW / 2 - 5,
    y,
    20,
    20,
  );
  y = drawBoletoInfo(doc, solicitud, pageW, y - 4);

  y += 2;

  //aqui va un cuadro que diga detalle
  y = drawTablaVuelos(doc, solicitud.vuelos, y, solicitud.viajero);
  //aqui va un cuadro que diga gracias por suconfianza
  y += 4;
  y = drawContacto(doc, y);
  doc.text("Politicas:", STYLES.MARGINS.LEFT, y);
  y += 3;
  y = drawList(
    doc,
    condicionesVuelo,
    STYLES.MARGINS.LEFT,
    y,
    pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
    { fontSize: STYLES.FONTS.XS, lineHeight: 4 },
  );
  doc.text("Nomenclatura:", STYLES.MARGINS.LEFT, y);
  y += 3;
  y = drawList(
    doc,
    restriccionesBoleto,
    STYLES.MARGINS.LEFT,
    y,
    pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
    { symbol: "•", fontSize: STYLES.FONTS.XS, lineHeight: 4 },
  );
  y = drawParagraph(
    doc,
    `Noktos Alianza, S.A. de C.V., mejor conocido como Noktos, con domicilio en calle Av. presidente Masarik No. 29 Int. P-4, colonia Chapultepec Morales, ciudad México, municipio o delegación Miguel Hidalgo, cp. 11570, en la entidad de Ciudad de México, país México, es el responsable del uso y protección de sus datos personales, puede verificar más información en nuestro portal de internet https://www.noktos.com`,
    STYLES.MARGINS.LEFT,
    y,
    pageW - STYLES.MARGINS.LEFT * 2,
  );
  drawHeader(doc, pageW);
  //Aqui va un cuadro de nuevo como el del inicio, un rectangulo

  return doc;
}

function drawTextBox(
  doc: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    text: string;
    padding?: number;
    bgColor?: [number, number, number];
    borderColor?: [number, number, number];
    textColor?: [number, number, number];
    fontSize?: number;
    lineHeight?: number;
  },
) {
  const {
    x,
    y,
    width,
    text,
    padding = 0,
    bgColor = [245, 245, 245],
    borderColor = [220, 220, 220],
    textColor = [0, 0, 0],
    fontSize = 6,
    lineHeight = 4,
  } = options;

  doc.setFontSize(fontSize);

  // Dividir texto en líneas según el ancho disponible
  const textLines = doc.splitTextToSize(text, width - padding * 2);

  const textHeight = textLines.length * lineHeight;
  const height = textHeight + padding * 2;

  // Fondo
  doc.setFillColor(...bgColor);
  doc.setDrawColor(0, 0, 0, 0);
  doc.rect(x, y, width, height, "FD");

  doc.setTextColor(...textColor);
  doc.text(textLines, x + padding + 2, y + padding + lineHeight - 1);

  return y + height; // nuevo y
}

function drawParagraph(
  doc: jsPDF,
  text: string,
  startX: number,
  startY: number,
  maxWidth: number,
  options?: {
    fontSize?: number;
    lineHeight?: number;
    align?: "left" | "center" | "right" | "justify";
  },
) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 20;

  const fontSize = options?.fontSize ?? 6;
  const lineHeight = options?.lineHeight ?? 3;
  const align = options?.align ?? "left";

  let y = startY;

  doc.setFontSize(fontSize);

  const lines = doc.splitTextToSize(text, maxWidth);

  lines.forEach((line) => {
    // 👇 salto automático de página
    if (y + lineHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = 20;
    }

    doc.text(line, startX, y, {
      maxWidth,
      align,
    });

    y += lineHeight;
  });

  return y + 2;
}

function drawHeader(doc: jsPDF, pageW: number) {
  doc.setFillColor(...STYLES.COLORS.RECT);
  doc.rect(STYLES.MARGINS.LEFT, 0, pageW - STYLES.MARGINS.LEFT * 2, 8, "F");
}

function drawEmitidoPor(doc: jsPDF, y: number) {
  const x = STYLES.MARGINS.LEFT;
  const width = 90;
  y = drawTextBox(doc, {
    x,
    y,
    text: "EMITIDO POR:",
    width,
    bgColor: STYLES.COLORS.TABLE_HEADER,
    textColor: STYLES.COLORS.WHITE,
  });
  y = drawTextBox(doc, {
    x,
    y,
    text: "NOKTOS ALIANZA SA DE CV",
    width,
    bgColor: STYLES.COLORS.WHITE,
  });
  y = drawTextBox(doc, {
    x,
    y,
    text: "NAL190807BU2",
    width,
    bgColor: STYLES.COLORS.WHITE,
  });
  y = drawTextBox(doc, {
    x,
    y,
    text: "Presidente Masaryk #29, int. E3, Col. Chapultepec Morales 11570, Miguel Hidalgo, CDMX",
    width,
    bgColor: STYLES.COLORS.WHITE,
  });
}
function drawBoletoInfo(
  doc: jsPDF,
  solicitud: SolicitudVuelo,
  pageW: number,
  y: number,
) {
  const boxW = 80;
  const x = pageW - boxW - STYLES.MARGINS.RIGHT;
  y = drawTextBox(doc, {
    x,
    y,
    width: boxW,
    text: "BOLETO AÉREO",
    bgColor: STYLES.COLORS.WHITE,
  });
  drawTextBox(doc, {
    x,
    y,
    width: boxW / 2,
    text: "FECHA DE EMISIÓN",
    bgColor: STYLES.COLORS.TABLE_HEADER,
    textColor: STYLES.COLORS.WHITE,
  });
  y = drawTextBox(doc, {
    x: x + boxW / 2,
    y,
    width: boxW / 2,
    text: formatDate(currentDate()).toString(),
    bgColor: STYLES.COLORS.TABLE_HEADER,
    textColor: STYLES.COLORS.WHITE,
  });
  drawTextBox(doc, {
    x,
    y,
    width: boxW / 2,
    text: "CODIGO DE LA AEROLINEA",
    bgColor: STYLES.COLORS.TABLE_HEADER,
    textColor: STYLES.COLORS.WHITE,
  });
  y = drawTextBox(doc, {
    x: x + boxW / 2,
    y,
    width: boxW / 2,
    text: solicitud.codigo_confirmacion.toString(),
    bgColor: STYLES.COLORS.TABLE_HEADER,
    textColor: STYLES.COLORS.WHITE,
  });
  drawTextBox(doc, {
    x,
    y,
    width: boxW / 2,
    text: "TOTAL",
    bgColor: STYLES.COLORS.TABLE_HEADER,
    textColor: STYLES.COLORS.WHITE,
  });
  y = drawTextBox(doc, {
    x: x + boxW / 2,
    y,
    width: boxW / 2,
    text: `$${formatNumberWithCommas(solicitud.total)}`,
    bgColor: STYLES.COLORS.WHITE,
  });
  drawTextBox(doc, {
    x,
    y,
    width: boxW / 2,
    text: "TARIFA",
    bgColor: STYLES.COLORS.TABLE_HEADER,
    textColor: STYLES.COLORS.WHITE,
  });
  y = drawTextBox(doc, {
    x: x + boxW / 2,
    y,
    width: boxW / 2,
    text: "NO REMBOLSABLE",
    bgColor: STYLES.COLORS.TEXT_MUTED,
  });

  return y + 10;
}
function drawTablaVuelos(
  doc: jsPDF,
  vuelos: VueloDetalle[],
  y: number,
  viajero: string,
) {
  const head = [
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
  ];

  const columnCount = head[0].length;

  const body: any[] = vuelos.map((v) => [
    v.airline,
    `${v.departure_airport} - ${v.departure_city}`,
    formatDate(v.departure_date),
    formatTime(v.departure_time),
    `${v.arrival_airport} - ${v.arrival_city}`,
    formatDate(v.arrival_date),
    formatTime(v.arrival_time),
    v.seat_number,
    viajero,
    v.flight_number,
  ]);

  // 👇 Si mandas nota, se agrega fila de ancho completo
  if (vuelos.some((i) => i.eq_documentado || i.eq_mano || i.eq_personal)) {
    const eq = vuelos.filter(
      (i) => i.eq_documentado || i.eq_mano || i.eq_personal,
    )[0];
    body.push([
      {
        content: `${[eq.eq_personal ? `articulo personal: ${eq.eq_personal}` : null, eq.eq_mano ? `equipaje de mano: ${eq.eq_mano}` : null, eq.eq_documentado ? `equipaje documentado: ${eq.eq_documentado}` : null].filter((i) => Boolean(i)).join(" + ")}`,
        colSpan: columnCount,
        styles: {
          halign: "center",
          fontSize: 8,
          cellPadding: 4,
        },
      },
    ]);
  }

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    styles: {
      fontSize: 7,
    },
    headStyles: {
      fillColor: STYLES.COLORS.TABLE_HEADER,
      halign: "center",
      fontSize: 7,
    },
    bodyStyles: {
      textColor: STYLES.COLORS.TEXT_NORMAL,
    },
    margin: {
      left: STYLES.MARGINS.LEFT,
      right: STYLES.MARGINS.RIGHT,
    },
  });

  return (doc as any).lastAutoTable.finalY;
}

function drawList(
  doc: jsPDF,
  items: string[],
  startX: number,
  startY: number,
  maxWidth: number,
  options?: {
    symbol?: string; // 👈 opcional
    lineHeight?: number;
    fontSize?: number;
  },
) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 20;

  const lineHeight = options?.lineHeight ?? 6;
  const fontSize = options?.fontSize ?? 9;
  const symbol = options?.symbol;

  let y = startY;

  doc.setFontSize(fontSize);

  items.forEach((item, index) => {
    const bullet = symbol ?? `${index + 1}.`;

    const textLines = doc.splitTextToSize(item, maxWidth - 10);

    // 👇 salto de página si no cabe
    if (y + textLines.length * lineHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = 20;
    }

    // símbolo
    doc.text(bullet, startX, y);

    // texto
    doc.text(textLines, startX + 4, y);

    y += textLines.length * lineHeight - textLines.length;
  });

  return y + 2;
}
function drawContacto(doc: jsPDF, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1️⃣ Texto normal
  doc.setFontSize(6);
  doc.setTextColor(0, 0, 0);

  doc.text(
    "Si tiene alguna duda sobre esta información, póngase en contacto con nosotros",
    pageWidth / 2,
    y,
    { align: "center" },
  );

  y += 3;

  // 2️⃣ WhatsApp (link)
  doc.setTextColor(0, 0, 255);

  doc.textWithLink("WA 55 31 49 10 62", pageWidth / 2, y, {
    url: "https://wa.me/525531491062",
    align: "center",
  });

  y += 3;

  // 3️⃣ Correo (link)
  doc.textWithLink("reservaciones@noktos.com", pageWidth / 2, y, {
    url: "mailto:reservaciones@noktos.com",
    align: "center",
  });

  y += 3;

  doc.textWithLink("support@noktos.zohodesk.com", pageWidth / 2, y, {
    url: "mailto:support@noktos.zohodesk.com",
    align: "center",
  });

  // Regresar color a negro
  doc.setTextColor(0, 0, 0);

  return y + 5;
}

function drawImage(
  doc: jsPDF,
  image: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc.addImage(image, "PNG", x, y, width, height);
}

const condicionesVuelo: string[] = [
  "Es necesario presentarse por lo menos 2 horas antes de la salida del vuelo en rutas nacionales (importante considerar realizar el check in antes de presentarse al vuelo; el check in está sujeto a la aerolínea, es probable que sea necesario realizarlo en aeropuerto; se sugiere verificar horarios de documentación directamente con la aerolínea). En caso de vuelos internacionales, presentarse por lo menos 3 horas antes de la salida del vuelo (importante considerar realizar el check in antes de presentarse al vuelo; el check in está sujeto a la aerolínea, es probable que sea necesario realizarlo en aeropuerto; se sugiere verificar horarios de documentación directamente con la aerolínea).",

  "Presenta tus documentos: identificación oficial vigente o pasaporte.",

  "Cualquier cambio o cancelación a la reservación deberá ser solicitada por correo a reservaciones@noktos.com, al WhatsApp 55 31 49 10 62 o al teléfono 800 666 5867 con una anticipación mínima de 72 horas antes de la fecha de check in, proporcionando la(s) clave(s) de confirmación y la sede.",

  "El pasajero debe respetar las políticas y lineamientos de la aerolínea para evitar incurrir en multas y penalizaciones. En caso de que se reporte algún mal comportamiento o una penalización que el pasajero se haya negado a pagar, Noktos se reserva el derecho de seguirle brindando servicio al cliente/pasajero involucrado.",

  "Las políticas de cambio en el itinerario de un boleto aéreo están sujetas a las reglas tarifarias vigentes; estas pueden aplicar penalidades de hasta el monto total de la compra y diferencia de tarifa.",

  "La vigencia de los boletos aéreos emitidos es de 12 meses a partir de la fecha de emisión. Si las políticas de la tarifa lo permiten, cualquier cambio y segmento debe efectuarse antes de la vigencia del boleto aéreo emitido.",

  "Según las políticas de cancelación o no show (no presentarse al vuelo), en caso de no presentarse en el horario de salida del vuelo especificado por la aerolínea, es probable que se cancele el itinerario completo conforme a la regla tarifaria del vuelo.",

  "Las cancelaciones solo aplican cuando se tratan de tarifas reembolsables; estas se deben solicitar al correo reservaciones@noktos.com.",

  "Las tarifas están sujetas a disponibilidad; la aerolínea puede aumentar o modificar los montos sin previo aviso. Las tarifas no están garantizadas hasta la emisión de los boletos aéreos.",

  "Cada pasajero es responsable de verificar que posee o, en su caso, gestionar la documentación de identificación, así como la documentación migratoria, de salud y/o aduanal necesaria para realizar su viaje, incluyendo pasaporte, visas, permisos sanitarios, vacunas y cualquier requisito impuesto por las autoridades competentes de cada nación o del país de destino. Asimismo, el pasaporte debe tener como mínimo una validez de 6 meses posteriores a la fecha de retorno del itinerario. Noktos no asume responsabilidad por cualquier eventualidad derivada de la falta de estos requisitos.",
];
const restriccionesBoleto: string[] = [
  "No reembolsable – no podrá ser devuelto el importe del boleto.",
  "No transferible – no se permiten los cambios de nombre del pasajero.",
  "No intercambiable – los boletos no podrán ser cambiados por dinero en efectivo.",
  "Sin cambio de ruta – no se permiten modificaciones en el origen ni destino del boleto.",
  "Sin posibilidad de mejoras – no se permiten las mejoras a tipos de tarifa superiores o categoría de clases.",
];
