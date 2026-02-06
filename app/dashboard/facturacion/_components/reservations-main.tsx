"use client";

import React, { useEffect, useState } from "react";
import { fetchEmpresasDatosFiscales } from "@/hooks/useFetch";
import {
  formatDate,
  subirArchivoAS3,
  obtenerPresignedUrl,
} from "@/helpers/utils";
import { URL, API_KEY } from "@/lib/constants/index";
import useApi from "@/hooks/useApi";
import { DescargaFactura, Root } from "@/types/billing";
import { ChevronDownIcon, ChevronUpIcon, Download } from "lucide-react";
import { formatNumber, formatMoneyMXN, withCommas } from "@/helpers/formater";
import { Console } from "console";
import { useNotification } from "@/context/useNotificacion";
// --- Helpers de descarga robusta ---
const normalizeBase64 = (b64?: string | null) => {
  if (!b64) return "";
  // Soportar "data:...;base64," y variantes URL-safe (-, _)
  const clean = b64
    .split("base64,")
    .pop()!
    .replace(/[\r\n\s]/g, "");
  return clean.replace(/-/g, "+").replace(/_/g, "/");
};

// --- Subida segura a S3 con URL pre-firmada ---
const subirArchivoAS3Seguro = async (
  file: File,
  bucket: string = "comprobantes"
) => {
  try {
    console.log(`Iniciando subida de ${file.name} (${file.type})`);

    // 1) Obtener URL pre-firmada
    const { url: presignedUrl, publicUrl } = await obtenerPresignedUrl(
      file.name,
      file.type,
      bucket
    );

    console.log(`URL pre-firmada obtenida para ${file.name}`);

    // 2) Subir archivo
    await subirArchivoAS3(file, presignedUrl);

    console.log(
      `✅ Archivo ${file.name} subido exitosamente a S3: ${publicUrl}`
    );

    return publicUrl;
  } catch (error: any) {
    console.error(`❌ Error al subir ${file.name} a S3:`, error);
    throw new Error(`Error al subir ${file.name} a S3: ${error.message}`);
  }
};

// Convierte base64 -> Blob (ya la tienes) y ahora -> File
const base64ToFile = (b64: string, mime: string, filename: string) =>
  new File([base64ToBlob(b64, mime)], filename, { type: mime });

// Detecta si viene como URL http(s)
const isHttpUrl = (s?: string | null) => !!s && /^https?:\/\//i.test(s);

const base64ToBlob = (b64: string, mime: string) => {
  const clean = normalizeBase64(b64);
  const byteChars = atob(clean);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++)
    byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
};

// ✅ Mejora opcional: revocar el ObjectURL con delay (Safari fix)
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500); // <- antes era inmediato
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

// Si alguna API te devuelve URLs directas ya firmadas:
const maybeDownloadByUrl = (
  urlOrBase64: string,
  fallbackMime: string,
  filename: string
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

// Opciones y tipos...
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

const tipoComprobanteOptions = [
  { value: "I", label: "I - Ingreso" },
  { value: "E", label: "E - Egreso" },
  { value: "T", label: "T - Traslado" },
  { value: "N", label: "N - Nómina" },
  { value: "P", label: "P - Pago" },
];

const regimenFiscalOptions = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  {
    value: "605",
    label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios",
  },
  { value: "606", label: "606 - Arrendamiento" },
  {
    value: "607",
    label: "607 - Régimen de Enajenación o Adquisición de Bienes",
  },
  { value: "608", label: "608 - Demás ingresos" },
  {
    value: "610",
    label:
      "610 - Residentes en el Extranjero sin Establecimiento Permanente en México",
  },
  {
    value: "611",
    label: "611 - Ingresos por Dividendos (socios y accionistas)",
  },
  {
    value: "612",
    label:
      "612 - Personas Físicas con Actividades Empresariales y Profesionales",
  },
  { value: "614", label: "614 - Ingresos por intereses" },
  {
    value: "615",
    label: "615 - Régimen de los ingresos por obtención de premios",
  },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  {
    value: "620",
    label:
      "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
  },
  { value: "621", label: "621 - Incorporación Fiscal" },
  {
    value: "622",
    label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
  },
  { value: "623", label: "623 - Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 - Coordinados" },
  {
    value: "625",
    label:
      "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
];

const exportacionOptions = [
  { value: "01", label: "01 - No aplica" },
  { value: "02", label: "02 - Definitiva" },
  { value: "03", label: "03 - Temporal" },
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
}

// Tipos actualizados
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
  // Campos adicionales del join
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

interface FilterOptions {
  searchTerm: string;
  statusFilter: ReservationStatus;
  dateRangeFilter: {
    startDate: Date | null;
    endDate: Date | null;
  };
  priceRangeFilter: {
    min: number | null;
    max: number | null;
  };
  estado: string;
}

// ✅ Nuevo: asignar URLs a la factura en tu backend
const asignarURLS_factura = async (
  id_factura: string,
  url_pdf: string,
  url_xml: string
) => {
  try {
    console.log("Asignando URLs a factura:", { id_factura, url_pdf, url_xml });

    const resp = await fetch(
      `${URL}/mia/factura/asignarURLS_factura?id_factura=${encodeURIComponent(
        id_factura
      )}&url_pdf=${encodeURIComponent(url_pdf)}&url_xml=${encodeURIComponent(
        url_xml
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      }
    );

    if (!resp.ok) {
      const errorData = await resp.json();
      throw new Error(errorData?.message || "Error al asignar URLs de factura");
    }

    const data = await resp.json();
    console.log("✅ URLs asignadas correctamente en BD:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al asignar URLs de factura:", error);
    throw error;
  }
};

// ✅ Nuevo: genera data:URL a partir de base64
const base64ToDataUrl = (b64: string, mime: string) =>
  `data:${mime};base64,${normalizeBase64(b64)}`;

// Status Badge Component
const StatusBadge: React.FC<{ status: ReservationStatus }> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-yellow-600" />
          Pendiente
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-blue-600" />
          Confirmada
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-green-600" />
          Completada
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-red-600" />
          Cancelada
        </span>
      );
    default:
      return null;
  }
};

// Loader Component
const LoaderComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    <span className="ml-3 text-gray-700">Cargando reservaciones...</span>
  </div>
);

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;



const splitIva16 = (total: number) => {
  const subtotal = round2(total / 1.16);
  const iva = round2(total - subtotal);
  return { subtotal, iva, total: round2(total) };
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
  // console.log(reservationsInit.map((reserva) => reserva.items));

  // const reservations = reservationsInit;
  // const reservations = reservationsInit
  //    .filter((reserva) => reserva.items != null)
  //    .map((reserva) => ({
  //      ...reserva,
  //      items: reserva.items.map((item) => ({
  //        ...item,
  //        subtotal: (Number(item.total) / 1.16).toFixed(2),
  //        impuestos: (item.total - Number(item.total) / 1.16).toFixed(2),
  //      })),
  //    }));
  const [selectedDescription, setSelectedDescription] = useState<string>(
    paymentDescriptions[0]
  );
  const [omitObservations, setOmitObservations] = useState(false);

  console.log("informacion",selectedItems)
  const [reservations, setReservations] = useState(
    reservationsInit
      .filter((reserva) => reserva.items != null)
      .map((reserva) => ({
        ...reserva,
        items: reserva.items.map((item) => ({
          ...item,
          subtotal: (Number(item.total) / 1.16).toFixed(2),
          impuestos: (item.total - Number(item.total) / 1.16).toFixed(2),
        })),
      }))
  );
  const { showNotification } = useNotification();
  const handleCopyObservations = async () => {
  const text = sanitizeFacturamaText(descriptionToUse, 1000);

  


  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback viejo
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

    showNotification("success","Observación copiada ✅");
  } catch (e) {
    console.error("Error al copiar:", e);
    showNotification("error","No se pudo copiar la observación ❌");
  }
};

  const [fiscalDataList, setFiscalDataList] = useState<FiscalData[]>([]);
  console.log("FISCAL DATA", fiscalDataList);
  const [selectedFiscalData, setSelectedFiscalData] =
    useState<FiscalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCfdiUse, setSelectedCfdiUse] = useState("G03");
  const [selectedPaymentForm, setSelectedPaymentForm] = useState("03");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("PUE");
  const { crearCfdi, descargarFactura, mandarCorreo } = useApi();
  const [descarga, setDescarga] = useState<DescargaFactura | null>(null);
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState<Root | null>(
    null
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
  // Fecha de vencimiento (por defecto a 30 días)
  const [dueDate, setDueDate] = useState<string>(() =>
    toInputDate(addDays(new Date(), 30))
  );
  // Para limitar el mínimo a hoy
  const minDueDate = toInputDate(new Date());

  // Estado para el CFDI
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
    ExpeditionPlace: "11560",
    //ExpeditionPlace: "42501",
    Serie: null,

    Folio: Math.round(Math.random() * 999999999),
    PaymentForm: selectedPaymentForm,
    PaymentMethod: selectedPaymentMethod,
    Exportation: "01",
    Items: [] as any[],
  });

  //ESTE USEEFFECT SE CREO PARA HARDCODEAR AL CLIENTE AMPARO, NO SE QUITA O SI SE MUEVE DEBEMOS ACTUALIZARLO Y AVISAR A FINANZAS (QUE PIDE CAMBIOS HARDCODEADOS, SOLO PA DAR EL GUSTO UN RATO, POR MI AUMENTOOOO)
  useEffect(() => {
    if (
      fiscalDataList.some(
        (empresa) =>
          empresa?.id_agente == "11e1a5c7-1d44-485e-99a2-7fdf674058f3"
      )
    ) {
      showNotification("error","Se detecto al cliente amparo, cambiaremos el servicio");
      setSelectedDescription(paymentDescriptions[1]);
    }
  }, [fiscalDataList]);
  // Preparar los datos de las reservaciones con sus items seleccionados
  useEffect(() => {
    if (reservations.length > 0 && Object.keys(selectedItems).length > 0) {
      const preparedReservations = reservations
        .filter((reserva) => selectedItems[reserva.id_servicio]?.length > 0)
        .map((reserva) => {
          const selectedItemIds = selectedItems[reserva.id_servicio] || [];
          const items = Array.isArray(reserva.items)
            ? reserva.items.filter((item) =>
                selectedItemIds.includes(item.id_item)
              )
            : [];

          return {
            ...reserva,
            items: items.map((item) => ({
              ...item,
              subtotal: Number(item.total) / 1.16,
            })),
            nightsCount: items.length,
          };
        });

      setReservationsWithSelectedItems(preparedReservations);

      // Cargar datos fiscales si no están cargados
      if (
        fiscalDataList.length === 0 &&
        preparedReservations[0]?.id_usuario_generador
      ) {
        const fetchFiscalData = async () => {
          try {
            setLoading(true);
            const data = await fetchEmpresasDatosFiscales(
              preparedReservations[0].id_usuario_generador
            );
            setFiscalDataList(data);
            if (data.length > 0) {
              setSelectedFiscalData(data[0]);
            }
          } catch (err) {
            setError("Error al cargar los datos fiscales");
            console.error("Error fetching fiscal data:", err);
          } finally {
            setLoading(false);
          }
        };
        fetchFiscalData();
      }
    }
  }, [selectedItems, reservations]);

  const [customDescription, setCustomDescription] = useState("");
  const sanitizeFacturamaText = (s: string, max = 1000) =>
  (s ?? "")
    .toString()
    .replace(/\|/g, " - ")      // 🔥 quita pipe
    .replace(/[\r\n\t]+/g, " ") // quita tabs/saltos
    .replace(/\s{2,}/g, " ")    // colapsa espacios dobles
    .trim()
    .slice(0, max);


  // Actualizar CFDI cuando cambian los datos
  useEffect(() => {
    if (selectedFiscalData && reservationsWithSelectedItems.length > 0) {
      const totalNights = reservationsWithSelectedItems.reduce(
        (sum, reserva) => sum + reserva.nightsCount,
        0
      );

      // Calcular totales de items seleccionados solamente
      const totalAmount = reservationsWithSelectedItems.reduce(
        (sum, reserva) => {
          const selectedItemsForReserva = reserva.items.filter((item) =>
            selectedItems[reserva.id_servicio]?.includes(item.id_item)
          );
          return (
            sum +
            selectedItemsForReserva.reduce(
              (itemSum, item) => itemSum + parseFloat(item.total),
              0
            )
          );
        },
        0
      );
      console.log("reserva", reservationsWithSelectedItems);

      if (isConsolidated) {
        // Factura consolidada - un solo concepto
        const subtotalConsolidado = totalAmount / 1.16; // Calcular subtotal sin IVA
        const ivaConsolidado = totalAmount - subtotalConsolidado; // IVA = Total - Subtotal

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
          Items: [
            {
              Quantity: "1",
              ProductCode: "90111500",
              UnitCode: "E48",
              Unit: "Unidad de servicio",
              Description: selectedDescription, //AQUI CAMBIO
              //IdentificationNumber: "HSP",
              UnitPrice: subtotalConsolidado.toFixed(2),
              Subtotal: subtotalConsolidado.toFixed(2),
              TaxObject: "02",
              Taxes: [
                {
                  Name: "IVA",
                  Rate: "0.16",
                  Total: ivaConsolidado.toFixed(2),
                  Base: subtotalConsolidado.toFixed(2), // Base debe ser el subtotal, no el total
                  IsRetention: "false",
                  IsFederalTax: "true",
                },
              ],
              Total: totalAmount.toFixed(2),
            },
          ],
          Observations: omitObservations ? "" : sanitizeFacturamaText(descriptionToUse),
        }));
      } else {
        // Factura detallada - un concepto por reservación con suma EXACTA de items seleccionados
        setCfdi((prev) => ({
          ...prev,
          Receiver: {
            Name: selectedFiscalData.razon_social_df,
            CfdiUse: selectedCfdiUse,
            Rfc: selectedFiscalData.rfc,
            FiscalRegime: selectedFiscalData.regimen_fiscal,
            TaxZipCode: selectedFiscalData.codigo_postal_fiscal,
          },
          PaymentForm: selectedPaymentForm,
          Items: reservationsWithSelectedItems
            .map((reserva) => {
              // Filtrar solo los items seleccionados para esta reserva
              const selectedItemsForReserva = reserva.items
                .filter((item) =>
                  selectedItems[reserva.id_servicio]?.includes(item.id_item)
                )
                .map((item) => ({
                  ...item,
                  subtotal: (Number(item.total) / 1.16).toFixed(2),
                }));

              // Validar que hay items seleccionados
              if (selectedItemsForReserva.length === 0) {
                console.warn(
                  `No hay items seleccionados para la reserva ${reserva.id_servicio}`
                );
                return null;
              }

              // Calcular totales exactos de los items seleccionados
              const subtotalSelected = selectedItemsForReserva.reduce(
                (sum, item) => sum + parseFloat(item.subtotal),
                0
              );
              const ivaSelected = selectedItemsForReserva.reduce(
                (sum, item) =>
                  sum +
                  parseFloat(((Number(item.total) / 1.16) * 0.16).toFixed(2)),
                0
              );
              const totalSelected = subtotalSelected + ivaSelected;
              const selectedNightsCount = selectedItemsForReserva.length;

              // OPCIÓN 1: UnitPrice calculado matemáticamente correcto
              // El UnitPrice debe ser tal que: UnitPrice * Quantity = Subtotal
              const unitPrice = subtotalSelected / selectedNightsCount;

              // OPCIÓN 2: Si quieres usar el total (incluyendo IVA) como base para UnitPrice
              // const unitPrice = totalSelected / selectedNightsCount;
              // En este caso el Subtotal sería: (unitPrice * selectedNightsCount) / 1.16

              return {
                Quantity: "1",
                ProductCode: "90121500",
                UnitCode: "E48",
                Unit: "Unidad de servicio",
                Description: selectedDescription, //AQUI CAMBIO
                //IdentificationNumber: `HSP-${reserva.id_servicio}`,
                UnitPrice: subtotalSelected.toFixed(2),
                Subtotal: subtotalSelected.toFixed(2),
                TaxObject: "02",
                Taxes: [
                  {
                    Name: "IVA",
                    Rate: "0.16",
                    Total: ivaSelected.toFixed(2),
                    Base: subtotalSelected.toFixed(2),
                    IsRetention: "false",
                    IsFederalTax: "true",
                  },
                ],
                Total: totalSelected.toFixed(2),
              };
            })
            .filter((item) => item !== null), // Filtrar items nulos
          Observations: sanitizeFacturamaText(descriptionToUse),
        }));
      }
    }
  }, [
    selectedFiscalData,
    selectedCfdiUse,
    selectedPaymentForm,
    selectedPaymentMethod,
    reservationsWithSelectedItems,
    isConsolidated,
    omitObservations
  ]);

  const validateInvoiceData = () => {
    if (reservationsWithSelectedItems.length === 0) {
      showNotification("error","No hay items seleccionados para facturar");
      return false;
    }

    const missingFields = [];
    if (!cfdi.Receiver.Rfc) missingFields.push("RFC del receptor");
    if (!cfdi.Receiver.TaxZipCode)
      missingFields.push("código postal del receptor");
    if (!selectedCfdiUse) missingFields.push("uso CFDI");
    if (!selectedPaymentForm) missingFields.push("forma de pago");

    if (missingFields.length > 0) {
      showNotification("error",`Faltan los siguientes campos: ${missingFields.join(", ")}`);
      return false;
    }

    return true;
  };


  type ItemFull = {
  id_item: string;
  id_servicio: string;
  id_hospedaje: string | null;
  total: number;
  fecha_uso?: string;
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
    // ✅ si no hay id_hospedaje, NO mezcles todo en un solo grupo:
    // agrupa por servicio para evitar juntar cosas distintas.
    const key = it.id_hospedaje ?? `servicio:${it.id_servicio}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }

  return Array.from(map.entries()).map(([key, arr]) => ({
    key,
    id_hospedaje: arr[0]?.id_hospedaje ?? null,
    items: arr,
    total: arr.reduce((s, x) => s + Number(x.total || 0), 0),
    // metadatos útiles para descripción
    hotel: arr.find(x => x.reserva?.hotel)?.reserva?.hotel ?? "",
    check_in: arr.find(x => x.reserva?.check_in)?.reserva?.check_in ?? "",
    check_out: arr.find(x => x.reserva?.check_out)?.reserva?.check_out ?? "",
  }));
};


// Devuelve un arreglo de items seleccionados con contexto de su reserva
const getSelectedItemsFull = (
  reservationsWithSelectedItems: ReservationWithItems[],
  selectedItems: Record<string, string[]>,
  selectedHospedaje?: Record<string, string[]>
) => {
  return reservationsWithSelectedItems.flatMap((r) => {
    const ids = selectedItems[r.id_servicio] ?? [];
    if (ids.length === 0) return [];

    const id_hospedaje = selectedHospedaje?.[r.id_servicio]?.[0] ?? r.id_hospedaje ?? null;

    return (r.items ?? [])
      .filter((it) => ids.includes(it.id_item))
      .map((it) => {
        const total = Number(it.total);
        const subtotal = total / 1.16;
        const iva = total - subtotal;

        return {
          // --- llaves "core" para tu backend ---
          id_item: it.id_item,
          id_servicio: r.id_servicio,
          id_hospedaje,
          id_solicitud: r.id_solicitud,
          id_usuario_generador: r.id_usuario_generador,

          // --- montos ya numéricos ---
          total,
          subtotal,
          iva,

          // --- info del item ---
          fecha_uso: it.fecha_uso,
          impuestos: it.impuestos,
          saldo: it.saldo,
          id_factura: it.id_factura,
          is_facturado: it.is_facturado,
          costo_total: it.costo_total,
          costo_subtotal: it.costo_subtotal,
          costo_impuestos: it.costo_impuestos,
          tipo_cuarto: it.tipo_cuarto ?? r.tipo_cuarto ?? null,
          codigo_reservacion_hotel: it.codigo_reservacion_hotel ?? r.codigo_reservacion_hotel ?? null,

          // --- info de la reserva (útil para addenda / auditoría) ---
          reserva: {
            id_servicio: r.id_servicio,
            id_solicitud: r.id_solicitud,
            confirmation_code: r.confirmation_code,
            hotel: r.hotel,
            check_in: r.check_in,
            check_out: r.check_out,
            room: r.room,
            nombre_viajero: r.nombre_viajero_completo ?? r.nombre_viajero ?? null,
            id_booking: r.id_booking ?? null,
          },
        };
      });
  });
};

type InvoiceMode =
  | "consolidada"
  | "detallada_por_hospedaje"
  | "detallada_por_item";

const handleConfirm = async (mode: InvoiceMode) => {
  if (!selectedFiscalData) {
    setError("Debes seleccionar unos datos fiscales");
    return;
  }
  if (!validateInvoiceData()) return;

  const modeIsConsolidated = mode === "consolidada";
  setIsConsolidated(modeIsConsolidated); // solo para UI/preview

  try {
    setLoading(true);

    const now = new Date();
    now.setHours(now.getHours() - 6);
    const formattedDate = now.toISOString().split(".")[0];

    // 1) Addenda (antes del payload)
    const addendaObj = buildAddenda();
    const addendaStr = JSON.stringify(addendaObj);

    // 2) Items FULL (seleccionados)
    const itemsFacturadosFull = getSelectedItemsFull(
      reservationsWithSelectedItems,
      selectedItems,
      selectedHospedaje
    );

    if (itemsFacturadosFull.length === 0) {
      showNotification("error","No hay items seleccionados para facturar");
      return;
    }

    // Compacto (si tu backend/SP lo usa así)
    const itemsFacturados = itemsFacturadosFull.map((x) => ({
      id_item: x.id_item,
      monto: x.total,
      id_servicio: x.id_servicio,
      id_hospedaje: x.id_hospedaje,
    }));

    // 3) CFDI Items
const cfdiItems = (() => {
  // ✅ SIEMPRE Quantity = 1 en todos los conceptos
  const QTY_ONE = "1";

  if (mode === "consolidada") {
    // 1 solo concepto, suma total de todos los items seleccionados
    const totalFacturado = itemsFacturadosFull.reduce(
      (s, it) => s + Number(it.total),
      0
    );
    const { subtotal, iva, total } = splitIva16(totalFacturado);

    return [
      {
        Quantity: QTY_ONE,
        ProductCode: "90121500",
        UnitCode: "E48",
        Unit: "Unidad de servicio",
        Description: selectedDescription, // ✅ igual que antes
        UnitPrice: subtotal.toFixed(2),   // ✅ QTY=1 => UnitPrice = Subtotal
        Subtotal: subtotal.toFixed(2),
        TaxObject: "02",
        Taxes: [
          {
            Name: "IVA",
            Rate: "0.16",
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
    // ✅ 1 concepto por id_hospedaje, PERO Quantity = 1
    const groups = groupByHospedaje(itemsFacturadosFull as any);

    return groups.map((g) => {
      const { subtotal, iva, total } = splitIva16(g.total);

      const descRaw = [
        selectedDescription, // ✅ igual que antes
        g.hotel ? `${g.hotel}` : "",
        g.check_in && g.check_out
          ? `${formatDate(g.check_in)} - ${formatDate(g.check_out)}`
          : "",
        // ojo: evita crashear si no existe
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
        UnitPrice: subtotal.toFixed(2), // ✅ QTY=1
        Subtotal: subtotal.toFixed(2),
        TaxObject: "02",
        Taxes: [
          {
            Name: "IVA",
            Rate: "0.16",
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

  // mode === "detallada_por_item"
  // ✅ 1 concepto por cada id_item, Quantity = 1
  return (itemsFacturadosFull as any[]).map((it) => {
    const { subtotal, iva, total } = splitIva16(Number(it.total));

    // OJO: aquí NO cambio tu estilo de descripción: sigue usando selectedDescription
    // (si quieres que agregue hotel/fechas/viajero como antes, me dices y lo armamos)
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
      Quantity: QTY_ONE,
      ProductCode: "90121500",
      UnitCode: "E48",
      Unit: "Unidad de servicio",
      Description: desc,
      UnitPrice: subtotal.toFixed(2), // ✅ QTY=1
      Subtotal: subtotal.toFixed(2),
      TaxObject: "02",
      Taxes: [
        {
          Name: "IVA",
          Rate: "0.16",
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


    // 4) payloadCFDI
    const payloadCFDI = {
      cfdi: {
        ...cfdi,
        Receiver: {
          ...cfdi.Receiver,
          CfdiUse: selectedCfdiUse,
        },
        PaymentForm: selectedPaymentForm,
        PaymentMethod: selectedPaymentMethod,
        Currency: "MXN",
        Date: formattedDate,
        OrderNumber: Math.round(Math.random() * 999999999).toString(),
        Observations: omitObservations ? "" : sanitizeFacturamaText(descriptionToUse),
        Items: cfdiItems,
      },
      info_user: {
        fecha_vencimiento: dueDate,
        id_user: reservationsWithSelectedItems[0].id_usuario_generador,
        id_solicitud: reservationsWithSelectedItems.map((r) => r.id_solicitud),
        id_items: itemsFacturadosFull.map((x: any) => x.id_item),
        datos_empresa: {
          rfc: cfdi.Receiver.Rfc,
          id_empresa: selectedFiscalData.id_empresa,
        },
        items_facturados: itemsFacturados,
        items_facturados_full: itemsFacturadosFull,
        addenda: addendaStr,
        addenda_type: "Noktos",
        invoice_mode: mode, // opcional para backend
      },
      items_facturados: itemsFacturados,
    };

    // 5) Ejecutar
    const response = await crearCfdi(payloadCFDI.cfdi, payloadCFDI.info_user);
    if (response.error) throw new Error(response.error);

    setIsInvoiceGenerated(response);

    // 👇 aquí sigue tu flujo: descargarFactura, subir a S3, asignarURLS_factura, etc.
    const factura = await descargarFactura(response.Id);
    setDescarga(factura);

    showNotification("success","Se ha generado con éxito la factura");

    onConfirm(selectedFiscalData, modeIsConsolidated);
  } catch (error) {
    console.error(error);
    showNotification("error","Ocurrió un error al generar la factura: " + (error as Error).message);
  } finally {
    setLoading(false);
  }
};


  // Calcular total de noches y monto
  const totalNights = reservationsWithSelectedItems.reduce(
    (sum, reserva) => sum + (reserva.nightsCount || 0),
    0
  );


  // Generar descripción por defecto
  const defaultDescription = `${reservationsWithSelectedItems
    .map((reserva) => {
      const selectedItemsForReserva = reserva.items.filter((item) =>
        selectedItems[reserva.id_servicio]?.includes(item.id_item)
      );

      const nochesReales = selectedItemsForReserva.length;

      return `${reserva.hotel} - ${formatDate(
        reserva.check_in
      )}`;
    })
    .join(" | ")}`;

  const isCustomValid =
    customDescription && /[a-zA-Z0-9\S]/.test(customDescription.trim());
  const descriptionToUse = isCustomValid
    ? customDescription
    : defaultDescription;

const buildAddenda = () => {
  const reservas = reservationsWithSelectedItems.map((r) => {
    const itemsSel = r.items.filter((it) =>
      selectedItems[r.id_servicio]?.includes(it.id_item)
    );

    const subtotal = itemsSel.reduce((s, it) => s + Number(it.total) / 1.16, 0);
    const iva = itemsSel.reduce(
      (s, it) => s + (Number(it.total) - Number(it.total) / 1.16),
      0
    );
    const total = subtotal + iva;

    return {
      id_servicio: r.id_servicio,
      id_solicitud: r.id_solicitud,
      confirmation_code: r.confirmation_code,
      hotel: r.hotel,
      check_in: r.check_in,
      check_out: r.check_out,
      viajero: r.nombre_viajero_completo,
      noches: itemsSel.length,
      items: itemsSel.map((it) => ({
        id_item: it.id_item,
        fecha_uso: it.fecha_uso,
        total: Number(it.total),
        subtotal: Number(it.total) / 1.16,
        iva: Number(it.total) - Number(it.total) / 1.16,
        tipo_cuarto: it.tipo_cuarto,
        codigo_reservacion_hotel: it.codigo_reservacion_hotel,
      })),
      totales: { subtotal, iva, total },
    };
  });

  const total = reservas.reduce((s, r) => s + r.totales.total, 0);
  const subtotal = reservas.reduce((s, r) => s + r.totales.subtotal, 0);
  const iva = reservas.reduce((s, r) => s + r.totales.iva, 0);

  return {
    version: "1.0",
    source: "Noktos",
    generated_at: new Date().toISOString(),
    due_date: dueDate,
    cfdi_observations: descriptionToUse,
    reservas,
    totales_globales: { subtotal, iva, total },
  };
};

  const totalAmount = reservationsWithSelectedItems.reduce(
    (sum, reserva) =>
      sum +
      (reserva.items?.reduce(
        (itemSum, item) => itemSum + parseFloat(item.total),
        0
      ) || 0),
    0
  );

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

          {/* Sección de vista previa de factura */}
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
                    // Vista previa consolidada
                    <>
                      <tr>
                        <td className="px-3 py-2 text-sm border-b">90121500</td>
                        <td className="px-3 py-2 text-sm border-b">1</td>
                        <td className="px-3 py-2 text-sm border-b">
                          E48
                          <p>Unidad de servicio</p>
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
                              {withCommas(totalAmount.toFixed(2))}, Tasa:
                              0.160000, Importe: $
                              {withCommas((totalAmount * 0.16).toFixed(2))}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm border-b">
                          {formatMoneyMXN(totalAmount.toFixed(2))}
                        </td>
                        <td className="px-3 py-2 text-sm border-b">
                          {formatMoneyMXN(totalAmount.toFixed(2))}
                        </td>
                      </tr>
                    </>
                  ) : (
                    // Vista previa detallada
                    reservationsWithSelectedItems
                      .slice(0, 2)
                      .map((reserva, index) => (
                        <tr
                          key={`preview-${reserva.id_solicitud}-${Math.round(
                            Math.random() * 9999999
                          )}`}
                        >
                          <td className="px-3 py-2 text-sm border-b">
                            90121500
                          </td>
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
                          <td className="px-3 py-2 text-sm border-b">
                            $
                            {parseFloat(
                              reserva.items.reduce(
                                (sum, item) => sum + parseFloat(item.total),
                                0
                              )
                            ).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm border-b">
                            $
                            {parseFloat(
                              reserva.items.reduce(
                                (sum, item) => sum + parseFloat(item.total),
                                0
                              )
                            ).toFixed(2)}
                          </td>
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
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            ) : fiscalDataList.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No se encontraron datos fiscales registrados.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {fiscalDataList.map((data) => (
                  <div
                    key={`${Math.round(
                      Math.random() * 9999999
                    )}-data.id_datos_fiscales`}
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
                  <option
                    key={`option.value-${Math.round(Math.random() * 9999999)}`}
                    value={option.value}
                  >
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
                  <option
                    key={`option.value-${Math.round(Math.random() * 9999999)}`}
                    value={option.value}
                  >
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
                  <option
                    key={`option.value-${Math.round(Math.random() * 9999999)}`}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div>
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

              <div className="mb-4">
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
    {omitObservations ? "Observación desactivada" : "No poner observación"}
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
                onChange={(e) => {
                  setSelectedDescription(e.target.value);
                  console.log(e.target.value);
                  console.log(selectedDescription);
                }}
                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {paymentDescriptions.map((option) => (
                  <option
                    key={`option.value-${Math.round(Math.random() * 9999999)}`}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              </div>
              <span className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

                  // Si el backend te regresó una URL ya lista:
                  if (
                    typeof pdf === "string" &&
                    maybeDownloadByUrl(
                      pdf,
                      "application/pdf",
                      `factura_${
                        isInvoiceGenerated?.Folio ?? cfdi?.Folio ?? "archivo"
                      }.pdf`
                    )
                  ) {
                    return;
                  }

                  if (!pdf) {
                    showNotification("error","No se encontró el PDF en la respuesta de descarga.");
                    return;
                  }
                  downloadBase64File(
                    pdf,
                    "application/pdf",
                    `factura_${
                      isInvoiceGenerated?.Folio ?? cfdi?.Folio ?? "archivo"
                    }.pdf`
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
                  const xml =
                    getXmlBase64(descarga) ??
                    (typeof descarga === "string" ? null : null);

                  // Si el backend te regresó una URL ya lista:
                  if (
                    typeof xml === "string" &&
                    maybeDownloadByUrl(
                      xml,
                      "application/xml",
                      `factura_${
                        isInvoiceGenerated?.Folio ?? cfdi?.Folio ?? "archivo"
                      }.xml`
                    )
                  ) {
                    return;
                  }

                  if (!xml) {
                    showNotification("error","No se encontró el XML en la respuesta de descarga.");
                    return;
                  }
                  downloadBase64File(
                    xml,
                    "application/xml",
                    `factura_${
                      isInvoiceGenerated?.Folio ?? cfdi?.Folio ?? "archivo"
                    }.xml`
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
  disabled={!selectedFiscalData || loading || reservationsWithSelectedItems.length === 0}
  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
>
  {loading ? "Generando..." : "Facturar Consolidada"}
</button>

<button
  type="button"
  onClick={() => handleConfirm("detallada_por_hospedaje")}
  disabled={!selectedFiscalData || loading || reservationsWithSelectedItems.length === 0}
  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
>
  {loading ? "Generando..." : "Facturar Detallada (por hospedaje)"}
</button>

<button
  type="button"
  onClick={() => handleConfirm("detallada_por_item")}
  disabled={!selectedFiscalData || loading || reservationsWithSelectedItems.length === 0}
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
