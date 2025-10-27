"use client";

import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { ReservationForm } from "../../../components/organism/FormReservation";
import Filters from "@/components/Filters";
import { fetchSolicitudes } from "@/services/solicitudes";
import {
  calcularNoches,
  formatDate,
  formatRoom,
  getPaymentBadge,
  getStageBadge,
  getStatusBadge,
  getWhoCreateBadge,
} from "@/helpers/utils";
import { Table } from "@/components/Table";
import { fetchHoteles } from "@/services/hoteles";
import Modal from "@/components/organism/Modal";
import { TypeFilters } from "@/types";
import { set } from "date-fns";
import { Loader } from "@/components/atom/Loader";
import { currentDate } from "@/lib/utils";

interface SolicitudClient {
  id_agente: string;
  id_servicio: string;
  id_solicitud: string;
  id_hospedaje: string | null;
  id_hotel_solicitud: string;
  id_hotel_reserva: string | null;
  id_viajero_solicitud: string;
  id_viajero_reserva: string | null;
  id_booking: string | null;
  id_pago: string | null;
  id_credito: string | null;
  id_factura: string | null;
  id_facturama: string | null;
  status_solicitud: string;
  status_reserva: string | null;
  etapa_reservacion: string;
  created_at_solicitud: string;
  created_at_reserva: string | null;
  hotel_solicitud: string;
  hotel_reserva: string | null;
  check_in: string | null;
  check_out: string | null;
  room: string;
  tipo_cuarto: string | null;
  total_solicitud: string;
  total: string | null;
  nuevo_incluye_desayuno: string | null;
  quien_reservó: string;
  nombre_viajero_solicitud: string;
  viajeros_acompañantes: any[];
  nombres_viajeros_acompañantes: string;
  nombre_viajero_reservacion: string | null;
  viajeros_adicionales_reserva: any | null;
  nombres_viajeros_adicionales_reserva: string | null;
  updated_at: string | null;
  costo_total: string | null;
  comments: string | null;
  confirmation_code: string;
  codigo_reservacion_hotel: string | null;
  metodo_pago_dinamico: string;
  nombre_cliente: string;
  correo: string;
  telefono: string | null;
  rfc: string | null;
  tipo_persona: string;
  items_reserva: any[];
  pagos_asociados: any[];
  facturas_asociadas: any[];
}

function App() {
  const [allSolicitudes, setAllSolicitudes] = useState<SolicitudClient[]>([]);
  const [selectedItem, setSelectedItem] = useState<SolicitudClient | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [hoteles, setHoteles] = useState([]);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );

  const handleFetchSolicitudes = () => {
    setLoading(true);
    fetchSolicitudes(
      filters,
      { status: "Pendiente", id_booking: "Inactive" },
      ({ data }) => {
        console.log("THIS IS THE FUCKING DATA", data);
        setAllSolicitudes(data);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    handleFetchSolicitudes();
  }, [filters]);

  const handleEdit = (item: SolicitudClient) => {
    setSelectedItem(item);
  };

  let formatedSolicitudes = allSolicitudes
    .filter(
      (item) =>
        (item.hotel_solicitud || "").toUpperCase().includes(searchTerm) ||
        item.nombre_cliente.toUpperCase().includes(searchTerm) ||
        item.nombre_viajero_solicitud.toUpperCase().includes(searchTerm)
    )
    .map((item) => ({
      id_cliente: item.id_agente,
      cliente: (item?.nombre_cliente || "").toUpperCase(),
      creado: item.created_at_solicitud,
      hotel: (item.hotel_solicitud || "").toUpperCase(),
      codigo_hotel: item.codigo_reservacion_hotel,
      viajero: (item.nombre_viajero_solicitud || "").toUpperCase(),
      check_in: item.check_in_solicitud,
      check_out: item.check_out_solicitud,
      noches: calcularNoches(item.check_in, item.check_out),
      habitacion: formatRoom(item.room),
      costo_proveedor: Number(item.costo_total) || 0,
      markup:
        ((Number(item.total_solicitud || 0) - Number(item.costo_total || 0)) /
          Number(item.total_solicitud || 0)) *
        100,
      precio_de_venta: parseFloat(item.total_solicitud),
      metodo_de_pago: `${item.id_credito ? "credito" : "contado"}`,
      reservante: item.quien_reservó ? "Cliente" : "Operaciones",
      etapa_reservacion: item.etapa_reservacion,
      estado_pago_proveedor: "",
      estado_factura_proveedor: "",
      // estado: item.status,
      procesar: item,
    }));

  console.log(formatedSolicitudes);

  let componentes: Record<keyof SolicitudClient, any> = {
    reservante: ({ value }: { value: string | null }) =>
      getWhoCreateBadge(value),
    etapa_reservacion: ({ value }: { value: string | null }) =>
      getStageBadge(value),
    metodo_de_pago: ({ value }: { value: null | string }) =>
      getPaymentBadge(value),
    id_cliente: ({ value }: { value: null | string }) => (
      <span className="font-semibold text-sm">
        {value ? value.split("-").join("").slice(0, 8) : ""}
      </span>
    ),
    markup: (props: any) => (
      <span
        className={`font-semibold border p-2 rounded-full ${
          props.value == "Infinity"
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
    procesar: (props: any) => (
      <button
        onClick={() => handleEdit(props.value)}
        className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out flex gap-2 items-center"
      >
        <Pencil className="w-4 h-4" />
        Procesar
      </button>
    ),
    estado: (props: any) => (
      <span title={props.value}>{getStatusBadge(props.value)}</span>
    ),
    precio_de_venta: (props: any) => (
      <span title={props.value}>${props.value.toFixed(2)}</span>
    ),
    hotel: (props: any) => (
      <span className="font-medium " title={props.value}>
        {props.value}
      </span>
    ),
    viajero: (props: any) => <span title={props.value}>{props.value}</span>,
    habitacion: (props: any) => <span title={props.value}>{props.value}</span>,
    check_in: (props: any) => {
      return <span title={props.value}>{formatDate(props.value)}</span>;
    },
    check_out: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
    creado: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
  };

  useEffect(() => {
    fetchHoteles((data) => {
      setHoteles(data);
    });
  }, []);

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Solicitudes
      </h1>
      <div className="max-w-7xl mx-auto bg-white p-4 rounded-lg shadow">
        <div>
          <Filters
            defaultFilters={filters}
            onFilter={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {/* Reservations Table */}
        <div className="overflow-hidden0">
          {loading ? (
            <Loader></Loader>
          ) : (
            <Table
              registros={formatedSolicitudes}
              renderers={componentes}
              defaultSort={defaultSort}
            />
          )}
        </div>
        {selectedItem && (
          <Modal
            onClose={() => {
              setSelectedItem(null);
            }}
            title="Crear reserva"
            subtitle="Modifica los detalles de la reserva y creala."
          >
            <ReservationForm
              hotels={hoteles}
              solicitud={{
                check_in: selectedItem.check_in_solicitud,
                check_out: selectedItem.check_out_solicitud,
                id_servicio: selectedItem.id_servicio,
                hotel: selectedItem.hotel_solicitud,
                room: selectedItem.room,
                id_viajero: selectedItem.id_viajero_solicitud,
                id_agente: selectedItem.id_agente,
                id_solicitud: selectedItem.id_solicitud,
                // viajeros_adicionales:selectedItem.viajeros_acompañantes
              }}
              onClose={() => {
                setSelectedItem(null);
                handleFetchSolicitudes();
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

const defaultSort = {
  key: "creado",
  sort: true,
};

const [dia, mes, año] = new Date()
  .toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  .split("/");

const defaultFiltersSolicitudes: TypeFilters = {
  codigo_reservacion: null,
  client: null,
  reservante: null,
  reservationStage: null,
  hotel: null,
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
