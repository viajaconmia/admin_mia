import React, { useEffect, useState, useRef } from "react";
import {
  Calendar,
  Hotel,
  User,
  Bed,
  ArrowRight,
  MessageCircle,
  Users,
  CupSoda,
  FileDown,
} from "lucide-react";
import { SupportModal } from "./superModal";
// ⬇️ ya no usamos ReservationDetails2; trabajamos con any
// import { ReservationDetails2 } from "../types/index";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { HEADERS_API, URL } from "@/lib/constants";

export type ReservaHandle = {
  download: () => Promise<void>;
  getPdfBlob: () => Promise<Blob | null>;
};

const getUbicacion = async (
  id: string
) => {
  const response = await fetch(`${URL}/mia/solicitud/ubicacion?id=${id}`, {
    method: "GET",
    headers: HEADERS_API,
  });
  const json = await response.json();
  console.log(json);
  return json;
}


// =================== PROPS ===================
export type ReservaProps = {
  isOpen: boolean;
  onClose: () => void;
  reservation?: any;                // objeto directo con la reservación
  reservationIdBase64?: string;     // opcional si aún quieres pasar el id (pero aquí NO se usa fetch)
  mountHidden?: boolean;
  billingMode?: "full" | "credito"; // ⬅️ opcional para la página de facturación
};

// =================== UTIL: Carga IMG a dataURL ===================
type LogoAsset = { key: string; src: string };

type LogoLoaded = {
  dataUrl: string;
  ar: number; // aspect ratio width/height
};

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

// =================== SVG MIA a PNG ===================
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

// =================== COMPONENTE ===================
export function Reserva({
  isOpen,
  onClose,
  reservation,
  reservationIdBase64, // no lo usamos aquí para fetch, solo por compat
  mountHidden,
  billingMode = "full",
}: ReservaProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [Ubicacion, SetUbicacion] = useState<any>(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const hotelCardRef = useRef<HTMLDivElement>(null);
  const [logos, setLogos] = useState<Record<string, LogoLoaded>>({});

  // ===== Cargar reservación desde props (sin fetch) =====
  useEffect(() => {
    if (reservation) {
      setReservationDetails({ ...reservation });
      setLoading(false);
    } else {
      setReservationDetails(null);
      setLoading(false);
    }
  }, [reservation, reservationIdBase64]);

  // ===== Precargar logos solo para PDF =====
  const logoAssets: LogoAsset[] = [
    { key: "noktos", src: "https://luiscastaneda-tos.github.io/log/files/nokt.png" },
    // { key: "hotel", src: "https://tu-servidor/logo-hotel.png" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const fromAssets = await Promise.all(
          logoAssets.map(async (a) => {
            const data = await loadImageAsDataURL(a.src);
            return [a.key, data] as const;
          })
        );
        const miaData = await loadSvgStringAsPngDataURL(MIA_SVG);
        const entries = [...fromAssets, ["mia", miaData] as const];
        setLogos(Object.fromEntries(entries));
      } catch (e) {
        console.warn("Fallo precarga de logos:", e);
      }
    })();
  }, []);

  // ===== Helpers UI =====
  const getAcompanantesValue = (viajeros: string) => (viajeros ? viajeros : "No hay acompañantes");
  const cambiarLenguaje = (room: string) => {
    let r = room;
    if (room?.toUpperCase() === "SINGLE") r = "SENCILLO";
    else if (room?.toUpperCase() === "DOUBLE") r = "DOBLE";
    return r;
  };

  // ===== Pinturas y tarjetas para PDF =====
  function paintFullBluePage(pdf: jsPDF) {
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(221, 235, 254); // #DDEBFE
    pdf.rect(0, 0, w, h, "F");
  }

  function drawLogosOnPage(pdf: jsPDF, logosMap: Record<string, LogoLoaded>) {
    const pageW = pdf.internal.pageSize.getWidth();
    const TOP_Y = 14;
    const PADDING_X = 10;
    const HEADER_H = 16;
    const MAX_W_RATIO = 0.28;
    const FOOTER_H = 8;

    if (logosMap["noktos"]) {
      const { dataUrl, ar } = logosMap["noktos"];
      let w = HEADER_H * ar;
      const maxW = pageW * MAX_W_RATIO;
      if (w > maxW) w = maxW;
      pdf.addImage(dataUrl, "PNG", PADDING_X, TOP_Y, w, HEADER_H);
    }
    if (logosMap["mia"]) {
      const { dataUrl, ar } = logosMap["mia"];
      let w = HEADER_H * ar;
      const maxW = pageW * MAX_W_RATIO;
      if (w > maxW) w = maxW;
      const x = pageW - PADDING_X - w;
      pdf.addImage(dataUrl, "PNG", x, TOP_Y, w, HEADER_H);
    }
    if (logosMap["hotel"]) {
      const pageH = pdf.internal.pageSize.getHeight();
      const { dataUrl, ar } = logosMap["hotel"];
      const w = FOOTER_H * ar;
      const x = (pageW - w) / 2;
      const y = pageH - 8 - FOOTER_H;
      pdf.addImage(dataUrl, "PNG", x, y, w, FOOTER_H);
    }
  }

  function drawContactInfoOnCurrentPage(pdf: jsPDF) {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const BLUE_50 = { r: 239, g: 246, b: 255 };
    const BLUE_200 = { r: 191, g: 219, b: 254 };
    const BLUE_600 = { r: 37, g: 99, b: 235 };
    const BLUE_900 = { r: 30, g: 58, b: 138 };
    const TEXT_DARK = { r: 30, g: 41, b: 59 };

    const marginX = 12;
    const bottomMargin = 12;
    const boxW = pageW - marginX * 2;

    const title = "DATOS DE CONTACTO 24/7";

    const whatsappLabel = "Whatsapp:";
    const whatsappNumber = "5510445254";
    const mailLabel = "Correo:";
    const mail = "support@noktos.zohodesk.com";
    const phoneLabel = "Teléfono:";
    const phone = "800 666 5867 opción 2";

    const paddingX = 7;
    const paddingY = 6;
    const titleBarH = 9;
    const lineGap = 3;
    const topPaddingFromPolicies = -3;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    const lineH = 5;

    const contentH = lineH * 3 + lineGap * 2;
    const boxH = paddingY + titleBarH + paddingY + contentH + paddingY;

    const x = marginX;
    const y = pageH - bottomMargin - boxH - topPaddingFromPolicies;

    pdf.setDrawColor(BLUE_200.r, BLUE_200.g, BLUE_200.b);
    pdf.setFillColor(BLUE_50.r, BLUE_50.g, BLUE_50.b);
    if ((pdf as any).roundedRect) (pdf as any).roundedRect(x, y, boxW, boxH, 3, 3, "FD");
    else pdf.rect(x, y, boxW, boxH, "FD");

    pdf.setFillColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.rect(x, y, boxW, titleBarH, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, x + paddingX, y + titleBarH - 2.2);

    let cursorY = y + titleBarH + paddingY + lineH - 2;

    const drawLabel = (label: string, baseX: number, baseY: number) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(BLUE_900.r, BLUE_900.g, BLUE_900.b);
      pdf.text(label, baseX, baseY);
    };
    const drawValue = (value: string, baseX: number, baseY: number) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
      pdf.text(value, baseX, baseY);
    };

    const textX = x + paddingX;

    drawLabel(whatsappLabel, textX, cursorY);
    const wsLabelW = pdf.getTextWidth(whatsappLabel + " ");
    pdf.setTextColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.textWithLink(whatsappNumber, textX + wsLabelW, cursorY, { url: "https://wa.me/5215510445254" });

    cursorY += lineH + lineGap;
    drawLabel(mailLabel, textX, cursorY);
    const mailLabelW = pdf.getTextWidth(mailLabel + " ");
    pdf.setTextColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.textWithLink(mail, textX + mailLabelW, cursorY, { url: `mailto:${mail}` });

    cursorY += lineH + lineGap;
    drawLabel(phoneLabel, textX, cursorY);
    const phoneLabelW = pdf.getTextWidth(phoneLabel + " ");
    pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
    drawValue(phone, textX + phoneLabelW, cursorY);
    pdf.setTextColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.textWithLink(" Llamar", textX + phoneLabelW + pdf.getTextWidth(phone) + 1, cursorY, {
      url: "tel:+528006665867",
    });

    pdf.setTextColor(0, 0, 0);
    pdf.setDrawColor(0, 0, 0);
  }

  function drawPoliciesOnCurrentPage(pdf: jsPDF) {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const BLUE_50 = { r: 239, g: 246, b: 255 };
    const BLUE_200 = { r: 191, g: 219, b: 254 };
    const BLUE_600 = { r: 37, g: 99, b: 235 };
    const TEXT_DARK = { r: 30, g: 41, b: 59 };

    const marginX = 12;
    const sideW = pageW - marginX * 2;

    const politicas = [
      "1.- Los cambios y cancelaciones solo aplican cuando se tratan de Tarifas Reembolsables y están sujetas a disponibilidad.",
      "2.- Cualquier cambio o cancelación a la reservación deberá ser solicitada a los canales de contacto oficiales con una anticipación mínima de 72 horas antes de la fecha de llegada o inicio de servicios proporcionando la (s) clave (s) de confirmación y la sede.",
      "3.- El huésped debe realizar el check out con base en los horarios y formas establecidas por cada hotel, si el huésped no ejecuta la actividad en tiempo y forma, el proveedor podrá cobrar al viajero penalizaciones.",
      "4.- En caso de que el viajero realice una salida anticipada o desee extender su estadía (sujeto a disponibilidad), deberá notificarlo al proveedor y a Noktos a través de correo electrónico, teléfono o whatsapp: para evitar penalizaciones adicionales.",
      "5.- El viajero debe respetar las políticas y lineamientos de cada proveedor para evitar incurrir en multas y penalizaciones. En caso de que el hotel reporte algún mal comportamiento o una penalización que el viajero se haya negado a pagar, MIA by NOKTOS se reserva el derecho de seguirle brindando servicio al cliente / huésped involucrado.",
      "6.- El link de google maps es aproximado, favor de validar la dirección abajo del nombre del proveedor.",
    ];

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    const title = "POLÍTICAS";

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    const paddingX = 1;
    const paddingY = 6;
    const titleBarH = 9;
    const maxTextWidth = sideW - paddingX * 2;

    const wrapped = politicas.flatMap((p) => pdf.splitTextToSize(p, maxTextWidth));
    const lineH = 5;
    const contentH = wrapped.length * lineH;

    const boxH = paddingY + titleBarH + paddingY + contentH + paddingY;

    const bottomMargin = 12;
    const contactApproxH = 42;
    const gapBetweenCards = 6;
    const y = pageH - bottomMargin - contactApproxH - gapBetweenCards - boxH;
    const x = marginX;

    pdf.setDrawColor(BLUE_200.r, BLUE_200.g, BLUE_200.b);
    pdf.setFillColor(BLUE_50.r, BLUE_50.g, BLUE_50.b);
    if ((pdf as any).roundedRect) (pdf as any).roundedRect(x, y, sideW, boxH, 3, 3, "FD");
    else pdf.rect(x, y, sideW, boxH, "FD");

    pdf.setFillColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.rect(x, y, sideW, titleBarH, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, x + paddingX, y + titleBarH - 2.2);

    let cursorY = y + titleBarH + paddingY;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);

    for (const line of wrapped) {
      pdf.text(line as string, x + paddingX, cursorY);
      cursorY += lineH;
    }

    pdf.setTextColor(0, 0, 0);
    pdf.setDrawColor(0, 0, 0);
  }

  // ===== Página de Facturación (se añade SIEMPRE al final) =====
  function drawBillingInfoOnLastPage(
    pdf: jsPDF,
    paintFullBluePage?: (pdf: jsPDF) => void,
    mode: "full" | "credito" = "full"
  ) {
    pdf.addPage();
    paintFullBluePage?.(pdf);

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const BLUE_50 = { r: 239, g: 246, b: 255 };
    const BLUE_200 = { r: 191, g: 219, b: 254 };
    const BLUE_600 = { r: 37, g: 99, b: 235 };
    const BLUE_900 = { r: 30, g: 58, b: 138 };
    const TEXT_DARK = { r: 30, g: 41, b: 59 };

    const marginX = 12;
    const marginY = 16;
    const boxW = pageW - marginX * 2;
    let y = marginY;

    const titleBarH = 12;
    const paddingX = 8;
    const paddingY = 8;
    const lineGap = 3;

    const titleText = mode === "credito" ? "FACTURACIÓN (CRÉDITO)" : "FACTURACIÓN DE RESERVACIONES";
    pdf.setFillColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.rect(marginX, y, boxW, titleBarH, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(titleText, marginX + paddingX, y + titleBarH - 3);
    y += titleBarH + 6;

    if (mode !== "credito") {
      pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const aviso = "Recuerda que la facturación de cada reservación debe hacerse por habitación y con esta información:";
      const avisoWrapped = pdf.splitTextToSize(aviso, boxW);
      pdf.text(avisoWrapped, marginX, y);
      y += avisoWrapped.length * 5 + 6;
    }

    const drawSection = (heading: string, lines: string[]) => {
      const startY = y;
      let contentHeight = paddingY * 2 + 6;
      const headingH = 6;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      contentHeight += headingH + 4;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      const maxWidth = boxW - paddingX * 2;
      const wrappedLines = lines.map((L) => pdf.splitTextToSize(L, maxWidth));
      wrappedLines.forEach((w) => (contentHeight += w.length * 5 + lineGap));

      if (startY + contentHeight + 10 > pageH) {
        pdf.addPage();
        paintFullBluePage?.(pdf);
        y = marginY;
      }

      pdf.setDrawColor(BLUE_200.r, BLUE_200.g, BLUE_200.b);
      pdf.setFillColor(BLUE_50.r, BLUE_50.g, BLUE_50.b);
      if ((pdf as any).roundedRect) (pdf as any).roundedRect(marginX, y, boxW, contentHeight, 3, 3, "FD");
      else pdf.rect(marginX, y, boxW, contentHeight, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(BLUE_900.r, BLUE_900.g, BLUE_900.b);
      pdf.text(heading, marginX + paddingX, y + paddingY + headingH);
      let cy = y + paddingY + headingH + 4;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
      wrappedLines.forEach((w) => {
        pdf.text(w, marginX + paddingX, cy);
        cy += w.length * 5 + lineGap;
      });

      y += contentHeight + 8;
    };

    const comunes = [
      "Razón social: NOKTOS ALIANZA",
      "RFC: NAL190807BU2",
      "Código postal: 11570",
      "Dirección: Presidente Masarik No. 29, Interior E-3, Col. Chapultepec Morales, Alcaldía Miguel Hidalgo, CDMX.",
      "E-mail: operaciones@noktos.com",
      "Régimen Fiscal: 601 - General de Ley Personas Morales",
      "Uso de CFDI: G03 - Gastos en general",
    ];

    if (mode === "credito") {
      drawSection("CRÉDITO", [
        ...comunes,
        "Método de pago: PPD - Pago en parcialidades o diferido",
        "Forma de pago: 99 - Por definir",
      ]);
      return;
    }

    drawSection("CRÉDITO", [
      ...comunes,
      "Método de pago: PPD - Pago en parcialidades o diferido",
      "Forma de pago: 99 - Por definir",
    ]);
  }

  // ===== Google Maps URL (usa tu getUbicacion) =====
  type UbicacionType = { lat?: number; lng?: number } | string | null | undefined;

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
    if (parts.length > 0) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
    }
    return "";
  }

  const handleUbication = async (): Promise<UbicacionType> => {
    try {
      const id_hotel = reservationDetails?.id_hotel;
      if (!id_hotel) return reservationDetails?.direccion ?? null;
      const data = await getUbicacion(id_hotel);
      const ubic = data?.res?.[0]?.ubicacion_o_direccion ?? null; // "lat,lng" o texto
      SetUbicacion(ubic);
      if (typeof ubic === "string" && ubic.includes(",")) {
        const [a, b] = ubic.split(",").map((s) => Number(s.trim()));
        if (!Number.isNaN(a) && !Number.isNaN(b)) return { lat: a, lng: b };
      }
      return ubic;
    } catch (e) {
      console.error("Hubo un error al obtener la ubicación:", e);
      return reservationDetails?.direccion ?? null;
    }
  };

  // ===== Descargar PDF =====
  const handleDownloadPdf = async () => {
    const ubic = await handleUbication();
    const mapsUrl = buildGoogleMapsUrl(
      ubic,
      reservationDetails?.hotel || "",
      reservationDetails?.direccion || ""
    );

    const content = pageRef.current;
    if (!content) return;

    const original = {
      position: content.style.position,
      margin: content.style.margin,
      width: content.style.width,
    };

    try {
      content.style.position = "static";
      content.style.margin = "0 auto";
      content.style.width = "100%";

      const contentRect = content.getBoundingClientRect();
      const hotelRect = hotelCardRef.current?.getBoundingClientRect();

      const canvas = await html2canvas(content, {
        scale: Math.min(2, window.devicePixelRatio || 1) * 2,
        useCORS: true,
        backgroundColor: null,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWmm = pdf.internal.pageSize.getWidth();
      const pageHmm = pdf.internal.pageSize.getHeight();

      const imgWmm = pageWmm;
      const imgHmm = (canvas.height * imgWmm) / canvas.width;

      // Página 1
      paintFullBluePage(pdf);
      pdf.addImage(imgData, "PNG", 0, 0, imgWmm, imgHmm);
      drawLogosOnPage(pdf, logos);

      // Páginas siguientes
      let heightLeft = imgHmm - pageHmm;
      let position = 0;
      while (heightLeft > 0) {
        pdf.addPage();
        paintFullBluePage(pdf);
        position = heightLeft - imgHmm;
        pdf.addImage(imgData, "PNG", 0, position, imgWmm, imgHmm);
        drawLogosOnPage(pdf, logos);
        heightLeft -= pageHmm;
      }

      // Link clickeable sobre la tarjeta de Hotel (misma técnica que ya usabas)
      if (hotelRect && mapsUrl) {
        const relXpx = hotelRect.left - contentRect.left + 19;
        const relYpx = hotelRect.top - contentRect.top;
        const wpx = hotelRect.width;
        const hpx = hotelRect.height;

        const mmPerPxX = imgWmm / canvas.width;
        const mmPerPxY = imgHmm / canvas.height;

        const OFFSET_X_MM = 39;
        const OFFSET_Y_MM = 18;

        let xmm_total = relXpx * mmPerPxX + OFFSET_X_MM;
        let ymm_total = relYpx * mmPerPxY + OFFSET_Y_MM;
        let wmm = wpx * mmPerPxX;
        let hmm = hpx * mmPerPxY;

        const targetPageIndex = Math.floor(ymm_total / pageHmm);
        const yOnPageMm = ymm_total - targetPageIndex * pageHmm;

        const totalPages = (pdf as any).getNumberOfPages
          ? (pdf as any).getNumberOfPages()
          : pdf.getNumberOfPages?.();
        const pageIndex1Based = Math.min(targetPageIndex + 1, totalPages || 1);
        pdf.setPage(pageIndex1Based);

        if ((pdf as any).link) {
          (pdf as any).link(xmm_total, yOnPageMm, wmm, hmm, { url: mapsUrl });
        } else {
          pdf.setTextColor(0, 0, 255);
          pdf.setFontSize(1);
          pdf.textWithLink(" ", xmm_total + 0.5, yOnPageMm + 1, { url: mapsUrl });
          pdf.setTextColor(0, 0, 0);
        }
      }

      // Última página “constante”: Políticas + Contacto
      const total = (pdf as any).getNumberOfPages
        ? (pdf as any).getNumberOfPages()
        : pdf.getNumberOfPages?.();
      if (total && total > 0) {
        pdf.setPage(total);
        drawPoliciesOnCurrentPage(pdf);
        drawContactInfoOnCurrentPage(pdf);
      }

      // ⬇️ Nueva página de Facturación al final
      drawBillingInfoOnLastPage(pdf, paintFullBluePage, billingMode);

      pdf.save(`reservacion-${reservationDetails?.codigo_confirmacion || "sin-codigo"}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("No se pudo generar el PDF. Revisa la consola para más detalles.");
    } finally {
      content.style.position = original.position;
      content.style.margin = original.margin;
      content.style.width = original.width;
    }
  };

  // =================== UI ===================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
      {/* Botón de descarga */}
      <div className="text-right p-4 print:hidden">
        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FileDown className="mr-2" size={20} />
          Descargar PDF
        </button>
      </div>

      <div ref={pageRef} className="max-w-5xl mx-auto px-4 py-12 relative">
        <SupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />

        {reservationDetails ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-blue-900">Detalles de la Reservación</h1>
              {reservationDetails.codigo_confirmacion && (
                <p className="text-blue-600 mt-2">
                  Confirmación #{reservationDetails.codigo_confirmacion}
                </p>
              )}
            </div>

            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-blue-100">
              <div className="grid gap-6">
                {/* Huésped / Hotel */}
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
                  {reservationDetails.acompañantes &&
                    reservationDetails.acompañantes.length > 0 && (
                      <InfoCard
                        icon={Users}
                        label="Acompañantes"
                        value={getAcompanantesValue(reservationDetails.acompañantes)}
                      />
                    )}
                  <InfoCard
                    icon={CupSoda}
                    label="Desayuno incluido"
                    value={
                      reservationDetails.incluye_desayuno === 1
                        ? "Desayuno incluido"
                        : "No incluye desayuno"
                    }
                  />
                </div>

                {/* Fechas */}
                <DateCard
                  check_in={reservationDetails.check_in}
                  check_out={reservationDetails.check_out}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard
                    icon={Bed}
                    label="Tipo de Habitación"
                    value={cambiarLenguaje(reservationDetails.room || "")}
                  />
                  <InfoCard
                    icon={MessageCircle}
                    label="Comentarios"
                    value={reservationDetails.comentarios || "No hay comentarios"}
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 text-sm rounded-lg border border-blue-100 text-gray-700">
                <p>
                  ¿Necesitas hacer cambios en tu reserva?{" "}
                  <span
                    onClick={() => setIsSupportModalOpen(true)}
                    className="hover:underline cursor-pointer text-blue-500"
                  >
                    Contacta al soporte de MIA
                  </span>{" "}
                  para ayudarte con cualquier modificación
                </p>
              </div>
            </div>
          </>
        ) : loading ? (
          <div className="text-center mt-20 animate-pulse">
            <h1 className="text-3xl font-bold text-blue-900 mb-4">Cargando reservación...</h1>
            <p className="text-gray-500 text-lg">Por favor espera un momento.</p>
            <div className="mt-10 flex justify-center">
              <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="text-center mt-20">
            <h1 className="text-3xl font-bold text-blue-900 mb-4">No se encontró información</h1>
            <p className="text-gray-600 text-lg">
              No pudimos encontrar una reservación con los datos proporcionados, por favor contacte
              con soporte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== Subcomponentes simples ===================
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
      {subValue && <p className="text-[11px] font-normal text-blue-900/50">{subValue.toLowerCase()}</p>}
    </div>
  </div>
);

const DateCard = ({ check_in, check_out }: { check_in: string; check_out: string }) => {
  const formatDate = (dateStr: string) => (!dateStr ? "—" : dateStr.includes("T") ? dateStr.split("T")[0] : dateStr);
  return (
    <div className="bg-white/50 backdrop-blur-sm p-3 rounded-lg">
      <div className="flex items-center space-x-2">
        <Calendar className="w-4 h-4 text-blue-600" />
        <div className="flex-1">
          <p className="text-xs font-medium text-blue-900/60">Fechas de Estancia</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-blue-900/60">Check-in</p>
              <p className="text-base font-semibold text-blue-900">{formatDate(check_in)}</p>
            </div>
            <div className="mx-4">
              <ArrowRight className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-blue-900/60">Check-out</p>
              <p className="text-base font-semibold text-blue-900">{formatDate(check_out)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
