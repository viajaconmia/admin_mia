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
import { fetchSolicitudes2 } from "@/services/solicitudes";
import { Solicitud2, TypeFilters } from "@/types";
import { Building2, DollarSign, Loader, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Table5 } from "../Table5";
import Modal from "../organism/Modal";
import { ReservationForm2 } from "../organism/FormReservation2";
import { PaymentModal } from "../organism/PaymentProveedor/PaymentProveedor";
import { ReservationForm } from "../organism/FormReservation";

type SolicitudConPagos = Solicitud2 & {
  pagos_asociados?: Array<{ monto?: string | number | null }>;
};

const parseNum = (v: any) => (v == null ? 0 : Number(v));

export const HotelesTable = ({
  searchTerm,
  id_agente,
  filters,
  agente,
}: {
  searchTerm: string;
  id_agente: string;
  agente: Agente;
  filters: TypeFilters;
}) => {
  const [allSolicitudes, setAllSolicitudes] = useState<SolicitudConPagos[]>([]);
  const [selectedItem, setSelectedItem] = useState<Solicitud2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoteles, setHoteles] = useState([]);
  const [modificar, setModificar] = useState(false);
  const [pagar, setPagar] = useState(false);
  const [createReserva, setCreateReserva] = useState(false);
  const handleEdit = (item: Solicitud2) => {
    setSelectedItem(item);
    setModificar(true);
  };
  const handlePagar = (item: Solicitud2) => {
    setSelectedItem(item);
    setPagar(true);
  };

  // 2) Filtrado por búsqueda
  const solicitudesFiltradas = useMemo(() => {
    const q = (searchTerm || "").toUpperCase();
    return allSolicitudes.filter((item) => {
      return (
        (item.hotel_reserva?.toUpperCase() || "").includes(q) ||
        (item.nombre_cliente?.toUpperCase() || "").includes(q) ||
        (item.nombre_viajero_reservacion?.toUpperCase() || "").includes(q)
      );
    });
  }, [allSolicitudes, searchTerm]);

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
        reservante:
          item.quien_reservó === "CREADA POR OPERACIONES"
            ? "Operaciones"
            : "Cliente",
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
          href={`https://www.viajaconmia.com/bookings/${item.id_solicitud}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Ver
        </a>
        <button
          onClick={() => {
            copyToClipboard(
              `https://www.viajaconmia.com/bookings/${item.id_solicitud}`,
            );
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
    codigo_hotel: ({ value }) => <span className="font-semibold">{value}</span>,
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
    costo_proveedor: ({ value }) => (
      <span title={value}>${Number(value || 0).toFixed(2)}</span>
    ),
    hotel: ({ value }) => (
      <span className="font-medium " title={value}>
        {value}
      </span>
    ),
    viajero: ({ value }) => <span title={value}>{value}</span>,
    tipo_cuarto: ({ value }) => <span title={value}>{value}</span>,
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
  return (
    <>
      <div className="">
        {loading ? (
          <Loader />
        ) : (
          <Table5<Solicitud2>
            maxHeight="24rem"
            registros={formatedSolicitudes}
            renderers={renderers}
            defaultSort={defaultSort}
            leyenda={`Has filtrado ${formatedSolicitudes.length} reservas`}
          >
            {id_agente && (
              <button
                onClick={() => setCreateReserva(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Crear reserva
              </button>
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
            hotels={hoteles}
            onClose={() => {
              handleFetchSolicitudes();
              setCreateReserva(false);
            }}
            edicion={false}
            create={true}
          />
        </Modal>
      )}
    </>
  );
};

const defaultSort = { key: "creado", sort: false };
