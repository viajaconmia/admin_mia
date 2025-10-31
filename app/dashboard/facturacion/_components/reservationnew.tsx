"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchReservationsFacturacion } from "@/services/reservas";
import { Table4 } from "@/components/organism/Table4";
import { format } from "date-fns";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types";
import { FacturacionModal } from "@/app/dashboard/facturacion/_components/reservations-main";
import SubirFactura from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";
import { Balance } from "@/app/dashboard/facturas-pendientes/balance";
import BalanceSummary from "@/app/dashboard/facturas-pendientes/balance";
import { fetchPagosPrepagobalance } from "@/services/pagos";
import { formatDate } from "@/helpers/utils";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
// ---------- Tipos mínimos ----------
interface Item {
  id_item: string;
  id_factura: string | null;
  total: string;
  subtotal: string;
  impuestos: string;
  fecha_uso: string;
}

interface Reservation {
  id_servicio: string;
  created_at: string;
  id_usuario_generador: string;
  razon_social?: string;
  nombre_viajero?: string | null;
  hotel: string;
  codigo_reservacion_hotel: string | null;
  check_in: string;
  check_out: string;
  room: string;
  total: string;
  costo_total?: string;
  pendiente_por_cobrar: number;
  id_booking: string | null;
  id_factura: string | null;
  items?: Item[];
}

interface ReservationWithItems extends Reservation {
  items: Item[];
}

type SelectedMap = { [id_servicio: string]: string[] };

// ---------- Helpers selección ----------
const isItemFacturable = (it: Item) => it?.id_factura == null;

const getSelectableItemsOfReservation = (r: Reservation) =>
  (r.items ?? []).filter(isItemFacturable).map((i) => i.id_item);

const hasPendingItems = (r: Reservation) =>
  (r.items ?? []).some((it) => it?.id_factura == null);

// --- Tabla perezosa de items (solo se monta si la fila está expandida) ---
const LazyItemsTable = React.memo(function LazyItemsTable({
  reservationId,
  getReservationById,
  isItemSelected,
  toggleItemSelection,
  adjustItemDates,
}: {
  reservationId: string;
  getReservationById: (id: string) => ReservationWithItems | undefined;
  isItemSelected: (reservationId: string, itemId: string) => boolean;
  toggleItemSelection: (reservationId: string, itemId: string) => void;
  adjustItemDates: (r: ReservationWithItems) => ReservationWithItems;
}) {
  const r = getReservationById(reservationId);
  if (!r) return null;

  // Ajuste de fechas solo cuando se expande
  const reservationWithDates = React.useMemo(
    () => adjustItemDates(r),
    // Si la API te garantiza que los items cambian de ref, puedes usar r.items como dep;
    // si no, usa campos estables como id, check_in/out y longitud de items:
    [r.id_servicio, r.check_in, r.check_out, r.items]
  );

  const items: Item[] = reservationWithDates.items ?? [];
  const factPend = React.useMemo(
    () => items.filter((i) => i.id_factura == null).length,
    [items]
  );

  const fmtMoney = (s: string) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(s || "0"));

  return (
    <div className="p-4 ml-8">
      <h4 className="text-xs font-medium text-gray-700 mb-2">
        Items (Noches) de la reservación
      </h4>
      <div className="flex items-center mb-2">
        <span className="text-xs text-gray-500">
          {factPend} noche(s) pendientes por facturar
        </span>
      </div>

      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Selección
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Noche
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
          {items.map((item) => {
            const disabled = item.id_factura != null;
            const checked = isItemSelected(reservationId, item.id_item);

            return (
              <tr
                key={item.id_item}
                className={`hover:bg-gray-50 ${
                  disabled ? "bg-gray-100 text-gray-500" : ""
                }`}
              >
                <td className="px-4 py-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={checked}
                    onChange={() =>
                      toggleItemSelection(reservationId, item.id_item)
                    }
                    disabled={disabled}
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs">
                  {format(new Date(item.fecha_uso), "dd/MM/yyyy")}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs">
                  {fmtMoney(item.subtotal)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs">
                  {fmtMoney(item.impuestos)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs">
                  {fmtMoney(item.total)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs">
                  {disabled ? (
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

const DEFAULT_RESERVA_FILTERS: TypeFilters = {
  // texto
  id_agente: null, // id_cliente en la tabla (mapea a id_usuario_generador)
  nombre_agente: null, // cliente en la tabla (mapea a razon_social)
  hotel: null, // hotel
  codigo_reservacion: null, // codigo_hotel (mapea a codigo_reservacion_hotel)
  traveler: null, // viajero (mapea a nombre_viajero)
  tipo_hospedaje: null, // opcional - tú lo mapeas si aplica

  // fechas (rango) y qué fecha usar
  filterType: null,
  startDate: null,
  endDate: null,

  // rangos numéricos útiles en columnas mostradas
  markup_start: null,
  markup_end: null,
  startCantidad: null, // para noches mínimas
  endCantidad: null, // para noches máximas

  // otros campos de tu TypeFilters los dejamos fuera para no saturar el modal
};

// ---------- Componente ----------
const ReservationsWithTable4: React.FC = () => {
  const { hasPermission } = usePermiso();
  hasPermission(PERMISOS.VISTAS.FACTURAS_CREDITO);

  //-----------helper de filtro agente------------
  // Calcula y aplica el filtro id_agente según la selección actual
  const updateAgentFilterFromSelection = (nextSelected: SelectedMap) => {
    const selectedReservaIds = Object.keys(nextSelected);
    if (selectedReservaIds.length === 0) {
      setFilters((prev) => ({ ...prev, id_agente: null }));
      return;
    }

    const agentIds = selectedReservaIds
      .map(
        (id) =>
          reservations.find((r) => r.id_servicio === id)?.id_usuario_generador
      )
      .filter((v): v is string => !!v);

    const unique = Array.from(new Set(agentIds));

    // Si todas las seleccionadas son del mismo agente, filtramos por él
    if (unique.length === 1) {
      setFilters((prev) => ({ ...prev, id_agente: unique[0] }));
    } else {
      // Si por alguna razón hay mezcla, no tocamos el filtro (o podrías limpiarlo)
      // setFilters((prev) => ({ ...prev, id_agente: null }));
    }
  };

  const adjustItemDates = (
    reservation: ReservationWithItems
  ): ReservationWithItems => {
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);

    const nights = Math.max(
      0,
      Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    const adjustedItems = (reservation.items ?? []).map((item, index) => {
      // Regla solicitada: si hay más ítems que noches, esos extras se quedan con fecha de check-in
      if (index >= nights) {
        return { ...item, fecha_uso: checkIn.toISOString() };
      }
      const d = new Date(checkIn);
      d.setDate(checkIn.getDate() + index);
      return { ...item, fecha_uso: d.toISOString() };
    });

    return { ...reservation, items: adjustedItems };
  };

  const [filters, setFilters] = useState<TypeFilters>(DEFAULT_RESERVA_FILTERS);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState<boolean>(true);

  // selección por reservación -> ids de items
  const [selectedItems, setSelectedItems] = useState<SelectedMap>({});
  // filas expandibles
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  // modal

  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const [showsubirFacModal, setShowSubirFacModal] = useState(false);

  const [balance, setBalance] = useState<Balance | null>(null);

  const obtenerBalance = async () => {
    try {
      setLoading(true);
      const response = await fetchPagosPrepagobalance();
      const balanceObtenido: Balance = {
        montototal: response.montototal || "0",
        montofacturado: response.montofacturado || "0",
        restante: response.restante || "0",
        total_reservas_confirmadas: response.total_reservas_confirmadas || "3",
      };
      setBalance(balanceObtenido);
    } catch (err) {
      console.error("Error al obtener el balance:", err);
      setError(
        "No se pudieron cargar los saldos de pagos. Intente nuevamente más tarde."
      );
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerBalance();
  }, []);

  // useEffect(() => {
  //   // Llamamos a la función que ajusta las fechas de los ítems
  //   const updatedReservations = reservations.map((reservation) => adjustItemDates(reservation));
  //   setReservations(updatedReservations); // Actualizamos el estado con las reservas con fechas ajustadas
  // }, [reservations]); // Este useEffect se ejecutará cuando las reservas cambien

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchReservationsFacturacion((data: ReservationWithItems[]) => {
        setReservations(data);
      });
    } catch (err) {
      console.error(err);
      setError("Error al cargar las reservaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [asignarData, setAsignarData] = useState<{
    items: string[];
    agentId: string | null;
    initialItemsTotal?: number;
    itemsJson?: string;
  }>({
    items: [],
    agentId: null,
  });

  //------filtrado------
  // Normaliza strings para búsqueda
  const norm = (s?: string | number | null) =>
    (s ?? "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .replace(/\s+/g, " ") // colapsa espacios
      .trim()
      .toUpperCase();

  const itemsIndex = useMemo(() => {
    const map = new Map<string, Item>();
    reservations.forEach((res) =>
      res.items?.forEach((i) => map.set(i.id_item, i))
    );
    return map;
  }, [reservations]);

  // Decide qué campo de fecha usar según filterType
  const pickDate = (r: Reservation, filterType?: TypeFilters["filterType"]) => {
    switch (filterType) {
      case "Check-in":
        return r.check_in;
      case "Check-out":
        return r.check_out;
      case "Creacion":
        return r.created_at;
      default:
        return r.check_in;
    }
  };

  const tokens = (s?: string | null) => norm(s).split(" ").filter(Boolean);

  // Aplica todos los filtros soportados por las columnas de la tabla
  const applyFiltersReservation = (
    list: ReservationWithItems[],
    f: TypeFilters,
    q: string
  ) => {
    const qTokens = tokens(q); // palabras buscadas (AND)

    return list.filter((r) => {
      // ---- 1) SEARCH global (AND por tokens en el "haystack") ----
      if (qTokens.length) {
        const haystack = [
          r.codigo_reservacion_hotel,
          r.id_usuario_generador,
          r.razon_social,
          r.hotel,
          r.nombre_viajero,
          r.id_servicio,
          r.room,
        ]
          .map(norm)
          .join(" | ");

        const okAll = qTokens.every((t) => haystack.includes(t));
        if (!okAll) return false;
      }

      // ---- 2) Filtros por texto exacto / contiene (normalizados) ----
      // id_agente: suele ser id exacto -> igualdad estricta normalizada
      if (f.id_agente) {
        if (norm(r.id_usuario_generador) !== norm(f.id_agente)) return false;
      }

      // nombre_agente, hotel, traveler, codigo_reservacion: contiene (case/accents-insensitive)
      if (f.nombre_agente) {
        if (!norm(r.razon_social).includes(norm(f.nombre_agente))) return false;
      }

      if (f.hotel) {
        if (!norm(r.hotel).includes(norm(f.hotel))) return false;
      }

      if (f.traveler) {
        if (!norm(r.nombre_viajero).includes(norm(f.traveler))) return false;
      }

      if (f.codigo_reservacion) {
        if (
          !norm(r.codigo_reservacion_hotel).includes(norm(f.codigo_reservacion))
        )
          return false;
      }

      // ---- 3) Filtro por fechas (rango) ----
      if (f.startDate || f.endDate) {
        const dateStr = pickDate(r, f.filterType);
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return false;

        if (f.startDate) {
          const sd = new Date(f.startDate as string);
          sd.setHours(0, 0, 0, 0);
          if (d < sd) return false;
        }
        if (f.endDate) {
          const ed = new Date(f.endDate as string);
          ed.setHours(23, 59, 59, 999);
          if (d > ed) return false;
        }
      }

      // ---- 4) Rango noches (startCantidad / endCantidad) ----
      const nights = Math.max(
        0,
        Math.ceil(
          (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      if (typeof f.startCantidad === "number" && nights < f.startCantidad)
        return false;
      if (typeof f.endCantidad === "number" && nights > f.endCantidad)
        return false;

      // ---- 5) Rango markup ----
      const costoProveedor = Number(r.costo_total || 0);
      const precioVenta = Number(r.total || 0);
      const markUp = Math.max(0, precioVenta - costoProveedor);

      if (typeof f.markup_start === "number" && markUp < f.markup_start)
        return false;
      if (typeof f.markup_end === "number" && markUp > f.markup_end)
        return false;

      return true;
    });
  };

  // ---- selección por RESERVA (todos los items facturables) ----
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
      let nextSelected: SelectedMap;
      // Verifica si la selección de este usuario corresponde al mismo agente
      const agentId = reservation.id_usuario_generador;
      const selectedAgentId = Object.keys(prev)
        .map(
          (resId) =>
            reservations.find((r) => r.id_servicio === resId)
              ?.id_usuario_generador
        )
        .find((id) => id !== agentId);

      if (selectedAgentId) {
        alert("No puedes seleccionar ítems de otro agente.");
        return prev; // No se permite la selección de otro agente
      }

      // Si ya están todos, deselecciona
      if (currentSelected.length === itemsFacturables.length) {
        const { [reservationId]: _drop, ...rest } = prev;
        nextSelected = rest;
      } else {
        // seleccionar solo los facturables
        nextSelected = { ...prev, [reservationId]: itemsFacturables };
      }

      // Actualiza el filtro por agente
      updateAgentFilterFromSelection(nextSelected);

      return nextSelected;
    });
  };

  // ---- selección por ITEM (no tocar si ya está facturado) ----
  const toggleItemSelection = (reservationId: string, itemId: string) => {
    const reservation = reservations.find(
      (r) => r.id_servicio === reservationId
    );
    const item = reservation?.items?.find((i) => i.id_item === itemId);
    if (item?.id_factura != null) return; // item ya facturado

    setSelectedItems((prev) => {
      const currentSelected = prev[reservationId] || [];
      if (currentSelected.includes(itemId)) {
        const newSelected = currentSelected.filter((id) => id !== itemId);
        if (newSelected.length === 0) {
          const { [reservationId]: _drop, ...rest } = prev;
          return rest;
        }
        return { ...prev, [reservationId]: newSelected };
      } else {
        return { ...prev, [reservationId]: [...currentSelected, itemId] };
      }
    });
  };

  const isReservationFullySelected = (reservationId: string) => {
    const reservation = reservations.find(
      (r) => r.id_servicio === reservationId
    );
    if (!reservation) return false;

    const itemsFacturables = (reservation.items || [])
      .filter((item) => item.id_factura == null)
      .map((item) => item.id_item);

    const selected = selectedItems[reservationId] || [];
    return selected.length > 0 && selected.length === itemsFacturables.length;
  };

  const isItemSelected = (reservationId: string, itemId: string) =>
    (selectedItems[reservationId] || []).includes(itemId);

  const toggleExpand = (id: string) =>
    setExpandedMap((m) => ({ ...m, [id]: !m[id] }));

  const getAllSelectedItems = () => Object.values(selectedItems).flat();
  const selectedCount = getAllSelectedItems().length;

  // NUEVO: obtener el id del agente a partir de las reservas involucradas
  const getAgentIdForSelection = (): string | null => {
    const reservasSeleccionadas = Object.keys(selectedItems); // ids de reservación con al menos un item
    const agentIds = reservasSeleccionadas
      .map(
        (id) =>
          reservations.find((r) => r.id_servicio === id)?.id_usuario_generador
      )
      .filter((v): v is string => !!v);

    // Deben pertenecer al MISMO agente para esta UX (si quieres mezclar agentes, cambia esta regla)
    const unique = Array.from(new Set(agentIds));
    return unique.length === 1 ? unique[0] : null;
  };

  const handleFacturar = () => setShowFacturacionModal(true);

  const handleSubirfactura = () => setShowSubirFacModal(true);

  const handleAsignar = () => {
    const ids = getAllSelectedItems();
    if (ids.length === 0) return;

    const agentId = getAgentIdForSelection();
    if (!agentId) {
      alert(
        "Selecciona items pertenecientes al mismo agente/cliente para asignar la factura."
      );
      return;
    }

    // Construir el arreglo de objetos { id_item, total:number }
    const itemsForApi = ids
      .map((id_item) => {
        const it = itemsIndex.get(id_item);
        if (!it) return null;
        // total debe ser número (no string)
        const totalNum = Number(it.total ?? 0);
        return { id_item, total: isNaN(totalNum) ? 0 : totalNum };
      })
      .filter(Boolean) as { id_item: string; total: number }[];

    // String final que pide el backend
    const itemsJson = JSON.stringify(itemsForApi);

    // Suma de totales de los items seleccionados
    const initialItemsTotal = itemsForApi.reduce(
      (acc, it) => acc + it.total,
      0
    );

    // Ejemplo: [{"total":841,"id_item":"ite-7f5a401b-8689-45bc-8019-05b91629c912"}]

    setAsignarData({
      items: ids, // sigues manteniendo los ids si los ocupas
      agentId,
      initialItemsTotal,
      itemsJson, // <<< NUEVO: payload listo para enviar
    });
    setShowAsignarModal(true);
  };

  const confirmFacturacion = async () => {
    // después de facturar desde el modal, refrescamos y limpiamos
    await fetchReservations();
    setSelectedItems({});
    setShowFacturacionModal(false);
  };

  const subirFactura = async () => {
    setShowSubirFacModal(false);
  };

  // ---- filas para Table4 ----
  const rows = useMemo(() => {
    // 0) Origen: pendientes o todas
    const base = onlyPending
      ? reservations.filter(hasPendingItems)
      : reservations;

    // 1) Aplica filtros + search
    const filtradas = applyFiltersReservation(base, filters, searchTerm);

    // 2) Mapea a rows de la tabla creando nuevos objetos para React
    return filtradas.map((r, index) => {
      const noches = Math.max(
        0,
        Math.ceil(
          (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      const costoProveedor = Number(r.costo_total || 0);
      const precioVenta = Number(r.total || 0);
      const markUp = Math.max(0, precioVenta - costoProveedor);

      const items = r.items ?? [];
      const totalFacturado = items
        .filter((it) => it?.id_factura != null)
        .reduce((acc, it) => acc + Number((it as any).total || 0), 0);

      const pendientePorFacturar = Math.max(0, precioVenta - totalFacturado);

      return {
        id: `${r.id_servicio}-${index}`, // 🔑 clave única
        seleccionado: { ...r }, // ⚡ nuevo objeto para React
        id_cliente: r.id_usuario_generador,
        cliente: r.razon_social ?? "",
        creado: r.created_at,
        hotel: r.hotel,
        codigo_hotel: r.codigo_reservacion_hotel ?? "",
        viajero: r.nombre_viajero ?? "",
        check_in: r.check_in,
        check_out: r.check_out,
        noches,
        tipo_cuarto: r.room,
        mark_up: markUp,
        precio_de_venta: precioVenta,
        pendiente_por_facturar: pendientePorFacturar,
        total_facturado: totalFacturado,
        detalles: {
          reservaId: r.id_servicio,
        },
      };
    });
  }, [reservations, onlyPending, filters, searchTerm]);

  // ---- renderers de columnas ----
  const renderers = {
    // 1) columna combinada: chevron + checkbox por reserva
    cliente: ({ value }: { value: string }) => (
      <span className="whitespace-nowrap text-xs text-gray-600">
        {value.toUpperCase()}
      </span>
    ),

    seleccionado: ({ value }: { value: Reservation }) => {
      const r = value;
      const checked = isReservationFullySelected(r.id_servicio);
      const disabled = getSelectableItemsOfReservation(r).length === 0;
      const expanded = !!expandedMap[r.id_servicio];

      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleExpand(r.id_servicio)}
            className="p-1 text-gray-500 hover:text-gray-700"
            title={expanded ? "Ocultar items" : "Mostrar items"}
          >
            {expanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>

          <input
            type="checkbox"
            className="h-4 w-4 accent-blue-600"
            checked={checked}
            disabled={disabled}
            onChange={() => toggleReservationSelection(r.id_servicio)}
            title={disabled ? "Sin items facturables" : "Seleccionar reserva"}
          />
        </div>
      );
    },

    creado: ({ value }: { value: string }) => (
      <span className="whitespace-nowrap text-xs text-gray-600">
        {formatDate(value)}
      </span>
    ),
    check_in: ({ value }: { value: string }) => (
      <span className="whitespace-nowrap text-xs text-gray-600">
        {formatDate(value)}
      </span>
    ),
    check_out: ({ value }: { value: string }) => (
      <span className="whitespace-nowrap text-xs text-gray-600">
        {formatDate(value)}
      </span>
    ),
    noches: ({ value }: { value: number }) => <span>{value}</span>,
    tipo_cuarto: ({ value }: { value: string }) => (
      <span className="capitalize">{value}</span>
    ),
    mark_up: ({ value }: { value: number }) => (
      <span>
        {new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(value || 0)}
      </span>
    ),
    precio_de_venta: ({ value }: { value: number }) => (
      <span className="font-semibold">
        {new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(value || 0)}
      </span>
    ),
    pendiente_por_facturar: ({ value }: { value: number }) => (
      <span className="font-semibold text-amber-700">
        {new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(value || 0)}
      </span>
    ),
  };

  // ---- Expanded renderer: tabla de ITEMS (noches) igual al original ----

  // Renderer expandido actualizado
  const getReservationById = React.useCallback(
    (id: string) => reservations.find((rr) => rr.id_servicio === id),
    [reservations]
  );

  // Reemplaza tu expandedRenderer por:
  const expandedRenderer = (row: any) => {
    const reservationId: string = row.detalles?.reservaId ?? row.id;

    return (
      <LazyItemsTable
        key={reservationId} // 🔑 clave única para evitar duplicados
        reservationId={reservationId}
        getReservationById={getReservationById}
        isItemSelected={isItemSelected}
        toggleItemSelection={toggleItemSelection}
        adjustItemDates={adjustItemDates}
      />
    );
  };

  // ---- columnas en el orden solicitado ----
  const columns = [
    "seleccionado",
    "id_cliente",
    "cliente",
    "creado",
    "hotel",
    "codigo_hotel",
    "viajero",
    "check_in",
    "check_out",
    "noches",
    "tipo_cuarto",
    "pendiente_por_facturar", // <<--- NUEVA
    "mark_up",
    "precio_de_venta",
  ];

  return (
    <div className="bg-white rounded-lg p-4 w-full shadow-sm">
      {loading && <div className="mb-2 text-sm text-gray-600">Cargando…</div>}
      {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
      {balance && (
        <BalanceSummary
          balance={balance}
          formatCurrency={formatCurrency} // Pasa la función de formato de divisa
        />
      )}

      <Filters
        onFilter={(f) => setFilters(f)}
        defaultOpen={false}
        defaultFilters={DEFAULT_RESERVA_FILTERS}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <Table4
        registros={rows}
        renderers={renderers}
        customColumns={columns}
        filasExpandibles={expandedMap}
        expandedRenderer={expandedRenderer}
      >
        {/* Botones en el header de Table4 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedItems({})}
            disabled={selectedCount === 0}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              selectedCount === 0
                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                : "text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Deseleccionar todo
          </button>
          <button
            type="button"
            onClick={handleFacturar}
            disabled={selectedCount === 0}
            className={`px-4 py-1.5 text-sm rounded-md ${
              selectedCount === 0
                ? "bg-blue-300 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Facturar ({selectedCount})
          </button>

          <button
            onClick={handleAsignar}
            disabled={selectedCount === 0}
            className={`px-4 py-1.5 text-sm rounded-md ${
              selectedCount === 0
                ? "bg-emerald-300 text-white cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
            title="Asignar factura usando los items seleccionados"
          >
            Asignar ({selectedCount})
          </button>
          <button
            onClick={handleSubirfactura}
            disabled={selectedCount > 0}
            className={`px-4 py-1.5 text-sm rounded-md ${
              selectedCount > 0
                ? "bg-emerald-300 text-white cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
            title="Subir factura sin seleccionar items"
          >
            Subir factura
          </button>
        </div>
      </Table4>

      {showsubirFacModal && (
        <SubirFactura
          autoOpen
          onSuccess={() => {
            // aquí decides qué hacer al cerrar (refrescar lista, toasts, etc.)
            setShowSubirFacModal(false);
          }}
          onCloseExternal={() => setShowSubirFacModal(false)} // opcional
        />
      )}
      {/* Modal de facturación */}
      {showFacturacionModal && (
        <FacturacionModal
          selectedItems={selectedItems}
          reservationsInit={reservations}
          onClose={() => setShowFacturacionModal(false)}
          onConfirm={confirmFacturacion}
        />
      )}

      {/* Modal de Asignación (SubirFactura) */}
      {showAsignarModal && (
        <SubirFactura
          onSuccess={() => {
            confirmFacturacion(); // ya refresca y cierra modal de facturación
            setShowAsignarModal(false);
          }}
          autoOpen
          agentId={asignarData.agentId || undefined}
          initialItems={asignarData.items}
          initialItemsTotal={asignarData.initialItemsTotal}
          itemsJson={asignarData.itemsJson}
          onCloseExternal={() => setShowAsignarModal(false)}
        />
      )}
    </div>
  );
};

export default ReservationsWithTable4;
