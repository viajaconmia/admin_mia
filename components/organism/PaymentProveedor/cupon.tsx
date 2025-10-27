"use client";

import React, {
  useEffect, useState, useRef, forwardRef, useImperativeHandle
} from "react";
import { Calendar, Hotel, User, Bed, ArrowRight, MessageCircle, Users, CupSoda, FileDown, X } from "lucide-react";
import { SupportModal } from "./superModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getUbicacion } from "./reservas";
// ↑ Encima del componente Reserva()
type LogoAsset = { key: string; src: string };

type LogoLoaded = {
  dataUrl: string;
  ar: number; // aspect ratio = width/height
};

export type ReservaHandle = {
  download: () => Promise<void>;
  getPdfBlob: () => Promise<Blob | null>;
};

function measureBillingBoxHeight(pdf: jsPDF, mode: "full" | "credito" = "credito"): number {
  const BLUE_50 = { r: 239, g: 246, b: 255 };
  const BLUE_200 = { r: 191, g: 219, b: 254 };
  const BLUE_900 = { r: 30, g: 58, b: 138 };

  const pageW = pdf.internal.pageSize.getWidth();
  const marginX = 12;
  const boxW = pageW - marginX * 2;
  const paddingX = 8;
  const paddingY = 8;
  const headingH = 6;
  const lineGap = 3;
  const lineH = 5;

  const comunes = [
    "Razón social: NOKTOS ALIANZA",
    "RFC: NAL190807BU2",
    "Código postal: 11570",
    "Dirección: Presidente Masarik No. 29, Interior E-3, Col. Chapultepec Morales, Alcaldía Miguel Hidalgo, CDMX.",
    "E-mail: operaciones@noktos.com",
    "Régimen Fiscal: 601 - General de Ley Personas Morales",
    "Uso de CFDI: G03 - Gastos en general",
  ];
  const metodoForma =
    mode === "credito"
      ? ["Método de pago: PPD - Pago en parcialidades o diferido", "Forma de pago: 99 - Por definir"]
      : ["Método de pago: PUE - Pago en una sola exhibición", "Forma de pago: 03 - Transferencia electrónica de fondos"];
  const lines = [...comunes, ...metodoForma];

  const maxWidth = boxW - paddingX * 2;
  const wrapped = lines.map((L) => pdf.splitTextToSize(L, maxWidth));
  let contentH = paddingY * 2 + headingH + 4;
  wrapped.forEach((w) => (contentH += w.length * lineH + lineGap));
  return contentH;
}

function drawBillingInfoInline(pdf: jsPDF, y: number, mode: "full" | "credito" = "credito"): number {
  const BLUE_50 = { r: 239, g: 246, b: 255 };
  const BLUE_200 = { r: 191, g: 219, b: 254 };
  const BLUE_600 = { r: 37, g: 99, b: 235 };
  const BLUE_900 = { r: 30, g: 58, b: 138 };
  const TEXT_DARK = { r: 30, g: 41, b: 59 };

  const pageW = pdf.internal.pageSize.getWidth();
  const marginX = 12;
  const boxW = pageW - marginX * 2;
  const paddingX = 8;
  const paddingY = 8;
  const headingH = 6;
  const lineGap = 3;
  const lineH = 5;

  const comunes = [
    "Razón social: NOKTOS ALIANZA",
    "RFC: NAL190807BU2",
    "Código postal: 11570",
    "Dirección: Presidente Masarik No. 29, Interior E-3, Col. Chapultepec Morales, Alcaldía Miguel Hidalgo, CDMX.",
    "E-mail: operaciones@noktos.com",
    "Régimen Fiscal: 601 - General de Ley Personas Morales",
    "Uso de CFDI: G03 - Gastos en general",
  ];

  const metodoForma =
    mode === "credito"
      ? ["Método de pago: PPD - Pago en parcialidades o diferido", "Forma de pago: 99 - Por definir"]
      : ["Método de pago: PUE - Pago en una sola exhibición", "Forma de pago: 03 - Transferencia electrónica de fondos"];
  const lines = [...comunes, ...metodoForma];

  // Medidas y caja
  const contentH = measureBillingBoxHeight(pdf, mode);
  pdf.setDrawColor(BLUE_200.r, BLUE_200.g, BLUE_200.b);
  pdf.setFillColor(BLUE_50.r, BLUE_50.g, BLUE_50.b);
  if ((pdf as any).roundedRect) (pdf as any).roundedRect(marginX, y, boxW, contentH, 3, 3, "FD");
  else pdf.rect(marginX, y, boxW, contentH, "FD");

  // Título
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(BLUE_900.r, BLUE_900.g, BLUE_900.b);
  pdf.text("Datos para facturación (CRÉDITO)", marginX + paddingX, y + paddingY + headingH);

  // Contenido
  let cy = y + paddingY + headingH + 4;
  const maxWidth = boxW - paddingX * 2;
  const wrapped = lines.map((L) => pdf.splitTextToSize(L, maxWidth));
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
  wrapped.forEach((w) => {
    pdf.text(w, marginX + paddingX, cy);
    cy += w.length * lineH + lineGap;
  });

  // Reset
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  return contentH;
}

// Carga IMG (PNG/JPG) a dataURL + aspect ratio
async function loadImageAsDataURL(src: string): Promise<LogoLoaded> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 512;
        canvas.height = img.naturalHeight || 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No 2D context"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        const ar = (img.naturalWidth || 1) / (img.naturalHeight || 1) || 1;
        resolve({ dataUrl, ar });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

// SVG de MIA (ajusta fill/color si lo necesitas)
const MIA_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 493 539">
  <path fill="#0A3A57" d="M205.1,500.5C205.1,500.5,205,500.6,205.1,500.5C140.5,436.1,71.7,369.1,71.7,291.1 c0-86.6,84.2-157.1,187.6-157.1S447,204.4,447,291.1c0,74.8-63.4,139.6-150.8,154.1c0,0,0,0,0,0l-8.8-53.1 c61.3-10.2,105.8-52.6,105.8-100.9c0-56.9-60-103.2-133.7-103.2s-133.7,46.3-133.7,103.2c0,49.8,48,93.6,111.7,101.8c0,0,0,0,0,0 L205.1,500.5L205.1,500.5z"/>
  <path fill="#0A3A57" d="M341,125.5c-2.9,0-5.8-0.7-8.6-2.1c-70.3-37.3-135.9-1.7-138.7-0.2c-8.8,4.9-20,1.8-24.9-7.1 c-4.9-8.8-1.8-20,7-24.9c3.4-1.9,85.4-47.1,173.8-0.2c9,4.8,12.4,15.9,7.6,24.8C353.9,122,347.6,125.5,341,125.5z"/>
  <g>
    <path fill="#0A3A57" d="M248.8,263.8c-38.1-26-73.7-0.8-75.2,0.2c-6.4,4.6-8.7,14-5.3,21.8c1.9,4.5,5.5,7.7,9.8,8.9 c4,1.1,8.2,0.3,11.6-2.1c0.9-0.6,21.4-14.9,43.5,0.2c2.2,1.5,4.6,2.3,7.1,2.4c0.2,0,0.4,0,0.6,0c0,0,0,0,0,0 c5.9,0,11.1-3.7,13.5-9.7C257.8,277.6,255.4,268.3,248.8,263.8z"/>
    <path fill="#0A3A57" d="M348.8,263.8c-38.1-26-73.7-0.8-75.2,0.2c-6.4,4.6-8.7,14-5.3,21.8c1.9,4.5,5.5,7.7,9.8,8.9 c4,1.1,8.2,0.3,11.6-2.1c0.9-0.6,21.4-14.9,43.5,0.2c2.2,1.5,4.6,2.3,7.1,2.4c0.2,0,0.4,0,0.6,0c0,0,0,0,0,0 c5.9,0,11.1-3.7,13.5-9.7C357.8,277.6,355.4,268.3,348.8,263.8z"/>
  </g>
</svg>
`;

// Convierte el SVG (string) a PNG dataURL y devuelve ar
async function loadSvgStringAsPngDataURL(svg: string): Promise<LogoLoaded> {
  const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("No se pudo cargar el SVG"));
    im.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  const w = img.naturalWidth || 512;
  const h = img.naturalHeight || 512;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");
  ctx.drawImage(img, 0, 0, w, h);

  const dataUrl = canvas.toDataURL("image/png");
  const ar = w / h || 1;
  return { dataUrl, ar };
}

type ReservaProps = {
  isOpen: boolean;
  onClose: () => void;
  reservation?: any;                // ⬅️ nuevo: objeto directo
  reservationIdBase64?: string;     // ⬅️ opcional: por si mantienes la vía anterior
  mountHidden?: boolean;
};

export const Reserva = forwardRef<ReservaHandle, ReservaProps>(function Reserva(
  { isOpen, onClose, reservation, reservationIdBase64, mountHidden = false }: ReservaProps,
  ref
) {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState<any | null>(reservation ?? null);
  const [loading, setLoading] = useState<boolean>(!reservation); // si ya viene por props, no cargamos
  const pageRef = useRef<HTMLDivElement>(null);
  const [logos, setLogos] = useState<Record<string, LogoLoaded>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleUbicacion = async (): Promise<UbicacionType> => {
    try {
      const idHotel = reservationDetails?.id_hotel;
      if (!idHotel) {
        const fallback = reservationDetails?.direccion ?? null;
        setUbicacionState(fallback);
        return fallback;
      }
      const data = await getUbicacion(String(idHotel));
      const raw = data?.res?.[0]?.ubicacion_o_direccion ?? null; // puede venir "lat,lng" o texto
      // Parseo "lat,lng"
      if (typeof raw === "string" && raw.includes(",")) {
        const [a, b] = raw.split(",").map(s => Number(s.trim()));
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          const obj = { lat: a, lng: b };
          setUbicacionState(obj);
          return obj;
        }
      }
      setUbicacionState(raw);
      return raw;
    } catch (e) {
      console.error("Error obteniendo ubicación:", e);
      const fallback = reservationDetails?.direccion ?? null;
      setUbicacionState(fallback);
      return fallback;
    }
  };

  // --- NUEVO: para guardar texto/coords de ubicación
  type UbicacionType = { lat?: number; lng?: number } | string | null | undefined;
  const [ubicacionState, setUbicacionState] = useState<UbicacionType>(null);


  useEffect(() => {
    setReservationDetails(reservation ?? null);
    setLoading(!reservation);
  }, [reservation]);

  useEffect(() => {
    (async () => {
      try {
        const fromAssets = await Promise.all(
          [{ key: "noktos", src: "https://luiscastaneda-tos.github.io/log/files/nokt.png" }].map(async (a) => {
            const data = await loadImageAsDataURL(a.src);
            return [a.key, data] as const;
          })
        );
        const miaData = await loadSvgStringAsPngDataURL(MIA_SVG);
        setLogos(Object.fromEntries([...fromAssets, ["mia", miaData] as const]));
      } catch (e) {
        console.warn("Fallo precarga de logos:", e);
      }
    })();
  }, []);

  const logoAssets: LogoAsset[] = [
    { key: "noktos", src: "https://luiscastaneda-tos.github.io/log/files/nokt.png" },
    // { key: "hotel", src: "https://tudominio.com/assets/hotel_logo.png" },
  ];

  useEffect(() => {
    // Precargar logos al montar: PNG/JPG + MIA desde SVG
    (async () => {
      try {
        const fromAssets = await Promise.all(
          logoAssets.map(async (a) => {
            const data = await loadImageAsDataURL(a.src);
            return [a.key, data] as const;
          })
        );

        // MIA desde SVG
        const miaData = await loadSvgStringAsPngDataURL(MIA_SVG);

        const entries = [...fromAssets, ["mia", miaData] as const];
        setLogos(Object.fromEntries(entries));
      } catch (e) {
        console.warn("Fallo precarga de logos:", e);
      }
    })();
  }, []);

  const getAcompanantesValue = (viajeros: string) => {
    if (viajeros) return viajeros;
    return "No hay acompañantes";
  };
  function buildGoogleMapsUrl(
    ubicacion: UbicacionType,
    hotelName?: string | null,
    direccionFallback?: string | null,
    soloHotel: boolean = false
  ) {
    const hotel = (hotelName ?? "").trim();
    if (soloHotel && hotel) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel)}`;
    }

    if (ubicacion && typeof ubicacion === "object" && "lat" in ubicacion && "lng" in ubicacion) {
      const lat = Number(ubicacion.lat);
      const lng = Number(ubicacion.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const label = hotel ? ` (${hotel})` : "";
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}${label}`)}`;
      }
    }

    const ubicStr = (typeof ubicacion === "string" ? ubicacion : "")?.trim();
    const dir = (direccionFallback ?? "").trim();
    const parts = [hotel, ubicStr, dir].filter(Boolean);

    return parts.length > 0
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`
      : "";
  }

  const cambiarLenguaje = (room: string) => {
    let updateRoom = room;
    if (room?.toUpperCase() === "SINGLE") updateRoom = "SENCILLO";
    else if (room?.toUpperCase() === "DOUBLE") updateRoom = "DOBLE";
    return updateRoom;
  };

  // Dibuja logos LATERALES en el PDF (Noktos izquierda, MIA derecha)
  function drawLogosOnPage(pdf: jsPDF, logosMap: Record<string, LogoLoaded>) {
    const pageW = pdf.internal.pageSize.getWidth();

    // ── Tuning del header lateral ───────────────────────────────────────
    const TOP_Y = 3;      // posición Y (mm) de los logos
    const PADDING_X = 10;  // margen lateral (mm)
    const HEADER_H = 16;   // altura base de cada logo (mm)
    const MAX_W_RATIO = 0.28; // % máx. del ancho de página por logo (evita corte)
    const FOOTER_H = 8;    // altura del logo del pie (si lo usas)
    // ───────────────────────────────────────────────────────────────────

    // NOKTOS → izquierda
    if (logosMap["noktos"]) {
      const { dataUrl, ar } = logosMap["noktos"];
      let w = HEADER_H * ar;
      const maxW = pageW * MAX_W_RATIO;
      if (w > maxW) {
        const scale = maxW / w;
        w *= scale;
      }
      pdf.addImage(dataUrl, "PNG", PADDING_X, TOP_Y, w, HEADER_H);
    }

    // MIA → derecha
    if (logosMap["mia"]) {
      const { dataUrl, ar } = logosMap["mia"];
      let w = HEADER_H * ar;
      const maxW = pageW * MAX_W_RATIO;
      if (w > maxW) {
        const scale = maxW / w;
        w *= scale;
      }
      const x = pageW - PADDING_X - w;
      pdf.addImage(dataUrl, "PNG", x, TOP_Y, w, HEADER_H);
    }

    // Footer (opcional)
    if (logosMap["hotel"]) {
      const pageH = pdf.internal.pageSize.getHeight();
      const { dataUrl, ar } = logosMap["hotel"];
      const w = FOOTER_H * ar;
      const x = (pageW - w) / 2;
      const y = pageH - 8 - FOOTER_H; // padding inferior
      pdf.addImage(dataUrl, "PNG", x, y, w, FOOTER_H);
    }
  }
  // --- NUEVO: para ubicar el rectángulo clickeable de Maps
  const hotelCardRef = useRef<HTMLDivElement>(null);
  // respiro entre bloques inferiores


  function drawContactInfoOnCurrentPage(pdf: jsPDF, customY?: number): number {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Paleta sobria
    const BG = { r: 245, g: 248, b: 255 }; // azul muy claro
    const BD = { r: 210, g: 224, b: 250 }; // borde suave
    const PRI = { r: 37, g: 99, b: 235 };  // azul 600
    const TXT = { r: 31, g: 41, b: 55 };   // gris oscuro

    // Layout compacto
    const marginX = 12;
    const boxW = pageW - marginX * 2;
    const paddingX = 6;
    const paddingY = 6;
    const titleBarH = 8;
    const lineH = 4.6;
    const lineGap = 2;

    const title = "Contacto 24/7";
    const whatsappNumber = "5510445254";
    const mail = "support@noktos.zohodesk.com";
    const phone = "800 666 5867 opción 2";

    // Calcula alto
    let contentH = paddingY + titleBarH + paddingY; // título + paddings
    // 2 líneas (combinamos etiquetas y valores en una misma línea para compactar)
    contentH += lineH + lineGap; // WhatsApp + Tel
    contentH += lineH;           // Correo

    const boxH = contentH + paddingY;

    // Posición pegada al pie (y la devolvemos)
    const bottomMargin = 8;
    const x = marginX;
    const y = customY !== undefined ? customY : pageH - bottomMargin - boxH;

    // Fondo
    pdf.setDrawColor(BD.r, BD.g, BD.b);
    pdf.setFillColor(BG.r, BG.g, BG.b);
    if ((pdf as any).roundedRect) (pdf as any).roundedRect(x, y, boxW, boxH, 2, 2, "FD");
    else pdf.rect(x, y, boxW, boxH, "FD");

    // Barra título
    pdf.setFillColor(PRI.r, PRI.g, PRI.b);
    pdf.rect(x, y, boxW, titleBarH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, x + paddingX, y + titleBarH - 2.2);

    // Contenido
    let cy = y + titleBarH + paddingY;
    const tx = x + paddingX;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(TXT.r, TXT.g, TXT.b);

    // Línea 1: WhatsApp + Tel (mismo renglón)
    const wsLabel = "WhatsApp:";
    const telLabel = "Tel:";
    const sep = "   •   ";

    const leftLine = `${wsLabel} ${whatsappNumber}`;
    const rightLine = `${telLabel} ${phone}`;
    const leftW = pdf.getTextWidth(leftLine + sep);

    pdf.text(leftLine + sep, tx, cy);
    pdf.text(rightLine, tx + leftW, cy);

    // Links
    pdf.setTextColor(PRI.r, PRI.g, PRI.b);
    pdf.textWithLink(whatsappNumber, 1.5 + tx + pdf.getTextWidth("WhatsApp "), cy, { url: "https://wa.me/525510445254" });
    pdf.textWithLink(" Llamar", tx + leftW + pdf.getTextWidth(rightLine), cy, { url: "tel:+528006665867" });

    // Línea 2: Correo
    cy += lineH + lineGap;
    pdf.setTextColor(TXT.r, TXT.g, TXT.b);
    pdf.text("Correo:", tx, cy);
    const mailLblW = pdf.getTextWidth("Correo: ");
    pdf.setTextColor(PRI.r, PRI.g, PRI.b);
    pdf.textWithLink(mail, tx + mailLblW, cy, { url: `mailto:${mail}` });

    // reset
    pdf.setTextColor(0, 0, 0);
    pdf.setDrawColor(0, 0, 0);

    return boxH; // devolvemos altura para apilar facturación encima si hace falta
  }


  function drawBillingInfoCompact(pdf: jsPDF, mode: "full" | "credito" = "credito") {
    // Página nueva con fondo azul claro
    pdf.addPage();
    paintFullBluePage(pdf);

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Colores
    const BLUE_50 = { r: 239, g: 246, b: 255 };
    const BLUE_200 = { r: 191, g: 219, b: 254 };
    const BLUE_600 = { r: 37, g: 99, b: 235 };
    const BLUE_900 = { r: 30, g: 58, b: 138 };
    const TEXT_DARK = { r: 30, g: 41, b: 59 };

    // Layout compacto
    const marginX = 12;
    const marginY = 20;
    const boxW = pageW - marginX * 2;
    const paddingX = 8;
    const paddingY = 8;
    const titleBarH = 12;
    const lineGap = 3;

    // Header
    const titleText = mode === "credito" ? "FACTURACIÓN (CRÉDITO)" : "FACTURACIÓN";
    pdf.setFillColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.rect(marginX, marginY, boxW, titleBarH, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(titleText, marginX + paddingX, marginY + titleBarH - 3);

    let y = marginY + titleBarH + 6;

    // Tarjeta única (datos comunes + método/forma)
    const comunes = [
      "Razón social: NOKTOS ALIANZA",
      "RFC: NAL190807BU2",
      "Código postal: 11570",
      "Dirección: Presidente Masarik No. 29, Interior E-3, Col. Chapultepec Morales, Alcaldía Miguel Hidalgo, CDMX.",
      "E-mail: operaciones@noktos.com",
      "Régimen Fiscal: 601 - General de Ley Personas Morales",
      "Uso de CFDI: G03 - Gastos en general",
    ];

    const metodoForma =
      mode === "credito"
        ? ["Método de pago: PPD - Pago en parcialidades o diferido", "Forma de pago: 99 - Por definir"]
        : ["Método de pago: PUE - Pago en una sola exhibición", "Forma de pago: 03 - Transferencia electrónica de fondos"];

    const lines = [...comunes, ...metodoForma];

    // Medición de alto
    const maxWidth = boxW - paddingX * 2;
    const wrapped = lines.map((L) => pdf.splitTextToSize(L, maxWidth));
    const headingH = 6;
    const lineH = 5;

    let contentH = paddingY * 2 + headingH + 4; // paddings + heading
    wrapped.forEach((w) => (contentH += w.length * lineH + lineGap));

    // Fondo de la tarjeta
    pdf.setDrawColor(BLUE_200.r, BLUE_200.g, BLUE_200.b);
    pdf.setFillColor(BLUE_50.r, BLUE_50.g, BLUE_50.b);
    if ((pdf as any).roundedRect) {
      (pdf as any).roundedRect(marginX, y, boxW, contentH, 3, 3, "FD");
    } else {
      pdf.rect(marginX, y, boxW, contentH, "FD");
    }

    // Título de la tarjeta
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(BLUE_900.r, BLUE_900.g, BLUE_900.b);
    pdf.text("Datos para facturación", marginX + paddingX, y + paddingY + headingH);
    let cy = y + paddingY + headingH + 4;

    // Contenido
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);

    wrapped.forEach((w) => {
      pdf.text(w, marginX + paddingX, cy);
      cy += w.length * lineH + lineGap;
    });
  }



  function paintFullBluePage(pdf: jsPDF) {
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(221, 235, 254); // #DDEBFE
    pdf.rect(0, 0, w, h, "F");
  }

  function measureContactBoxHeight(pdf: jsPDF): number {
    // Estos números deben coincidir con los usados en drawContactInfoOnCurrentPage
    const paddingY = 6;
    const titleBarH = 8;
    const lineH = 4.6;
    const lineGap = 2;

    // título + paddings
    let contentH = paddingY + titleBarH + paddingY;
    // 2 renglones: (1) WhatsApp+Tel, (2) Correo
    contentH += lineH + lineGap; // (1)
    contentH += lineH;           // (2)

    // + padding inferior
    return contentH + paddingY;
  }


  // ====== GENERACIÓN DE PDF (devuelve Blob y opcionalmente guarda) ======
  const buildPdf = async (opts?: { save?: boolean }) => {
    const content = pageRef.current;
    const scroller = scrollRef.current;
    if (!content) return null;

    // 1) Asegura tener ubicación para el link  
    const ubic = await handleUbicacion();
    const mapsUrl = buildGoogleMapsUrl(
      ubic,
      reservationDetails?.hotel || "",
      reservationDetails?.direccion || ""
    );

    // Guarda estilos originales
    const original = {
      position: content.style.position,
      margin: content.style.margin,
      width: content.style.width,
      overflow: content.style.overflow,
      maxHeight: content.style.maxHeight,
      padding: content.style.padding,
    };

    const scrollerOriginal = scroller
      ? {
        overflow: scroller.style.overflow,
        maxHeight: scroller.style.maxHeight,
      }
      : null;

    // Elementos que se ocultan en PDF (botones/header, etc.)
    const elementsToHide = content.querySelectorAll('[data-hide-in-pdf], .no-print');
    const originalDisplay: string[] = [];

    try {
      // Expandir para capturar TODO
      content.style.position = "static";
      content.style.margin = "0 auto";
      content.style.width = "100%";
      content.style.overflow = "visible";
      content.style.maxHeight = "none";
      content.style.padding = "16px 12px"; // Reducir padding para más espacio

      if (scroller) {
        scroller.style.overflow = "visible";
        scroller.style.maxHeight = "none";
      }

      elementsToHide.forEach((el) => {
        originalDisplay.push((el as HTMLElement).style.display);
        (el as HTMLElement).style.display = 'none';
      });

      await new Promise((r) => requestAnimationFrame(r));

      // Medidas del DOM para posicionar el link
      const pageRect = content.getBoundingClientRect();
      const hotelRect = hotelCardRef.current?.getBoundingClientRect() || null;

      // Captura
      const canvas = await html2canvas(content, {
        scale: Math.min(1.5, window.devicePixelRatio || 1), // Reducir escala para menos altura
        useCORS: true,
        backgroundColor: null,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        ignoreElements: (el) => el.hasAttribute('data-hide-in-pdf') || el.classList.contains('no-print'),
      });

      const imgData = canvas.toDataURL("image/png");

      // ======== PDF =========
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();   // 210
      const pageH = pdf.internal.pageSize.getHeight();  // 297

      // REDUCIR espacio reservado para que quepa en una página
      const RESERVED_BOTTOM_MM = 45; // Reducido de 64 a 45
      const BOTTOM_GAP_MM = 3;

      // Calcular dimensiones de la imagen
      const imgWmm = pageW;
      const imgHmm = (canvas.height * imgWmm) / canvas.width;
      const maxImgHmm = pageH - RESERVED_BOTTOM_MM;

      let drawW = imgWmm;
      let drawH = imgHmm;

      // Escalar si es necesario para que quepa con el espacio reservado
      if (drawH > maxImgHmm) {
        const scale = maxImgHmm / drawH;
        drawW = drawW * scale;
        drawH = drawH * scale;
      }

      const drawX = (pageW - drawW) / 2;
      const drawY = 2; // Pequeño margen superior

      // Página 1 - Todo en una sola página
      paintFullBluePage(pdf);
      pdf.addImage(imgData, "PNG", drawX, drawY, drawW, drawH);
      drawLogosOnPage(pdf, logos);

      // --- Políticas y Contacto en la misma página (1) ---
      // Queremos TODO en la misma hoja: Facturación arriba, Contacto abajo
      const bottomMargin = 8;
      const gap = 4;

      // Alturas necesarias
      const contactBoxH = measureContactBoxHeight(pdf);
      const billingBoxH = measureBillingBoxHeight(pdf, "credito");

      // Calculamos el Y superior para facturación (antes del contacto)
      const billingY = pageH - bottomMargin - contactBoxH - gap - billingBoxH;
      const contactY = billingY + billingBoxH + gap;

      // Dibuja facturación inline y luego contacto
      drawBillingInfoInline(pdf, billingY, "credito");
      drawContactInfoOnCurrentPage(pdf, contactY);


      // --- Link invisible sobre la tarjeta del hotel ---
      // --- Link VISIBLE de Google Maps sobre la card del hotel ---
      if (hotelRect && mapsUrl) {
        const relXpx = hotelRect.left - pageRect.left;
        const relYpx = hotelRect.top - pageRect.top;
        const wpx = hotelRect.width;
        const hpx = hotelRect.height;

        // Escala px → mm en PDF (imagen ya escalada a drawW x drawH)
        const mmPerPxX = drawW / canvas.width;
        const mmPerPxY = drawH / canvas.height;

        let xmm = drawX + relXpx * mmPerPxX;
        let ymm = drawY + relYpx * mmPerPxY;
        let wmm = wpx * mmPerPxX;
        let hmm = hpx * mmPerPxY;

        // Ajuste fino para colocar el chip
        const LINK_OFFSET_MM = { x: 36, y: 12.5 };
        xmm += LINK_OFFSET_MM.x;
        ymm += LINK_OFFSET_MM.y;

        // ---- CHIP visible "Abrir en Google Maps" ----
        const labelText = "Abrir en Google Maps";
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);

        const padX = 2.6;
        const padY = 1.8;
        const textW = pdf.getTextWidth(labelText);
        const chipW = textW + padX * 2 + 4; // +4 para un mini icono
        const chipH = 6.8;

        const chipX = xmm + (wmm - chipW) / 2;
        const chipY = ymm - chipH - 1.5; // sobre la card

        // Fondo del chip
        const BLUE = { r: 59, g: 130, b: 246 };    // blue-500
        const BLUE_D = { r: 30, g: 64, b: 175 };  // azul más oscuro
        pdf.setFillColor(BLUE.r, BLUE.g, BLUE.b);
        pdf.setDrawColor(BLUE_D.r, BLUE_D.g, BLUE_D.b);
        if ((pdf as any).roundedRect) {
          (pdf as any).roundedRect(chipX, chipY, chipW, chipH, 1.6, 1.6, "FD");
        } else {
          pdf.rect(chipX, chipY, chipW, chipH, "FD");
        }

        // (opcional) Dibujar un “pin” simple a la izquierda
        const pinCx = chipX + 2.4;     // centro del pin
        const pinCy = chipY + chipH / 2; // verticalmente centrado
        pdf.setFillColor(255, 255, 255);
        // círculo
        pdf.circle(pinCx, pinCy - 0.6, 0.8, "F");
        // triángulo (punta)
        pdf.triangle(
          pinCx - 0.7, pinCy - 0.1,
          pinCx + 0.7, pinCy - 0.1,
          pinCx, pinCy + 1.2,
          "F"
        );

        // Texto del chip
        pdf.setTextColor(255, 255, 255);
        pdf.text(labelText, pinCx + 2.2, chipY + chipH - 2.1);

        // ---- Área CLICKEABLE ----
        // Si quieres que el clic sea SOLO el chip:
        const linkX = chipX, linkY = chipY, linkW = chipW, linkH = chipH;

        if ((pdf as any).link) {
          (pdf as any).link(linkX, linkY, linkW, linkH, { url: mapsUrl });
        } else {
          pdf.textWithLink(" ", linkX + linkW / 2, linkY + linkH / 2, { url: mapsUrl });
        }

        const RED_STROKE_MM = 0.5;


        // (opcional) Caja de depuración para ver dónde está el link
        const SHOW_DEBUG_LINK_BOX = false; // pon true para ver el marco
        if (SHOW_DEBUG_LINK_BOX) {
          pdf.setDrawColor(255, 0, 0);
          pdf.setLineWidth(RED_STROKE_MM);
          pdf.rect(linkX, linkY, linkW, linkH); // marco fino blanco
        }

        // Reset
        pdf.setTextColor(0, 0, 0);
        pdf.setDrawColor(0, 0, 0);
      }


      // ELIMINAR la página adicional de facturación
      // drawBillingInfoOnLastPage(pdf, "credito"); // ← COMENTAR ESTA LÍNEA

      const filename = `reservacion-${reservationDetails?.codigo_confirmacion || "sin-codigo"}.pdf`;
      if (opts?.save) pdf.save(filename);

      return pdf.output("blob") as Blob;
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("No se pudo generar el PDF. Revisa la consola para más detalles.");
      return null;
    } finally {
      // Restaurar estilos y elementos ocultos
      content.style.position = original.position;
      content.style.margin = original.margin;
      content.style.width = original.width;
      content.style.overflow = original.overflow;
      content.style.maxHeight = original.maxHeight;
      content.style.padding = original.padding;

      elementsToHide.forEach((el, i) => {
        (el as HTMLElement).style.display = originalDisplay[i] || '';
      });

      if (scroller && scrollerOriginal) {
        scroller.style.overflow = scrollerOriginal.overflow;
        scroller.style.maxHeight = scrollerOriginal.maxHeight;
      }
    }
  };

  // ====== Exponer métodos al padre ======
  useImperativeHandle(ref, () => ({
    download: async () => {
      await buildPdf({ save: true });
    },
    getPdfBlob: async () => {
      const blob = await buildPdf({ save: false });
      return blob;
    },
  }), [reservationDetails, logos]);

  // Si no está abierto y no queremos montarla oculta, no renderizamos nada
  if (!isOpen && !mountHidden) return null;

  // Estilo para “ocultar pero con layout” cuando mountHidden=true y isOpen=false
  const hiddenStyle = !isOpen && mountHidden
    ? { position: "absolute" as const, left: "-10000px", top: 0, width: "1000px" }
    : undefined;

  return (
    <div
      className={isOpen ? "fixed inset-0 z-[999] flex items-center justify-center" : ""}
      style={hiddenStyle}
    >
      {isOpen && <div className="absolute inset-0 bg-black/50" onClick={onClose} />}

      <div className="relative bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1100px] h-[95vh] flex flex-col mx-4 my-4">
        {/* Header fijo - FUERA del área de scroll */}
        {isOpen && (
          <div
            data-hide-in-pdf="true"
            className="no-print flex items-center justify-between px-6 py-4 border-b bg-white shrink-0 rounded-t-xl sticky top-0 z-10"
          >
            <h3 className="text-xl font-bold text-slate-800">
              Detalles de la Reservación
            </h3>
            <div className="flex items-center gap-3">
              <button
                data-hide-in-pdf="true"
                onClick={() => buildPdf({ save: true })}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
              >
                <FileDown className="mr-2" size={18} />
                Descargar PDF
              </button>
              <button
                data-hide-in-pdf="true"
                className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}

        {/* Body scrolleable - SOLO el contenido */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#3b82f6 #e0f2fe',
          }}
        >
          <div ref={pageRef} className="max-w-5xl mx-auto px-4 py-6 relative scroll-improved">
            <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />

            {reservationDetails ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-blue-900">Resumen de reservación</h1>
                  {reservationDetails?.codigo_confirmacion && (
                    <p className="mt-2">
                      <span className="text-slate-600 text-sm mr-1 align-middle">Confirmación</span>
                      <code className="text-blue-700 font-mono text-xl md:text-2xl tracking-wider leading-none align-middle select-all">
                        #{String(reservationDetails?.codigo_confirmacion).trim()}
                      </code>
                    </p>
                  )}

                </div>

                {/* Main Content */}
                <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-blue-100 mb-6">
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoCard icon={User} label="Huésped" value={reservationDetails.huesped || ""} />
                      <div ref={hotelCardRef} data-role="hotel-card">
                        <InfoCard
                          icon={Hotel}
                          label="Hotel"
                          value={reservationDetails.hotel || ""}
                          subValue={reservationDetails.direccion || ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {reservationDetails.acompañantes && reservationDetails.acompañantes.length > 0 && (
                        <InfoCard
                          icon={Users}
                          label="Acompañantes"
                          value={getAcompanantesValue(reservationDetails.acompañantes)}
                        />
                      )}
                      <InfoCard
                        icon={CupSoda}
                        label="Desayuno incluido"
                        value={reservationDetails.incluye_desayuno === 1 ? "Desayuno incluido" : "No incluye desayuno"}
                      />
                    </div>

                    <DateCard check_in={reservationDetails.check_in} check_out={reservationDetails.check_out} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoCard icon={Bed} label="Tipo de Habitación" value={cambiarLenguaje(reservationDetails.room || "")} />
                      <InfoCard
                        icon={MessageCircle}
                        label="Comentarios"
                        value={reservationDetails.comentarios || "No hay comentarios"}
                      />
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-blue-50 text-sm rounded-lg border border-blue-100 text-gray-700">
                    <p>
                      ¿Necesitas hacer cambios en tu reserva? <br />
                      <span
                        onClick={() => setIsSupportModalOpen(true)}
                        className="hover:underline cursor-pointer text-blue-500 font-medium"
                      >
                        Contacta al soporte de MIA
                      </span>{" "}
                      para ayudarte con cualquier modificación
                    </p>
                  </div>
                </div>

                {/* Botones adicionales en el footer del contenido - OCULTAR EN PDF */}
                <div
                  data-hide-in-pdf="true"
                  className="no-print flex justify-center gap-4 pb-6"
                >
                  <button
                    data-hide-in-pdf="true"
                    onClick={() => buildPdf({ save: true })}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
                  >
                    <FileDown className="mr-2" size={18} />
                    Descargar PDF
                  </button>
                  <button
                    data-hide-in-pdf="true"
                    onClick={onClose}
                    className="inline-flex items-center px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                  >
                    <X className="mr-2" size={18} />
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                {loading ? (
                  <div className="text-center mt-20 animate-pulse">
                    <h1 className="text-3xl font-bold text-blue-900 mb-4">Cargando reservación...</h1>
                    <p className="text-gray-500 text-lg">Por favor espera un momento.</p>
                    <div className="mt-10 flex justify-center">
                      <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center mt-20">
                    <h1 className="text-3xl font-bold text-blue-900 mb-4">No se encontró información</h1>
                    <p className="text-gray-600 text-lg">Revisa el objeto de la reservación que envías al modal.</p>
                    <button
                      data-hide-in-pdf="true"
                      onClick={onClose}
                      className="mt-6 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Reusable components (sin cambios)
const InfoCard = ({
  icon: Icon,
  label,
  value,
  subValue = "",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}) => (
  <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-3 rounded-lg">
    <Icon className="w-4 h-4 text-blue-600" />
    <div>
      <p className="text-xs font-medium text-blue-900/60">{label}</p>
      <p className="text-base font-semibold text-blue-900">{value}</p>
      {subValue && (
        <p className="text-[11px] font-normal text-blue-900/50">
          {subValue.toLowerCase()}
        </p>
      )}
    </div>
  </div>
);

const DateCard = ({
  check_in,
  check_out,
}: {
  check_in: string;
  check_out: string;
}) => (
  <div className="bg-white/50 backdrop-blur-sm p-3 rounded-lg">
    <div className="flex items-center space-x-2">
      <Calendar className="w-4 h-4 text-blue-600" />
      <div className="flex-1">
        <p className="text-xs font-medium text-blue-900/60">
          Fechas de Estancia
        </p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xs text-blue-900/60">Check-in</p>
            <p className="text-base font-semibold text-blue-900">
              {check_in.split("T")[0] || ""}
            </p>
          </div>
          <div className="mx-4">
            <ArrowRight className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-blue-900/60">Check-out</p>
            <p className="text-base font-semibold text-blue-900">
              {check_out.split("T")[0] || ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);