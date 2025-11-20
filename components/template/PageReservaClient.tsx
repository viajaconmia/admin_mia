"use client";

import React, { useState } from "react";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types";
import { currentDate } from "@/lib/utils";
import { Table5 } from "@/components/Table5";
import { ReservationForm2 } from "@/components/organism/FormReservation2";
import { ReservationForm } from "@/components/organism/FormReservation";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { TextTransform } from "@/app/dashboard/facturas-pendientes/page";

import { environment } from "@/lib/constants";
import { Button } from "../ui/button";
import { generateCuponForOperaciones } from "@/lib/qr-generator";
import { ROUTES } from "@/constant/routes";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

type TabsReservation = "hoteles" | "vuelos" | "renta autos" | "todos";

function App({ id_agente, agente }: { id_agente?: string; agente?: any }) {
  const [tab, setTab] = useState<TabsReservation>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );
  const { hasAccess, Can } = usePermiso();

  hasAccess(PERMISOS.VISTAS.RESERVAS);

  const handleEdit = (item: Solicitud2) => {
    setSelectedItem(item);
    setModificar(true);
  };
  const handlePagar = (item: Solicitud2) => {
    setSelectedItem(item);
    setPagar(true);
  };

  // ---------- handleConteo: clasifica pagadas vs pendientes ----------
  const { pagadas, pendientes } = useMemo(() => {
    const acc = {
      pagadas: [] as SolicitudConPagos[],
      pendientes: [] as SolicitudConPagos[],
    };

    for (const s of allSolicitudes) {
      const total = parseNum(s.total);
      const sumaPagos = (s.pagos_asociados || []).reduce(
        (sum, p) => sum + parseNum(p.monto),
        0
      );

      if (sumaPagos + EPS > total) {
        console.log("errores", sumaPagos);
      }

      // Igual (con tolerancia) o mayor -> pagadas; menor -> pendientes
      if (sumaPagos + EPS >= total) {
        acc.pagadas.push(s);
      } else {
        acc.pendientes.push(s);
      }
    }
    return acc;
  }, [allSolicitudes]);

  // 1) Selección por vista (simplificada para mostrar solo 'reservas')
  const solicitudesPorVista: SolicitudConPagos[] = useMemo(() => {
    // Si la vista fuera dinámica, se usaría una variable de estado.
    // Como ahora siempre es "reservas", devolvemos directamente `allSolicitudes`.
    return allSolicitudes;
  }, [allSolicitudes]);

  // 2) Filtrado por búsqueda
  const solicitudesFiltradas = useMemo(() => {
    const q = (searchTerm || "").toUpperCase();
    return solicitudesPorVista.filter((item) => {
      return (
        (item.hotel_reserva?.toUpperCase() || "").includes(q) ||
        (item.nombre_cliente?.toUpperCase() || "").includes(q) ||
        (item.nombre_viajero_reservacion?.toUpperCase() || "").includes(q)
      );
    });
  }, [solicitudesPorVista, searchTerm]);

  // 3) Mapeo a filas para Table5
  const formatedSolicitudes =
    Array.isArray(solicitudesFiltradas) &&
    solicitudesFiltradas.map((item) => {
      const total = parseNum(item.total);
      const sumaPagos = (item.pagos_asociados || []).reduce(
        (sum, p) => sum + parseNum(p.monto),
        0
      );
      const faltaPagar = total - sumaPagos;

      return {
        id_cliente: item.id_agente,
        cliente: (item.nombre_cliente || "").toUpperCase(),
        creado: item.created_at_reserva,
        hotel: item.hotel_reserva || "",
        codigo_hotel: item.codigo_reservacion_hotel,
        viajero: item.nombre_viajero_reservacion || "",
        check_in: item.check_in,
        check_out: item.check_out,
        noches: calcularNoches(item.check_in, item.check_out),
        tipo_cuarto: item.tipo_cuarto
          ? formatRoom(item.tipo_cuarto)
          : formatRoom(item.room),
        costo_proveedor: Number(item.costo_total) || 0,
        markup:
          ((Number(item.total || 0) - Number(item.costo_total || 0)) /
            Number(item.total || 0)) *
          100,
        precio_de_venta: parseFloat(item.total),
        metodo_de_pago: item.metodo_pago_dinamico,
        reservante: item.origen,
        etapa_reservacion: item.etapa_reservacion,
        estado_pago_proveedor: "",
        estado_factura_proveedor: "",
        estado: item.status_reserva,
        detalles_cliente: "",
        editar: "",
        pagar: "",
        item, // para los renderers
      };
    });

  // ---------- RENDERERS ----------
  const renderers: Record<
    string,
    React.FC<{ value: any; item: Solicitud2; index: number }>
  > = {
    reservante: ({ value }) => getWhoCreateBadge(value),
    etapa_reservacion: ({ value }) => getStageBadge(value),
    metodo_de_pago: ({ value }) => getPaymentBadge(value),
    falta_pagar: ({ value }) => {
      // Determinar el color según el valor
      let colorClass = "text-gray-600"; // Valor por defecto
      let titleText = `Falta por pagar: $${value.toFixed(2)}`;

      if (value > 0) {
        colorClass = "text-red-600";
      } else if (value < 0) {
        colorClass = "text-blue-600";
        titleText = `Pago en exceso: $${Math.abs(value).toFixed(2)}`;
      } else {
        colorClass = "text-green-600";
        titleText = "Completamente pagado";
      }

      return (
        <span className={`font-semibold ${colorClass}`} title={titleText}>
          ${Number(value || 0).toFixed(2)}
        </span>
      );
    },

    detalles_cliente: ({ item }) => (
      <span className="font-semibold text-sm flex items-center gap-2 w-full">
        <a
          href={ROUTES.BOOKING.ID_SOLICITUD(item.id_solicitud)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Ver
        </a>
        <button
          onClick={() => {
            copyToClipboard(ROUTES.BOOKING.ID_SOLICITUD(item.id_solicitud));
          }}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Copiar
        </button>
      </span>
    ),
    id_cliente: ({ value }) => (
      <span className="font-semibold text-sm">
        {value ? String(value).slice(0, 11) : ""}
      </span>
    ),
    markup: ({ value }) => (
      <span
        className={`font-semibold border p-2 rounded-full ${value == "Infinity"
          ? "text-gray-700 bg-gray-100 border-gray-300 "
          : value > 0
            ? "text-green-600 bg-green-100 border-green-300"
            : "text-red-600 bg-red-100 border-red-300"
          }`}
      >
        {value == "Infinity" ? "0%" : `${Number(value).toFixed(2)}%`}
      </span>
    ),
    codigo_hotel: ({ value }: { value: string }) => (
      <TextTransform value={value} />
    ),

    editar: ({ item }) => (
      <button
        onClick={() => handleEdit(item)}
        className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out flex gap-2 items-center"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </button>
    ),
    pagar: ({ item }) =>
      item.status_reserva === "Confirmada" ? (
        <button
          onClick={() => handlePagar(item)}
          className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out flex gap-2 items-center"
        >
          <DollarSign className="w-4 h-4" />
          Pagar
        </button>
      ) : (
        <span className="text-gray-400 text-xs">—</span>
      ),
    estado: ({ value }) => <span title={value}>{getStatusBadge(value)}</span>,
    precio_de_venta: ({ value }) => (
      <span title={value}>${Number(value || 0).toFixed(2)}</span>
    ),
    vuelos: <VuelosTable />,
    "renta autos": <></>,
    todos: <></>,
  };

  return (
    <div className="h-fit">
      <div className="w-full mx-auto rounded-md bg-white shadow-lg">
        <div>
          <TabsList
            tabs={tabs}
            onChange={(tab: string) => setTab(tab as TabsReservation)}
            activeTab={tab}
          />
          <div className="p-4 pb-0">
            <Filters
              defaultFilters={filters}
              onFilter={setFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
        </div>
        <div>
          <div className="p-4">{pageTabs[tab]}</div>
        </div>
      </div>
    </div>
  );
}

const defaultFiltersSolicitudes: TypeFilters = {
  codigo_reservacion: null,
  client: null,
  reservante: null,
  reservationStage: null,
  hotel: null,
  status: "Confirmada",
  startDate: currentDate(),
  endDate: currentDate(),
  traveler: null,
  paymentMethod: null,
  id_client: null,
  statusPagoProveedor: null,
  filterType: "Transaccion",
  markup_end: null,
  markup_start: null,
};

export default App;
