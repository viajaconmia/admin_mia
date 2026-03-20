import { getUbicacion } from "@/components/organism/PaymentProveedor/reservas";
import { formatDate, formatLargeDate } from "@/helpers/utils";
import { BookingsService, SolicitudHotel } from "@/services/BookingService";
import jsPDF from "jspdf";

const STYLES = {
  COLORS: {
    PRIMARY: [222, 235, 255] as [number, number, number], //azul claro
    DARK: [38, 99, 235] as [number, number, number],
    TEXT_NORMAL: [0, 0, 0] as [number, number, number],
    TEXT_MUTED: [220, 220, 220] as [number, number, number],
    RECT: [0, 181, 226] as [number, number, number],
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
// type UbicacionType = { lat?: number; lng?: number } | string | null | undefined;
// function buildGoogleMapsUrl(
//   ubicacion: UbicacionType,
//   hotelName?: string | null,
//   direccionFallback?: string | null,
//   soloHotel: boolean = false,
// ) {
//   const hotel = (hotelName ?? "").trim();
//   if (soloHotel && hotel) {
//     return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel)}`;
//   }

//   if (
//     ubicacion &&
//     typeof ubicacion === "object" &&
//     "lat" in ubicacion &&
//     "lng" in ubicacion
//   ) {
//     const lat = Number(ubicacion.lat);
//     const lng = Number(ubicacion.lng);
//     if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
//       const label = hotel ? ` (${hotel})` : "";
//       return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}${label}`)}`;
//     }
//   }

//   const ubicStr = (typeof ubicacion === "string" ? ubicacion : "")?.trim();
//   const dir = (direccionFallback ?? "").trim();
//   const parts = [hotel, ubicStr, dir].filter(Boolean);

//   return parts.length > 0
//     ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`
//     : "";
// }
type UbicacionType = { lat?: number; lng?: number } | string | null | undefined;

function buildGoogleMapsUrl(
  ubicacion: UbicacionType,
  hotelName?: string | null,
  direccionFallback?: string | null,
  options?: {
    soloHotel?: boolean;
    aproximado?: boolean;
    offset?: number; // 👈 en grados (~0.01 ≈ 1km)
    zoom?: number;
  },
) {
  const {
    soloHotel = false,
    aproximado = false,
    offset = 0.05, // 🔥 por defecto ~1km (seguro)
    zoom = 15,
  } = options || {};

  const hotel = (hotelName ?? "").trim();

  // 🏨 Mostrar hotel (solo si explícitamente lo quieres)
  if (soloHotel && hotel) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel)}`;
  }

  // 📍 Coordenadas
  if (
    ubicacion &&
    typeof ubicacion === "object" &&
    "lat" in ubicacion &&
    "lng" in ubicacion
  ) {
    let lat = Number(ubicacion.lat);
    let lng = Number(ubicacion.lng);

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      // 🧭 Modo aproximado (evita que caiga en el hotel)
      if (aproximado) {
        lat += (Math.random() - 0.5) * offset;
        lng += (Math.random() - 0.5) * offset;
      }

      // 🔥 USAMOS CENTER (no query) → no selecciona negocios
      return `https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=${zoom}`;
    }
  }

  // 🧾 Fallback (sin nombre de hotel)
  const ubicStr = (typeof ubicacion === "string" ? ubicacion : "")?.trim();
  const dir = (direccionFallback ?? "").trim();
  const parts = [ubicStr, dir].filter(Boolean);

  if (parts.length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
  }

  return "";
}

export async function generatePdfHotel(id_solicitud: string): Promise<jsPDF> {
  try {
    const book = new BookingsService();
    const solicitud = (await book.obtenerCupon(id_solicitud))
      .data as SolicitudHotel;
    let ubicacion: UbicacionType = solicitud?.direccion ?? null;
    const idHotel = solicitud?.id_hotel_resuelto;
    if (!ubicacion) {
      const data = await getUbicacion(String(idHotel));
      const raw = data?.res?.[0]?.ubicacion_o_direccion ?? null; // puede venir "lat,lng" o texto
      // Parseo "lat,lng"
      if (typeof raw === "string" && raw.includes(",")) {
        const [a, b] = raw.split(",").map((s) => Number(s.trim()));
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          const obj = { lat: a, lng: b };
          ubicacion = obj;
        }
      }
      ubicacion = raw;
    }
    const mapsUrl = buildGoogleMapsUrl(
      ubicacion,
      solicitud?.hotel || "",
      solicitud?.direccion || "",
    );

    console.log(mapsUrl);
    console.log(solicitud);

    const doc = new jsPDF("p", "mm", "a4");

    const pageW = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFillColor(...STYLES.COLORS.PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.rect(0, 0, pageW, height, "F");

    let y = STYLES.MARGINS.TOP - 4;

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(12);
    drawImage(
      doc,
      "https://luiscastaneda-tos.github.io/log/files/nokt.png",
      STYLES.MARGINS.LEFT,
      STYLES.SPACING.SECTION,
      26,
      18,
    );
    drawImage(
      doc,
      "https://luiscastaneda-tos.github.io/log/files/mia.png",
      pageW - 20 - STYLES.MARGINS.LEFT,
      STYLES.SPACING.SECTION,
      20,
      20,
    );
    doc.text("Detalles de la reservación", pageW / 2, y, { align: "center" });
    y += 4;
    doc.setFont("helvetica", "normal");
    if (solicitud.codigo_confirmacion) {
      doc.setTextColor(44, 104, 234);
      doc.setFontSize(8);
      doc.text(
        "Codigo de confirmación: " + solicitud.codigo_confirmacion,
        pageW / 2,
        y,
        { align: "center" },
      );
    }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(6);
    y += 16;
    drawCardBox(doc, {
      text: solicitud.huesped,
      label: "Huesped",
      width: pageW / 2 - STYLES.MARGINS.LEFT - 2,
      x: STYLES.MARGINS.LEFT,
      y,
      padding: 5,
    });
    y = drawCardBox(doc, {
      text: solicitud.hotel,
      label: "Hotel",
      width: pageW / 2 - STYLES.MARGINS.LEFT - 2,
      x: 2 + pageW / 2,
      y,
      padding: 5,
      link: mapsUrl,
      placeholder: solicitud.direccion,
    });
    y += 4;
    drawCardBox(doc, {
      text: solicitud.incluye_desayuno
        ? "Incluye desayuno"
        : "No incluye desayuno",
      label: "Desayuno",
      width: pageW / 2 - STYLES.MARGINS.LEFT - 2,
      x: STYLES.MARGINS.LEFT,
      y,
      padding: 5,
    });
    y = drawCardBox(doc, {
      text:
        solicitud.acompañantes != ""
          ? solicitud.acompañantes.toUpperCase().replaceAll("  ", " ")
          : "Sin acompañantes",
      label: "Acompañantes",
      width: pageW / 2 - STYLES.MARGINS.LEFT - 2,
      x: 2 + pageW / 2,
      y,
      padding: 5,
    });
    y += 4;
    drawCardBox(doc, {
      text: solicitud.check_in ? formatLargeDate(solicitud.check_in) : "",
      label: "Check in",
      width: pageW / 2 - STYLES.MARGINS.LEFT - 2,
      x: STYLES.MARGINS.LEFT,
      y,
      padding: 5,
    });
    y = drawCardBox(doc, {
      text: solicitud.check_out ? formatLargeDate(solicitud.check_out) : "",
      label: "Check out",
      width: pageW / 2 - STYLES.MARGINS.LEFT - 2,
      x: 2 + pageW / 2,
      y,
      padding: 5,
    });
    y += 4;
    drawCardBox(doc, {
      text: solicitud.room ? solicitud.room.toUpperCase() : "",
      label: "Habitación",
      width: pageW / 2 - STYLES.MARGINS.LEFT - 2,
      x: STYLES.MARGINS.LEFT,
      y,
      padding: 5,
    });
    y = drawCardBox(doc, {
      text: solicitud.comentarios ? solicitud.comentarios : "",
      label: "Comentarios",
      width: pageW / 2 - STYLES.MARGINS.LEFT - 2,
      x: 2 + pageW / 2,
      y,
      padding: 5,
    });
    y += 4;

    y = drawTextBox(doc, {
      text: "Politicas",
      width: pageW - STYLES.MARGINS.LEFT * 2,
      x: STYLES.MARGINS.LEFT,
      y,
      bgColor: STYLES.COLORS.DARK,
      fontSize: 10,
      lineHeight: 5,
      textColor: STYLES.COLORS.WHITE,
    });
    y += 3;
    y = drawList(
      doc,
      politicas,
      STYLES.MARGINS.LEFT * 2,
      y,
      pageW - STYLES.MARGINS.LEFT * 4,
      { fontSize: STYLES.FONTS.XS, lineHeight: 4 },
    );
    y = drawTextBox(doc, {
      text: "Datos de contacto 24/7",
      width: pageW - STYLES.MARGINS.LEFT * 2,
      x: STYLES.MARGINS.LEFT,
      bgColor: STYLES.COLORS.DARK,
      fontSize: 10,
      lineHeight: 5,
      textColor: STYLES.COLORS.WHITE,
      y,
    });
    drawContacto(doc, y);
    return doc;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
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
function drawCardBox(
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
    label?: string;
    link?: string;
    placeholder?: string;
  },
) {
  const {
    x,
    y,
    width,
    text,
    padding = 0,
    bgColor = [250, 250, 255],
    textColor = [0, 0, 0],
    fontSize = 6,
    lineHeight = 4,
    label = "",
    link,
    placeholder,
  } = options;

  const textLines = doc.splitTextToSize(text, width - padding * 2);

  const textHeight = textLines.length * lineHeight;
  const height = textHeight + padding * 2;

  // Fondo
  doc.setFillColor(...bgColor);
  doc.setDrawColor(0, 0, 0, 0);
  doc.roundedRect(x, y, width, height, 3, 3, "F");

  doc.setFillColor(100, 100, 100);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(label, x + padding, y + 4);
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  doc.text(textLines, x + padding, y + 2 + height / 2);
  if (link && placeholder) {
    doc.setFontSize(4);
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(placeholder, x + padding, y + 3 + height / 2 + 2, {
      url: link,
    });
    doc.setTextColor(0, 0, 0);
  }

  return y + height; // nuevo y
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
  doc.setTextColor(0, 0, 0);
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

  y += 3;

  doc.setTextColor(0, 0, 0);
  doc.text(
    "Si tiene alguna duda sobre esta información o necesita algun cambio, póngase en contacto con nosotros",
    pageWidth / 2,
    y,
    { align: "center" },
  );

  y += 3;

  // 2️⃣ WhatsApp (link)
  doc.setTextColor(0, 0, 255);

  doc.textWithLink("WhatsApp: 55 10 44 52 54", pageWidth / 2, y, {
    url: "https://wa.me/525510445254",
    align: "center",
  });

  y += 3;

  // 3️⃣ Correo (link)
  doc.textWithLink("correo: support@noktos.zohodesk.com", pageWidth / 2, y, {
    url: "mailto:support@noktos.zohodesk.com",
    align: "center",
  });

  y += 3;

  doc.textWithLink("Llamada: 800 666 5867", pageWidth / 2, y, {
    url: "tel:+528006665867",
    align: "center",
  });

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

const politicas = [
  "Los cambios y cancelaciones solo aplican cuando se tratan de Tarifas Reembolsables y están sujetas a disponibilidad.",
  "Cualquier cambio o cancelación a la reservación deberá ser solicitada a los canales de contacto oficiales con una anticipación mínima de 72 horas antes de la fecha de llegada o inicio de servicios proporcionando la(s) clave(s) de confirmación y la sede.",
  "El huésped debe realizar el check out con base en los horarios y formas establecidas por cada hotel, si el huésped no ejecuta la actividad en tiempo y forma, el proveedor podrá cobrar al viajero penalizaciones.",
  "En caso de que el viajero realice una salida anticipada o desee extender su estadía (sujeto a disponibilidad), deberá notificarlo al proveedor y a Noktos a través de correo electrónico, teléfono o WhatsApp para evitar penalizaciones adicionales.",
  "El viajero debe respetar las políticas y lineamientos de cada proveedor para evitar incurrir en multas y penalizaciones. En caso de que el hotel reporte algún mal comportamiento o una penalización que el viajero se haya negado a pagar, MIA by NOKTOS se reserva el derecho de seguirle brindando servicio al cliente/huésped involucrado.",
  "El link de Google Maps es aproximado, favor de validar la dirección abajo del nombre del proveedor.",
];

// function drawParagraph(
//   doc: jsPDF,
//   text: string,
//   startX: number,
//   startY: number,
//   maxWidth: number,
//   options?: {
//     fontSize?: number;
//     lineHeight?: number;
//     align?: "left" | "center" | "right" | "justify";
//   },
// ) {
//   const pageHeight = doc.internal.pageSize.getHeight();
//   const marginBottom = 20;

//   const fontSize = options?.fontSize ?? 6;
//   const lineHeight = options?.lineHeight ?? 3;
//   const align = options?.align ?? "left";

//   let y = startY;

//   doc.setFontSize(fontSize);

//   const lines = doc.splitTextToSize(text, maxWidth);

//   lines.forEach((line) => {
//     // 👇 salto automático de página
//     if (y + lineHeight > pageHeight - marginBottom) {
//       doc.addPage();
//       y = 20;
//     }

//     doc.text(line, startX, y, {
//       maxWidth,
//       align,
//     });

//     y += lineHeight;
//   });

//   return y + 2;
// }

// function drawHeader(doc: jsPDF, pageW: number) {
//   doc.setFillColor(...STYLES.COLORS.RECT);
//   doc.rect(STYLES.MARGINS.LEFT, 0, pageW - STYLES.MARGINS.LEFT * 2, 8, "F");
// }
