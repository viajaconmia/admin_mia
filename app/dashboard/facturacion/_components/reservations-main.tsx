"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { fetchEmpresasDatosFiscales } from "@/hooks/useFetch";
import {
  formatDate,
  subirArchivoAS3,
  obtenerPresignedUrl,
} from "@/helpers/utils";
import { URL, API_KEY } from "@/lib/constants/index";
import useApi from "@/hooks/useApi";
import { DescargaFactura, Root } from "@/types/billing";
import { Download } from "lucide-react";
import { formatMoneyMXN, withCommas } from "@/helpers/formater";
import { useNotification } from "@/context/useNotificacion";
import { se } from "date-fns/locale";
import { currentDate } from "@/lib/utils";

// --- Helpers de descarga robusta ---
const normalizeBase64 = (b64?: string | null) => {
  if (!b64) return "";
  const clean = b64
    .split("base64,")
    .pop()!
    .replace(/[\r\n\s]/g, "");
  return clean.replace(/-/g, "+").replace(/_/g, "/");
};

// --- Subida segura a S3 con URL pre-firmada ---
const subirArchivoAS3Seguro = async (
  file: File,
  bucket: string = "comprobantes",
) => {
  try {
    console.log(`Iniciando subida de ${file.name} (${file.type})`);

    const { url: presignedUrl, publicUrl } = await obtenerPresignedUrl(
      file.name,
      file.type,
      bucket,
    );

    console.log(`URL pre-firmada obtenida para ${file.name}`);

    await subirArchivoAS3(file, presignedUrl);

    console.log(
      `✅ Archivo ${file.name} subido exitosamente a S3: ${publicUrl}`,
    );

    return publicUrl;
  } catch (error: any) {
    console.error(`❌ Error al subir ${file.name} a S3:`, error);
    throw new Error(`Error al subir ${file.name} a S3: ${error.message}`);
  }
};

const base64ToBlob = (b64: string, mime: string) => {
  const clean = normalizeBase64(b64);
  const byteChars = atob(clean);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++)
    byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const downloadBase64File = (b64: string, mime: string, filename: string) => {
  const blob = base64ToBlob(b64, mime);
  downloadBlob(blob, filename);
};

// Permite distintas formas de respuesta del backend
const getPdfBase64 = (d: any) =>
  d?.PdfBase64 ??
  d?.pdfBase64 ??
  d?.pdf ??
  (d?.FileExtension === "pdf" ? d?.Content : null);

const getXmlBase64 = (d: any) =>
  d?.XmlBase64 ??
  d?.xmlBase64 ??
  d?.xml ??
  (d?.FileExtension === "xml" ? d?.Content : null);

const maybeDownloadByUrl = (
  urlOrBase64: string,
  _fallbackMime: string,
  filename: string,
) => {
  if (/^https?:\/\//i.test(urlOrBase64)) {
    const a = document.createElement("a");
    a.href = urlOrBase64;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }
  return false;
};

// Opciones (deja las tuyas completas si ya están)
const cfdiUseOptions = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I01", label: "I01 - Construcciones" },
  {
    value: "I02",
    label: "I02 - Mobilario y equipo de oficina por inversiones",
  },
  { value: "I03", label: "I03 - Equipo de transporte" },
  { value: "I04", label: "I04 - Equipo de cómputo y accesorios" },
  {
    value: "I05",
    label: "I05 - Dados, troqueles, moldes, matrices y herramental",
  },
  { value: "I06", label: "I06 - Comunicaciones telefónicas" },
  { value: "I07", label: "I07 - Comunicaciones satelitales" },
  { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  {
    value: "D01",
    label: "D01 - Honorarios médicos, dentales y gastos hospitalarios",
  },
  {
    value: "D02",
    label: "D02 - Gastos médicos por incapacidad o discapacidad",
  },
  { value: "D03", label: "D03 - Gastos funerales" },
  { value: "D04", label: "D04 - Donativos" },
  {
    value: "D05",
    label:
      "D05 - Intereses reales efectivamente pagados por créditos hipotecarios",
  },
  { value: "D06", label: "D06 - Aportaciones voluntarias al SAR" },
  { value: "D07", label: "D07 - Primas por seguros de gastos médicos" },
  { value: "D08", label: "D08 - Gastos de transportación escolar obligatoria" },
  { value: "D09", label: "D09 - Depósitos en cuentas para el ahorro" },
  { value: "D10", label: "D10 - Pagos por servicios educativos" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
  { value: "CP01", label: "CP01 - Pagos" },
  { value: "CN01", label: "CN01 - Nómina" },
];

const paymentFormOptions = [
  { value: "01", label: "01 - Efectivo" },
  { value: "02", label: "02 - Cheque nominativo" },
  { value: "03", label: "03 - Transferencia electrónica de fondos" },
  { value: "04", label: "04 - Tarjeta de crédito" },
  { value: "05", label: "05 - Monedero electrónico" },
  { value: "06", label: "06 - Dinero electrónico" },
  { value: "08", label: "08 - Vales de despensa" },
  { value: "12", label: "12 - Dación en pago" },
  { value: "13", label: "13 - Pago por subrogación" },
  { value: "14", label: "14 - Pago por consignación" },
  { value: "15", label: "15 - Condonación" },
  { value: "17", label: "17 - Compensación" },
  { value: "23", label: "23 - Novación" },
  { value: "24", label: "24 - Confusión" },
  { value: "25", label: "25 - Remisión de deuda" },
  { value: "26", label: "26 - Prescripción o caducidad" },
  { value: "27", label: "27 - A satisfacción del acreedor" },
  { value: "28", label: "28 - Tarjeta de débito" },
  { value: "29", label: "29 - Tarjeta de servicios" },
  { value: "30", label: "30 - Aplicación de anticipos" },
  { value: "31", label: "31 - Intermediario pagos" },
  { value: "99", label: "99 - Por definir" },
];

const paymentMethodOptions = [
  { value: "PUE", label: "PUE - Pago en una sola exhibición" },
  { value: "PPD", label: "PPD - Pago en parcialidades o diferido" },
];

// Types
interface Reservation {
  id_servicio: string;
  created_at: string;
  is_credito: boolean | null;
  id_solicitud: string;
  confirmation_code: string;
  nombre: string;
  hotel: string;
  check_in: string;
  check_out: string;
  room: string;
  total: string;
  id_usuario_generador: string;
  id_booking: string | null;
  codigo_reservacion_hotel: string | null;
  id_pago: string;
  pendiente_por_cobrar: number;
  monto_a_credito: string;
  id_factura: string | null;
  primer_nombre: string | null;
  apellido_paterno: string | null;
  items?: Item[];
  nombre_viajero_completo?: string | null;
  razon_social?: string;
  costo_total?: string;
  id_hospedaje?: string | null;
  tipo_cuarto?: string | null;
  nombre_viajero?: string;
}

interface FiscalData {
  id_empresa: string;
  id_datos_fiscales: number;
  rfc: string;
  razon_social_df: string;
  calle: string;
  colonia: string;
  estado: string;
  municipio: string;
  codigo_postal_fiscal: string;
  regimen_fiscal: string;
  id_agente?: string; // por tu hardcode de amparo
}

interface Item {
  id_item: string;
  id_catalogo_item: string | null;
  id_factura: string | null;
  total: string;
  subtotal: string;
  impuestos: string;
  is_facturado: boolean | null;
  fecha_uso: string;
  id_hospedaje: string;
  created_at: string;
  updated_at: string;
  costo_total: string;
  costo_subtotal: string;
  costo_impuestos: string;
  saldo: string;
  costo_iva: string;
  id_booking?: string;
  id_hotel?: string;
  nombre_hotel?: string;
  codigo_reservacion_hotel?: string;
  tipo_cuarto?: string;
  noches?: string;
}

interface ReservationWithItems extends Reservation {
  items: Item[];
  nightsCount?: number;
}

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "all";

// ✅ Nuevo: asignar URLs a la factura en tu backend
const asignarURLS_factura = async (
  id_factura: string,
  url_pdf: string,
  url_xml: string,
) => {
  const resp = await fetch(
    `${URL}/mia/factura/asignarURLS_factura?id_factura=${encodeURIComponent(
      id_factura,
    )}&url_pdf=${encodeURIComponent(url_pdf)}&url_xml=${encodeURIComponent(url_xml)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    },
  );

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => null);
    throw new Error(errorData?.message || "Error al asignar URLs de factura");
  }

  return resp.json();
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// === PRE-FLIGHT (control de totales) ===
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: any) => Number.parseFloat(String(v ?? 0)) || 0;

const preflightCfdi = (
  cfdiItems: any[],
  itemsFacturadosFull: any[],
  showNotification: (type: any, message: string) => void,
) => {
  const errs: string[] = [];
  const sum = (arr: any[], pick: (x: any) => number) =>
    r2(arr.reduce((s, x) => s + pick(x), 0));

  const totalSelected = sum(itemsFacturadosFull, (x) => num(x.total));
  const totalCfdi = sum(cfdiItems, (x) => num(x.Total));
  const subtotalCfdi = sum(cfdiItems, (x) => num(x.Subtotal));
  const taxCfdi = sum(cfdiItems, (x) =>
    sum(x?.Taxes ?? [], (t: any) => num(t.Total)),
  );

  if (Math.abs(totalSelected - totalCfdi) > 0.01) {
    errs.push(
      `Total seleccionado (${totalSelected.toFixed(2)}) != Total CFDI (${totalCfdi.toFixed(2)})`,
    );
  }

  if (Math.abs(r2(subtotalCfdi + taxCfdi) - totalCfdi) > 0.01) {
    errs.push(
      `Global: Subtotal(${subtotalCfdi.toFixed(2)}) + IVA(${taxCfdi.toFixed(2)}) != Total(${totalCfdi.toFixed(2)})`,
    );
  }

  cfdiItems.forEach((it, idx) => {
    const sub = r2(num(it.Subtotal));
    const total = r2(num(it.Total));
    const taxes = it?.Taxes ?? [];
    const taxSum = r2(taxes.reduce((s: number, t: any) => s + num(t.Total), 0));
    const expectedTotal = r2(sub + taxSum);

    if (Math.abs(expectedTotal - total) > 0.01) {
      errs.push(
        `Item#${idx + 1}: Subtotal(${sub.toFixed(2)}) + IVA(${taxSum.toFixed(
          2,
        )}) != Total(${total.toFixed(2)})`,
      );
    }

    taxes.forEach((t: any) => {
      const base = r2(num(t.Base));
      const rate = Number.parseFloat(String(t.Rate ?? 0));
      const tax = r2(num(t.Total));
      const expectedTax = r2(base * rate);

      if (Math.abs(expectedTax - tax) > 0.01) {
        errs.push(
          `Item#${idx + 1} TAX: Base(${base.toFixed(
            2,
          )})*Rate(${rate})=${expectedTax.toFixed(2)} != Tax(${tax.toFixed(2)})`,
        );
      }
    });
  });

  if (errs.length) {
    console.error("❌ PRE-FLIGHT CFDI FAIL", { errs, cfdiItems });
    showNotification("error", "Totales no coinciden:\n- " + errs.join("\n- "));
    return false;
  }

  console.log("✅ PRE-FLIGHT CFDI OK", {
    totalSelected,
    subtotalCfdi,
    taxCfdi,
    totalCfdi,
  });
  return true;
};

export const FacturacionModal: React.FC<{
  selectedItems: { [reservationId: string]: string[] };
  selectedHospedaje: { [hospedajeId: string]: string[] };
  reservationsInit: Reservation[];
  onClose: () => void;
  onConfirm: (fiscalData: FiscalData, isConsolidated: boolean) => void;
}> = ({
  selectedItems,
  selectedHospedaje,
  reservationsInit,
  onClose,
  onConfirm,
}) => {
  const { showNotification } = useNotification();
  const { crearCfdi, descargarFactura } = useApi();

  // =========================
  // IVA switch (default 16)
  // =========================
  const IVA_16 = 0.16 as const;
  const IVA_8 = 0.08 as const;
  type IvaRate = typeof IVA_16 | typeof IVA_8;
  const EXPEDITION_PLACE_8P = "32460";
  const EXPEDITION_PLACE_16P = "11560";
  const [ivaRate, setIvaRate] = useState<IvaRate>(IVA_16);

  const expeditionPlace = useMemo(
    () => (ivaRate === IVA_8 ? EXPEDITION_PLACE_8P : EXPEDITION_PLACE_16P),
    [ivaRate],
  );

  const ivaFactor = useMemo(() => 1 + ivaRate, [ivaRate]);
  const ivaRateStr = useMemo(() => ivaRate.toFixed(6), [ivaRate]);

  // Cambia la función splitIva para que use el ivaFactor correctamente
  const splitIva = useCallback(
    (total: number) => {
      const t = round2(Number(total) || 0);
      const subtotal = round2(t / ivaFactor);
      const iva = round2(t - subtotal);
      return { subtotal, iva, total: t };
    },
    [ivaFactor],
  );

  const [selectedDescription, setSelectedDescription] = useState<string>(
    paymentDescriptions[0],
  );
  const now = new Date();
  const [omitObservations, setOmitObservations] = useState(false);
  const [periodicity, setPeriodicity] = useState("04");
  const [month, setMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState(String(now.getFullYear()));
  const [fiscalDataList, setFiscalDataList] = useState<FiscalData[]>([]);
  const [selectedFiscalData, setSelectedFiscalData] =
    useState<FiscalData | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCfdiUse, setSelectedCfdiUse] = useState("G03");
  const [selectedPaymentForm, setSelectedPaymentForm] = useState("03");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("PUE");

  const [descarga, setDescarga] = useState<DescargaFactura | null>(null);
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState<Root | null>(
    null,
  );

  const [isConsolidated, setIsConsolidated] = useState(true);
  const [reservationsWithSelectedItems, setReservationsWithSelectedItems] =
    useState<ReservationWithItems[]>([]);

  // --- Helpers fecha de vencimiento ---
  const addDays = (d: Date, days: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  };
  const toInputDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [dueDate, setDueDate] = useState<string>(() =>
    toInputDate(addDays(new Date(), 30)),
  );
  const minDueDate = toInputDate(new Date());

  // Estado para el CFDI (preview / base)
  const [cfdi, setCfdi] = useState({
    Receiver: {
      Name: "",
      CfdiUse: "",
      Rfc: "",
      FiscalRegime: "",
      TaxZipCode: "",
    },
    CfdiType: "I",
    NameId: "1",
    Observations: "",
    //ExpeditionPlace: "42501",
    ExpeditionPlace: EXPEDITION_PLACE_16P,
    Serie: null as any,
    Folio: Math.round(Math.random() * 999999999),
    PaymentForm: selectedPaymentForm,
    PaymentMethod: selectedPaymentMethod,
    Exportation: "01",
    Items: [] as any[],
  });

  // Sanitizador Facturama
  const [customDescription, setCustomDescription] = useState("");
  const sanitizeFacturamaText = (s: string, max = 1000) =>
    (s ?? "")
      .toString()
      .replace(/\|/g, " - ")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, max);

  // Generar descripción por defecto
  const defaultDescription = `${reservationsWithSelectedItems
    .map((reserva) => `${reserva.hotel} - ${formatDate(reserva.check_in)}`)
    .join(" | ")}`;

  const isCustomValid =
    customDescription && /[a-zA-Z0-9\S]/.test(customDescription.trim());
  const descriptionToUse = isCustomValid
    ? customDescription
    : defaultDescription;

  const handleCopyObservations = async () => {
    const text = sanitizeFacturamaText(descriptionToUse, 1000);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      showNotification("success", "Observación copiada ✅");
    } catch (e) {
      console.error("Error al copiar:", e);
      showNotification("error", "No se pudo copiar la observación ❌");
    }
  };

  // Reservas (para UI) – recalcula cuando cambia IVA para que no quede “viejo”
  const [reservations, setReservations] = useState(() =>
    reservationsInit
      .filter((reserva) => reserva.items != null)
      .map((reserva) => ({
        ...reserva,
        items: (reserva.items ?? []).map((item) => {
          const total = Number(item.total);
          const { subtotal, iva } = splitIva(total);
          return {
            ...item,
            subtotal: subtotal.toFixed(2),
            impuestos: iva.toFixed(2),
          };
        }),
      })),
  );

  useEffect(() => {
    setReservations(
      reservationsInit
        .filter((reserva) => reserva.items != null)
        .map((reserva) => ({
          ...reserva,
          items: (reserva.items ?? []).map((item) => {
            const total = Number(item.total);
            const { subtotal, iva } = splitIva(total);
            return {
              ...item,
              subtotal: subtotal.toFixed(2),
              impuestos: iva.toFixed(2),
            };
          }),
        })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ivaRate, reservationsInit]);

  // HARD CODE AMPARO
  useEffect(() => {
    if (
      fiscalDataList.some(
        (empresa) =>
          empresa?.id_agente == "11e1a5c7-1d44-485e-99a2-7fdf674058f3",
      )
    ) {
      showNotification(
        "error",
        "Se detecto al cliente amparo, cambiaremos el servicio",
      );
      setSelectedDescription(paymentDescriptions[1]);
    }
  }, [fiscalDataList, showNotification]);

  // Preparar los datos seleccionados + cargar fiscales
  useEffect(() => {
    if (reservations.length > 0 && Object.keys(selectedItems).length > 0) {
      const preparedReservations = reservations
        .filter((reserva) => selectedItems[reserva.id_servicio]?.length > 0)
        .map((reserva) => {
          const selectedItemIds = selectedItems[reserva.id_servicio] || [];
          const items = Array.isArray(reserva.items)
            ? reserva.items.filter((item) =>
                selectedItemIds.includes(item.id_item),
              )
            : [];

          return {
            ...reserva,
            items,
            nightsCount: items.length,
          };
        });

      setReservationsWithSelectedItems(preparedReservations);

      if (
        fiscalDataList.length === 0 &&
        preparedReservations[0]?.id_usuario_generador
      ) {
        (async () => {
          try {
            setLoading(true);
            const data = await fetchEmpresasDatosFiscales(
              preparedReservations[0].id_usuario_generador,
            );
            setFiscalDataList(data);
            if (data.length > 0) setSelectedFiscalData(data[0]);
          } catch (err) {
            setError("Error al cargar los datos fiscales");
            console.error("Error fetching fiscal data:", err);
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [selectedItems, reservations, fiscalDataList.length]);

  useEffect(() => {
    setCfdi((prev) => ({
      ...prev,
      ExpeditionPlace: expeditionPlace,
    }));
  }, [expeditionPlace]);

  // Totales seleccionados (total con IVA incluido, porque viene de item.total)
  const totalAmount = reservationsWithSelectedItems.reduce(
    (sum, reserva) =>
      sum +
      (reserva.items?.reduce(
        (itemSum, item) => itemSum + parseFloat(item.total),
        0,
      ) || 0),
    0,
  );

  const {
    subtotal: previewSubtotal,
    iva: previewIva,
    total: previewTotal,
  } = splitIva(totalAmount);

  // Actualizar CFDI preview (IMPORTANT: ya no hardcodea 1.16 / 0.16)
  useEffect(() => {
    if (!selectedFiscalData || reservationsWithSelectedItems.length === 0)
      return;

    if (isConsolidated) {
      const { subtotal, iva, total } = splitIva(totalAmount);

      setCfdi((prev) => ({
        ...prev,
        Receiver: {
          Name: selectedFiscalData.razon_social_df,
          CfdiUse: selectedCfdiUse,
          Rfc: selectedFiscalData.rfc,
          FiscalRegime: selectedFiscalData.regimen_fiscal || "612",
          TaxZipCode: selectedFiscalData.codigo_postal_fiscal,
        },
        PaymentForm: selectedPaymentForm,
        PaymentMethod: selectedPaymentMethod,
        Items: [
          {
            Quantity: "1",
            ProductCode: "90111500",
            UnitCode: "E48",
            Unit: "Unidad de servicio",
            Description: selectedDescription,
            UnitPrice: subtotal.toFixed(2),
            Subtotal: subtotal.toFixed(2),
            TaxObject: "02",
            Taxes: [
              {
                Name: "IVA",
                Rate: ivaRateStr,
                Total: iva.toFixed(2),
                Base: subtotal.toFixed(2),
                IsRetention: "false",
                IsFederalTax: "true",
              },
            ],
            Total: total.toFixed(2),
          },
        ],
        Observations: omitObservations
          ? ""
          : sanitizeFacturamaText(descriptionToUse),
      }));
      return;
    }

    // Detallada preview por reserva (1 concepto por reserva con suma EXACTA de items seleccionados)
    setCfdi((prev) => ({
      ...prev,
      ExpeditionPlace: expeditionPlace,
      Receiver: {
        Name: selectedFiscalData.razon_social_df,
        CfdiUse: selectedCfdiUse,
        Rfc: selectedFiscalData.rfc,
        FiscalRegime: selectedFiscalData.regimen_fiscal,
        TaxZipCode: selectedFiscalData.codigo_postal_fiscal,
      },
      PaymentForm: selectedPaymentForm,
      PaymentMethod: selectedPaymentMethod,
      Items: reservationsWithSelectedItems
        .map((reserva) => {
          const ids = selectedItems[reserva.id_servicio] ?? [];
          const itemsSel = (reserva.items ?? []).filter((it) =>
            ids.includes(it.id_item),
          );
          if (!itemsSel.length) return null;

          const totalSel = round2(
            itemsSel.reduce((s, it) => s + Number(it.total), 0),
          );
          const { subtotal, iva, total } = splitIva(totalSel);

          return {
            Quantity: "1",
            ProductCode: "90121500",
            UnitCode: "E48",
            Unit: "Unidad de servicio",
            Description: selectedDescription,
            UnitPrice: subtotal.toFixed(2),
            Subtotal: subtotal.toFixed(2),
            TaxObject: "02",
            Taxes: [
              {
                Name: "IVA",
                Rate: ivaRateStr,
                Total: iva.toFixed(2),
                Base: subtotal.toFixed(2),
                IsRetention: "false",
                IsFederalTax: "true",
              },
            ],
            Total: total.toFixed(2),
          };
        })
        .filter(Boolean),
      Observations: omitObservations
        ? ""
        : sanitizeFacturamaText(descriptionToUse),
    }));
  }, [
    selectedFiscalData,
    selectedCfdiUse,
    selectedPaymentForm,
    selectedPaymentMethod,
    reservationsWithSelectedItems,
    isConsolidated,
    omitObservations,
    ivaRate,
    ivaRateStr,
    totalAmount,
    selectedDescription,
    descriptionToUse,
    expeditionPlace,
  ]);

  const validateInvoiceData = () => {
    if (reservationsWithSelectedItems.length === 0) {
      showNotification("error", "No hay items seleccionados para facturar");
      return false;
    }

    const missingFields: string[] = [];
    if (!cfdi.Receiver.Rfc) missingFields.push("RFC del receptor");
    if (!cfdi.Receiver.TaxZipCode)
      missingFields.push("código postal del receptor");
    if (!selectedCfdiUse) missingFields.push("uso CFDI");
    if (!selectedPaymentForm) missingFields.push("forma de pago");

    if (missingFields.length > 0) {
      showNotification(
        "error",
        `Faltan los siguientes campos: ${missingFields.join(", ")}`,
      );
      return false;
    }

    return true;
  };

  // --------- helpers para modos ----------
  type ItemFull = {
    id_item: string;
    id_servicio: string;
    id_hospedaje: string | null;
    total: number;
    subtotal: number;
    iva: number;
    id_solicitud: string;
    id_usuario_generador: string;
    reserva?: {
      hotel?: string;
      check_in?: string;
      check_out?: string;
      nombre_viajero?: string | null;
    };
  };

  const groupByHospedaje = (items: ItemFull[]) => {
    const map = new Map<string, ItemFull[]>();
    for (const it of items) {
      const key = it.id_hospedaje ?? `servicio:${it.id_servicio}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }

    return Array.from(map.entries()).map(([key, arr]) => ({
      key,
      id_hospedaje: arr[0]?.id_hospedaje ?? null,
      items: arr,
      total: arr.reduce((s, x) => s + Number(x.total || 0), 0),
      hotel: arr.find((x) => x.reserva?.hotel)?.reserva?.hotel ?? "",
      check_in: arr.find((x) => x.reserva?.check_in)?.reserva?.check_in ?? "",
      check_out:
        arr.find((x) => x.reserva?.check_out)?.reserva?.check_out ?? "",
    }));
  };

  const getSelectedItemsFull = (
    reservationsSel: ReservationWithItems[],
    selected: Record<string, string[]>,
    selectedHosp?: Record<string, string[]>,
  ): ItemFull[] => {
    return reservationsSel.flatMap((r) => {
      const ids = selected[r.id_servicio] ?? [];
      if (!ids.length) return [];

      const id_hospedaje =
        selectedHosp?.[r.id_servicio]?.[0] ?? r.id_hospedaje ?? null;

      return (r.items ?? [])
        .filter((it) => ids.includes(it.id_item))
        .map((it) => {
          const total = Number(it.total);
          const { subtotal, iva } = splitIva(total);

          return {
            id_item: it.id_item,
            id_servicio: r.id_servicio,
            id_hospedaje,
            id_solicitud: r.id_solicitud,
            id_usuario_generador: r.id_usuario_generador,
            total,
            subtotal,
            iva,
            reserva: {
              hotel: r.hotel,
              check_in: r.check_in,
              check_out: r.check_out,
              nombre_viajero:
                r.nombre_viajero_completo ?? r.nombre_viajero ?? null,
            },
          };
        });
    });
  };

  type InvoiceMode =
    | "consolidada"
    | "detallada_por_hospedaje"
    | "detallada_por_item";

  const buildAddenda = () => {
    const reservas = reservationsWithSelectedItems.map((r) => {
      const ids = selectedItems[r.id_servicio] ?? [];
      const itemsSel = (r.items ?? []).filter((it) => ids.includes(it.id_item));

      const total = round2(itemsSel.reduce((s, it) => s + Number(it.total), 0));
      const { subtotal, iva } = splitIva(total);

      return {
        id_servicio: r.id_servicio,
        id_solicitud: r.id_solicitud,
        confirmation_code: r.confirmation_code,
        hotel: r.hotel,
        check_in: r.check_in,
        check_out: r.check_out,
        viajero: r.nombre_viajero_completo,
        noches: itemsSel.length,
        items: itemsSel.map((it) => {
          const t = Number(it.total);
          const { subtotal: sub, iva: tax } = splitIva(t);
          return {
            id_item: it.id_item,
            fecha_uso: it.fecha_uso,
            total: t,
            subtotal: sub,
            iva: tax,
            tipo_cuarto: it.tipo_cuarto,
            codigo_reservacion_hotel: it.codigo_reservacion_hotel,
          };
        }),
        totales: { subtotal, iva, total },
      };
    });

    const total = round2(reservas.reduce((s, r) => s + r.totales.total, 0));
    const subtotal = round2(
      reservas.reduce((s, r) => s + r.totales.subtotal, 0),
    );
    const iva = round2(reservas.reduce((s, r) => s + r.totales.iva, 0));

    return {
      version: "1.0",
      source: "Noktos",
      generated_at: new Date().toISOString(),
      due_date: dueDate,
      cfdi_observations: descriptionToUse,
      iva_rate: ivaRateStr,
      reservas,
      totales_globales: { subtotal, iva, total },
    };
  };
  useEffect(() => {
    console.log("IVA:", ivaRateStr, "ExpeditionPlace:", expeditionPlace);
  }, [ivaRateStr, expeditionPlace]);

  const handleConfirm = async (mode: InvoiceMode) => {
    if (!selectedFiscalData) {
      setError("Debes seleccionar unos datos fiscales");
      return;
    }
    if (!validateInvoiceData()) return;

    const modeIsConsolidated = mode === "consolidada";
    setIsConsolidated(modeIsConsolidated);

    try {
      setLoading(true);

      const now = new Date();
      now.setHours(now.getHours() - 6);
      const formattedDate = now.toISOString().split(".")[0];

      // 1) Addenda
      const addendaObj = buildAddenda();
      const addendaStr = JSON.stringify(addendaObj);

      // 2) Items FULL
      const itemsFacturadosFull = getSelectedItemsFull(
        reservationsWithSelectedItems,
        selectedItems,
        selectedHospedaje,
      );

      if (!itemsFacturadosFull.length) {
        showNotification("error", "No hay items seleccionados para facturar");
        return;
      }

      const itemsFacturados = itemsFacturadosFull.map((x) => ({
        id_item: x.id_item,
        monto: x.total,
        id_servicio: x.id_servicio,
        id_hospedaje: x.id_hospedaje,
      }));

      // 3) CFDI Items (IMPORTANT: usa splitIva, no splitIva16)
      const cfdiItems = (() => {
        const QTY_ONE = "1";

        if (mode === "consolidada") {
          const totalFacturado = round2(
            itemsFacturadosFull.reduce((s, it) => s + it.total, 0),
          );
          const { subtotal, iva, total } = splitIva(totalFacturado);

          return [
            {
              Quantity: QTY_ONE,
              ProductCode: "90121500",
              UnitCode: "E48",
              Unit: "Unidad de servicio",
              Description: selectedDescription,
              UnitPrice: subtotal.toFixed(2),
              Subtotal: subtotal.toFixed(2),
              TaxObject: "02",
              Taxes: [
                {
                  Name: "IVA",
                  Rate: ivaRateStr,
                  Total: iva.toFixed(2),
                  Base: subtotal.toFixed(2),
                  IsRetention: "false",
                  IsFederalTax: "true",
                },
              ],
              Total: total.toFixed(2),
            },
          ];
        }

        if (mode === "detallada_por_hospedaje") {
          const groups = groupByHospedaje(itemsFacturadosFull);

          return groups.map((g) => {
            const { subtotal, iva, total } = splitIva(round2(g.total));

            const descRaw = [
              selectedDescription,
              g.hotel ? `${g.hotel}` : "",
              g.check_in && g.check_out
                ? `${formatDate(g.check_in)} - ${formatDate(g.check_out)}`
                : "",
              g.items?.[0]?.reserva?.nombre_viajero ?? "",
            ]
              .filter(Boolean)
              .join(" - ");

            const desc = sanitizeFacturamaText(descRaw, 1000);

            return {
              Quantity: QTY_ONE,
              ProductCode: "90121500",
              UnitCode: "E48",
              Unit: "Unidad de servicio",
              Description: desc,
              UnitPrice: subtotal.toFixed(2),
              Subtotal: subtotal.toFixed(2),
              TaxObject: "02",
              Taxes: [
                {
                  Name: "IVA",
                  Rate: ivaRateStr,
                  Total: iva.toFixed(2),
                  Base: subtotal.toFixed(2),
                  IsRetention: "false",
                  IsFederalTax: "true",
                },
              ],
              Total: total.toFixed(2),
            };
          });
        }

        // detallada_por_item
        return itemsFacturadosFull.map((it) => {
          const { subtotal, iva, total } = splitIva(round2(it.total));

          const descRaw = [
            selectedDescription,
            it?.reserva?.hotel ?? "",
            it?.reserva?.check_in && it?.reserva?.check_out
              ? `${formatDate(it.reserva.check_in)} - ${formatDate(it.reserva.check_out)}`
              : "",
            it?.reserva?.nombre_viajero ?? "",
          ]
            .filter(Boolean)
            .join(" - ");

          const desc = sanitizeFacturamaText(descRaw, 1000);

          return {
            Quantity: "1",
            ProductCode: "90121500",
            UnitCode: "E48",
            Unit: "Unidad de servicio",
            Description: desc,
            UnitPrice: subtotal.toFixed(2),
            Subtotal: subtotal.toFixed(2),
            TaxObject: "02",
            Taxes: [
              {
                Name: "IVA",
                Rate: ivaRateStr,
                Total: iva.toFixed(2),
                Base: subtotal.toFixed(2),
                IsRetention: "false",
                IsFederalTax: "true",
              },
            ],
            Total: total.toFixed(2),
          };
        });
      })();

      // ✅ PRE-FLIGHT: si no coincide, NO mandes a Facturama
      if (!preflightCfdi(cfdiItems, itemsFacturadosFull, showNotification)) {
        return;
      }

      // 4) payloadCFDI
      const payloadCFDI = {
        cfdi: {
          ...cfdi,
          ExpeditionPlace: expeditionPlace, // ✅ garantizado
          Receiver: {
            ...cfdi.Receiver,
            CfdiUse: selectedCfdiUse,
          },
          PaymentForm: selectedPaymentForm,
          PaymentMethod: selectedPaymentMethod,
          Currency: "MXN",
          Date: formattedDate,
          OrderNumber: Math.round(Math.random() * 999999999).toString(),
          Observations: omitObservations
            ? ""
            : sanitizeFacturamaText(descriptionToUse),
          Items: cfdiItems,
        },
        info_user: {
          fecha_vencimiento: dueDate,
          id_user: reservationsWithSelectedItems[0].id_usuario_generador,
          id_solicitud: reservationsWithSelectedItems.map(
            (r) => r.id_solicitud,
          ),
          id_items: itemsFacturadosFull.map((x: any) => x.id_item),
          datos_empresa: {
            rfc: cfdi.Receiver.Rfc,
            id_empresa: selectedFiscalData.id_empresa,
          },
          items_facturados: itemsFacturados,
          items_facturados_full: itemsFacturadosFull,
          addenda: addendaStr,
          addenda_type: "Noktos",
          invoice_mode: mode,
          iva_rate: ivaRateStr,
        },
        items_facturados: itemsFacturados,
      };
      if (selectedFiscalData.rfc == RFC_GENERICO) {
        payloadCFDI.cfdi.GlobalInformation = {
          Periodicity: periodicity,
          Months: month,
          Year: year,
        };
      }

      console.log("📦 payloadCFDI (preview):", payloadCFDI);

      // 5) Ejecutar
      const response = await crearCfdi(payloadCFDI.cfdi, payloadCFDI.info_user);
      if ((response as any)?.error) throw new Error((response as any).error);

      setIsInvoiceGenerated(response);

      const factura = await descargarFactura((response as any).Id);
      setDescarga(factura);

      showNotification("success", "Se ha generado con éxito la factura");
      onConfirm(selectedFiscalData, modeIsConsolidated);
    } catch (error: any) {
      console.error(error);
      showNotification(
        "error",
        "Ocurrió un error al generar la factura: " + error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const totalNights = reservationsWithSelectedItems.reduce(
    (sum, reserva) => sum + (reserva.nightsCount || 0),
    0,
  );

  useEffect(() => {
    console.log(selectedFiscalData);
  }, [selectedFiscalData]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Facturar Items de Reservaciones
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Cerrar</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Vista previa */}
          <div className="mb-6 border rounded-md p-4 bg-gray-50">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Vista previa de factura (
              {isConsolidated ? "Consolidada" : "Detallada"})
            </h4>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                      Cantidad
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                      Unidad
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                      Concepto(s)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                      Precio U
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                      Importe
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isConsolidated ? (
                    <tr>
                      <td className="px-3 py-2 text-sm border-b">90121500</td>
                      <td className="px-3 py-2 text-sm border-b">1</td>
                      <td className="px-3 py-2 text-sm border-b">
                        E48<p>Unidad de servicio</p>
                      </td>
                      <td className="px-3 py-2 text-sm border-b">
                        <div>
                          <p className="text-gray-600">
                            HOSPEDAJE - {totalNights} NOCHES(S) EN{" "}
                            {reservationsWithSelectedItems.length} RESERVAS(S)
                          </p>
                          <p className="text-gray-600">
                            02 - Con objeto de impuesto
                          </p>
                          <p className="text-gray-600">
                            Traslados:
                            <br />
                            IVA: 002, Base: $
                            {withCommas(previewSubtotal.toFixed(2))}, Tasa:{" "}
                            {ivaRateStr}, Importe: $
                            {withCommas(previewIva.toFixed(2))}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm border-b">
                        {formatMoneyMXN(previewSubtotal.toFixed(2))}
                      </td>
                      <td className="px-3 py-2 text-sm border-b">
                        {formatMoneyMXN(previewTotal.toFixed(2))}
                      </td>
                    </tr>
                  ) : (
                    reservationsWithSelectedItems.slice(0, 2).map((reserva) => (
                      <tr
                        key={`preview-${reserva.id_solicitud}-${Math.round(Math.random() * 9999999)}`}
                      >
                        <td className="px-3 py-2 text-sm border-b">90121500</td>
                        <td className="px-3 py-2 text-sm border-b">1</td>
                        <td className="px-3 py-2 text-sm border-b">
                          E48<p>Unidad de servicio</p>
                        </td>
                        <td className="px-3 py-2 text-sm border-b">
                          <div>
                            <p className="text-gray-600">
                              HOSPEDAJE EN {reserva.hotel} - DEL{" "}
                              {formatDate(reserva.check_in)} AL{" "}
                              {formatDate(reserva.check_out)} (
                              {reserva.nightsCount} NOCHES) -{" "}
                              {reserva.nombre_viajero_completo}
                            </p>
                            <p className="text-gray-600">
                              02 - Con objeto de impuesto
                            </p>
                          </div>
                        </td>
                        {(() => {
                          const totalSel = reserva.items.reduce(
                            (s, it) => s + Number(it.total || 0),
                            0,
                          );
                          const { subtotal, iva, total } = splitIva(totalSel);

                          return (
                            <>
                              <td className="px-3 py-2 text-sm border-b">
                                ${subtotal.toFixed(2)}
                                <div className="text-[11px] text-gray-500">
                                  IVA: ${iva.toFixed(2)} ({ivaRateStr})
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm border-b">
                                ${total.toFixed(2)}
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {!isConsolidated && reservationsWithSelectedItems.length > 2 && (
                <p className="text-xs text-gray-500 mt-2">
                  + {reservationsWithSelectedItems.length - 2} items más...
                </p>
              )}
            </div>
          </div>

          {/* Datos fiscales */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Datos Fiscales
            </h4>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">
                  Cargando datos fiscales...
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ) : fiscalDataList.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-700">
                  No se encontraron datos fiscales registrados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fiscalDataList.map((data) => (
                  <div
                    key={`${data.id_datos_fiscales}-${data.id_empresa}`}
                    className={`border rounded-md p-4 cursor-pointer ${
                      selectedFiscalData?.id_datos_fiscales ===
                      data.id_datos_fiscales
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedFiscalData(data)}
                  >
                    <div className="flex justify-between">
                      <h5 className="font-medium text-gray-900">
                        {data.razon_social_df}
                      </h5>
                      <span className="text-sm text-gray-500">
                        RFC: {data.rfc}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Regimen Fiscal: {data.regimen_fiscal}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {data.codigo_postal_fiscal},{data.estado},{" "}
                      {data.municipio}, {data.colonia} , {data.calle}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Uso de CFDI
              </label>
              <select
                value={selectedCfdiUse}
                onChange={(e) => setSelectedCfdiUse(e.target.value)}
                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {cfdiUseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Forma de Pago
              </label>
              <select
                value={selectedPaymentForm}
                onChange={(e) => setSelectedPaymentForm(e.target.value)}
                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {paymentFormOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Metodo de Pago
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha de vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  min={minDueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Por defecto se establece 30 días a partir de hoy.
                </p>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observacion personalizada
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder={defaultDescription}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCopyObservations}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                  >
                    Copiar
                  </button>

                  <button
                    type="button"
                    onClick={() => setOmitObservations((v) => !v)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                      omitObservations
                        ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {omitObservations
                      ? "Observación desactivada"
                      : "No poner observación"}
                  </button>

                  {omitObservations && (
                    <span className="text-[11px] text-red-600">
                      No se enviará Observations a Facturama.
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {omitObservations
                    ? "Observación desactivada: Facturama recibirá Observations vacío."
                    : `Deja vacío para usar la descripción por defecto: "${defaultDescription}"`}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <select
                value={selectedDescription}
                onChange={(e) => setSelectedDescription(e.target.value)}
                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {paymentDescriptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {/* IVA Switch */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  IVA
                </label>
                <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIvaRate(IVA_16)}
                    className={`px-3 py-2 text-sm ${
                      ivaRate === IVA_16
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    16%
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvaRate(IVA_8)}
                    className={`px-3 py-2 text-sm ${
                      ivaRate === IVA_8
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    8%
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Por defecto es 16%.
                </p>
                {selectedFiscalData?.rfc == RFC_GENERICO && (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">
                        Periodicidad
                      </label>
                      <select
                        value={periodicity}
                        onChange={(e) => setPeriodicity(e.target.value)}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      >
                        {periodicidades.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">
                        Mes
                      </label>
                      <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      >
                        {meses.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">
                        Año
                      </label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        min="2000"
                        max="2100"
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Total a facturar:
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {totalNights} noche(s) en{" "}
                  {reservationsWithSelectedItems.length} reserva(s)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Subtotal:{" "}
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(previewSubtotal)}{" "}
                  | IVA ({ivaRateStr}):{" "}
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(previewIva)}
                </p>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(previewTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 pt-0">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </button>

          {isInvoiceGenerated ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!descarga) return;
                  const pdf =
                    getPdfBase64(descarga) ??
                    (typeof descarga === "string" ? descarga : null);

                  if (
                    typeof pdf === "string" &&
                    maybeDownloadByUrl(
                      pdf,
                      "application/pdf",
                      `factura_${(isInvoiceGenerated as any)?.Folio ?? cfdi?.Folio ?? "archivo"}.pdf`,
                    )
                  ) {
                    return;
                  }

                  if (!pdf) {
                    showNotification(
                      "error",
                      "No se encontró el PDF en la respuesta de descarga.",
                    );
                    return;
                  }

                  downloadBase64File(
                    pdf,
                    "application/pdf",
                    `factura_${(isInvoiceGenerated as any)?.Folio ?? cfdi?.Folio ?? "archivo"}.pdf`,
                  );
                }}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!descarga) return;
                  const xml = getXmlBase64(descarga) ?? null;

                  if (
                    typeof xml === "string" &&
                    maybeDownloadByUrl(
                      xml,
                      "application/xml",
                      `factura_${(isInvoiceGenerated as any)?.Folio ?? cfdi?.Folio ?? "archivo"}.xml`,
                    )
                  ) {
                    return;
                  }

                  if (!xml) {
                    showNotification(
                      "error",
                      "No se encontró el XML en la respuesta de descarga.",
                    );
                    return;
                  }

                  downloadBase64File(
                    xml,
                    "application/xml",
                    `factura_${(isInvoiceGenerated as any)?.Folio ?? cfdi?.Folio ?? "archivo"}.xml`,
                  );
                }}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors border border-green-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Descargar XML</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleConfirm("consolidada")}
                disabled={
                  !selectedFiscalData ||
                  loading ||
                  reservationsWithSelectedItems.length === 0
                }
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? "Generando..." : "Facturar Consolidada"}
              </button>

              <button
                type="button"
                onClick={() => handleConfirm("detallada_por_hospedaje")}
                disabled={
                  !selectedFiscalData ||
                  loading ||
                  reservationsWithSelectedItems.length === 0
                }
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Generando..."
                  : "Facturar Detallada (por hospedaje)"}
              </button>

              <button
                type="button"
                onClick={() => handleConfirm("detallada_por_item")}
                disabled={
                  !selectedFiscalData ||
                  loading ||
                  reservationsWithSelectedItems.length === 0
                }
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {loading ? "Generando..." : "Facturar Detallada (por ítem)"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const paymentDescriptions = [
  "Servicio de administración y gestión de Reservas",
  "Servicio y Gestión de viajes",
];

const RFC_GENERICO = "XAXX010101000";

const periodicidades = [
  { value: "01", label: "Diario" },
  { value: "02", label: "Semanal" },
  { value: "03", label: "Quincenal" },
  { value: "04", label: "Mensual" },
  { value: "05", label: "Bimestral" },
];

const meses = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];
