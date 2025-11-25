import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Mail,
  Receipt,
  Building2,
  FileText,
  DollarSign,
  Percent,
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  AlertCircle,
  X,
} from "lucide-react";
import { DataInvoice, DescargaFactura, ProductInvoice } from "@/types/billing";
import { Root } from "@/types/billing";
import { URL, API_KEY } from "@/lib/constants/index";
import { useRoute, Link } from "wouter";
import { useApi } from "@/hooks/useApi";
import { Pago } from "@/app/dashboard/payments/page";
import {
  formatNumberWithCommas,
  obtenerPresignedUrl,
  subirArchivoAS3,
} from "@/helpers/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Catálogos completos del SAT
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

interface FiscalDataModalProps {
  isOpen: boolean;
}

// Función para convertir base64 a archivo
const base64ToFile = (base64String: string, fileName: string, mimeType: string): File => {
  try {
    // Remover el prefijo data: si existe
    const base64Data = base64String.replace(/^data:[^;]+;base64,/, '');

    // Decodificar base64
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return new File([blob], fileName, { type: mimeType });
  } catch (error) {
    console.error('Error al convertir base64 a archivo:', error);
    throw new Error('Error al procesar el archivo');
  }
};

// Función para subir archivo a S3
const subirArchivoAS3Seguro = async (file: File, bucket: string = "comprobantes") => {
  try {
    console.log(`Iniciando subida de ${file.name} (${file.type})`);

    // Obtener URL pre-firmada
    const { url: presignedUrl, publicUrl } = await obtenerPresignedUrl(
      file.name,
      file.type,
      bucket
    );

    console.log(`URL pre-firmada obtenida para ${file.name}`);

    // Subir archivo
    await subirArchivoAS3(file, presignedUrl);

    console.log(`✅ Archivo ${file.name} subido exitosamente a S3: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error(`❌ Error al subir ${file.name} a S3:`, error);
    throw new Error(`Error al subir ${file.name} a S3: ${error.message}`);
  }
};

// Función para asignar URLs de factura
const asignarURLS_factura = async (id_factura: string, url_pdf: string, url_xml: string) => {
  try {
    console.log('Asignando URLs a factura:', { id_factura, url_pdf, url_xml });

    const resp = await fetch(
      `${URL}/mia/factura/asignarURLS_factura?id_factura=${encodeURIComponent(id_factura)}&url_pdf=${encodeURIComponent(url_pdf)}&url_xml=${encodeURIComponent(url_xml)}`,
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
    console.log('✅ URLs asignadas correctamente en BD:', data);
    return data;
  } catch (error) {
    console.error("❌ Error al asignar URLs de factura:", error);
    throw error;
  }
};

export const BillingPage: React.FC<BillingPageProps> = ({
  onBack,
  invoiceData,
  userId,
  saldoMonto = 0, // Valor por defecto 0
  rawIds = [], // Valor por defecto array vacío
  saldos = [],
  isBatch = false, // Valor por defecto false
  pagoData,
}) => {
  const [match, params] = useRoute("/factura/:id");
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [solicitud, setSolicitud] = useState(null);
  const [idCompany, setIdCompany] = useState<string | null>(null);
  const [selectedCfdiUse, setSelectedCfdiUse] = useState("G03");
  const [selectedPaymentForm, setSelectedPaymentForm] = useState("03");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("PUE");
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [descarga, setDescarga] = useState<DescargaFactura | null>(null);
  const [descargaxml, setDescargaxml] = useState<DescargaFactura | null>(null);
  const [isEmpresaSelected, setIsEmpresaSelected] = useState("");
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState<Root | null>(
    null
  );
  const { descargarFactura, mandarCorreo, descargarFacturaXML } = useApi();
  const [minAmount, setMinAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState(saldoMonto);
  console.log("custom", customAmount);
  console.log("custom", saldoMonto);

  console.log("pagos", pagoData);

  // Helper seguro para números
  const toNumber = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const [cfdi, setCfdi] = useState({
    Receiver: {
      Name: "",
      CfdiUse: "",
      Rfc: "",
      FiscalRegime: "",
      TaxZipCode: "",
    },
    CfdiType: "",
    NameId: "",
    Observations: "",
    //ExpeditionPlace: "11570",
    ExpeditionPlace: "42501", //Codigo Postal DE PRUEBA

    Serie: null,
    Folio: Number((Math.random() * 9999999).toFixed(0)),
    PaymentForm: "",
    PaymentMethod: selectedPaymentMethod,
    Exportation: "",
    Items: [
      {
        Quantity: "1",
        ProductCode: "90121500",
        UnitCode: "E48",
        Unit: "Unidad de servicio",
        Description: "Servicio de administración y Gestión de Reservas",
        // IdentificationNumber: "",
        UnitPrice: (saldoMonto / 1.16).toFixed(2),
        Subtotal: (saldoMonto / 1.16).toFixed(2), // Subtotal inicial
        TaxObject: "02",
        Taxes: [
          {
            Name: "IVA",
            Rate: "0.16",
            Total: (
              saldoMonto - Number((saldoMonto / 1.16).toFixed(2))
            ).toFixed(2), // IVA inicial
            Base: (saldoMonto / 1.16).toFixed(2),
            IsRetention: "false",
            IsFederalTax: "true",
          },
        ],
        Total: saldoMonto.toFixed(2), // Total inicial
      },
    ],
  });

  console.log("IDs de pagos:", rawIds);
  console.log("Es facturación por lotes?", isBatch);

  const updateInvoiceAmounts = (totalAmount: number) => {
    // Convertir el totalAmount a número por si acaso
    const total = Number(totalAmount);
    const subtotal = parseFloat((total / 1.16).toFixed(2)); // Calcula el subtotal y redondea a 2 decimales
    const iva = parseFloat((total - subtotal).toFixed(2)); // Calcula el IVA y redondea a 2 decimales

    setCfdi((prev) => ({
      ...prev,
      Items: [
        {
          ...prev.Items[0],
          UnitPrice: subtotal.toFixed(2),
          Subtotal: subtotal.toFixed(2),
          Taxes: [
            {
              ...prev.Items[0].Taxes[0],
              Total: iva.toFixed(2),
              Base: subtotal.toFixed(2),
            },
          ],
          Total: total.toFixed(2),
        },
      ],
    }));
  };

  const handleUpdateCompany = (company: any) => {
    console.log("Company object:", company);
    setIsEmpresaSelected(company.id_empresa);

    // Safely access taxInfo and id_datos_fiscales
    setIdCompany(company.taxInfo?.id_datos_fiscales || null);

    // Also update the CFDI receiver data
    setCfdi((prev) => ({
      ...prev,
      Receiver: {
        ...prev.Receiver,
        Name: company.razon_social_df.trim() || "",
        Rfc: company.rfc || "",
        FiscalRegime: company.regimen_fiscal || "",
        CfdiUse: selectedCfdiUse,
        TaxZipCode: company.codigo_postal_fiscal || "",
      },
    }));
  };

  useEffect(() => {
    if (!idCompany) {
      setShowFiscalModal(true);
    }
  }, []);
  console.log("info ", saldos);

  useEffect(() => {
    if (isBatch && rawIds.length > 0 && saldos.length > 0) {
      // 1. Crear array con los saldos
      const saldosArray = [...saldos].filter((s) => s > 0);

      if (saldosArray.length > 1) {
        // 2. Ordenar de menor a mayor
        saldosArray.sort((a, b) => a - b);

        // 3. Tomar todos menos el más grande (n-1 elementos)
        const saldosMinimos = saldosArray.slice(0, -1);

        // 4. Sumarlos para obtener el mínimo
        const sumaMinima = saldosMinimos.reduce((sum, saldo) => sum + saldo, 0);

        setMinAmount(0);
        setCustomAmount(saldoMonto);
        updateInvoiceAmounts(0);
      } else {
        // Si solo hay un saldo, el mínimo es ese saldo
        setMinAmount(saldosArray[0] || 0);
        setCustomAmount(saldosArray[0] || 0);
        updateInvoiceAmounts(saldosArray[0] || 0);
      }
    } else {
      // Si no es batch, el mínimo es 0
      setMinAmount(0);
    }
  }, [isBatch, rawIds, saldos]);

  // Modificar el input para respetar el mínimo y máximo
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);

    if (!isNaN(value)) {
      setCustomAmount(value);
      updateInvoiceAmounts(value);
    }
  };

  const handleSendEmail = async () => {
    if (isInvoiceGenerated?.Id) {
      const correo = prompt(
        "¿A que correo electronico deseas mandar la factura?"
      );
      await mandarCorreo(isInvoiceGenerated?.Id, correo || "");
      alert("El correo fue mandado con exito");
    } else {
      alert("ocurrio un error");
    }
  };

  const validateInvoiceData = () => {
    console.log("cfdi", cfdi.Receiver);
    console.log("seleccioonado", selectedCfdiUse);
    console.log(selectedPaymentForm);
    if (
      !cfdi.Receiver.Rfc ||
      !cfdi.Receiver.TaxZipCode ||
      !selectedCfdiUse ||
      !selectedPaymentForm
    ) {
      setShowValidationModal(true);
      return false;
    }
    return true;
  };

  const handleGenerateInvoice = async () => {
    if (customAmount > saldoMonto) {
      alert(
        `El monto debe estar entre ${formatCurrency(
          minAmount
        )} y ${formatCurrency(saldoMonto)}`
      );
      return;
    }

    if (!validateInvoiceData()) return;

    // Fecha actual (zona MX). Ya restabas 6 horas: lo mantengo.
    const now = new Date();
    now.setHours(now.getHours() - 6);
    const formattedDateTime = now.toISOString().split(".")[0]; // YYYY-MM-DDTHH:mm:ss
    const formattedDate = formattedDateTime.slice(0, 10); // YYYY-MM-DD

    try {
      // ---------------------------
      // 1) Lógica de distribución de montos entre pagos (de handlePagos)
      // ---------------------------
      let restante = parseFloat(customAmount.toString());
      const pagosAsociados = [];

      // Verificar si pagoData tiene rawIds (para múltiples pagos) o es un solo pago
      const raw_Ids = isBatch
        ? pagoData.map((p) => p.raw_id)
        : [pagoData[0]?.raw_id];
      console.log("raws", rawIds);

      let saldos2 = isBatch
        ? pagoData.map((p) => parseFloat(p.saldo))
        : [parseFloat(pagoData[0]?.monto_por_facturar || pagoData[0]?.saldo)];

      console.log("arreglo", rawIds, "tamaño", rawIds.length);

      if (rawIds.length == 1) {
        saldos2 = saldoMonto;
        const montoAsignar = Math.min(restante, saldos2);

        pagosAsociados.push({
          raw_id: rawIds[0],
          monto: montoAsignar,
        });

        restante -= montoAsignar;
      } else {
        console.log("hola 🐨🐨🐨");
        for (let i = 0; i < raw_Ids.length; i++) {
          console.log("restante", restante)
          if (restante <= 0) break;

          const montoAsignar = Math.min(restante, saldos2[i]);
          console.log("asignar", montoAsignar)
          pagosAsociados.push({
            raw_id: raw_Ids[i],
            monto: montoAsignar,
          });
          console.log("pagoasociados", pagosAsociados)

          restante -= montoAsignar;
        }
      }

      console.log(pagosAsociados, "edgeuibobon");

      // Si después de asignar a todos los pagos todavía queda restante
      if (restante > 0) {
        alert(
          `La factura excede los pagos disponibles por $${formatNumberWithCommas(
            restante
          )}`
        );
        return;
      }

      // ---------------------------
      // 2) Construimos el payload base (timbrado)
      // ---------------------------
      const subtotal = customAmount / 1.16;
      const iva = Number(subtotal) * 0.16;
      console.log("rfrfe", pagosAsociados);
      console.log(cfdi, "LINEA 415");
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
          Date: formattedDateTime,
          OrderNumber: Math.floor(Math.random() * 1000000),
          Items: [
            {
              ...cfdi.Items[0],
              UnitPrice: subtotal,
              Subtotal: subtotal,
              Taxes: [
                {
                  ...cfdi.Items[0].Taxes[0],
                  Total: iva,
                  Base: subtotal,
                },
              ],
              Total: customAmount.toString(),
            },
          ],
        },
        info_user: {
          id_user: userId,
          id_agente: userId,
          id_solicitud: null,
        },
        datos_empresa: {
          rfc: cfdi.Receiver.Rfc,
          id_empresa: isEmpresaSelected,
        },
        // Info pago para casos individuales
        ...(!isBatch && {
          info_pago: {
            id_movimiento: pagoData[0]?.id_movimiento,
            raw_id: rawIds,
            monto: pagoData[0]?.monto,
            monto_factura: customAmount.toString(),
            currency: pagoData[0]?.currency || "MXN",
            metodo: pagoData[0]?.metodo || "wallet",
            referencia: pagoData[0]?.referencia,
          },
        }),
        // Info para batch de pagos
        ...(isBatch && {
          pagos_asociados: pagosAsociados,
        }),
      };

      // Determinamos si es flujo de un solo pago
      const esUnSoloPago = !isBatch && pagoData.length === 1;

      // -------------------------------------------------------------
      // 3) FLUJO A: UN SOLO PAGO → endpoint individual
      // -------------------------------------------------------------
      console.log("payload", payloadCFDI);
      if (esUnSoloPago) {
        const resp = await fetch(
          `${URL}/mia/factura/CrearFacturaDesdeCargaPagos`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY,
            },
            body: JSON.stringify(payloadCFDI),
          }
        );

        const { data } = await resp.json();
        if (!resp.ok)
          throw new Error(data?.message || "Error al generar (individual)");

        alert("Factura generada con éxito");
        setIsInvoiceGenerated(data.facturama);

        // Descargas
        if (data?.facturama?.Id) {
          try {
            descargarFactura(data.facturama.Id).then(setDescarga);
            descargarFacturaXML(data.facturama.Id).then(setDescargaxml);
          } catch (err) {
            console.error("Error al descargar factura:", err);
          }
        }
        return; // fin flujo individual
      }

      // -------------------------------------------------------------
      // 4) FLUJO B: MULTIPLES PAGOS → endpoint de múltiples
      // -------------------------------------------------------------

      // 4.1) Timbramos la factura
      const respTimbrado = await fetch(
        `${URL}/mia/factura/CrearFacturasMultiplesPagos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(payloadCFDI),
        }
      );

      const { data } = await respTimbrado.json();
      console.log("data 😎😎😎😎😎😎", data);
      if (!respTimbrado.ok)
        throw new Error(data?.message || "Error al generar (múltiples)");
      alert("Factura generada con éxito");

      // PROCESO DE DESCARGA Y SUBIDA A S3 CORREGIDO
      let pdfUrl = "";
      let xmlUrl = "";

      try {
        if (data?.facturama?.Id) {
          console.log("=== INICIANDO DESCARGA DE PDF Y XML ===");
          console.log("ID de factura:", data.facturama.Id);

          // Descargamos PDF y XML en paralelo
          const [pdfResponse, xmlResponse] = await Promise.all([
            descargarFactura(data.facturama.Id),
            descargarFacturaXML(data.facturama.Id),
          ]);

          console.log("PDF Response:", pdfResponse);
          console.log("XML Response:", xmlResponse);

          setDescarga(pdfResponse);
          setDescargaxml(xmlResponse);

          // --- PROCESAR Y SUBIR PDF A S3 ---
          if (pdfResponse?.Content) {
            try {
              console.log("📄 Procesando PDF...");
              const pdfFile = base64ToFile(
                pdfResponse.Content,
                `factura_${data.facturama.Id}.pdf`,
                "application/pdf"
              );

              pdfUrl = await subirArchivoAS3Seguro(pdfFile, "comprobantes");
              console.log("✅ PDF subido exitosamente:", pdfUrl);
            } catch (pdfError) {
              console.error("❌ Error al procesar/subir PDF:", pdfError);
              alert("Error al subir PDF a S3, pero la factura se generó correctamente");
            }
          } else {
            console.warn("⚠️ No hay contenido PDF para subir");
          }

          // --- PROCESAR Y SUBIR XML A S3 ---
          if (xmlResponse?.Content) {
            try {
              console.log("📄 Procesando XML...");

              // Verificar que el contenido XML es válido
              if (typeof xmlResponse.Content === 'string' && xmlResponse.Content.trim()) {
                const xmlFile = base64ToFile(
                  xmlResponse.Content,
                  `factura_${data.facturama.Id}.xml`,
                  "application/xml"
                );

                xmlUrl = await subirArchivoAS3Seguro(xmlFile, "comprobantes");
                console.log("✅ XML subido exitosamente:", xmlUrl);
              } else {
                throw new Error("Contenido XML no válido o vacío");
              }
            } catch (xmlError) {
              console.error("❌ Error al procesar/subir XML:", xmlError);
              alert("Error al subir XML a S3, pero la factura se generó correctamente");
            }
          } else {
            console.warn("⚠️ No hay contenido XML para subir");
          }

          // --- ASIGNAR URLs EN LA BASE DE DATOS ---
          if (pdfUrl || xmlUrl) {
            try {
              console.log("🔗 Asignando URLs en base de datos...");
              console.log({ id_factura: data.id_factura, pdfUrl, xmlUrl });
              await asignarURLS_factura(data.id_factura, pdfUrl, xmlUrl);
              console.log("✅ URLs asignadas correctamente en BD");

              // Notificar al usuario si algún archivo no se pudo subir
              if (!pdfUrl && !xmlUrl) {
                alert("Factura generada, pero no se pudieron subir los archivos a S3");
              } else if (!pdfUrl) {
                alert("Factura generada. XML subido correctamente, pero hubo un error con el PDF");
              } else if (!xmlUrl) {
                alert("Factura generada. PDF subido correctamente, pero hubo un error con el XML");
              } else {
                alert("Factura generada y archivos subidos correctamente a S3");
              }

            } catch (assignError) {
              console.error("❌ Error al asignar URLs en BD:", assignError);
              alert("Factura generada y archivos subidos, pero error al registrar URLs en BD");
            }
          } else {
            console.warn("⚠️ No se pudieron subir ninguno de los archivos a S3");
            alert("Factura generada, pero no se pudieron subir los archivos a S3");
          }
        }
      } catch (downloadError) {
        console.error("❌ Error en proceso de descarga/subida:", downloadError);
        alert("Factura generada, pero error al procesar archivos");
      }

      // 4.2) Construimos el payload resumen (mantenemos la lógica existente)
      const subtotalN = Number(subtotal);
      const impuestosN = Number(iva);
      const totalN = parseFloat(customAmount.toString());

      const uuid =
        data?.facturama?.Complement?.TaxStamp?.UUID ||
        data?.facturama?.Uuid ||
        data?.facturama?.FolioFiscal ||
        data?.facturama?.Id ||
        "";

      const rfcEmisor =
        data?.facturama?.Issuer?.Rfc ||
        data?.facturama?.Emisor?.Rfc ||
        "AAA010101AAA";

      // Guardamos el objeto para mostrar botones de descarga
      setIsInvoiceGenerated(data.facturama);

      console.log("=== PROCESO COMPLETADO ===");

    } catch (error: any) {
      console.error("Error:", error);
      alert(error?.message || "Ocurrió un error al generar la(s) factura(s)");
    }
  };

  return (
    <div className="min-h-screen py-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-xl border border-gray-300 overflow-hidden">
          <div className="grid grid-cols-12 gap-0">
            {/* Left Column - Header and Details */}
            <div className="col-span-8 border-r border-gray-200">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Facturación
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Billing Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                      Datos de Facturación
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        RFC: {cfdi?.Receiver.Rfc}
                      </p>
                      <p className="text-sm text-gray-600">
                        {cfdi?.Receiver.Name}
                      </p>
                    </div>
                  </div>

                  {/* Reservation Details */}
                  <div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        {solicitud?.hotel || ""}
                      </p>
                      <p className="text-sm text-gray-600">
                        {solicitud ? (
                          <>
                            {formatDate(solicitud?.check_in)} -
                            {formatDate(solicitud?.check_out)}
                          </>
                        ) : (
                          <p> </p>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 text-blue-600 mr-2" />
                    Desglose
                  </h3>

                  <div className="space-y-2">
                    <AmountDetailsSplit
                      amount={formatCurrency(
                        Number(cfdi?.Items?.[0]?.Subtotal) || 0
                      )}
                      label="Subtotal"
                      icon={<DollarSign className="w-4 h-4 text-gray-400" />}
                    />
                    <AmountDetailsSplit
                      amount={formatCurrency(
                        Number(cfdi?.Items?.[0]?.Taxes?.[0]?.Total) ?? 0
                      )}
                      label={`IVA (${(
                        (Number(cfdi?.Items?.[0]?.Taxes?.[0]?.Rate) ?? 0) * 100
                      ).toFixed(2)}%)`}
                      icon={<Percent className="w-4 h-4 text-gray-400" />}
                    />

                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <AmountDetailsSplit
                          amount={formatCurrency(
                            Number(cfdi?.Items?.[0]?.Total) || 0
                          )}
                          label="Total"
                          icon={
                            <DollarSign className="w-4 h-4 text-gray-400" />
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="col-span-4 bg-gray-50 p-4 flex flex-col justify-between">
              <div>
                {/* CFDI Use Select */}
                <div className="space-y-1 mb-4">
                  <label className="block text-xs font-medium text-gray-700">
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

                {/* Payment Form Select */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
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

                {/* Payment Method Select */}
                <div className="space-y-1 mb-4">
                  <label className="block text-xs font-medium text-gray-700">
                    Método de Pago
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
                </div>

                {/* Custom Amount Input */}
                <div className="space-y-1 mb-4">
                  <label className="block text-xs font-medium text-gray-700">
                    Monto a facturar
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={handleAmountChange}
                      className="block w-full pl-8 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isBatch ? (
                      <>Máximo: {formatCurrency(saldoMonto)}</>
                    ) : (
                      `Máximo: ${formatCurrency(saldoMonto)}`
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {isInvoiceGenerated ? (
                  <>
                    <button
                      onClick={handleSendEmail}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Enviar por Correo</span>
                    </button>
                    <a
                      href={`data:application/pdf;base64,${descarga?.Content}`}
                      download="factura.pdf"
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Descargar PDF</span>
                    </a>
                    <a
                      href={`data:application/xml;base64,${descargaxml?.Content}`}
                      download="factura.xml"
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Descargar XML</span>
                    </a>
                  </>
                ) : (
                  <button
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={handleGenerateInvoice}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Confirmar y Generar
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DataFiscalModalWithCompanies
        onClose={() => setShowFiscalModal(false)}
        actualizarCompany={handleUpdateCompany}
        isOpen={showFiscalModal}
        agentId={userId} // Pasa el ID del usuario aquí
      />

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="text-red-500 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">
                Error de Validación
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Por favor, regresa a tu configuración y establece los datos
              fiscales para poder realizar tu factura
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AmountDetailsSplit = ({
  amount,
  label,
  icon,
}: {
  amount: string;
  label: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{amount}</span>
    </div>
  );
};

interface BillingPageProps {
  onBack: () => void;
  invoiceData?: DataInvoice;
  userId: string; // Nuevo prop
  saldoMonto?: number;
  rawIds?: string[]; // Array opcional de IDs
  saldos?: number[];
  isBatch?: boolean; // Flag para indicar si es facturación por lotes
  pagoData?: Pago | Pago[];
}

interface DataFiscalModalProps {
  isOpen: boolean;
  onClose: () => void;
  actualizarCompany: (company: any) => void;
  agentId: string; // Nuevo prop
}

export const getEmpresasDatosFiscales = async (agent_id: string) => {
  console.log(agent_id);
  try {
    const response = await fetch(
      `${URL}/mia/agentes/empresas-con-datos-fiscales?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Error al obtener empresas con datos fiscales:", error);
    throw error;
  }
};

const DataFiscalModalWithCompanies: React.FC<DataFiscalModalProps> = ({
  isOpen,
  onClose,
  actualizarCompany,
  agentId,
}) => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoRfcAlert, setShowNoRfcAlert] = useState(false);

  useEffect(() => {
    if (isOpen && agentId) {
      const fetchEmpresas = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getEmpresasDatosFiscales(agentId);

          // Validar si hay empresas y si tienen RFC
          const empresasValidas = Array.isArray(data)
            ? data.filter((empresa) => empresa.rfc) // Solo empresas con RFC
            : (data?.data || data?.empresas || []).filter(
              (empresa) => empresa.rfc
            );

          setEmpresas(empresasValidas);

          // Si solo hay una empresa válida, seleccionarla automáticamente
          if (empresasValidas.length === 1) {
            actualizarCompany(empresasValidas[0]);
            onClose();
            return;
          }

          if (empresasValidas.length === 0) {
            setError("No tienes empresas con RFC registrado");
            setShowNoRfcAlert(true);
          }
        } catch (err) {
          console.error("Error fetching companies:", err);
          setError("Error al cargar las empresas");
          setEmpresas([]);
        } finally {
          setLoading(false);
        }
      };

      fetchEmpresas();
    }
  }, [isOpen, agentId]);

  const handleClose = () => {
    window.location.href = "/dashboard/payments"; // Redirige a la página principal
    onClose(); // Cierra el modal de selección de empresa
    window.location.href = "/dashboard/payments"; // Redirige a la página principal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">
          Selecciona la empresa para facturar
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <>
            <div className="text-red-500 text-center py-4">{error}</div>
            {showNoRfcAlert && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      {empresas.length === 0
                        ? "Debes registrar al menos una empresa con RFC antes de facturar."
                        : "Algunas empresas no tienen RFC. Debes agregar el RFC a tus empresas para poder facturar."}
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={handleClose}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : empresas.length === 0 ? (
          <div className="text-yellow-600 text-center py-4">
            No se encontraron empresas con datos fiscales completos
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {empresas.map((empresa) => (
                <div
                  key={empresa.id_empresa}
                  className="border p-4 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    actualizarCompany(empresa);
                    onClose();
                  }}
                >
                  <h3 className="font-medium">{empresa.razon_social}</h3>
                  <p className="text-sm text-gray-600">RFC: {empresa.rfc}</p>
                  <p className="text-sm text-gray-600">
                    Regimen: {empresa.regimen_fiscal}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClose}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BillingPage;