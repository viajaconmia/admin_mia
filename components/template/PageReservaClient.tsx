"use client";

import React, { useEffect, useState } from "react";
import { Building2, DollarSign, Pencil } from "lucide-react";
import { ReservationForm2 } from "@/components/organism/FormReservation2";
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
import { Table2 } from "@/components/organism/Table2";
import { ReservationForm } from "@/components/organism/FormReservation";

function App({ id_agente }: { id_agente?: string }) {
  const [allSolicitudes, setAllSolicitudes] = useState<Solicitud2[]>([]);
  const [selectedItem, setSelectedItem] = useState<Solicitud2 | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [hoteles, setHoteles] = useState([]);
  const [modificar, setModificar] = useState(false);
  const [pagar, setPagar] = useState(false);
  const [createReserva, setCreateReserva] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );

  const handleEdit = (item: Solicitud2) => {
    setSelectedItem(item);
    setModificar(true);
  };
  const handlePagar = (item: Solicitud2) => {
    setSelectedItem(item);
    setPagar(true);
  };

  let formatedSolicitudes = Array.isArray(allSolicitudes)
    ? allSolicitudes
      .filter(
        (item) =>
          (item.hotel_reserva?.toUpperCase() || "").includes(
            searchTerm || ""
          ) ||
          (item.nombre_cliente?.toUpperCase() || "").includes(
            searchTerm || ""
          ) ||
          (item.nombre_viajero_reservacion?.toUpperCase() || "").includes(
            searchTerm || ""
          )
      )
      .map((item) => ({
        id_cliente: item.id_agente,
        cliente: (item.nombre_cliente || "").toUpperCase(),
        creado: item.created_at_reserva,
        hotel: item.hotel_reserva || "",
        codigo_hotel: item.codigo_reservacion_hotel,
        viajero: item.nombre_viajero_reservacion || "",
        check_in: item.check_in,
        check_out: item.check_out,
        noches: calcularNoches(item.check_in, item.check_out),
        // habitacion: formatRoom(item.room),
        tipo_cuarto: formatRoom(item.room),
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
        item,
      }))
    : [];

  let componentes = {
    reservante: ({ value }: { value: string | null }) =>
      getWhoCreateBadge(value),
    etapa_reservacion: ({ value }: { value: string | null }) =>
      getStageBadge(value),
    metodo_de_pago: ({ value }: { value: null | string }) =>
      getPaymentBadge(value),
    detalles_cliente: ({ item }: { item: Solicitud2 }) => (
      <span className="font-semibold text-sm flex items-center gap-2 w-full">
        <a
          href={`https://www.viajaconmia.com/reserva/${item.id_solicitud}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Ver
        </a>
        <button
          onClick={() => {
            copyToClipboard(
              `https://www.viajaconmia.com/reserva/${item.id_solicitud}`
            );
          }}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Copiar
        </button>
      </span>
    ),
    id_cliente: ({ value }: { value: null | string }) => (
      <span className="font-semibold text-sm">
        {value ? value.slice(0, 11) : ""}
      </span>
    ),
    markup: (props: any) => (
      <span
        className={`font-semibold border p-2 rounded-full ${props.value == "Infinity"
          ? "text-gray-700 bg-gray-100 border-gray-300 "
          : props.value > 0
            ? "text-green-600 bg-green-100 border-green-300"
            : "text-red-600 bg-red-100 border-red-300"
          }`}
      >
        {props.value == "Infinity" ? <>0%</> : <>{props.value.toFixed(2)}%</>}
      </span>
    ),
    codigo_hotel: (props: any) => (
      <span className="font-semibold">{props.value}</span>
    ),
    editar: ({ item }: { item: Solicitud2 }) => (
      <button
        onClick={() => handleEdit(item)}
        className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out flex gap-2 items-center"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </button>
    ),
    pagar: ({ item }: { item: Solicitud2 }) => (
      <>
        {item.status_reserva == "Confirmada" && (
          <button
            onClick={() => handlePagar(item)}
            className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out flex gap-2 items-center"
          >
            <DollarSign className="w-4 h-4" />
            Pagar
          </button>
        )}
      </>
    ),
    estado: (props: any) => (
      <span title={props.value}>{getStatusBadge(props.value)}</span>
    ),
    precio_de_venta: (props: any) => (
      <span title={props.value}>${props.value.toFixed(2)}</span>
    ),
    costo_proveedor: (props: any) => (
      <span title={props.value}>${props.value.toFixed(2)}</span>
    ),
    hotel: (props: any) => (
      <span className="font-medium " title={props.value}>
        {props.value}
      </span>
    ),
    viajero: (props: any) => <span title={props.value}>{props.value}</span>,
    habitacion: (props: any) => <span title={props.value}>{props.value}</span>,
    check_in: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
    check_out: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
    creado: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
  };

  const handleFetchSolicitudes = () => {
    setLoading(true);

    const payload = Object.entries(filters)
      .filter(
        ([_, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    // Sobrescribe id_client si viene como prop
    if (id_agente) {
      payload["id_client"] = id_agente;
    }

    fetchSolicitudes2(payload, {}, (data) => {
      setAllSolicitudes(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchSolicitudes();
  }, [filters]);

  useEffect(() => {
    fetchHoteles((data) => {
      console.log("Hoteles fetched:", data);
      setHoteles(data);
    });
  }, []);

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Reservas
      </h1>
      <div className="w-full mx-auto bg-white p-4 rounded-lg shadow">
        <div>
          <Filters
            defaultFilters={filters}
            onFilter={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {/* Reservations Table */}
        <div className="overflow-hidden">
          {loading ? (
            <Loader></Loader>
          ) : (
            <Table2<Solicitud2>
              registros={formatedSolicitudes}
              renderers={componentes}
              defaultSort={defaultSort}
              leyenda={`Haz filtrado ${allSolicitudes.length} Reservas`}
            >
              {id_agente && (
                <>
                  <button
                    onClick={() => {
                      setCreateReserva(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Crear reserva
                  </button>
                </>
              )}
            </Table2>
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
            <PaymentModal reservation={selectedItem}></PaymentModal>
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
      </div>
    </div>
  );
}

const defaultSort = {
  key: "creado",
  sort: false,
};

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