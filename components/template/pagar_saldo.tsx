import React, { useEffect, useState, useRef } from "react";
import { DollarSign, X, Moon } from "lucide-react";
import { URL, API_KEY } from "@/lib/constants/index";
import { Table3 } from "@/components/organism/Table3";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SaldoFavor } from "@/services/SaldoAFavor";
import Modal from "../organism/Modal";

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
  console.log("reservaData recibida:", reservaData);
  console.log("facturas recibida:", facturaData);

  // Funciones para manejar las facturas
  function obtenerMontosFacturas(facturas_Data) {
    return facturas_Data.map((factura) => factura.monto);
  }

  function obtenerSaldosFacturas(facturas_Data) {
    return facturas_Data.map((factura) => factura.saldo);
  }

  function sumarMontos(montosArray) {
    return montosArray.reduce((total, monto) => total + parseFloat(monto), 0);
  }

  let montos = 0;
  let saldos = 0;
  let totalMonto = 0;
  let totalSaldo = 0;

  if (facturaData != null) {
    montos = obtenerMontosFacturas(facturaData);
    saldos = obtenerSaldosFacturas(facturaData);
    console.log("Total :", saldos);

    totalMonto = sumarMontos(montos);
    totalSaldo = sumarMontos(saldos);

    console.log("Total sumado:", totalMonto);
    console.log("Total sumado:", totalSaldo);
  }
  const id_agente =
    reservaData?.id_agente || facturaData?.id_agente || "desconocido";
  // Si no hay saldoData pero hay reservaData, crear un saldoData básico
  const effectiveSaldoData =
    saldoData ||
    (reservaData || facturaData
      ? {
          id_saldos: "temporal",
          id_agente: id_agente,
          nombre:
            reservaData?.solicitud.agente.nombre ||
            facturaData?.nombre_agente ||
            "Agente",
          monto: reservaData?.Total || montos || 0,
          saldo: reservaData?.Total || saldos || 0,
        }
      : {
          id_saldos: "",
          id_agente: "",
          nombre: "",
          monto: 0,
          saldo: 0,
        });

  console.log(effectiveSaldoData);

  const [formData, setFormData] = useState({
    montoPago: effectiveSaldoData.saldo,
    metodoPago: effectiveSaldoData.metodo_pago || "transferencia",
    referencia: effectiveSaldoData.referencia || "",
    fechaPago:
      effectiveSaldoData.fecha_pago || new Date().toISOString().split("T")[0],
  });

  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [uno, setUno] = useState<number>(1);
  const [montorestante, setMontoRestante] = useState<number>(
    effectiveSaldoData.saldo
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

  useEffect(() => {
    if (reservaData) {
      // Nuevo flujo: usar SaldoFavor cuando tenemos reservaData
      fetchSaldoFavorData();
    } else if (effectiveSaldoData.id_agente) {
      // Flujo existente
      fetchReservasConItems();
    }
  }, [effectiveSaldoData.id_agente, reservaData]);

  useEffect(() => {
    if (facturaData) {
      // Si recibimos facturaData, seguimos el flujo similar a reservaData
      fetchSaldoFavorData();
    }
  }, [effectiveSaldoData.id_agente, facturaData]);

  // Función para obtener datos del nuevo flujo (SaldoFavor)
  const fetchSaldoFavorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const agente = reservaData?.id_agente || facturaData[0]?.id_agente;
      if (!agente) {
        throw new Error(
          "ID de agente no disponible en reservaData ni facturaData"
        );
      }
      console.log("euuuuuuuuuuuuuuuuuuuuubbbuuuuuuufe", agente);

      const response = await SaldoFavor.getPagos(agente);
      console.log("Datos de SaldoFavor:", response.data);
      setSaldoFavorData(response.data || []);

      // Procesar datos para la tabla
      const initialOriginalSaldo: Record<string, number> = {};
      const initialSaldo: Record<string, number> = {};

      // Adaptar según la estructura real de los datos de SaldoFavor
      response.data?.forEach((saldo: any) => {
        // Para el nuevo flujo, usamos el saldo completo como "item"
        const idItem = `saldo-${saldo.id_saldos}`;
        const saldoValor = Number(saldo.saldo) || 0;

        initialOriginalSaldo[idItem] = saldoValor;
        initialSaldo[idItem] = saldoValor;
      });

      setOriginalSaldoItems(initialOriginalSaldo);
      setItemsSaldo(initialSaldo);
      if (reservaData) {
        seleccionarSaldosEnOrdenYAutoPagar(response.data || []);
      }
    } catch (err) {
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
        }
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
      const currentSaldo = itemsSaldo[id_item] ?? saldoOriginal;

      if (isCurrentlySelected) {
        // Deseleccionar item - restaurar el saldo original
        const newSelection = prev.filter((item) => item.id_item !== id_item);
        const newTotal = newSelection.reduce(
          (sum, item) => sum + item.saldo,
          0
        );
        const restante = effectiveSaldoData.saldo - newTotal;

        // Restaurar el saldo original del item
        setItemsSaldo((prevSaldo) => ({
          ...prevSaldo,
          [id_item]: saldoOriginal,
        }));

        setMontoRestante(restante);
        setMontoSeleccionado(newTotal);
        return newSelection;
      } else {
        // Verificar si ya se ha alcanzado el límite
        const currentTotal = prev.reduce((sum, item) => sum + item.saldo, 0);
        const mensaje = reservaData
          ? "Ya has pagado la reserva completa"
          : "Ya has utilizado todo tu saldo disponible";
        if (currentTotal >= effectiveSaldoData.saldo) {
          alert(mensaje);
          return prev;
        }

        // Calcular cuánto podemos aplicar de este ítem
        const saldoDisponible = effectiveSaldoData.saldo - currentTotal;
        const montoAAplicar = Math.min(currentSaldo, saldoDisponible);

        // Actualizar el saldo del ítem (lo que queda por payar)
        const nuevoSaldoItem = currentSaldo - montoAAplicar;
        setItemsSaldo((prevSaldo) => ({
          ...prevSaldo,
          [id_item]: nuevoSaldoItem,
        }));

        const newTotal = currentTotal + montoAAplicar;
        const restante = effectiveSaldoData.saldo - newTotal;

        const newSelection = [...prev, { id_item, saldo: montoAAplicar }];
        setMontoRestante(restante);
        setMontoSeleccionado(newTotal);
        return newSelection;
      }
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

    const formatToTwoDecimals = (value: number): number => {
      return parseFloat(value.toFixed(2));
    };

    let payload;
    let endpoint;

    if (reservaData && Number(montorestante.toFixed(0)) == 0) {
      payload = {
        bandera: 1, // Siempre 1
        hotel: reservaData.hotel || null, // Corregido: Usa el objeto 'hotel' completo
        habitacion: reservaData.habitacion || "",
        check_in: reservaData.check_in || "",
        check_out: reservaData.check_out || "",
        codigo_reservacion_hotel: reservaData.codigo_reservacion_hotel || "",
        viajero: reservaData.viajero || {},
        noches: reservaData.Noches || 0,
        venta: reservaData.venta || {},
        estado_reserva: reservaData.estado_reserva || "",
        comments: reservaData.comments || "",
        proveedor: reservaData.proveedor || {},
        impuestos: reservaData.impuestos || {},
        items: reservaData.items || [],
        solicitud: reservaData.solicitud || {},
        nuevo_incluye_desayuno: reservaData.nuevo_incluye_desayuno || null,
        acompanantes: reservaData.acompanantes || [],
        ejemplo_saldos: selectedItems.map((item) => {
          const originalItem = saldoFavorData.find(
            (sf) => `saldo-${sf.id_saldos}` === item.id_item
          );
          const appliedAmount =
            originalSaldoItems[item.id_item] - (itemsSaldo[item.id_item] || 0);

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
    } else if (reservaData && Number(montorestante.toFixed(0)) > 0) {
      console.log("montoRestante", montorestante);
      alert("Para registrar el pago, debes cubrir el total de la reserva.");
      return;
    } else if (facturaData) {
      console.log(
        selectedItems.map((item) => {
          const originalItem = saldoFavorData.find(
            (sf) => `saldo-${sf.id_saldos}` === item.id_item
          );
          const appliedAmount =
            originalSaldoItems[item.id_item] - (itemsSaldo[item.id_item] || 0);

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
        })
      );
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
        }))
      );

      payload = {
        SaldoAFavor: {
          ...rowData,
          saldo: formatToTwoDecimals(montorestante),
        },
        items_seleccionados: selectedItems.map((item) => {
          const itemData = tableDataToUse.find(
            (td) => td.id_item === item.id_item
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

    console.log("Payload:", payload);

    try {
      const response = await fetch(`${URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
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
    }
  };
  const tableData =
    reservaData || facturaData
      ? // Datos del nuevo flujo (SaldoFavor)
        saldoFavorData
          .filter((saldo) => saldo.activo !== 0)
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
            saldo: Number(saldo.saldo) || 0,
            seleccionado: saldo,
            saldo_restante:
              itemsSaldo[`saldo-${saldo.id_saldos}`] !== undefined
                ? itemsSaldo[`saldo-${saldo.id_saldos}`]
                : Number(saldo.saldo) || 0,
          }))
      : // Datos del flujo existente
        reservas.flatMap((reserva) =>
          (reserva.items_info?.items || []).map((item) => ({
            id_item: item.id_item,
            id_servicio: item.servicio,
            codigo_reservacion: reserva.codigo_reservacion_hotel,
            hotel: reserva.nombre_hotel,
            viajero: reserva.viajero,
            fecha_uso: reserva.check_in,
            total: item.total,
            saldo:
              itemsSaldo[item.id_item] !== undefined
                ? itemsSaldo[item.id_item]
                : item.saldo,
            seleccionado: item,
            item: item,
          }))
        );

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
                  Number(value.saldo)
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
  const seleccionarSaldosEnOrdenYAutoPagar = (saldosCrudos: any[]) => {
    // helper para redondear a 2 decimales
    const round2 = (n: number) =>
      Math.round((Number(n) + Number.EPSILON) * 100) / 100;

    // Solo aplica con reservaData y una sola vez
    if (!reservaData || autoPayTriggered.current) return;

    // Orden FIFO por fecha_creacion (nulos van al final)
    const saldosOrdenados = [...(saldosCrudos || [])]
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

    // Copias temporales para actualizar estados de manera atómica
    const tmpItemsSaldo: Record<string, number> = { ...itemsSaldo };
    const tmpOriginal: Record<string, number> = { ...originalSaldoItems };
    const nuevaSeleccion: SelectedItem[] = [];

    // Objetivo a cubrir: total de la reserva
    let restante = Number(reservaData?.Total || 0);
    let aplicadoTotal = 0;

    for (const s of saldosOrdenados) {
      if (restante <= 0) break;

      const idItem = `saldo-${s.id_saldos}`;
      const disponibleActual =
        typeof tmpItemsSaldo[idItem] === "number"
          ? Number(tmpItemsSaldo[idItem])
          : Number(s?.saldo || 0);

      // Asegura valores iniciales en los mapas (por si vienen vacíos)
      if (tmpOriginal[idItem] === undefined)
        tmpOriginal[idItem] = Number(s?.saldo || 0);
      if (tmpItemsSaldo[idItem] === undefined)
        tmpItemsSaldo[idItem] = Number(s?.saldo || 0);

      if (disponibleActual <= 0) continue;

      const aplicarRaw = Math.min(disponibleActual, restante);
      const aplicar = round2(aplicarRaw);
      if (aplicar <= 0) continue;

      // Descuenta del saldo del ítem y agrega a la selección
      tmpItemsSaldo[idItem] = round2(disponibleActual - aplicar);
      nuevaSeleccion.push({ id_item: idItem, saldo: aplicar });

      aplicadoTotal = round2(aplicadoTotal + aplicar);
      restante = round2(restante - aplicar);
    }

    // Logs detallados de lo seleccionado
    const resumenSeleccion = nuevaSeleccion.map((sel) => {
      const original = Number(tmpOriginal[sel.id_item] ?? 0);
      const final = Number(tmpItemsSaldo[sel.id_item] ?? 0);
      const aplicado = round2(original - final);
      return {
        id_item: sel.id_item,
        aplicado,
        saldo_inicial: round2(original),
        saldo_final: round2(final),
      };
    });

    console.log("=== Saldos seleccionados (FIFO) ===");
    resumenSeleccion.forEach((r, idx) => {
      console.log(
        `#${idx + 1} ${r.id_item} | aplicado: $${r.aplicado.toFixed(2)} | ` +
          `inicial: $${r.saldo_inicial.toFixed(
            2
          )} -> final: $${r.saldo_final.toFixed(2)}`
      );
    });

    // Actualiza estados coherentemente
    setItemsSaldo(tmpItemsSaldo);
    setOriginalSaldoItems(tmpOriginal);
    setSelectedItems(nuevaSeleccion);
    setMontoSeleccionado(round2(aplicadoTotal));

    // En flujo de reserva, el "saldo disponible" (effectiveSaldoData.saldo) es el Total
    const saldoDisponible = Number(effectiveSaldoData?.saldo || 0);
    const nuevoRestante = round2(saldoDisponible - aplicadoTotal);
    setMontoRestante(nuevoRestante);

    console.log(`Monto seleccionado total: $${aplicadoTotal.toFixed(2)}`);
    console.log(`Monto restante total: $${montorestante.toFixed(2)}`);
  };

  const titulo = reservaData
    ? "Informacion del pago de la reserva"
    : "💰 Información del Saldo";

  if (reservaData) {
    console.log(montorestante, "esto resta");
    if (montorestante == 0 && uno == 1) {
      handleSubmit({ preventDefault() {} } as unknown as React.FormEvent);
      setUno(0);
    }
    return (
      <Modal
        onClose={function (): void {
          throw new Error("Function not implemented.");
        }}
      >
        Cargando...
      </Modal>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-50 rounded-t-2xl px-6 py-4 border-b border-blue-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-blue-800">
            Aplicar Pago con Saldo a Favor
          </h2>
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
                        Number(montoSeleccionado) > effectiveSaldoData.saldo
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
            {loading ? (
              <div className="text-center py-8">
                <p>Cargando {reservaData ? "datos de saldo" : "reservas"}...</p>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>
            ) : tableData.length === 0 ? (
              <div className="text-gray-500 p-4 bg-gray-50 rounded">
                No hay{" "}
                {reservaData ? "saldos disponibles" : "reservas con items"}{" "}
                pendientes
              </div>
            ) : (
              <div className="min-h-[300px] max-h-[400px] overflow-auto">
                <Table3
                  registros={tableData}
                  renderers={renderers}
                  maxHeight="100%"
                  customColumns={customColumns}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={montoSeleccionado > effectiveSaldoData.saldo}
            >
              <DollarSign className="w-4 h-4" />
              Registrar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
