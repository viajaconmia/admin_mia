"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Building2, DollarSign, Pencil } from "lucide-react";
import Filters from "@/components/Filters";
import { fetchSolicitudes2 } from "@/services/solicitudes";
import {
  calcularNoches,
  copyToClipboard,
  formatDate,
  formatRoom,
  getPaymentBadge,
  getStageBadge,
  getStatusBadge,
  getWhoCreateBadge,
} from "@/helpers/utils";
import { fetchHoteles } from "@/services/hoteles";
import Modal from "@/components/organism/Modal";
import { TypeFilters, Solicitud2 } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { PaymentModal } from "@/components/organism/PaymentProveedor/PaymentProveedor";
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
import { useAuth } from "@/context/AuthContext";

type Vista = "reservas" | "pagadas" | "pendientes";

// --- Tipado local para pagos_asociados (opcional) ---
type SolicitudConPagos = Solicitud2 & {
  pagos_asociados?: Array<{ monto?: string | number | null }>;
};

const parseNum = (v: any) => (v == null ? 0 : Number(v));
const EPS = 0.01; // tolerancia para flotantes

function App({ id_agente, agente }: { id_agente?: string; agente?: any }) {
  // Cambiamos el estado a la versión con pagos opcionales
  const [allSolicitudes, setAllSolicitudes] = useState<SolicitudConPagos[]>([]);
  const [selectedItem, setSelectedItem] = useState<Solicitud2 | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hoteles, setHoteles] = useState([]);
  const [modificar, setModificar] = useState(false);
  const [pagar, setPagar] = useState(false);
  const [createReserva, setCreateReserva] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes,
  );
  const { hasAccess, Can } = usePermiso();
  const { user } = useAuth();

  hasAccess(PERMISOS.VISTAS.RESERVAS);
  console.log("solicitud de pago",PERMISOS,user)

  const handleEdit = (item: Solicitud2) => {
    setSelectedItem(item);
    setModificar(true);
  };
  const handlePagar = (item: Solicitud2) => {
    setSelectedItem(item);
    setPagar(true);
  };

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
        0,
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
        className={`font-semibold border p-2 rounded-full ${
          value == "Infinity"
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

    editar: ({ item }) =>
      item.status_reserva === "Confirmada" ? (
        <Can permiso="button.edit-booking">
          <button
            onClick={() => handleEdit(item)}
            className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out flex gap-2 items-center"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
        </Can>
      ) : (
        <></>
      ),
    pagar: ({ item }) =>
      item.status_reserva === "Confirmada" ? (
        <Can permiso={PERMISOS.COMPONENTES.BOTON.PAGAR_PROVEEDOR}>
          <button
            onClick={() => handlePagar(item)}
            className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out flex gap-2 items-center"
          >
            <DollarSign className="w-4 h-4" />
            Pagar
          </button>
        </Can>
      ) : (
        <span className="text-gray-400 text-xs">—</span>
      ),
    estado: ({ value }) => <span title={value}>{getStatusBadge(value)}</span>,
    precio_de_venta: ({ value }) => (
      <span title={value}>${Number(value || 0).toFixed(2)}</span>
    ),
    costo_proveedor: ({ value }) => (
      <span title={value}>${Number(value || 0).toFixed(2)}</span>
    ),
    tipo_cuarto: ({ value }: { value: string }) => (
      <TextTransform value={value} />
    ),
    check_in: ({ value }) => <span title={value}>{formatDate(value)}</span>,
    check_out: ({ value }) => <span title={value}>{formatDate(value)}</span>,
    creado: ({ value }) => <span title={value}>{formatDate(value)}</span>,
  };

  // ---------- Data fetching ----------
  const handleFetchSolicitudes = () => {
    setLoading(true);
    const payload = Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as any);

    if (id_agente) payload["id_client"] = id_agente;

    fetchSolicitudes2(payload, {}, (data) => {
      setAllSolicitudes((data || []) as SolicitudConPagos[]);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchSolicitudes();
  }, [filters]);

  useEffect(() => {
    fetchHoteles((data) => setHoteles(data));
  }, []);

  const labelVista = "Reservas"; // Hardcodeado para mantener el texto
  console.log("inroivnoribv", solicitudesFiltradas);

  console.log("cambios", selectedItem);
  return (
    <div className="h-fit">
      <div className="w-full mx-auto bg-white p-4 rounded-lg shadow">
        <Filters
          defaultFilters={filters}
          onFilter={setFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <div className="overflow-hidden">
          {loading ? (
            <Loader />
          ) : (
            <Table5<Solicitud2>
              registros={formatedSolicitudes}
              renderers={renderers}
              defaultSort={defaultSort}
              leyenda={`${labelVista}: Has filtrado ${formatedSolicitudes.length} reservas`}
              customColumns={[
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
                "costo_proveedor",
                "markup",
                "precio_de_venta",
                "metodo_de_pago",
                "reservante",
                "etapa_reservacion",
                "estado",
                "detalles_cliente",
                "editar",
                "pagar",
              ]}
            >
              {id_agente && (
                <Can permiso={PERMISOS.COMPONENTES.BOTON.CREAR_RESERVA}>
                  <button
                    onClick={() => setCreateReserva(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Crear reserva
                  </button>
                </Can>
              )}
            </Table5>
          )}
        </div>

        {selectedItem && modificar && (
          <Modal
            onClose={() => {
              setModificar(false);
              setSelectedItem(null);
            }}
            title="Editar reserva"
            subtitle="Modifica los detalles de una reservación anteriormente procesada."
          >
            <ReservationForm2
              hotels={hoteles}
              solicitud={selectedItem}
              onClose={() => {
                setModificar(false);
                setSelectedItem(null);
                handleFetchSolicitudes();
              }}
              edicion={true}
            />
          </Modal>
        )}

        {selectedItem && pagar && (
          <Modal
            onClose={() => {
              setPagar(false);
              setSelectedItem(null);
            }}
            title="Pagar reserva al proveedor"
          >
            <PaymentModal
              reservation={{
                ...selectedItem,
                codigo_confirmacion: selectedItem.codigo_reservacion_hotel,
                viajero: selectedItem.nombre_viajero_reservacion,
                proveedor: selectedItem.hotel_reserva,
                tipo_cuarto_vuelo:
                  selectedItem.tipo_cuarto || selectedItem.room,
                usuario_creador:user.id,
              }}
            />
          </Modal>
        )}

        {createReserva && (
          <Modal
            onClose={() => {
              setSelectedItem(null);
              setCreateReserva(false);
            }}
            title="Crea una nueva reserva"
            subtitle="Agrega los detalles de una nueva reserva"
          >
            <ReservationForm
              solicitud={{
                hotel: null,
                check_in: null,
                check_out: null,
                id_agente: id_agente,
                agente: agente,
              }}
              onClose={() => {
                handleFetchSolicitudes();
                setCreateReserva(false);
              }}
              edicion={false}
              create={true}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

const defaultSort = { key: "creado", sort: false };

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
