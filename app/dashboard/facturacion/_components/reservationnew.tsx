"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchReservationsFacturacion } from "@/services/reservas";
import { Table4 } from "@/components/organism/Table4";
import { format } from "date-fns";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { formatDate } from "@/helpers/utils";
import { FacturacionModal } from "@/app/dashboard/facturacion/_components/reservations-main";

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
  nombre_viajero_completo?: string | null;
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


const getDisplayDateForItem = (r: Reservation, idx: number) => {
  const ci = new Date(r.check_in);
  const co = new Date(r.check_out);
  const nights = Math.max(
    0,
    Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (Number.isNaN(ci.getTime()) || Number.isNaN(co.getTime())) {
    // fallback seguro si vienen fechas raras
    return formatDate(r.check_in);
  }

  if (idx < nights) {
    const d = new Date(ci);
    d.setDate(d.getDate() + idx);
    return format(d, "dd/MM/yyyy");
  }

  // si hay más items que noches, los últimos = check_out
  return format(co, "dd/MM/yyyy");
};


// ---------- Componente ----------
const ReservationsWithTable4: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // selección por reservación -> ids de items
  const [selectedItems, setSelectedItems] = useState<SelectedMap>({});
  // filas expandibles
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  // modal
  const [showFacturacionModal, setShowFacturacionModal] = useState(false);

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

  // ---- selección por RESERVA (todos los items facturables) ----
  const toggleReservationSelection = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id_servicio === reservationId);
    if (!reservation || !reservation.items) return;

    const itemsFacturables = reservation.items
      .filter((item) => item?.id_factura == null)
      .map((item) => item.id_item);

    setSelectedItems((prev) => {
      const currentSelected = prev[reservationId] || [];

      // si ya están todos, deselecciona
      if (currentSelected.length === itemsFacturables.length) {
        const { [reservationId]: _drop, ...rest } = prev;
        return rest;
      }
      // seleccionar solo los facturables
      return { ...prev, [reservationId]: itemsFacturables };
    });
  };

  // ---- selección por ITEM (no tocar si ya está facturado) ----
  const toggleItemSelection = (reservationId: string, itemId: string) => {
    const reservation = reservations.find((r) => r.id_servicio === reservationId);
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
    const reservation = reservations.find((r) => r.id_servicio === reservationId);
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

  const handleFacturar = () => setShowFacturacionModal(true);

  const confirmFacturacion = async () => {
    // después de facturar desde el modal, refrescamos y limpiamos
    await fetchReservations();
    setSelectedItems({});
    setShowFacturacionModal(false);
  };

  // ---- filas para Table4 ----
  const rows = useMemo(() => {
    return reservations.map((r) => {
      const noches = Math.max(
        0,
        Math.ceil(
          (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      );

      const costoProveedor = Number(r.costo_total || 0);
      const precioVenta = Number(r.total || 0);
      const markUp = Math.max(0, precioVenta - costoProveedor); // diferencia simple

      return {
        id: r.id_servicio, // ← NECESARIO para filasExpandibles
        seleccionado: r,   // ← el renderer usa esto (chevron + checkbox)
        id_cliente: r.id_usuario_generador,
        cliente: r.razon_social ?? "",
        creado: r.created_at,
        hotel: r.hotel,
        codigo_hotel: r.codigo_reservacion_hotel ?? "",
        viajero: r.nombre_viajero_completo ?? "",
        check_in: r.check_in,
        check_out: r.check_out,
        noches,
        tipo_cuarto: r.room,
        mark_up: markUp,
        precio_de_venta: precioVenta,

        // necesario para el expandedRenderer
        detalles: {
          reserva: r,
          items: r.items ?? [],
        },
      };
    });
  }, [reservations]);

  // ---- renderers de columnas ----
  const renderers = {
    // 1) columna combinada: chevron + checkbox por reserva
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
        {format(new Date(value), "dd/MM/yyyy")}
      </span>
    ),
    check_in: ({ value }: { value: string }) => (
      <span className="whitespace-nowrap text-xs text-gray-600">
        {format(new Date(value), "dd/MM/yyyy")}
      </span>
    ),
    check_out: ({ value }: { value: string }) => (
      <span className="whitespace-nowrap text-xs text-gray-600">
        {format(new Date(value), "dd/MM/yyyy")}
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
  };

  // ---- Expanded renderer: tabla de ITEMS (noches) igual al original ----

  // Renderer expandido actualizado
  const expandedRenderer = (row: any) => {
    const r: Reservation = row.detalles.reserva;
    const items: Item[] = row.detalles.items ?? [];
    const factPend = items.filter((i) => i.id_factura == null).length;

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
            {items.map((item, idx) => {
              const disabled = item.id_factura != null;
              const checked = isItemSelected(r.id_servicio, item.id_item);

              return (
                <tr
                  key={item.id_item}
                  className={`hover:bg-gray-50 ${disabled ? "bg-gray-100 text-gray-500" : ""
                    }`}
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={checked}
                      onChange={() =>
                        toggleItemSelection(r.id_servicio, item.id_item)
                      }
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs">
                    {getDisplayDateForItem(r, idx)}
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
    "mark_up",
    "precio_de_venta",
  ];

  return (
    <div className="bg-white rounded-lg p-4 w-full shadow-sm">
      {loading && <div className="mb-2 text-sm text-gray-600">Cargando…</div>}
      {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}

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
            className={`px-3 py-1.5 text-sm rounded-md border ${selectedCount === 0
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
          >
            Deseleccionar todo
          </button>
          <button
            onClick={handleFacturar}
            disabled={selectedCount === 0}
            className={`px-4 py-1.5 text-sm rounded-md ${selectedCount === 0
              ? "bg-blue-300 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            Facturar seleccionados ({selectedCount})
          </button>
        </div>
      </Table4>

      {/* Modal de facturación */}
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
};

export default ReservationsWithTable4;
