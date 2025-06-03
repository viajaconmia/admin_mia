"use client";

import React, { useEffect, useState } from "react";
import { Building2, Pencil, TriangleAlert } from "lucide-react";
import { ReservationForm } from "../../../components/structure/FormReservation";
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
import Modal from "@/components/structure/Modal";
import { TypeFilters, Solicitud } from "@/types";
import { Loader } from "@/components/atom/Loader";

function App() {
  const [allSolicitudes, setAllSolicitudes] = useState<Solicitud[]>([]);
  const [selectedItem, setSelectedItem] = useState<Solicitud | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [hoteles, setHoteles] = useState([]);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );

  const handleEdit = (item: Solicitud) => {
    setSelectedItem(item);
  };

  let formatedSolicitudes = allSolicitudes
    .filter(
      (item) =>
        item.hotel.toUpperCase().includes(searchTerm) ||
        item.nombre_agente_completo.toUpperCase().includes(searchTerm) ||
        item.nombre_viajero_completo.toUpperCase().includes(searchTerm)
    )
    .map((item) => ({
      id_cliente: item.id_agente,
      cliente: (item?.razon_social || "").toUpperCase(),
      creado: item.created_at,
      hotel: item.hotel.toUpperCase(),
      codigo_hotel: item.codigo_reservacion_hotel,
      viajero: (
        item.nombre_viajero_completo || item.nombre_viajero
      ).toUpperCase(),
      check_in: item.check_in,
      check_out: item.check_out,
      noches: calcularNoches(item.check_in, item.check_out),
      habitacion: formatRoom(item.room),
      costo_proveedor: Number(item.costo_total) || 0,
      markup:
        ((Number(item.total || 0) - Number(item.costo_total || 0)) /
          Number(item.costo_total || 0)) *
        100,
      precio_de_venta: parseFloat(item.total),
      metodo_de_pago: `${item.id_credito ? "credito" : "contado"}`,
      reservante: item.id_usuario_generador ? "Cliente" : "Operaciones",
      etapa_reservacion: item.estado_reserva,
      estado_pago_proveedor: "",
      estado_factura_proveedor: "",
      estado: item.status,
      editar: item,
    }));

  let componentes = {
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
    editar: (props: any) => (
      <button
        onClick={() => handleEdit(props.value)}
        className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out flex gap-2 items-center"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </button>
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
    fetchSolicitudes(filters, { id_booking: "Active" }, (data) => {
      setAllSolicitudes(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchSolicitudes();
  }, [filters]);

  useEffect(() => {
    fetchHoteles((data) => {
      setHoteles(data);
    });
  }, []);

  return (
    <div className="h-fit">
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
            ></Table>
          )}
        </div>
        {selectedItem && (
          <Modal
            onClose={() => {
              setSelectedItem(null);
            }}
            title={
              selectedItem.id_booking == null
                ? "Se encontro una anomalia"
                : "Editar reserva"
            }
            subtitle={
              selectedItem.id_booking == null
                ? "Revisa el mensaje de error"
                : "Modifica los detalles de una reservación anteriormente procesada."
            }
          >
            {selectedItem.id_booking == null ? (
              <div className="text-red-500 w-full flex justify-center p-4 max-w-sm">
                <p className="flex items-center gap-4 border border-red-300 bg-red-100 text-red-700 p-4 rounded-lg text-sm">
                  <TriangleAlert className="w-12 h-12" />
                  <span>
                    {" "}
                    Esta reservación aun no ha sido procesada. Por favor, crea
                    la reservación en la parte de solicitudes para poder
                    editarla.
                  </span>
                </p>
              </div>
            ) : (
              <ReservationForm
                hotels={hoteles}
                solicitud={selectedItem}
                onClose={() => {
                  setSelectedItem(null);
                  handleFetchSolicitudes();
                }}
                edicion={true}
              />
            )}
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
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(new Date().setDate(new Date().getDate() + 1))
    .toISOString()
    .split("T")[0],
  traveler: null,
  paymentMethod: null,
  id_client: null,
  statusPagoProveedor: null,
  filterType: "Creacion",
  markup_end: null,
  markup_start: null,
};

export default App;
