// pdfReservation.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type UbicacionType = { lat?: number; lng?: number } | string | null | undefined;

export type BuildMapsUrlOpts = {
  ubicacion: UbicacionType;
  hotelName?: string | null;
  direccionFallback?: string | null;
  soloHotel?: boolean;
};

export type ReservaHandle = {
  download: () => Promise<void>;
  getPdfBlob: () => Promise<Blob | null>;
};

export function buildGoogleMapsUrl({
  ubicacion,
  hotelName,
  direccionFallback,
  soloHotel = false,
}: BuildMapsUrlOpts) {
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

// === Facturación: helper reutilizable ===
export function drawBillingInfoOnLastPage(
  pdf: jsPDF,
  paintFullBluePage?: (pdf: jsPDF) => void,
  mode: "full" | "credito" = "full"
) {
  // Siempre agregamos una página dedicada a facturación
  pdf.addPage();
  paintFullBluePage?.(pdf);

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

  // Título principal
  const titleText = mode === "credito" ? "FACTURACIÓN (CRÉDITO)" : "FACTURACIÓN DE RESERVACIONES";
  pdf.setFillColor(BLUE_600.r, BLUE_600.g, BLUE_600.b);
  pdf.rect(marginX, y, boxW, titleBarH, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(titleText, marginX + paddingX, y + titleBarH - 3);
  y += titleBarH + 6;

  // Aviso (omite en crédito)
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
    let contentHeight = paddingY * 2 + 6; // base
    const headingH = 6;

    // medir
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    contentHeight += headingH + 4;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    const maxWidth = boxW - paddingX * 2;
    const wrappedLines = lines.map((L) => pdf.splitTextToSize(L, maxWidth));
    wrappedLines.forEach((w) => (contentHeight += w.length * 5 + lineGap));

    // salto de página si no cabe
    if (startY + contentHeight + 10 > pageH) {
      pdf.addPage();
      paintFullBluePage?.(pdf);
      y = marginY;
    }

    // fondo
    pdf.setDrawColor(BLUE_200.r, BLUE_200.g, BLUE_200.b);
    pdf.setFillColor(BLUE_50.r, BLUE_50.g, BLUE_50.b);
    if ((pdf as any).roundedRect) {
      (pdf as any).roundedRect(marginX, y, boxW, contentHeight, 3, 3, "FD");
    } else {
      pdf.rect(marginX, y, boxW, contentHeight, "FD");
    }

    // heading
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(BLUE_900.r, BLUE_900.g, BLUE_900.b);
    pdf.text(heading, marginX + paddingX, y + paddingY + headingH);
    let cy = y + paddingY + headingH + 4;

    // líneas
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
    wrappedLines.forEach((w) => {
      pdf.text(w, marginX + paddingX, cy);
      cy += w.length * 5 + lineGap;
    });

    y += contentHeight + 8;
  };

  // Contenido base común
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

  // Modo completo (puedes reactivar TDC/Transfer si lo necesitas)
  // drawSection("PAGO CON TDC", [...comunes, "Método de pago: PUE - Pago en una sola exhibición", "Forma de pago: 04 - Tarjeta de crédito"]);
  // drawSection("PAGO CON TRANSFERENCIA", [...comunes, "Método de pago: PUE - Pago en una sola exhibición", "Forma de pago: 03 - Transferencia electrónica de fondos"]);

  drawSection("CRÉDITO", [
    ...comunes,
    "Método de pago: PPD - Pago en parcialidades o diferido",
    "Forma de pago: 99 - Por definir",
  ]);
}


export type GeneratePdfOptions = {
  // necesarios
  contentRef: React.RefObject<HTMLDivElement>;
  hotelCardRef?: React.RefObject<HTMLDivElement>;
  logos?: Record<string, { dataUrl: string; ar: number }>;
  reservationDetails?: { codigo_confirmacion?: string | number; hotel?: string | null; direccion?: string | null };

  // ubicacion / maps
  ubicacion?: UbicacionType;                    // si ya la tienes
  fetchUbicacion?: () => Promise<UbicacionType>; // o pásame una función (se usará si no das 'ubicacion')
  buildMapsUrlParams?: Partial<BuildMapsUrlOpts>; // para soloHotel, etc.
  addHotelLink?: boolean;                       // dibujar link clicable sobre la tarjeta
  linkOffsetsMm?: { x?: number; y?: number };   // ajuste fino (derecha/abajo) en mm
  linkExtraShiftPx?: { x?: number; y?: number };// ajuste fino adicional en px (antes de convertir)

  // layout/canvas
  hideSelectors?: string;      // CSS selector de elementos a ocultar antes de capturar
  addLogosOnEachPage?: boolean;
  drawLogosOnPage?: (pdf: jsPDF, logosMap: Record<string, { dataUrl: string; ar: number }>) => void;
  paintFullBluePage?: (pdf: jsPDF) => void;

  // última página
  drawPoliciesOnCurrentPage?: (pdf: jsPDF) => void;
  drawContactInfoOnCurrentPage?: (pdf: jsPDF) => void;

  // NUEVO: facturación
  addBillingPage?: boolean;                    // activar página de facturación
  billingMode?: "full" | "credito";           // modo
  drawBillingInfoOnLastPage?: (pdf: jsPDF, paintFullBluePage?: (pdf: jsPDF) => void, mode?: "full" | "credito") => void;

  // salida
  filename?: string;
  save?: boolean;
};

export async function generateReservationPdf(opts: GeneratePdfOptions): Promise<Blob | null> {
  const {
    contentRef,
    hotelCardRef,
    logos = {},
    reservationDetails,
    ubicacion,
    fetchUbicacion,
    buildMapsUrlParams,
    addHotelLink = true,
    linkOffsetsMm = { x: 39, y: 18 },
    linkExtraShiftPx = { x: 19, y: 0 },
    hideSelectors = '[data-hide-in-pdf], .no-print',
    addLogosOnEachPage = true,
    drawLogosOnPage,
    paintFullBluePage,
    drawPoliciesOnCurrentPage,
    drawContactInfoOnCurrentPage,
    // NUEVO
    addBillingPage = false,
    billingMode = "full",
    drawBillingInfoOnLastPage: drawBillingCb, // opcional (si no pasas, uso la export por defecto)
    filename = `reservacion-${reservationDetails?.codigo_confirmacion || "sin-codigo"}.pdf`,
    save = false,
  } = opts;

  const content = contentRef.current;
  if (!content) return null;

  // 1) Ubicación/URL Maps
  let ubicActual = ubicacion;
  if (!ubicActual && fetchUbicacion) {
    try {
      ubicActual = await fetchUbicacion();
    } catch {
      /* noop, seguimos con dirección */
    }
  }
  const mapsUrl = buildGoogleMapsUrl({
    ubicacion: ubicActual ?? null,
    hotelName: reservationDetails?.hotel ?? "",
    direccionFallback: reservationDetails?.direccion ?? "",
    ...buildMapsUrlParams,
  });

  // 2) Guardar estilos y ocultar elementos
  const original = {
    position: content.style.position,
    margin: content.style.margin,
    width: content.style.width,
    overflow: content.style.overflow,
    maxHeight: content.style.maxHeight,
    padding: content.style.padding,
  };

  const toHide = Array.from(content.querySelectorAll(hideSelectors)) as HTMLElement[];
  const originalDisplay = toHide.map((el) => el.style.display);

  try {
    content.style.position = "static";
    content.style.margin = "0 auto";
    content.style.width = "100%";
    content.style.overflow = "visible";
    content.style.maxHeight = "none";
    content.style.padding = content.style.padding || "20px 16px";

    toHide.forEach((el) => (el.style.display = "none"));

    await new Promise((r) => requestAnimationFrame(r));

    // 3) Medidas
    const contentRect = content.getBoundingClientRect();
    const hotelRect = hotelCardRef?.current?.getBoundingClientRect();

    // 4) Captura
    // 🔹 Reducimos escala para que el contenido HTML se vea más pequeño en el PDF
    const SCALE_FACTOR = 1.3; // prueba con 1.0, 1.3, 1.5 según el tamaño deseado
    const canvas = await html2canvas(content, {
      scale: SCALE_FACTOR, // antes usabas 2, esto lo hace más pequeño
      useCORS: true,
      backgroundColor: null,
      scrollY: 0,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      ignoreElements: (el) => el.hasAttribute?.("data-hide-in-pdf") || el.classList?.contains("no-print"),
    });


    const imgData = canvas.toDataURL("image/png");

    // 5) PDF base
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWmm = pdf.internal.pageSize.getWidth();
    const pageHmm = pdf.internal.pageSize.getHeight();

    const imgWmm = pageWmm;
    const imgHmm = (canvas.height * imgWmm) / canvas.width;

    // Página 1
    paintFullBluePage?.(pdf);
    pdf.addImage(imgData, "PNG", 0, 0, imgWmm, imgHmm);
    if (addLogosOnEachPage && drawLogosOnPage) drawLogosOnPage(pdf, logos);

    // Paginado
    let heightLeft = imgHmm - pageHmm;
    let position = 0;
    while (heightLeft > 0) {
      pdf.addPage();
      paintFullBluePage?.(pdf);
      position = heightLeft - imgHmm; // negativo
      pdf.addImage(imgData, "PNG", 0, position, imgWmm, imgHmm);
      if (addLogosOnEachPage && drawLogosOnPage) drawLogosOnPage(pdf, logos);
      heightLeft -= pageHmm;
    }

    // 6) Link sobre la tarjeta del hotel
    if (addHotelLink && hotelRect && mapsUrl) {
      // Relativo al contenedor
      const relXpx = (hotelRect.left - contentRect.left) + (linkExtraShiftPx.x || 0);
      const relYpx = (hotelRect.top - contentRect.top) + (linkExtraShiftPx.y || 0);
      const wpx = hotelRect.width;
      const hpx = hotelRect.height;

      const mmPerPxX = imgWmm / canvas.width;
      const mmPerPxY = imgHmm / canvas.height;

      let xmm_total = relXpx * mmPerPxX + (linkOffsetsMm.x || 0);
      let ymm_total = relYpx * mmPerPxY + (linkOffsetsMm.y || 0);
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

    // 7) Última página: políticas + contacto (si te pasaron las funciones)
    const total = (pdf as any).getNumberOfPages
      ? (pdf as any).getNumberOfPages()
      : pdf.getNumberOfPages?.();
    if (total && total > 0 && (drawPoliciesOnCurrentPage || drawContactInfoOnCurrentPage)) {
      pdf.setPage(total);
      drawPoliciesOnCurrentPage?.(pdf);
      drawContactInfoOnCurrentPage?.(pdf);
      // 8) (NUEVO) Página de Facturación
      if (addBillingPage) {
        const useBilling = drawBillingCb ?? drawBillingInfoOnLastPage; // usa el pasado o el helper exportado
        useBilling?.(pdf, paintFullBluePage, billingMode);
      }
    }

    if (save) pdf.save(filename);
    return pdf.output("blob") as Blob;
  } catch (err) {
    console.error("Error generando PDF:", err);
    alert("No se pudo generar el PDF. Revisa la consola para más detalles.");
    return null;
  } finally {
    // 8) Restaurar estilos
    content.style.position = original.position;
    content.style.margin = original.margin;
    content.style.width = original.width;
    content.style.overflow = original.overflow;
    content.style.maxHeight = original.maxHeight;
    content.style.padding = original.padding;

    toHide.forEach((el, i) => (el.style.display = originalDisplay[i] || ""));
  }
}
