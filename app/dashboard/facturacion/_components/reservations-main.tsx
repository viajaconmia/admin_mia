"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { da, es } from "date-fns/locale";
import { fetchReservationsFacturacion } from "@/services/reservas";
import Link from "next/link";
import {
  fetchEmpresasDatosFiscales,
  fetchSolicitudesItems,
} from "@/hooks/useFetch";
import { formatDate } from "@/helpers/utils";
import useApi from "@/hooks/useApi";
import { DescargaFactura, Root } from "@/types/billing";
import { ChevronDownIcon, ChevronUpIcon, Download } from "lucide-react";
import SubirFactura from "../subirfacturas/SubirFactura";

const cfdiUseOptions = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I01", label: "I01 - Construcciones" },
  { value: "I02", label: "I02 - Mobilario y equipo de oficina por inversiones" },
  { value: "I03", label: "I03 - Equipo de transporte" },
  { value: "I04", label: "I04 - Equipo de cómputo y accesorios" },
  { value: "I05", label: "I05 - Dados, troqueles, moldes, matrices y herramental" },
  { value: "I06", label: "I06 - Comunicaciones telefónicas" },
  { value: "I07", label: "I07 - Comunicaciones satelitales" },
  { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  { value: "D01", label: "D01 - Honorarios médicos, dentales y gastos hospitalarios" },
  { value: "D02", label: "D02 - Gastos médicos por incapacidad o discapacidad" },
  { value: "D03", label: "D03 - Gastos funerales" },
  { value: "D04", label: "D04 - Donativos" },
  { value: "D05", label: "D05 - Intereses reales efectivamente pagados por créditos hipotecarios" },
  { value: "D06", label: "D06 - Aportaciones voluntarias al SAR" },
  { value: "D07", label: "D07 - Primas por seguros de gastos médicos" },
  { value: "D08", label: "D08 - Gastos de transportación escolar obligatoria" },
  { value: "D09", label: "D09 - Depósitos en cuentas para el ahorro" },
  { value: "D10", label: "D10 - Pagos por servicios educativos" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
  { value: "CP01", label: "CP01 - Pagos" },
  { value: "CN01", label: "CN01 - Nómina" }
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
  { value: "99", label: "99 - Por definir" }
];

const paymentMethodOptions = [
  { value: "PUE", label: "PUE - Pago en una sola exhibición" },
  { value: "PPD", label: "PPD - Pago en parcialidades o diferido" }
];

const tipoComprobanteOptions = [
  { value: "I", label: "I - Ingreso" },
  { value: "E", label: "E - Egreso" },
  { value: "T", label: "T - Traslado" },
  { value: "N", label: "N - Nómina" },
  { value: "P", label: "P - Pago" }
];

const regimenFiscalOptions = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  { value: "607", label: "607 - Régimen de Enajenación o Adquisición de Bienes" },
  { value: "608", label: "608 - Demás ingresos" },
  { value: "610", label: "610 - Residentes en el Extranjero sin Establecimiento Permanente en México" },
  { value: "611", label: "611 - Ingresos por Dividendos (socios y accionistas)" },
  { value: "612", label: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
  { value: "614", label: "614 - Ingresos por intereses" },
  { value: "615", label: "615 - Régimen de los ingresos por obtención de premios" },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  { value: "620", label: "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { value: "623", label: "623 - Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 - Coordinados" },
  { value: "625", label: "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" }
];

const exportacionOptions = [
  { value: "01", label: "01 - No aplica" },
  { value: "02", label: "02 - Definitiva" },
  { value: "03", label: "03 - Temporal" }
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
const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    <span className="ml-3 text-gray-700">Cargando reservaciones...</span>
  </div>
);

const FacturacionModal: React.FC<{
  selectedItems: { [reservationId: string]: string[] };
  reservationsInit: Reservation[];
  onClose: () => void;
  onConfirm: (fiscalData: FiscalData, isConsolidated: boolean) => void;
}> = ({ selectedItems, reservationsInit, onClose, onConfirm }) => {
  // console.log("reservationInit", reservationsInit);
  // console.log("selectedItems", selectedItems);
  // console.log(reservationsInit.map((reserva) => reserva.items));

  // const reservations = reservationsInit;
  // const reservations = reservationsInit
  //   .filter((reserva) => reserva.items != null)
  //   .map((reserva) => ({
  //     ...reserva,
  //     items: reserva.items.map((item) => ({
  //       ...item,
  //       subtotal: (Number(item.total) / 1.16).toFixed(2),
  //       impuestos: (item.total - Number(item.total) / 1.16).toFixed(2),
  //     })),
  //   }));
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
  const [fiscalDataList, setFiscalDataList] = useState<FiscalData[]>([]);
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
    // ExpeditionPlace: "11570",
    ExpeditionPlace: "11570",
    Serie: null,

    Folio: Math.round(Math.random() * 999999999),
    PaymentForm: "",
    PaymentMethod: "PUE",
    Exportation: "01",
    Items: [] as any[],
  });

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
              subtotal: item.total / 1.16,
            })),
            nightsCount: items.length,
          };
        });

      console.log("preparedReservations: ", preparedReservations);

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
            console.log("😊😊😊rrrrrrrrrrrrrrrrr", data);
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
              ProductCode: "90121500",
              UnitCode: "E48",
              Unit: "Unidad de servicio",
              Description: `HOSPEDAJE - ${totalNights} NOCHE(S) EN ${reservationsWithSelectedItems.length} RESERVA(S)`,
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
          Observations: `DETALLE DE RESERVACIONES: ${reservationsWithSelectedItems
            .map((reserva) => {
              const selectedItemsForReserva = reserva.items.filter((item) =>
                selectedItems[reserva.id_servicio]?.includes(item.id_item)
              );

              const nochesReales = selectedItemsForReserva.length;

              return `${reserva.hotel} - ${formatDate(
                reserva.check_in
              )} AL ${formatDate(
                reserva.check_out
              )} - ${nochesReales} NOCHES(S) - ${reserva.nombre_viajero_completo
                }`;
            })
            .join(" | ")}`,
        }));
      } else {
        // Factura detallada - un concepto por reservación con suma EXACTA de items seleccionados
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
                Description: `HOSPEDAJE EN ${reserva.hotel} - DEL ${formatDate(
                  reserva.check_in
                )} AL ${formatDate(
                  reserva.check_out
                )} (${selectedNightsCount} NOCHES) - ${reserva.nombre_viajero_completo
                  }`,
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
          Observations: `FACTURA DE ${totalNights} NOCHE(S) DE HOSPEDAJE EN ${reservationsWithSelectedItems.length} RESERVA(S)`,
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
  ]);
  console.log(cfdi);
  const validateInvoiceData = () => {
    if (reservationsWithSelectedItems.length === 0) {
      alert("No hay items seleccionados para facturar");
      return false;
    }

    const missingFields = [];
    if (!cfdi.Receiver.Rfc) missingFields.push("RFC del receptor");
    if (!cfdi.Receiver.TaxZipCode)
      missingFields.push("código postal del receptor");
    if (!selectedCfdiUse) missingFields.push("uso CFDI");
    if (!selectedPaymentForm) missingFields.push("forma de pago");

    if (missingFields.length > 0) {
      alert(`Faltan los siguientes campos: ${missingFields.join(", ")}`);
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    if (!selectedFiscalData) {
      setError("Debes seleccionar unos datos fiscales");
      return;
    }

    if (!validateInvoiceData()) return;

    try {
      setLoading(true);
      const now = new Date();
      now.setHours(now.getHours() - 6);
      const formattedDate = now.toISOString().split(".")[0];

      // Distribuir montos por item seleccionado
      const itemsFacturados = reservationsWithSelectedItems.flatMap(reserva =>
        reserva.items
          .filter(item => selectedItems[reserva.id_servicio]?.includes(item.id_item))
          .map(item => ({
            id_item: item.id_item,
            monto: parseFloat(item.total),
          }))
      );

      // Calcular totales
      const totalFacturado = itemsFacturados.reduce((sum, item) => sum + item.monto, 0);
      const subtotal = totalFacturado / 1.16;
      const iva = totalFacturado - subtotal;

      // Construir payload similar a generar_factura.tsx
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
          Items: isConsolidated
            ? [
              {
                Quantity: "1",
                ProductCode: "90121500",
                UnitCode: "E48",
                Unit: "Unidad de servicio",
                Description: `HOSPEDAJE - ${totalNights} NOCHE(S) EN ${reservationsWithSelectedItems.length} RESERVA(S)`,
                UnitPrice: subtotal.toFixed(2),
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
                Total: totalFacturado.toFixed(2),
              },
            ]
            : reservationsWithSelectedItems.map(reserva => {
              const itemsSeleccionados = reserva.items.filter(item =>
                selectedItems[reserva.id_servicio]?.includes(item.id_item)
              );
              const subtotalReserva = itemsSeleccionados.reduce((sum, item) => sum + parseFloat(item.total) / 1.16, 0);
              const ivaReserva = itemsSeleccionados.reduce((sum, item) => sum + (parseFloat(item.total) - parseFloat(item.total) / 1.16), 0);
              const totalReserva = subtotalReserva + ivaReserva;
              return {
                Quantity: "1",
                ProductCode: "90121500",
                UnitCode: "E48",
                Unit: "Unidad de servicio",
                Description: `HOSPEDAJE EN ${reserva.hotel} - DEL ${formatDate(reserva.check_in)} AL ${formatDate(reserva.check_out)} (${itemsSeleccionados.length} NOCHES) - ${reserva.nombre_viajero_completo}`,
                UnitPrice: subtotalReserva.toFixed(2),
                Subtotal: subtotalReserva.toFixed(2),
                TaxObject: "02",
                Taxes: [
                  {
                    Name: "IVA",
                    Rate: "0.16",
                    Total: ivaReserva.toFixed(2),
                    Base: subtotalReserva.toFixed(2),
                    IsRetention: "false",
                    IsFederalTax: "true",
                  },
                ],
                Total: totalReserva.toFixed(2),
              };
            }),
        },
        info_user: {
          id_user: reservationsWithSelectedItems[0].id_usuario_generador,
          id_solicitud: reservationsWithSelectedItems.map(reserva => reserva.id_solicitud),
          id_items: itemsFacturados.map(item => item.id_item),
          datos_empresa: {
            rfc: cfdi.Receiver.Rfc,
            id_empresa: selectedFiscalData.id_empresa,
          },
        },
        items_facturados: itemsFacturados, // Relación item-monto
      };

      // Aquí deberías llamar a tu API para crear la factura
      const response = await crearCfdi(payloadCFDI.cfdi, payloadCFDI.info_user);

      if (response.error) throw new Error(response.error);

      alert("Se ha generado con éxito la factura");
      descargarFactura(response.Id)
        .then(factura => setDescarga(factura))
        .catch(err => console.error(err));
      onConfirm(selectedFiscalData, isConsolidated);
      setIsInvoiceGenerated(response);
    } catch (error) {
      alert("Ocurrió un error al generar la factura: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Calcular total de noches y monto
  const totalNights = reservationsWithSelectedItems.reduce(
    (sum, reserva) => sum + reserva.nightsCount,
    0
  );
  const totalAmount = reservationsWithSelectedItems.reduce(
    (sum, reserva) =>
      sum +
      reserva.items.reduce(
        (itemSum, item) => itemSum + parseFloat(item.total),
        0
      ),
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
                              IVA: 002, Base: ${totalAmount.toFixed(2)}, Tasa:
                              0.160000, Importe: $
                              {(totalAmount * 0.16).toFixed(2)}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm border-b">
                          ${totalAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-sm border-b">
                          ${totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    // Vista previa detallada
                    reservationsWithSelectedItems
                      .slice(0, 2)
                      .map((reserva, index) => (
                        <tr key={`preview-${reserva.id_solicitud}`}>
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
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">
                Resumen de Items Seleccionados
              </h4>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {totalNights} noche(s) en{" "}
                  {reservationsWithSelectedItems.length} reserva(s)
                </span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">
                    Factura consolidada:
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isConsolidated}
                      onChange={() => setIsConsolidated(!isConsolidated)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-md mb-6">
              {reservationsWithSelectedItems.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  No hay items seleccionados para facturar
                </div>
              ) : (
                reservationsWithSelectedItems.map((reserva) => (
                  <div
                    key={reserva.id_solicitud}
                    className="border-b last:border-b-0"
                  >
                    <div className="bg-gray-50 p-3 sticky top-0 z-10">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">
                            {reserva.hotel} - {formatDate(reserva.check_in)} a{" "}
                            {formatDate(reserva.check_out)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Código: {reserva.codigo_reservacion_hotel || "N/A"}{" "}
                            |{reserva.nightsCount} noche(s)
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          {new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(
                            parseFloat(
                              reserva.items.reduce(
                                (itemSum, item) =>
                                  itemSum + parseFloat(item.total),
                                0
                              )
                            )
                          )}
                        </span>
                      </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Impuestos
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reserva.items.map((item) => (
                          <tr key={item.id_item}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(item.fecha_uso)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {new Intl.NumberFormat("es-MX", {
                                style: "currency",
                                currency: "MXN",
                              }).format(parseFloat(item.subtotal))}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {new Intl.NumberFormat("es-MX", {
                                style: "currency",
                                currency: "MXN",
                              }).format(parseFloat(item.impuestos))}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {new Intl.NumberFormat("es-MX", {
                                style: "currency",
                                currency: "MXN",
                              }).format(parseFloat(item.total))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
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
                      key={data.id_datos_fiscales}
                      className={`border rounded-md p-4 cursor-pointer ${selectedFiscalData?.id_datos_fiscales ===
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
                        {data.estado}, {data.municipio}, {data.colonia}{" "}
                        {data.codigo_postal_fiscal}, {data.calle}
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
                  className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
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
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            {isInvoiceGenerated ? (
              <>
                <a
                  href={`data:application/pdf;base64,${descarga?.Content}`}
                  download="factura.pdf"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Descargar PDF</span>
                </a>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  !selectedFiscalData ||
                  loading ||
                  reservationsWithSelectedItems.length === 0
                }
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!selectedFiscalData ||
                  loading ||
                  reservationsWithSelectedItems.length === 0
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading
                  ? "Generando factura..."
                  : `Facturar ${isConsolidated ? "Consolidada" : "Detallada"}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function ReservationsMain() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchTerm: "",
    statusFilter: "all",
    dateRangeFilter: {
      startDate: null,
      endDate: null,
    },
    priceRangeFilter: {
      min: null,
      max: null,
    },
    estado: "Confirmada",
  });
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState({
    start: "",
    end: "",
  });
  const [localPriceRange, setLocalPriceRange] = useState({
    min: "",
    max: "",
  });
  const [selectedItems, setSelectedItems] = useState<{
    [reservationId: string]: string[];
  }>({});
  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const [expandedReservations, setExpandedReservations] = useState<string[]>(
    []
  );

  useEffect(() => {
    fetchReservations();
  }, []);

  const getReservationStatus = (
    reservation: Reservation
  ): ReservationStatus => {
    if (reservation.pendiente_por_cobrar > 0) return "pending";
    if (reservation.id_booking) return "confirmed";
    return "completed";
  };

  const fetchReservations = async () => {
    setLoading(true);
    await fetchReservationsFacturacion((data) => {
      console.log(data);
      setReservations(data);
      setLoading(false);
    }).catch((err) => {
      setError("Error al cargar las reservaciones");
      setLoading(false);
      console.error(err);
    });
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(parseFloat(value));
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilterOptions((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const toggleReservationSelection = (reservationId: string) => {
    const reservation = reservations.find(
      (r) => r.id_servicio === reservationId
    );
    if (!reservation || !reservation.items) return;

    const itemsFacturables = reservation.items
      .filter((item) => item?.id_factura == null)
      .map((item) => item.id_item);

    setSelectedItems((prev) => {
      const currentSelected = prev[reservationId] || [];

      // Si ya están todos seleccionados, deseleccionar
      if (currentSelected.length === itemsFacturables.length) {
        const newState = { ...prev };
        delete newState[reservationId];
        return newState;
      }

      // Seleccionar solo los facturables
      return {
        ...prev,
        [reservationId]: itemsFacturables,
      };
    });
  };

  // Modifica la función de selección para ignorar items ya facturados
  const toggleItemSelection = (reservationId: string, itemId: string) => {
    const reservation = reservations.find(
      (r) => r.id_servicio === reservationId
    );
    const item = reservation?.items.find((i) => i.id_item === itemId);

    // No hacer nada si el item ya está facturado
    if (item?.id_factura != null) return;

    setSelectedItems((prev) => {
      const currentSelected = prev[reservationId] || [];

      if (currentSelected.includes(itemId)) {
        // Deseleccionar el item
        const newSelected = currentSelected.filter((id) => id !== itemId);
        if (newSelected.length === 0) {
          const newState = { ...prev };
          delete newState[reservationId];
          return newState;
        }
        return {
          ...prev,
          [reservationId]: newSelected,
        };
      } else {
        // Seleccionar el item
        return {
          ...prev,
          [reservationId]: [...currentSelected, itemId],
        };
      }
    });
  };

  const toggleSelectAll = () => {
    const allSelected =
      getAllSelectedItems().length === getAllSelectableItems().length;

    if (allSelected) {
      // Deseleccionar todo
      setSelectedItems({});
    } else {
      // Seleccionar todo
      const newSelectedItems: { [key: string]: string[] } = {};

      filteredReservations.forEach((reservation) => {
        if (reservation.id_factura == null) {
          newSelectedItems[reservation.id_servicio] = reservation.items.map(
            (item) => item.id_item
          );
        }
      });

      setSelectedItems(newSelectedItems);
    }
  };

  const toggleExpandReservation = (reservationId: string) => {
    setExpandedReservations((prev) =>
      prev.includes(reservationId)
        ? prev.filter((id) => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const handleFacturar = () => {
    setShowFacturacionModal(true);
  };

  const confirmFacturacion = async (
    fiscalData: FiscalData,
    isConsolidated: boolean
  ) => {
    try {
      setLoading(true);
      // Aquí iría tu lógica para facturar
      console.log("Facturando items:", selectedItems);

      // Simulación de éxito en facturación
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Elimina esto en producción

      // Refrescar los datos
      await fetchReservations();

      setShowFacturacionModal(false);
      setSelectedItems({});
    } catch (error) {
      console.error("Error al facturar:", error);
      setLoading(false);
    }
  };

  // Obtener todos los items seleccionados
  const getAllSelectedItems = () => {
    return Object.values(selectedItems).flat();
  };

  // Obtener todos los items que se pueden seleccionar (sin factura)
  const getAllSelectableItems = () => {
    return filteredReservations
      .filter((reservation) => reservation.id_factura == null)
      .flatMap(
        (reservation) => reservation.items?.map((item) => item.id_item) || []
      );
  };

  // Verificar si una reservación está completamente seleccionada
  const isReservationFullySelected = (reservationId: string) => {
    const reservation = reservations.find(
      (r) => r.id_servicio === reservationId
    );
    if (!reservation) return false;

    const itemsFacturables = reservation.items
      .filter((item) => item.id_factura == null)
      .map((item) => item.id_item);

    const selected = selectedItems[reservationId] || [];
    return selected.length > 0 && selected.length === itemsFacturables.length;
  };

  // Verificar si un item está seleccionado
  const isItemSelected = (reservationId: string, itemId: string) => {
    return (selectedItems[reservationId] || []).includes(itemId);
  };

  const applyFilters = (reservations: Reservation[]): Reservation[] => {
    return reservations.filter((reservation) => {
      // Search term filter
      const searchLower = filterOptions.searchTerm.toLowerCase();
      const matchesSearch =
        !filterOptions.searchTerm ||
        reservation.hotel.toLowerCase().includes(searchLower) ||
        reservation.codigo_reservacion_hotel
          .toLowerCase()
          .includes(searchLower) ||
        reservation.nombre_agente_completo
          .toLowerCase()
          .includes(searchLower) ||
        reservation?.razon_social?.toLowerCase().includes(searchLower) ||
        reservation?.id_usuario_generador?.toLowerCase().includes(searchLower);

      // Status filter
      const status = getReservationStatus(reservation);
      const matchesStatus =
        filterOptions.statusFilter === "all" ||
        status === filterOptions.statusFilter;

      // Date range filter
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      const matchesDateRange =
        (!filterOptions.dateRangeFilter.startDate ||
          checkIn >= filterOptions.dateRangeFilter.startDate) &&
        (!filterOptions.dateRangeFilter.endDate ||
          checkOut <= filterOptions.dateRangeFilter.endDate);

      // Price range filter
      const price = parseFloat(reservation.total);
      const matchesPriceRange =
        (filterOptions.priceRangeFilter.min === null ||
          price >= filterOptions.priceRangeFilter.min) &&
        (filterOptions.priceRangeFilter.max === null ||
          price <= filterOptions.priceRangeFilter.max);
      const isConfirmada = filterOptions.estado === "Confirmada";
      return (
        matchesSearch &&
        matchesStatus &&
        matchesDateRange &&
        matchesPriceRange &&
        isConfirmada
      );
    });
  };

  const filteredReservations = applyFilters(reservations);
  const reservacionesFacturables = filteredReservations.filter(
    (reservation): boolean => {
      return (
        reservation?.items?.some((item) => item?.id_factura == null) ?? false
      );
    }
  );
  console.log(reservacionesFacturables);
  const totalSelectedItems = getAllSelectedItems().length;

  return (
    <div className="min-h-screen">
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Selection Bar */}
        {totalSelectedItems > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-blue-800 font-medium">
                {totalSelectedItems} item(s) seleccionado(s)
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedItems({})}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-100"
              >
                Deseleccionar todo
              </button>
              <button
                onClick={handleFacturar}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                disabled={totalSelectedItems === 0}
              >
                Facturar seleccionados
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              {/* Basic Filters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar nombre de cliente, empresa o ID cliente..."
                    value={filterOptions.searchTerm}
                    onChange={(e) =>
                      handleFilterChange({ searchTerm: e.target.value })
                    }
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                </div>

                {/* <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filterOptions.statusFilter}
                    onChange={(e) =>
                      handleFilterChange({
                        statusFilter: e.target.value as ReservationStatus,
                      })
                    }
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select> */}
              </div>

              {/* Advanced Filters Toggle */}
              <div className="flex justify-between items-center gap-2">
                <button
                  onClick={() =>
                    setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)
                  }
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isAdvancedFiltersOpen
                    ? "Ocultar filtros avanzados"
                    : "Mostrar filtros avanzados"}
                  <span
                    className={`ml-2 transition-transform duration-200 ${isAdvancedFiltersOpen ? "rotate-180" : ""
                      }`}
                  >
                    ▼
                  </span>
                </button>
                <SubirFactura></SubirFactura>
              </div>

              {/* Advanced Filters */}
              {isAdvancedFiltersOpen && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango de fechas
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={localDateRange.start}
                          onChange={(e) => {
                            setLocalDateRange((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }));
                            handleFilterChange({
                              dateRangeFilter: {
                                ...filterOptions.dateRangeFilter,
                                startDate: e.target.value
                                  ? new Date(e.target.value)
                                  : null,
                              },
                            });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={localDateRange.end}
                          onChange={(e) => {
                            setLocalDateRange((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }));
                            handleFilterChange({
                              dateRangeFilter: {
                                ...filterOptions.dateRangeFilter,
                                endDate: e.target.value
                                  ? new Date(e.target.value)
                                  : null,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango de precio
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Mínimo"
                          value={localPriceRange.min}
                          onChange={(e) => {
                            setLocalPriceRange((prev) => ({
                              ...prev,
                              min: e.target.value,
                            }));
                            handleFilterChange({
                              priceRangeFilter: {
                                ...filterOptions.priceRangeFilter,
                                min: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Máximo"
                          value={localPriceRange.max}
                          onChange={(e) => {
                            setLocalPriceRange((prev) => ({
                              ...prev,
                              max: e.target.value,
                            }));
                            handleFilterChange({
                              priceRangeFilter: {
                                ...filterOptions.priceRangeFilter,
                                max: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Table */}
          {loading ? (
            <Loader />
          ) : error ? (
            <div className="p-6 bg-red-50 border-t border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="relative px-6 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={
                          totalSelectedItems > 0 &&
                          totalSelectedItems === getAllSelectableItems().length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      id Cliente
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Cliente
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Creado
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      hotel
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      código hotel
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      viajero
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      check in
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      check out
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      noches
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Habitación
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      costo proveedor
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      precio de venta
                    </th>
                    {/* <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Estado de pago
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservacionesFacturables.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No se encontraron reservaciones con los filtros
                        actuales.
                      </td>
                    </tr>
                  ) : (
                    reservacionesFacturables.map((reservation) => (
                      <React.Fragment key={reservation.id_servicio}>
                        {/* Fila de la reservación */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() =>
                                toggleExpandReservation(reservation.id_servicio)
                              }
                              className="mr-2 p-1 text-gray-500 hover:text-gray-700"
                            >
                              {expandedReservations.includes(
                                reservation.id_servicio
                              ) ? (
                                <ChevronUpIcon className="h-5 w-5" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5" />
                              )}
                            </button>
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={isReservationFullySelected(
                                reservation.id_servicio
                              )}
                              onChange={() =>
                                toggleReservationSelection(
                                  reservation.id_servicio
                                )
                              }
                              disabled={
                                !reservation.items.some(
                                  (item) => item.id_factura == null
                                )
                              }
                            />
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-800 font-medium">
                            {reservation.id_usuario_generador}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                            {reservation.razon_social}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                            {format(
                              new Date(reservation.created_at),
                              "dd/MM/yyyy"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900 overflow-hidden text-ellipsis max-w-[400px]">
                            {reservation.hotel}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                            {reservation.codigo_reservacion_hotel}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                            {reservation.nombre_viajero_completo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                            {format(
                              new Date(reservation.check_in),
                              "dd/MM/yyyy"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                            {format(
                              new Date(reservation.check_out),
                              "dd/MM/yyyy"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                            {calculateNights(
                              reservation.check_in,
                              reservation.check_out
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 capitalize">
                            {reservation.room}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 capitalize">
                            ${reservation.costo_total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 capitalize">
                            ${reservation.total}
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            {formatCurrency(reservation.total)}
                            {reservation.pendiente_por_cobrar > 0 && (
                              <div className="text-xs text-amber-600 mt-1">
                                Pendiente:{" "}
                                {formatCurrency(
                                  reservation.pendiente_por_cobrar.toString()
                                )}
                              </div>
                            )}
                          </td> */}
                          {/* <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge
                              status={getReservationStatus(reservation)}
                            />
                          </td> */}
                        </tr>

                        {/* Fila expandible con los items */}
                        {expandedReservations.includes(
                          reservation.id_servicio
                        ) && (
                            <tr className="bg-gray-50">
                              <td colSpan={13} className="px-6 py-4">
                                <div className="ml-8">
                                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                                    Items (Noches) de la reservación
                                  </h4>
                                  <div className="flex items-center mb-2">
                                    <span className="text-xs text-gray-500">
                                      {
                                        reservation.items.filter(
                                          (item) => item.id_factura == null
                                        ).length
                                      }{" "}
                                      noche(s) pendientes por facturar
                                    </span>
                                  </div>
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Selección
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Fecha de uso
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Subtotal
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Impuestos
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Total
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Estado facturación
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {reservation.items.map((item) => (
                                        <tr
                                          key={item.id_item}
                                          className={`hover:bg-gray-50 ${item.id_factura != null
                                            ? "bg-gray-100"
                                            : ""
                                            }`}
                                        >
                                          <td className="px-4 py-2 whitespace-nowrap">
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                              checked={isItemSelected(
                                                reservation.id_servicio,
                                                item.id_item
                                              )}
                                              onChange={() =>
                                                toggleItemSelection(
                                                  reservation.id_servicio,
                                                  item.id_item
                                                )
                                              }
                                              disabled={item.id_factura != null}
                                            />
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                            {item.fecha_uso}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                            {formatCurrency(
                                              item.subtotal.toString()
                                            )}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                            {formatCurrency(
                                              item.impuestos.toString()
                                            )}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                            {formatCurrency(
                                              item.total.toString()
                                            )}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-xs">
                                            {item.id_factura != null ? (
                                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                Facturado
                                              </span>
                                            ) : (
                                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Pendiente
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Facturación Modal */}
      {showFacturacionModal && (
        <FacturacionModal
          selectedItems={selectedItems}
          reservationsInit={reservations}
          onClose={() => setShowFacturacionModal(false)}
          onConfirm={confirmFacturacion}
        />
      )}
    </div>
  );
}
