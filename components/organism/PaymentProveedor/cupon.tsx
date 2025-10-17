"use client";

import React, {
  useEffect, useState, useRef, forwardRef, useImperativeHandle
} from "react";
import { Calendar, Hotel, User, Bed, ArrowRight, MessageCircle, Users, CupSoda, FileDown, X } from "lucide-react";
import { SupportModal } from "./superModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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


  useEffect(() => {
    setReservationDetails(reservation ?? null);
    setLoading(!reservation);
  }, [reservation]);

  // (si ocuparas el fetch por id, reactívalo)
  // useEffect(() => { ... }, [reservationIdBase64]);

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

  function drawContactInfoOnCurrentPage(pdf: jsPDF) {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // === Colores Tailwind ===
    const BLUE_50 = { r: 239, g: 246, b: 255 }; // #eff6ff
    const BLUE_200 = { r: 191, g: 219, b: 254 }; // #bfdbfe
    const BLUE_600 = { r: 37, g: 99, b: 235 }; // #2563eb
    const BLUE_900 = { r: 30, g: 58, b: 138 }; // #1e3a8a
    const TEXT_DARK = { r: 30, g: 41, b: 59 }; // gris oscuro legible

    // — Layout —
    const marginX = 12;            // margen lateral
    const bottomMargin = 12;       // margen inferior
    const boxW = pageW - marginX * 2;

    const title = "DATOS DE CONTACTO 24/7";

    // Contenido (con partes linkeables)
    const whatsappLabel = "Whatsapp:";
    const whatsappNumber = "5510445254";
    const mailLabel = "Correo:";
    const mail = "support@noktos.zohodesk.com";
    const phoneLabel = "Teléfono:";
    const phone = "800 666 5867 opción 2";

    // Métricas tipográficas
    const paddingX = 8;
    const paddingY = 8;
    const titleBarH = 11; // barra superior azul
    const lineGap = 4;

    // Medimos altura aproximada de contenido
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const lineH = 6;

    // 3 líneas de contenido principales
    const contentH = lineH * 3 + lineGap * 2;

    // Alto total de la tarjeta
    const boxH = paddingY + titleBarH + paddingY + contentH + paddingY;

    // Posición de la tarjeta pegada al pie
    const x = marginX;
    const y = pageH - bottomMargin - boxH;

    // — Caja de fondo (blue-50) con borde (blue-200)
    pdf.setDrawColor(BLUE_200.r, BLUE_200.g, BLUE_200.b);
    pdf.setFillColor(BLUE_50.r, BLUE_50.g, BLUE_50.b);
    if ((pdf as any).roundedRect) {
      (pdf as any).roundedRect(x, y, boxW, boxH, 3, 3, "FD");
    } else {
      pdf.rect(x, y, boxW, boxH, "FD");
    }

    // — Barra superior azul-600
    pdf.setFillColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.rect(x, y, boxW, titleBarH, "F");

    // — Título (blanco) dentro de la barra
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12.5);
    pdf.setTextColor(255, 255, 255);
    // centrado vertical dentro de la barra
    pdf.text(title, x + paddingX, y + titleBarH - 3);

    // — Contenido
    let cursorY = y + titleBarH + paddingY + lineH - 2;

    // Label helpers
    const drawLabel = (label: string, baseX: number, baseY: number) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(BLUE_900.r, BLUE_900.g, BLUE_900.b);
      pdf.text(label, baseX, baseY);
    };
    const drawValue = (value: string, baseX: number, baseY: number) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
      pdf.text(value, baseX, baseY);
    };

    // Columna texto
    const textX = x + paddingX;

    // 1) Whatsapp (texto + link a wa.me)
    drawLabel(whatsappLabel, textX, cursorY);
    const wsLabelW = pdf.getTextWidth(whatsappLabel + " ");
    pdf.setTextColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.textWithLink(whatsappNumber, textX + wsLabelW, cursorY, {
      url: "https://wa.me/525510445254",
    });

    // 2) Correo (texto + mailto)
    cursorY += lineH + lineGap;
    drawLabel(mailLabel, textX, cursorY);
    const mailLabelW = pdf.getTextWidth(mailLabel + " ");
    pdf.setTextColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.textWithLink(mail, textX + mailLabelW, cursorY, {
      url: `mailto:${mail}`,
    });

    // 3) Teléfono (texto + tel:)
    cursorY += lineH + lineGap;
    drawLabel(phoneLabel, textX, cursorY);
    const phoneLabelW = pdf.getTextWidth(phoneLabel + " ");
    pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
    drawValue(phone, textX + phoneLabelW, cursorY);
    // Si quieres link "tel:" (algunos viewers lo respetan)
    pdf.setTextColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.textWithLink(" Llamar", textX + phoneLabelW + pdf.getTextWidth(phone) + 1, cursorY, {
      url: "tel:+528006665867",
    });

    // — Reset de estilos
    pdf.setTextColor(0, 0, 0);
    pdf.setDrawColor(0, 0, 0);
  }
  function drawBillingInfoOnLastPage(
    pdf: jsPDF,
    mode: "full" | "credito" = "full" // ← nuevo
  ) {
    // Siempre agregamos una página dedicada a facturación
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

    const marginX = 12;
    const marginY = 16;
    const boxW = pageW - marginX * 2;
    let y = marginY;

    const titleBarH = 12;
    const paddingX = 8;
    const paddingY = 8;
    const lineGap = 3;

    // === Título principal (ajustado cuando es solo CRÉDITO) ===
    const titleText =
      mode === "credito" ? "FACTURACIÓN (CRÉDITO)" : "FACTURACIÓN DE RESERVACIONES";
    pdf.setFillColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
    pdf.rect(marginX, y, boxW, titleBarH, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(titleText, marginX + paddingX, y + titleBarH - 3);
    y += titleBarH + 6;

    // Aviso superior (omite si solo es crédito, para ir directo al grano)
    if (mode !== "credito") {
      pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const aviso =
        "Recuerda que la facturación de cada reservación debe hacerse por habitación y con esta información:";
      const avisoWrapped = pdf.splitTextToSize(aviso, boxW);
      pdf.text(avisoWrapped, marginX, y);
      y += avisoWrapped.length * 5 + 6;
    }

    // Helper para secciones
    const drawSection = (heading: string, lines: string[]) => {
      const startY = y;

      // Medir alto del contenido
      let contentHeight = paddingY * 2 + 6; // base
      pdf.setFontSize(12);
      const headingH = 6;
      contentHeight += headingH + 4;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      const maxWidth = boxW - paddingX * 2;
      const wrappedLines = lines.map((L) => pdf.splitTextToSize(L, maxWidth));
      wrappedLines.forEach((w) => (contentHeight += w.length * 5 + lineGap));

      // Salto si no cabe
      if (startY + contentHeight + 10 > pageH) {
        pdf.addPage();
        paintFullBluePage(pdf);
        y = marginY;
      }

      // Fondo
      pdf.setDrawColor(BLUE_200.r, BLUE_200.g, BLUE_200.b);
      pdf.setFillColor(BLUE_50.r, BLUE_50.g, BLUE_50.b);
      if ((pdf as any).roundedRect) {
        (pdf as any).roundedRect(marginX, y, boxW, contentHeight, 3, 3, "FD");
      } else {
        pdf.rect(marginX, y, boxW, contentHeight, "FD");
      }

      // Heading
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(BLUE_900.r, BLUE_900.g, BLUE_900.b);
      pdf.text(heading, marginX + paddingX, y + paddingY + headingH);
      let cy = y + paddingY + headingH + 4;

      // Líneas
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
      wrappedLines.forEach((w) => {
        pdf.text(w, marginX + paddingX, cy);
        cy += w.length * 5 + lineGap;
      });

      y += contentHeight + 8;
    };

    // === Contenido base ===
    const comunes = [
      "Razón social: NOKTOS ALIANZA",
      "RFC: NAL190807BU2",
      "Código postal: 11570",
      "Dirección: Presidente Masarik No. 29, Interior E-3, Col. Chapultepec Morales, Alcaldía Miguel Hidalgo, CDMX.",
      "E-mail: operaciones@noktos.com",
      "Régimen Fiscal: 601 - General de Ley Personas Morales",
      "Uso de CFDI: G03 - Gastos en general",
    ];

    // Render condicional
    if (mode === "credito") {
      drawSection("CRÉDITO", [
        ...comunes,
        "Método de pago: PPD - Pago en parcialidades o diferido",
        "Forma de pago: 99 - Por definir",
      ]);
      return; // ← solo esa sección
    }

    // Modo completo (como lo tenías)
    // drawSection("PAGO CON TDC", [
    //   ...comunes,
    //   "Método de pago: PUE - Pago en una sola exhibición",
    //   "Forma de pago: 04 - Tarjeta de crédito",
    // ]);

    // drawSection("PAGO CON TRANSFERENCIA", [
    //   ...comunes,
    //   "Método de pago: PUE - Pago en una sola exhibición",
    //   "Forma de pago: 03 - Transferencia electrónica de fondos",
    // ]);

    drawSection("CRÉDITO", [
      ...comunes,
      "Método de pago: PPD - Pago en parcialidades o diferido",
      "Forma de pago: 99 - Por definir",
    ]);
  }


  function paintFullBluePage(pdf: jsPDF) {
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(221, 235, 254); // #DDEBFE
    pdf.rect(0, 0, w, h, "F");
  }


  // ====== GENERACIÓN DE PDF (devuelve Blob y opcionalmente guarda) ======
  const buildPdf = async (opts?: { save?: boolean }) => {
    const content = pageRef.current;
    const scroller = scrollRef.current;

    if (!content) return null;

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

    try {
      // Expandir para capturar TODO
      content.style.position = "static";
      content.style.margin = "0 auto";
      content.style.width = "100%";
      content.style.overflow = "visible";
      content.style.maxHeight = "none";
      content.style.padding = "20px 16px";

      if (scroller) {
        scroller.style.overflow = "visible";
        scroller.style.maxHeight = "none";
      }

      // Ocultar elementos que no deben aparecer en el PDF
      const elementsToHide = content.querySelectorAll('[data-hide-in-pdf]');
      const originalDisplay: string[] = [];

      elementsToHide.forEach((element) => {
        originalDisplay.push((element as HTMLElement).style.display);
        (element as HTMLElement).style.display = 'none';
      });

      // Espera un frame para reflow
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(content, {
        scale: Math.min(2, window.devicePixelRatio || 1) * 2,
        useCORS: true,
        backgroundColor: null,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        ignoreElements: (element) => {
          return (
            element.hasAttribute('data-hide-in-pdf') ||
            element.classList.contains('no-print')
          );
        },
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Página 1
      paintFullBluePage(pdf);
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      drawLogosOnPage(pdf, logos);
      heightLeft -= pageHeight;

      // Siguientes
      while (heightLeft > 0) {
        pdf.addPage();
        paintFullBluePage(pdf);
        position = heightLeft - imgHeight;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        drawLogosOnPage(pdf, logos);
        heightLeft -= pageHeight;
      }

      const total = (pdf as any).getNumberOfPages
        ? (pdf as any).getNumberOfPages()
        : pdf.getNumberOfPages?.();
      if (total && total > 0) {
        pdf.setPage(total);
        drawContactInfoOnCurrentPage(pdf);
        drawBillingInfoOnLastPage(pdf);
      }

      const filename = `reservacion-${reservationDetails?.codigo_confirmacion || "sin-codigo"}.pdf`;
      if (opts?.save) pdf.save(filename);

      return pdf.output("blob") as Blob;
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("No se pudo generar el PDF. Revisa la consola para más detalles.");
      return null;
    } finally {
      // Restaurar estilos
      content.style.position = original.position;
      content.style.margin = original.margin;
      content.style.width = original.width;
      content.style.overflow = original.overflow;
      content.style.maxHeight = original.maxHeight;
      content.style.padding = original.padding;

      // Restaurar elementos ocultos
      const elementsToHide = content.querySelectorAll('[data-hide-in-pdf], .no-print');
      elementsToHide.forEach((element, index) => {
        (element as HTMLElement).style.display = originalDisplay[index] || '';
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
                onClick={onClose}
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
                    <p className="text-blue-600 mt-2 break-words tracking-normal">
                      Confirmación #{reservationDetails?.codigo_confirmacion}
                    </p>
                  )}
                </div>

                {/* Main Content */}
                <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-blue-100 mb-6">
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoCard icon={User} label="Huésped" value={reservationDetails.huesped || ""} />
                      <InfoCard
                        icon={Hotel}
                        label="Hotel"
                        value={reservationDetails.hotel || ""}
                        subValue={reservationDetails.direccion || ""}
                      />
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
