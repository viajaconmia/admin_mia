import React, { useEffect, useState, useRef } from "react";
import { DollarSign, X, Moon, Shuffle, Search } from "lucide-react";
import { URL, API_KEY } from "@/lib/constants/index";
import { Table3 } from "@/components/organism/Table3";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SaldoFavor } from "@/services/SaldoAFavor";
import Modal from "../organism/Modal";
import Button from "../atom/Button";
import { useAlert } from "@/context/useAlert";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";


interface TableRow {
  id_item: string;
  total: number;
  codigo: string; 
  descripcion: string;
  fecha_uso: string;
  checkout: string;
  seleccionado: boolean;
  saldo: number;
}

interface ReservaConItems {
  id_reserva: string;
  codigo_reserva: string;
  codigo_reservacion_hotel: string;
  items: Array<{
    id_item: string;
    descripcion: string;
    precio: number;
  }>;
  nombre_hotel: string;
  check_in: string;
  check_out: string;
  viajero: string;
  status_reserva: string;
  items_info: {
    items: Array<{
      id_item: string;
      total: number;
      saldo: number;
      servicio: string;
    }>;
  };
}

interface SelectedItem {
  id_item: string;
  saldo: number;
}

interface PagarModalProps {
  saldoData?: {
    id_saldos: string;
    id_agente: string;
    nombre: string;
    monto: number;
    saldo: number;
    fecha_pago?: string;
    metodo_pago?: string;
    referencia?: string;
    comentario?: string;
  };
  rowData?: any;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  open?: boolean;
  reservaData?: {
    id_agente: string;
    Total?: number;
    Noches?: number;
    hotel?: any; // The entire hotel object
    habitacion?: string;
    check_in?: string;
    check_out?: string;
    codigo_reservacion_hotel?: string;
    viajero?: any; // The entire viajero object
    venta?: any; // The entire venta object
    estado_reserva?: string;
    comments?: string;
    proveedor?: any; // The entire proveedor object
    impuestos?: any; // The entire impuestos object
    items?: any[]; // The array of item objects
    solicitud?: any; // The entire solicitud object
    nuevo_incluye_desayuno?: any;
    acompanantes?: any[];
    status_reserva?: string;
    // otros campos que pueda tener reservaData
  } | null;
  facturaData?: {
    id_factura: string;
    nombre_agente: string;
    id_agente: string;
    monto: number;
  } | null;
}



export const PagarModalComponent: React.FC<PagarModalProps> = ({
  saldoData,
  rowData,
  onClose,
  onSubmit, 
  open = true,
  reservaData = null,
  facturaData = null,
}) => {
  // console.log("reservaData recibida:", reservaData);
  // console.log("facturas recibida:", facturaData);
  const { showNotification } = useAlert();
  const { hasPermission } = usePermiso();
  // Helper global para dinero
const MONEY_TOLERANCE_CENTS = 1;

const toCents = (v: any): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
};

const fromCents = (c: number): number => Number((c / 100).toFixed(2));

const toMoney = (v: any): number => fromCents(toCents(v));

const isZeroMoney = (v: any): boolean =>
  Math.abs(toCents(v)) <= MONEY_TOLERANCE_CENTS;

const exceedsMoney = (
  a: any,
  b: any,
  toleranceCents = MONEY_TOLERANCE_CENTS,
): boolean => {
  return toCents(a) > toCents(b) + toleranceCents;
};

const sumMoney = (values: any[] = []): number => {
  const totalCents = values.reduce((acc, value) => acc + toCents(value), 0);
  return fromCents(totalCents);
};

const getSaldoMonto = (saldo: any, isFacturaMode: boolean) => {
  return isFacturaMode
    ? Number(saldo?.monto_por_facturar ?? 0)
    : Number(saldo?.saldo ?? 0);
};

const isWalletCredito = (saldo: any) =>
  hasPermission(PERMISOS.COMPONENTES.BOTON.WALLET_CREDITO) ? false : Number(saldo?.is_wallet_credito ?? 0) === 1;

const isSaldoActivoVisible = (saldo: any, isFacturaMode: boolean) => {
  if (!saldo) return false;
  if (Number(saldo?.is_cancelado ?? 0) === 1) return false;
  console.log(saldo)
  if (isWalletCredito(saldo)) return false;
  console.log("paso",saldo)

  const monto = getSaldoMonto(saldo, isFacturaMode);

  if (isFacturaMode) {
    return Number(monto) > 0 && !isZeroMoney(monto);
  }

  return saldo?.activo !== 0 && !isZeroMoney(monto);
};

const normalizeSaldoFavorData = (
  saldos: any[] = [],
  isFacturaMode: boolean,
) => {
  return saldos.filter((saldo) => isSaldoActivoVisible(saldo, isFacturaMode));
};

  // Funciones para manejar las facturas
const facturas = Array.isArray(facturaData) ? facturaData : [];

const montos = facturas.map((factura) => Number(factura.monto || 0));
const saldos = facturas.map((factura) => Number(factura.saldo || 0));

const totalMonto = sumMoney(montos);
const totalSaldo = sumMoney(saldos);

console.log("Total saldos:", saldos);
console.log("Total saldo exacto:", totalSaldo);


  // Si no hay saldoData pero hay reservaData, crear un saldoData básico
const id_agente =
  reservaData?.id_agente ||
  saldoData?.id_agente ||
  facturas[0]?.id_agente ||
  "desconocido";

const effectiveSaldoData =
  saldoData ||
  (reservaData || facturas.length
    ? {
        id_saldos: "temporal",
        id_agente,
        nombre:
          reservaData?.solicitud?.agente?.nombre ||
          facturas[0]?.nombre_agente ||
          "Agente",
        monto: toMoney(
          reservaData?.Total ??
            (facturas.length > 1 ? totalMonto : montos[0] ?? 0),
        ),
        saldo: toMoney(
          reservaData?.Total ??
            (facturas.length > 1 ? totalSaldo : saldos[0] ?? 0),
        ),
      }
    : {
        id_saldos: "",
        id_agente: "",
        nombre: "",
        monto: 0,
        saldo: 0,
      });

  console.log(effectiveSaldoData, "paornvr iv to");

  const [formData, setFormData] = useState({
    montoPago: effectiveSaldoData.saldo,
    metodoPago: effectiveSaldoData.metodo_pago || "transferencia",
    referencia: effectiveSaldoData.referencia || "",
    fechaPago:
      effectiveSaldoData.fecha_pago || new Date().toISOString().split("T")[0],
  });

  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(
    toMoney(0),
  );
  const [uno, setUno] = useState<number>(1);
  const [montorestante, setMontoRestante] = useState<number>(
    toMoney(effectiveSaldoData.saldo),
  );

  const autoPayTriggered = useRef(false);
  const [reservas, setReservas] = useState<ReservaConItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemsSaldo, setItemsSaldo] = useState<Record<string, number>>({});
  const [originalSaldoItems, setOriginalSaldoItems] = useState<
    Record<string, number>
  >({});
  const [saldoFavorData, setSaldoFavorData] = useState<any[]>([]);
const [busquedaReserva, setBusquedaReserva] = useState("");
  useEffect(() => {
    if (reservaData || facturaData) {
      console.log("ENTRANDO A FACTURA");
      // Nuevo flujo: usar SaldoFavor cuando tenemos reservaData
      fetchSaldoFavorData();
    } else if (effectiveSaldoData.id_agente) {
      // Flujo existente
      fetchReservasConItems();
    }
  }, [effectiveSaldoData.id_agente, reservaData, facturaData]);

  // Función para obtener datos del nuevo flujo (SaldoFavor)
  const fetchSaldoFavorData = async () => {
  try {
    setLoading(true);
    setError(null);

    const agente = reservaData?.id_agente || facturas[0]?.id_agente;
    if (!agente) {
      throw new Error(
        "ID de agente no disponible en reservaData ni facturaData",
      );
    }

    const response = await SaldoFavor.getPagos(agente);
    const saldosFiltrados = normalizeSaldoFavorData(
      response.data || [],
      !!facturaData,
    );

    setSaldoFavorData(saldosFiltrados);

    const initialOriginalSaldo: Record<string, number> = {};
    const initialSaldo: Record<string, number> = {};

    saldosFiltrados.forEach((saldo: any) => {
      const idItem = `saldo-${saldo.id_saldos}`;
      const saldoValor = getSaldoMonto(saldo, !!facturaData);

      initialOriginalSaldo[idItem] = saldoValor;
      initialSaldo[idItem] = saldoValor;
    });

    setOriginalSaldoItems(initialOriginalSaldo);
    setItemsSaldo(initialSaldo);
  } catch (err: any) {
    console.error("Error fetching SaldoFavor data:", err);
    setError(err.message || "Error al cargar los datos de saldo a favor");
  } finally {
    setLoading(false);
  }
};

  // Función para el flujo existente
  const fetchReservasConItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${URL}/mia/reservas/reservasConItemsSinPagar?id_agente=${effectiveSaldoData.id_agente}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Error al obtener las reservas");
      }
      const data = await response.json();
      setReservas(data.data || []);

      const initialOriginalSaldo: Record<string, number> = {};
      const initialSaldo: Record<string, number> = {};

      data.data?.forEach((reserva: ReservaConItems) => {
        reserva.items_info?.items?.forEach((item) => {
          initialOriginalSaldo[item.id_item] = item.saldo;
          initialSaldo[item.id_item] = item.saldo;
        });
      });

      setOriginalSaldoItems(initialOriginalSaldo);
      setItemsSaldo(initialSaldo);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err.message || "Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (id_item: string, saldoOriginal: number) => {
    setSelectedItems((prev) => {
      const isCurrentlySelected = prev.some((item) => item.id_item === id_item);

      const saldoDisponibleTotalC = toCents(effectiveSaldoData.saldo);

      // suma seleccionada actual (en centavos)
      const currentTotalC = prev.reduce(
        (acc, it) => acc + toCents(it.saldo),
        0,
      );

      // saldo actual del item (lo que queda por pagar), en centavos
      const currentSaldoC = toCents(itemsSaldo[id_item] ?? saldoOriginal);

      if (isCurrentlySelected) {
        // ✅ Deseleccionar: quitar ese aplicado y restaurar saldo del item
        const newSelection = prev.filter((item) => item.id_item !== id_item);

        const newTotalC = newSelection.reduce(
          (acc, it) => acc + toCents(it.saldo),
          0,
        );
        const restanteC = saldoDisponibleTotalC - newTotalC;

        setItemsSaldo((prevSaldo) => ({
          ...prevSaldo,
          [id_item]: toMoney(saldoOriginal), // restaurar “original” visible
        }));

        setMontoSeleccionado(fromCents(newTotalC));
        setMontoRestante(fromCents(restanteC));
        return newSelection;
      }

      // ✅ Seleccionar: no exceder el saldo disponible
      if (currentTotalC >= saldoDisponibleTotalC) {
        const mensaje = reservaData
          ? "Ya has pagado la reserva completa"
          : "Ya has utilizado todo tu saldo disponible";
        alert(mensaje);
        return prev;
      }

      const saldoDisponibleC = saldoDisponibleTotalC - currentTotalC;
      const aplicarC = Math.min(currentSaldoC, saldoDisponibleC);

      if (aplicarC <= 0) return prev;

      // nuevo saldo restante del item
      const nuevoSaldoItemC = currentSaldoC - aplicarC;

      setItemsSaldo((prevSaldo) => ({
        ...prevSaldo,
        [id_item]: fromCents(nuevoSaldoItemC),
      }));

      const newTotalC = currentTotalC + aplicarC;
      const restanteC = saldoDisponibleTotalC - newTotalC;

      setMontoSeleccionado(fromCents(newTotalC));
      setMontoRestante(fromCents(restanteC));

      return [...prev, { id_item, saldo: fromCents(aplicarC) }];
    });
  };

  const isItemSelected = (id_item: string): boolean => {
    return selectedItems.some((item) => item.id_item === id_item);
  };

  const formatIdItem = (id: string): string => {
    if (!id) return "";
    return id.length > 4 ? `...${id.slice(-4)}` : id;
  };

  const formatFormaPago = (metodo_pago: string): string => {
    switch (metodo_pago) {
      case "transferencia":
        return "Transferencia Bancaria";
      case "tarjeta credito":
        return "Tarjeta de Crédito";
      case "tarjeta debito":
        return "Tarjeta de Débito";
      case "wallet":
        return "Wallet";
      default:
        return metodo_pago || "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formatToTwoDecimals = (value: number): number => {
        return parseFloat(value.toFixed(2));
      };

      let payload;
      let endpoint;

      if (reservaData && isZeroMoney(montorestante)) {
        payload = {
          bandera: 1, // Siempre 1
          hotel: reservaData.hotel||reservaData.proveedor || null, // Corregido: Usa el objeto 'hotel' completo
          habitacion: reservaData.habitacion || "",
          check_in: reservaData.check_in || "",
          check_out: reservaData.check_out || "",
          codigo_reservacion_hotel: reservaData.codigo_reservacion_hotel || "",
          viajero: reservaData.viajero || {},
          noches: reservaData.Noches || 0,
          venta: reservaData.venta || {},
          estado_reserva: reservaData.estado_reserva ||reservaData.codigo_confirmacion|| "",
          comments: reservaData.comments || "",
          proveedor: reservaData.proveedor || {},
          impuestos: reservaData.impuestos || {},
          items: reservaData.items || [],
          solicitud: reservaData.solicitud || {},
          nuevo_incluye_desayuno: reservaData.nuevo_incluye_desayuno || null,
          acompanantes: reservaData.acompanantes || [],
          intermediario: reservaData.intermediario || null,
          ejemplo_saldos: selectedItems.map((item) => {
            const originalItem = saldoFavorData.find(
              (sf) => `saldo-${sf.id_saldos}` === item.id_item,
            );
            const appliedAmount =
              originalSaldoItems[item.id_item] -
              (itemsSaldo[item.id_item] || 0);

            return {
              id_saldo: originalItem?.id_saldos || "",
              saldo_original: originalItem?.saldo || 0,
              saldo_actual: itemsSaldo[item.id_item] || 0,
              aplicado: appliedAmount,
              id_agente: effectiveSaldoData.id_agente,
              metodo_de_pago: originalItem?.metodo_pago || "wallet",
              fecha_pago: originalItem?.fecha_pago || "",
              concepto: originalItem?.concepto || null,
              referencia: originalItem?.referencia || null,
              currency: "mxn",
              tipo_de_tarjeta: originalItem?.tipo_tarjeta || null,
              link_pago: null,
              last_digits: null,
            };
          }),
        };
        endpoint = "/mia/reservas/operaciones";
      } else if (reservaData && !isZeroMoney(montorestante)) {
        console.log("montoRestante", montorestante);
        alert("Para registrar el pago, debes cubrir el total de la reserva.");
        return;
      } else if (facturaData) {
        const ejemplo_saldos = selectedItems.map((item) => {
          const originalItem = saldoFavorData.find(
            (sf) => `saldo-${sf.id_saldos}` === item.id_item,
          );
          const aplicado =
            (originalSaldoItems[item.id_item] ?? 0) -
            (itemsSaldo[item.id_item] ?? 0);
          console.log(
            "informacion",
            saldoFavorData,
            "original saldo",
            aplicado,
          );
          return {
            id_saldo: originalItem?.id_saldos || "",
            saldo_original: Number(originalItem?.monto_por_facturar || 0),
            saldo_actual: Number(itemsSaldo[item.id_item] ?? 0),
            aplicado: Number(aplicado),
            id_agente: effectiveSaldoData.id_agente,
            metodo_de_pago: originalItem?.metodo_pago || "wallet",
            fecha_pago: originalItem?.fecha_pago || "",
            concepto: originalItem?.concepto || null,
            referencia: originalItem?.referencia || null,
            currency: "mxn",
            tipo_de_tarjeta: originalItem?.tipo_tarjeta || null,
            link_pago: null,
            last_digits: null,
          };
        });

        // Armamos el payload para facturas
        console.log(facturaData, "fnvonvorv");
       const ids_facturas = facturas.map(
  (f) => f.facturaSeleccionada?.id_factura || f.id_factura,
);
        console.log(ids_facturas);
 
        payload = {
          facturaData,
          // Incluye el identificador de la factura y el agente
          id_factura: ids_facturas,
          id_agente: effectiveSaldoData.id_agente,
          // Arreglo de saldos aplicados (igual estructura que en reservaData)
          ejemplo_saldos,
        };

        endpoint = "/mia/factura/AsignarFacturaPagos";
        // endpoint = "/mia/factura/AsignarFacgos";
      } else {
        // Payload existente para el flujo de saldoData
        const tableDataToUse = reservas.flatMap((reserva) =>
          (reserva.items_info?.items || []).map((item) => ({
            id_item: item.id_item,
            id_servicio: item.servicio,
            total: item.total,
            saldo:
              itemsSaldo[item.id_item] !== undefined
                ? itemsSaldo[item.id_item]
                : item.saldo,
          })),
        );

        payload = {
          SaldoAFavor: {
            ...rowData,
            saldo: formatToTwoDecimals(montorestante),
          },
          items_seleccionados: selectedItems.map((item) => {
            const itemData = tableDataToUse.find(
              (td) => td.id_item === item.id_item,
            );
            const saldoItem = itemsSaldo[item.id_item] || 0;
            const totalItem = itemData?.total || 0;
            const servicioItem = itemData?.id_servicio || "";
            const saldoOriginal = originalSaldoItems[item.id_item] || 0;
            const fraccionado =
              saldoItem === 0 ? 0 : formatToTwoDecimals(totalItem - saldoItem);

            return {
              total: formatToTwoDecimals(totalItem),
              saldo: formatToTwoDecimals(saldoOriginal),
              saldonuevo: formatToTwoDecimals(saldoItem),
              id_item: item.id_item,
              fraccion: fraccionado,
              id_servicio: servicioItem,
            };
          }),
        };
        endpoint = "/mia/pagos/aplicarpagoPorSaldoAFavor";
      }

      console.log("endpoint:", URL, endpoint);
      console.log("payload", endpoint);

      const method = facturaData ? "PATCH" : "POST";

      const response = await fetch(`${URL}${endpoint}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al aplicar el pago por saldo a favor");
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      // Llamar a onSubmit si está definido
      if (onSubmit) {
        onSubmit({
          ...formData,
          id_saldos: effectiveSaldoData.id_saldos,
          id_agente: effectiveSaldoData.id_agente,
          itemsAsignados: selectedItems,
        });
      }

      // Cerrar el modal después de enviar
      onClose();
    } catch (error) {
      console.error("Error en la petición:", error);
      showNotification("error", error.message || "Fallo el pago");
    } finally {
      setLoading(false);
      onEnd();
    }
  };

  const tableData =
    reservaData || facturaData
      ? // Datos del nuevo flujo (SaldoFavor)
        saldoFavorData
          .filter((saldo) => saldo.is_cancelado !== 1)
          .filter((saldo) => {
            if (facturaData) {
              // MODO FACTURA: mostrar solo si tiene algo por facturar
              return Number(saldo.monto_por_facturar ?? 0) > 0;
            }

            // MODO RESERVA: no mostrar los que tengan activo = 0
            return saldo.activo !== 0; // o !!saldo.activo
          })
          .filter((saldo) => {
            const rawSaldo = facturaData
              ? Number(saldo.monto_por_facturar)
              : Number(saldo.saldo);

            // usa tu helper con tolerancia
            return !isZeroMoney(rawSaldo);
          })
          .map((saldo) => ({
            creado: saldo.fecha_creacion
              ? new Date(saldo.fecha_creacion)
              : null,
            id_item: `saldo-${saldo.id_saldos}`,
            id_servicio: "",
            codigo_reservacion: saldo.referencia || "",
            hotel: "",
            viajero: "",
            activo: saldo.activo,
            fecha_uso: saldo.fecha_creacion || "",
            total: Number(saldo.monto) || 0,
            item: saldo,
            // Campos adicionales para el nuevo flujo
            forma_De_Pago: formatFormaPago(saldo.metodo_pago),
            tipo_tarjeta: saldo.tipo_tarjeta || "",
            monto_pagado: Number(saldo.monto),
            saldo: facturaData
              ? Number(saldo.monto_por_facturar)
              : Number(saldo.saldo),
            seleccionado: saldo,
            saldo_restante: facturaData
              ? itemsSaldo[`saldo-${saldo.id_saldos}`] !== undefined
                ? itemsSaldo[`saldo-${saldo.id_saldos}`]
                : Number(saldo.monto_por_facturar) || 0
              : itemsSaldo[`saldo-${saldo.id_saldos}`] !== undefined
                ? itemsSaldo[`saldo-${saldo.id_saldos}`]
                : Number(saldo.saldo) || 0,
          }))
      : // Datos del flujo existente
        reservas.flatMap((reserva) =>
          (reserva.items_info?.items || []).map((item) => ({
            id_item: item.id_item,
            id_servicio: item.servicio,
            codigo_reservacion: reserva.codigo_reservacion_hotel||reserva.codigo_confirmacion,
            hotel: reserva.nombre_hotel||reserva.proveedor,
            viajero: reserva.viajero,
            fecha_uso: reserva.check_in,
            total: item.total,
            saldo:
              itemsSaldo[item.id_item] !== undefined
                ? itemsSaldo[item.id_item]
                : item.saldo,
            seleccionado: item,
            item: item,
          })),
        );

  const mostrarBuscadorReservas =
  !reservaData && !facturaData && reservas.length > 5;

const tableDataFiltrada =
  mostrarBuscadorReservas && busquedaReserva.trim()
    ? tableData.filter((row) =>
        String(row.codigo_reservacion || "")
          .toLowerCase()
          .includes(busquedaReserva.trim().toLowerCase()),
      )
    : tableData;

const buscarYSeleccionarReserva = () => {
  const termino = busquedaReserva.trim().toLowerCase();
  if (!termino) return;

  const reservasEncontradas = reservas.filter((reserva) =>
    String(
      reserva.codigo_reservacion_hotel ||
        reserva.codigo_reserva ||
        reserva.codigo_confirmacion ||
        "",
    )
      .toLowerCase()
      .includes(termino),
  );

  if (!reservasEncontradas.length) {
    showNotification("error", "No se encontró ninguna reserva con ese código");
    return;
  }

  reservasEncontradas.forEach((reserva) => {
    (reserva.items_info?.items || []).forEach((item) => {
      if (!isItemSelected(item.id_item)) {
        handleItemSelection(item.id_item, item.saldo);
      }
    });
  });

  setBusquedaReserva("");
};

  // Renderers para la tabla - diferentes según el flujo
  const renderers =
    reservaData || facturaData
      ? {
          // Renderers para el nuevo flujo (SaldoFavor)
          seleccionado: ({ value }: { value: any }) => (
            <input
              type="checkbox"
              checked={isItemSelected(`saldo-${value.id_saldos}`)}
              onChange={() =>
                handleItemSelection(
                  `saldo-${value.id_saldos}`,
                  Number(facturaData ? value.monto_por_facturar : value.saldo),
                )
              }
              className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded`}
            />
          ),
          creado: ({ value }: { value: Date | null }) => {
            if (!value)
              return <div className="text-gray-400 italic">Sin fecha</div>;
            return (
              <div className="whitespace-nowrap text-sm text-blue-900">
                {format(value, "dd 'de' MMMM yyyy", { locale: es })}
              </div>
            );
          },
          monto_pagado: ({ value }: { value: number }) => (
            <span className="font-medium text-sm px-2 py-1 rounded flex items-center justify-center bg-blue-50 text-blue-600">
              ${value.toFixed(2)}
            </span>
          ),

          saldo: ({ value }: { value: number }) => (
            <span
              className={`font-medium text-sm px-2 py-1 rounded flex items-center justify-center ${
                value <= 0
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              ${Number(value).toFixed(2)}
            </span>
          ),
          saldo_restante: ({ value }: { value: number }) => (
            <span
              className={`font-medium text-sm px-2 py-1 rounded flex items-center justify-center ${
                value > 0
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              ${Number(value).toFixed(2)}
            </span>
          ),
          forma_De_Pago: ({ value }: { value: string }) => (
            <span className="font-medium text-gray-800">{value}</span>
          ),
          tipo_tarjeta: ({ value }: { value: string }) => (
            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
              {value || "N/A"}
            </span>
          ),
        }
      : {
          // Renderers para el flujo existente
          id_item: ({ value }: { value: string }) => (
            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
              {formatIdItem(value)}
            </span>
          ),
          id_servicio: ({ value }: { value: string }) => (
            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
              {formatIdItem(value)}
            </span>
          ),
          seleccionado: ({ value }: { value: TableRow }) => (
            <input
              type="checkbox"
              checked={isItemSelected(value.id_item)}
              onChange={() => handleItemSelection(value.id_item, value.saldo)}
              className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded`}
            />
          ),
          total: ({ value }: { value: number }) => (
            <span className="font-medium text-sm px-2 py-1 rounded flex items-center justify-center bg-blue-50 text-blue-600">
              ${value}
            </span>
          ),
          fecha_uso: ({ value }: { value: string | null }) => {
            if (!value)
              return <div className="text-gray-400 italic">Sin fecha</div>;

            return (
              <div className="whitespace-nowrap text-sm text-blue-900">
                {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
              </div>
            );
          },
          checkout: ({ value }: { value: string | null }) => {
            if (!value)
              return <div className="text-gray-400 italic">Sin fecha</div>;
            return (
              <div className="whitespace-nowrap text-sm text-blue-900">
                {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
              </div>
            );
          },
          hotel: ({ value }: { value: string }) => (
            <span className="font-medium text-gray-800">{value}</span>
          ),
          codigo_reservacion: ({ value }: { value: string }) => (
            <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-sm border border-yellow-100">
              {value}
            </span>
          ),
          saldo: ({ value }: { value: number }) => (
            <span
              className={`font-medium text-sm px-2 py-1 rounded flex items-center justify-center ${
                value > 0
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              ${Number(value).toFixed(2)}
            </span>
          ),
        };

  // Columnas personalizadas según el flujo
  const customColumns =
    reservaData || facturaData
      ? [
          "seleccionado",
          "creado",
          "monto_pagado",
          "saldo",
          "forma_De_Pago",
          "tipo_tarjeta",
          "saldo_restante",
        ]
      : [
          "seleccionado",
          "codigo_reservacion",
          "hotel",
          "fecha_uso",
          "total",
          "saldo",
        ];

  // Si el modal no está abierto, no renderizar nada
  if (!open) return null;

  // Selecciona saldos en orden y auto-llama handleSubmit cuando cubre el total
  // Selecciona saldos en orden FIFO y deja todo redondeado a 2 decimales
  
  console.log(facturaData,"1️⃣1️⃣1️⃣1️⃣1️⃣1️⃣1️⃣")
  const seleccionarSaldosEnOrdenYAutoPagar = async () => {
    try {
      const agente = reservaData?.id_agente || facturaData[0]?.id_agente;
      if (!agente)
        throw new Error(
          "ID de agente no disponible en reservaData ni facturaData",
        );

      const response = await SaldoFavor.getPagos(agente);
      const saldosCrudos = response.data || [];

      // Solo aplica con reservaData y una sola vez
      if (!reservaData || autoPayTriggered.current) return;

      const totalReservaC = toCents(reservaData?.Total || 0);

      // FIFO por fecha_creacion (nulos al final)
      const saldosOrdenados = [...saldosCrudos]
        .filter((s) => s?.activo !== 0)
        .sort((a, b) => {
          const ta = a?.fecha_creacion
            ? new Date(a.fecha_creacion).getTime()
            : Number.MAX_SAFE_INTEGER;
          const tb = b?.fecha_creacion
            ? new Date(b.fecha_creacion).getTime()
            : Number.MAX_SAFE_INTEGER;
          return ta - tb;
        });

      const tmpItemsSaldo: Record<string, number> = { ...itemsSaldo };
      const tmpOriginal: Record<string, number> = { ...originalSaldoItems };
      const nuevaSeleccion: SelectedItem[] = [];

      let restanteC = totalReservaC;
      let aplicadoTotalC = 0;

      for (const s of saldosOrdenados) {
        if (restanteC <= 0) break;

        const idItem = `saldo-${s.id_saldos}`;

        // disponible actual (en centavos)
        const disponibleC = toCents(
          typeof tmpItemsSaldo[idItem] === "number"
            ? tmpItemsSaldo[idItem]
            : s?.saldo || 0,
        );

        if (disponibleC <= 0) continue;

        // inicializar mapas si vienen vacíos
        if (tmpOriginal[idItem] === undefined)
          tmpOriginal[idItem] = fromCents(disponibleC);
        if (tmpItemsSaldo[idItem] === undefined)
          tmpItemsSaldo[idItem] = fromCents(disponibleC);

        const aplicarC = Math.min(disponibleC, restanteC);
        if (aplicarC <= 0) continue;

        const nuevoSaldoItemC = disponibleC - aplicarC;

        // guarda saldos ya convertidos a pesos (2 dec)
        tmpItemsSaldo[idItem] = fromCents(nuevoSaldoItemC);
        nuevaSeleccion.push({ id_item: idItem, saldo: fromCents(aplicarC) });

        aplicadoTotalC += aplicarC;
        restanteC -= aplicarC;
      }

      setItemsSaldo(tmpItemsSaldo);
      setOriginalSaldoItems(tmpOriginal);
      setSelectedItems(nuevaSeleccion);

      setMontoSeleccionado(fromCents(aplicadoTotalC));
      setMontoRestante(fromCents(restanteC));

      autoPayTriggered.current = true;
    } catch (error: any) {
      showNotification("error", error.message || "error al seleccionar saldos");
    }
  };
  useEffect(() => {
    if (!autoPayTriggered.current) return;
    const restanteRedondeado = toMoney(montorestante);
    console.log(montorestante, restanteRedondeado, "esto resta");
    if (isZeroMoney(restanteRedondeado) && uno === 1) {
      handleSubmit({
        preventDefault() {},
      } as unknown as React.FormEvent);
      setUno(0);
    }
  }, [montoSeleccionado]);

  const titulo = reservaData
    ? "Informacion del pago de la reserva"
    : "💰 Información del Saldo";

  // if (reservaData) {
  //   const restanteRedondeado = toMoney(montorestante);
  //   console.log(montorestante, restanteRedondeado, "esto resta");
  //   if (isZeroMoney(restanteRedondeado) && uno === 1) {
  //     handleSubmit({ preventDefault() { } } as unknown as React.FormEvent);
  //     setUno(0);
  //   }
  //   return (
  //     <Modal
  //       onClose={() => { onClose() }}
  //     >
  //       Cargando...
  //     </Modal>
  //   );
  // }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100 flex justify-end items-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Sección de Información del Saldo */}
          <div className="bg-white rounded-2xl shadow-md border border-blue-100 mb-6">
            <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100">
              <h3 className="text-blue-800 text-lg font-semibold">{titulo}</h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">
                  Nombre del Agente:
                </span>{" "}
                {effectiveSaldoData.nombre}
              </p>

              {/* Mostrar Total y Noches cuando hay reservaData */}
              {reservaData && (
                <>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">
                      Total de la Reserva:
                    </span>
                    <span className="text-green-600 font-bold">
                      {" "}
                      ${reservaData.Total?.toFixed(2) || "0.00"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700 flex items-center">
                    <span className="font-semibold text-gray-900">Noches:</span>
                    <span className="ml-1 text-blue-600 font-medium flex items-center">
                      <Moon className="w-4 h-4 mr-1" />
                      {reservaData.Noches || 0}
                    </span>
                  </p>
                </>
              )}

              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">
                  Monto Total Disponible:
                </span>
                <span className="text-green-600 font-bold">
                  {" "}
                  ${Number(effectiveSaldoData.monto).toFixed(2)}
                </span>
              </p>

              <div className="mt-4 pt-4 border-t border-blue-100">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monto seleccionado:</p>
                    <p
                      className={`text-lg font-semibold ${
                        exceedsMoney(montoSeleccionado, effectiveSaldoData.saldo)
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      ${Number(montoSeleccionado).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto restante:</p>
                    <p className="text-lg text-green-600 font-semibold">
                      ${Number(montorestante).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Tabla */}
          <div className="mb-6">
            {mostrarBuscadorReservas && (
  <div className="mb-4 flex gap-2">
    <div className="relative flex-1">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={busquedaReserva}
        onChange={(e) => setBusquedaReserva(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            buscarYSeleccionarReserva();
          }
        }}
        placeholder="Buscar por código de reservación hotel"
        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <Button
      onClick={buscarYSeleccionarReserva}
      variant="secondary"
      disabled={loading || !busquedaReserva.trim()}
    >
      Buscar y seleccionar
    </Button>
  </div>
)}
            {loading ? (
              <div className="text-center py-8">
                <p>Cargando {reservaData ? "datos de saldo" : "reservas"}...</p>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>
            ) : tableDataFiltrada.length === 0 ? (
              <div className="text-gray-500 p-4 bg-gray-50 rounded">
                No hay{" "}
                {reservaData ? "saldos disponibles" : "reservas con items"}{" "}
                pendientes
              </div>
            ) : (
              <div className="min-h-[300px] max-h-[400px] overflow-auto">
                <Table3
                    registros={tableDataFiltrada}
                  renderers={renderers}
                  maxHeight="h-14"
                  customColumns={customColumns}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSubmit}
              variant="primary"
              disabled={exceedsMoney(montoSeleccionado, effectiveSaldoData.saldo) || loading}
              icon={DollarSign}
            >
              Registrar Pago
            </Button>
            <Button
              icon={Shuffle}
              variant="secondary"
              onClick={() => {
                seleccionarSaldosEnOrdenYAutoPagar();
              }}
              disabled={loading}
            >
              Seleccionar automaticamente
            </Button>
            <Button onClick={onClose} variant="warning" disabled={loading}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
