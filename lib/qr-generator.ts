import jsPDF from "jspdf";
import QRCode from "qrcode";
import autoTable from "jspdf-autotable";
import { currentDate } from "./utils";
import { ReservaCompleta } from "@/types/reserva";
import { Solicitud2 } from "@/types";

// Define una interfaz para una sola reservación en la tabla
interface ReservationLine {
  tipoHabitacion: string;
  nombre: string;
  checkIn: string;
  checkOut: string;
  reservacionId: string;
  monto: number;
}

// =================================================================
// DIAGNÓSTICO DE IMÁGENES EN EL PDF
// -----------------------------------------------------------------
// jsPDF NO descarga imágenes: si le pasas una URL, hace un XHR síncrono
// interno y, si falla (CORS, 404, red), se queda con el TEXTO de la URL e
// intenta parsearlo como PNG -> "Incomplete or corrupt PNG file".
// Aquí precargamos cada imagen con fetch, validamos los magic bytes y
// dejamos rastro en consola de cada paso.
// =================================================================

const IMG_LOG = "[PDF img]";

type DetectedFormat =
  "PNG" | "JPEG" | "GIF" | "BMP" | "WEBP" | "PDF" | "SVG" | "HTML" | "UNKNOWN";

type LoadedImage = { dataUrl: string; format: "PNG" | "JPEG"; label: string };

function describeImageInput(value: unknown) {
  if (typeof value !== "string") {
    return { tipo: typeof value, esString: false, valor: value };
  }

  return {
    tipo: "string",
    esString: true,
    longitud: value.length,
    vacio: value.trim() === "",
    inicio: value.slice(0, 60),
    esDataUrl: value.startsWith("data:"),
    esUrlRemota: /^https?:\/\//i.test(value),
  };
}

function hexSignature(bytes: Uint8Array, len = 12) {
  return Array.from(bytes.slice(0, len))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function detectFormat(bytes: Uint8Array): DetectedFormat {
  const startsWith = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);

  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "PNG";
  if (startsWith(0xff, 0xd8, 0xff)) return "JPEG";
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return "GIF";
  if (startsWith(0x42, 0x4d)) return "BMP";
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "WEBP";
  if (startsWith(0x25, 0x50, 0x44, 0x46)) return "PDF";

  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, 300))
    .trim()
    .toLowerCase();
  if (head.startsWith("<svg") || head.includes("<svg")) return "SVG";
  if (head.startsWith("<!doctype html") || head.startsWith("<html"))
    return "HTML";

  return "UNKNOWN";
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Convierte cualquier formato que el navegador sepa pintar (WEBP, GIF, BMP, SVG) a PNG. */
function convertViaCanvas(
  bytes: Uint8Array,
  mime: string,
  label: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([bytes as unknown as BlobPart], {
        type: mime || "image/png",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 512;
          canvas.height = img.naturalHeight || img.height || 512;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("No se pudo obtener el contexto 2D");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/png");
          console.info(`${IMG_LOG} ${label}: convertido a PNG vía canvas`, {
            mime,
            ancho: canvas.width,
            alto: canvas.height,
          });
          resolve(dataUrl);
        } catch (error) {
          console.error(`${IMG_LOG} ${label}: falló la conversión a PNG`, {
            mime,
            error,
          });
          resolve(null);
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      img.onerror = (event) => {
        console.error(
          `${IMG_LOG} ${label}: el navegador no pudo decodificar la imagen`,
          { mime, bytes: bytes.length, event },
        );
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch (error) {
      console.error(`${IMG_LOG} ${label}: error creando el blob de la imagen`, {
        mime,
        error,
      });
      resolve(null);
    }
  });
}

/**
 * Descarga/decodifica una imagen y la devuelve como data URL lista para jsPDF.
 * Devuelve null (nunca lanza) y deja el motivo exacto en consola.
 */
async function loadImageForPdf(
  source: unknown,
  label: string,
): Promise<LoadedImage | null> {
  const t0 = Date.now();
  console.info(`${IMG_LOG} ${label}: preparando`, describeImageInput(source));

  if (typeof source !== "string" || source.trim() === "") {
    console.error(
      `${IMG_LOG} ${label}: OMITIDA — el valor está vacío o no es un string`,
      describeImageInput(source),
    );
    return null;
  }

  const src = source.trim();
  let bytes: Uint8Array;
  let contentType = "";

  try {
    if (src.startsWith("data:")) {
      contentType = /^data:([^;,]*)/.exec(src)?.[1] ?? "";
      const res = await fetch(src);
      bytes = new Uint8Array(await res.arrayBuffer());
    } else if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src, { mode: "cors", cache: "no-store" });
      contentType = res.headers.get("content-type") ?? "";
      console.info(`${IMG_LOG} ${label}: respuesta HTTP`, {
        url: src,
        status: res.status,
        ok: res.ok,
        contentType,
        ms: Date.now() - t0,
      });
      if (!res.ok) {
        console.error(
          `${IMG_LOG} ${label}: OMITIDA — el servidor respondió ${res.status}`,
          { url: src },
        );
        return null;
      }
      bytes = new Uint8Array(await res.arrayBuffer());
    } else {
      console.error(
        `${IMG_LOG} ${label}: OMITIDA — el valor no es una URL ni un data URL`,
        describeImageInput(src),
      );
      return null;
    }
  } catch (error) {
    console.error(
      `${IMG_LOG} ${label}: OMITIDA — falló la descarga (causa típica: CORS o red)`,
      { url: src.slice(0, 120), error },
    );
    return null;
  }

  if (bytes.length === 0) {
    console.error(`${IMG_LOG} ${label}: OMITIDA — la respuesta vino vacía`, {
      url: src.slice(0, 120),
      contentType,
    });
    return null;
  }

  const format = detectFormat(bytes);
  console.info(`${IMG_LOG} ${label}: descargada`, {
    bytes: bytes.length,
    contentType,
    formatoDetectado: format,
    firma: hexSignature(bytes),
    ms: Date.now() - t0,
  });

  if (format === "PNG" || format === "JPEG") {
    return {
      dataUrl: `data:image/${format === "PNG" ? "png" : "jpeg"};base64,${bytesToBase64(bytes)}`,
      format,
      label,
    };
  }

  if (format === "PDF" || format === "HTML" || format === "UNKNOWN") {
    console.error(
      `${IMG_LOG} ${label}: OMITIDA — el contenido no es una imagen (${format}). ` +
        `Esto es justo lo que produce "Incomplete or corrupt PNG file".`,
      {
        url: src.slice(0, 120),
        contentType,
        firma: hexSignature(bytes),
        inicio: new TextDecoder().decode(bytes.slice(0, 120)),
      },
    );
    return null;
  }

  // GIF / BMP / WEBP / SVG -> los pasamos por canvas para normalizar a PNG
  const converted = await convertViaCanvas(
    bytes,
    contentType || `image/${format.toLowerCase()}`,
    label,
  );
  return converted ? { dataUrl: converted, format: "PNG", label } : null;
}

/** Agrega la imagen ya precargada. Registra el fallo y sigue: nunca rompe el PDF. */
function addLoadedImage(
  doc: jsPDF,
  image: LoadedImage | null,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  if (!image) return false;

  try {
    doc.addImage(image.dataUrl, image.format, x, y, width, height);
    console.info(`${IMG_LOG} ${image.label}: agregada al PDF`, {
      formato: image.format,
      x,
      y,
      width,
      height,
    });
    return true;
  } catch (error) {
    console.error(`${IMG_LOG} ${image.label}: addImage FALLÓ`, {
      formato: image.format,
      longitudDataUrl: image.dataUrl.length,
      error,
    });
    return false;
  }
}

/** btoa() truena con acentos (Latin-1). Registramos y usamos fallback UTF-8. */
function safeBtoa(value: string, label: string): string | null {
  try {
    return btoa(value);
  } catch (error) {
    console.warn(
      `${IMG_LOG} QR: btoa("${label}") falló por caracteres no Latin-1, usando fallback UTF-8`,
      { valorLongitud: value.length, error },
    );
    try {
      return btoa(String.fromCharCode(...new TextEncoder().encode(value)));
    } catch (fallbackError) {
      console.error(`${IMG_LOG} QR: no se pudo codificar "${label}"`, {
        fallbackError,
      });
      return null;
    }
  }
}

// Actualiza tu interfaz principal
export interface QRPaymentData {
  // Datos para el QR
  isSecureCode: boolean;
  secureToken: string;
  cargo: string;
  type: string;

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
  cvv: string;
  documento: string;

  // Para el monto total
  currency: string;
}

export async function generateSecureQRPaymentPDF(
  data: QRPaymentData,
): Promise<jsPDF> {
  const doc = new jsPDF("p", "mm", "a4"); // Usamos 'mm' para más precisión y tamaño A4

  console.info("[PDF] generando carta instrucción con", {
    type: data.type,
    isSecureCode: data.isSecureCode,
    codigoDocumento: data.codigoDocumento,
    reservaciones: data.reservations?.length ?? 0,
    tieneToken: Boolean(data.secureToken),
    logoUrl: describeImageInput(data.logoUrl),
    documento: describeImageInput(data.documento),
    nombreTarjeta: data.nombreTarjeta ? "[presente]" : "[vacío]",
    numeroTarjeta: data.numeroTarjeta ? "[presente]" : "[vacío]",
  });

  if (!Array.isArray(data.reservations) || data.reservations.length === 0) {
    console.warn("[PDF] la carta no trae reservaciones; la tabla saldrá vacía");
  }

  // --- Generación del QR ---
  const qp = new URLSearchParams();
  if (data.nombreTarjeta) {
    const t = safeBtoa(data.nombreTarjeta, "nombreTarjeta");
    if (t) qp.set("t", t);
  }
  if (data.documento) {
    const d = safeBtoa(data.documento, "documento");
    if (d) qp.set("d", d);
  }
  const qs = qp.toString();
  const secureUrl = `https://admin.viajaconmia.com/secure-payment/${data.secureToken}${qs ? `?${qs}` : ""}`;
  const qrDataUrl = await QRCode.toDataURL(secureUrl, {
    width: 256,
    margin: 2,
  });
  console.info("[PDF QR] generado", {
    secureUrl: secureUrl.replace(data.secureToken, "[token]"),
    qr: describeImageInput(qrDataUrl),
  });

  // --- Precarga de TODAS las imágenes (aquí es donde suele romperse) ---
  const [logoImg, qrImg, waImg, telImg, mailImg, documentoImg] =
    await Promise.all([
      data.logoUrl ? loadImageForPdf(data.logoUrl, "logo") : null,
      data.type === "qr" ? loadImageForPdf(qrDataUrl, "QR") : null,
      loadImageForPdf(
        "https://luiscastaneda-tos.github.io/log/files/wa.png",
        "icono WhatsApp",
      ),
      loadImageForPdf(
        "https://luiscastaneda-tos.github.io/log/files/fon.png",
        "icono teléfono",
      ),
      loadImageForPdf(
        "https://cdn-icons-png.flaticon.com/512/561/561127.png",
        "icono correo",
      ),
      loadImageForPdf(data.documento, "identificación (página 2)"),
    ]);

  const imagenesFallidas = [
    ["logo", data.logoUrl ? logoImg : "n/a"],
    ["QR", data.type === "qr" ? qrImg : "n/a"],
    ["icono WhatsApp", waImg],
    ["icono teléfono", telImg],
    ["icono correo", mailImg],
    ["identificación", documentoImg],
  ]
    .filter(([, img]) => img === null)
    .map(([nombre]) => nombre);

  if (imagenesFallidas.length) {
    console.warn(
      "[PDF] el documento se generará SIN estas imágenes:",
      imagenesFallidas,
    );
  }

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
    MARGINS: { LEFT: 15, RIGHT: 15, TOP: 20 },
    SPACING: { LINE: 7, SECTION: 10 },
  };

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = STYLES.MARGINS.TOP;

  // =================================================================
  // 2. CUERPO DEL DOCUMENTO
  // =================================================================

  // --- Logo y Datos Superiores ---
  addLoadedImage(doc, logoImg, STYLES.MARGINS.LEFT, y - 10, 25, 15);

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
  y += STYLES.SPACING.SECTION;
  doc.setFontSize(STYLES.FONTS.TITLE);
  doc.setFont("helvetica", "bold");
  doc.text("CARTA INSTRUCCIÓN DE PAGO", pageW / 2, y, { align: "center" });
  y += STYLES.SPACING.SECTION;

  // --- Párrafos de Introducción y Datos de la Empresa ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(STYLES.FONTS.BODY);
  doc.text("A QUIEN CORRESPONDA", STYLES.MARGINS.LEFT, y);
  y += STYLES.SPACING.SECTION;

  const introText = `Por medio de la presente solicito de la manera más atenta, se facturen las siguientes reservaciones, a nombre de la empresa:`;
  const splitIntro = doc.splitTextToSize(
    introText,
    pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
  );
  doc.text(splitIntro, STYLES.MARGINS.LEFT, y);
  y += splitIntro.length * STYLES.SPACING.LINE;

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

  //codigo postal
  doc.setFont("helvetica", "bold");
  doc.text(`CÓDIGO POSTAL:`, STYLES.MARGINS.LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.empresa.codigoPostal, STYLES.MARGINS.LEFT + 35, y);
  y += STYLES.SPACING.LINE;

  doc.setFont("helvetica", "bold");
  doc.text(`DIRECCIÓN:`, STYLES.MARGINS.LEFT, y);
  doc.setFont("helvetica", "normal");
  const splitDirec = doc.splitTextToSize(
    data.empresa.direccion,
    pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT - 35,
  );
  doc.text(splitDirec, STYLES.MARGINS.LEFT + 35, y);
  y += splitDirec.length * STYLES.SPACING.LINE;

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
  const finalText1 = `Así mismo le informo que ${
    data.empresa.nombre
  } proporcionará la siguiente Tarjeta para realizar el cargo de ${
    data.cargo || ""
  }.`;
  const splitFinalText1 = doc.splitTextToSize(
    finalText1,
    pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
  );
  doc.text(splitFinalText1, STYLES.MARGINS.LEFT, y);
  y += splitFinalText1.length * STYLES.SPACING.LINE;

  // Para la línea con texto de diferente color, lo hacemos por partes
  const part1 =
    "Solicitamos de su apoyo para que el cargo se haga al check out del cliente y se hagan únicamente por las noches efectivas, es decir, las noches dormidas. ";
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
  y += part1Height + 2;

  doc.setTextColor(
    ...(STYLES.COLORS.TEXT_HIGHLIGHT as [number, number, number]),
  );
  doc.setFont("helvetica", "bold");
  doc.text(part2_highlight, STYLES.MARGINS.LEFT, y, {
    maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
  });
  const part2Height = doc.getTextDimensions(part2_highlight, {
    maxWidth: pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
  }).h;
  y += part2Height + STYLES.SPACING.SECTION;

  //--- aviso si el codigo esta oculto ---
  if (!data.isSecureCode) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      ...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]),
    );
    const splitAnuncioText1 = doc.splitTextToSize(
      "Les pedimos que al momento de hacer el cargo favor de comunicarse por los siguientes medios, para brindarles el CVV",
      pageW - STYLES.MARGINS.LEFT - STYLES.MARGINS.RIGHT,
    );
    doc.text(splitAnuncioText1, STYLES.MARGINS.LEFT, y);
    y += splitAnuncioText1.length * STYLES.SPACING.LINE;
  }
  if (data.type !== "code" && data.type !== "qr") {
    console.warn(
      `[PDF] type="${data.type}" no es "code" ni "qr": no se dibujarán ni tarjeta ni QR`,
    );
  }
  let y_contact: number = y;
  // --- Datos de la Tarjeta o Codigo QR---z
  if (data.type == "code") {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(
      ...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]),
    );
    doc.text(`BANCO EMISOR: ${data.bancoEmisor}`, STYLES.MARGINS.LEFT, y);
    y += STYLES.SPACING.LINE;
    doc.text(`Nombre: ${data.nombreTarjeta}`, STYLES.MARGINS.LEFT, y);
    y += STYLES.SPACING.LINE;
    doc.text(
      `Número de Tarjeta: ${data.numeroTarjeta}`,
      STYLES.MARGINS.LEFT,
      y,
    );
    y += STYLES.SPACING.LINE;
    doc.text(
      `Fecha de expiración: ${data.fechaExpiracion}`,
      STYLES.MARGINS.LEFT,
      y,
    );
    y += STYLES.SPACING.LINE;
    if (data.isSecureCode) {
      doc.text(`CVV: ${data.cvv}`, STYLES.MARGINS.LEFT, y);
      y += STYLES.SPACING.LINE;
    }
    y_contact = y;
  } else if (data.type == "qr") {
    y_contact = y;
    const qrSize = 50;
    const qrX = STYLES.MARGINS.LEFT; // Del lado izquierdo
    addLoadedImage(doc, qrImg, qrX, y, qrSize, qrSize);
    y += qrSize + STYLES.SPACING.LINE;

    doc.setFontSize(STYLES.FONTS.BODY);
    doc.setTextColor(
      ...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]),
    );
    doc.text("Escanear para pago seguro", STYLES.MARGINS.LEFT + qrSize / 2, y, {
      align: "center",
    });
  }

  //Imagenes y links
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]));
  const textContacto =
    "Cualquier duda o aclaración favor de \ncontactarse por los siguientes medios:";
  const x_contact =
    pageW - STYLES.MARGINS.RIGHT - doc.getTextWidth(textContacto) / 2 - 10;
  doc.text(textContacto, x_contact, y_contact);
  y_contact += STYLES.SPACING.LINE * 2;
  doc.setTextColor(...(STYLES.COLORS.PRIMARY as [number, number, number]));
  addLoadedImage(doc, waImg, x_contact, y_contact - 4, 6, 6);
  const contactWa = "Por WhatsApp: 55 1044 5254";
  doc.textWithLink(contactWa, x_contact + 7, y_contact, {
    url: "https://wa.me/525510445254",
  });

  y_contact += STYLES.SPACING.LINE;
  addLoadedImage(doc, telImg, x_contact, y_contact - 4, 6, 6);
  doc.textWithLink("Por llamada: 800 666 5867", x_contact + 7, y_contact, {
    url: "tel:8006665867",
  });
  y_contact += STYLES.SPACING.LINE;
  addLoadedImage(doc, mailImg, x_contact, y_contact - 4, 6, 6);

  doc.textWithLink(
    "Por correo: operaciones@noktos.com",
    x_contact + 7,
    y_contact,
    {
      url: "mailto:operaciones@noktos.com",
    },
  );

  y_contact += STYLES.SPACING.LINE;

  // --- Footer ---
  // Este se mantiene al final de la página, sin importar la altura del contenido
  doc.setFontSize(STYLES.FONTS.SMALL);
  doc.setTextColor(...(STYLES.COLORS.TEXT_MUTED as [number, number, number]));
  doc.text(
    `Documento generado automáticamente por el sistema`,
    pageW / 2,
    pageH - 10,
    { align: "center" },
  );

  // --- Página extra: identificación del titular ---
  if (documentoImg) {
    doc.addPage();
    addLoadedImage(
      doc,
      documentoImg,
      STYLES.MARGINS.LEFT,
      STYLES.MARGINS.TOP,
      pageW - STYLES.MARGINS.LEFT * 4,
      150,
    );
  } else {
    console.warn(
      "[PDF] no se agregó la página de la identificación porque la imagen no se pudo cargar",
      describeImageInput(data.documento),
    );
  }

  // =================================================================
  // 3. RETORNAR EL DOCUMENTO
  // =================================================================
  return doc;
}

export async function generateCuponForOperaciones(
  reserva: Solicitud2,
): Promise<jsPDF> {
  const doc = new jsPDF("p", "mm", "a4"); // Usamos 'mm' para más precisión y tamaño A4

  // --- Generación del QR ---
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
    MARGINS: { LEFT: 15, RIGHT: 15, TOP: 20 },
    SPACING: { LINE: 7, SECTION: 10 },
  };

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = STYLES.MARGINS.TOP;

  // =================================================================
  // 2. CUERPO DEL DOCUMENTO
  // =================================================================

  // --- Logo y Datos Superiores ---
  const logoCupon = await loadImageForPdf(
    "https://luiscastaneda-tos.github.io/log/files/nokt.png",
    "logo cupón",
  );
  addLoadedImage(doc, logoCupon, STYLES.MARGINS.LEFT, y - 10, 25, 15);

  doc.setFontSize(STYLES.FONTS.BODY);
  doc.setTextColor(...(STYLES.COLORS.TEXT_NORMAL as [number, number, number]));
  const fechaActual = currentDate();
  doc.text(`Fecha: ${fechaActual}`, pageW - STYLES.MARGINS.RIGHT, y, {
    align: "right",
  });

  y += STYLES.SPACING.SECTION;
  y += STYLES.SPACING.SECTION;
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
  const tableBody = [reserva].map((r) => [
    r.tipo_cuarto,
    r.hotel_reserva,
    r.check_in.split("T")[0],
    r.check_out.split("T")[0],
    r.codigo_reservacion_hotel,
    `$${reserva.total}`,
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

  y += STYLES.SPACING.SECTION;

  // --- Footer ---
  // Este se mantiene al final de la página, sin importar la altura del contenido
  doc.setFontSize(STYLES.FONTS.SMALL);
  doc.setTextColor(...(STYLES.COLORS.TEXT_MUTED as [number, number, number]));
  doc.text(
    `Documento generado automáticamente por el sistema`,
    pageW / 2,
    pageH - 10,
    { align: "center" },
  );

  return doc;
}

export function generateSecureToken(
  reservationId: string,
  amount: number,
  cardType: string,
  isSecureCode: boolean,
): string {
  // Generate a secure token combining reservation data with timestamp and random elements
  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const dataStr = `${reservationId}-${amount}-${cardType}-${
      isSecureCode ? 1 : 0
    }-${timestamp}`;
    console.log(dataStr);
    // In production, this should be properly encrypted on the backend
    // For demo purposes, we'll use base64 encoding with additional obfuscation
    const token = btoa(dataStr + "-" + randomStr)
      .replace(/[+/=]/g, (match) => {
        return { "+": "-", "/": "_", "=": "" }[match] || match;
      })
      .replaceAll("=", "");
    console.log(token);
    return token;
  } catch (error) {
    console.log(error);
  }
}

export function validateSecureToken(token: string): {
  valid: boolean;
  data?: any;
} {
  try {
    // Reverse the token generation process
    const decoded = atob(
      token.replace(/[-_]/g, (match) => {
        return { "-": "+", _: "/" }[match] || match;
      }),
    );
    console.log(decoded);

    const parts = decoded.split("-");
    if (parts.length >= 5) {
      return {
        valid: true,
        data: {
          codigo_reservacion: parts[0],
          monto: parseFloat(parts[1]),
          id_card: `${parts[2]}-${parts[3]}-${parts[4]}-${parts[5]}-${parts[6]}`,
          isSecureCode: parts[7] == "1" ? true : false,
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
