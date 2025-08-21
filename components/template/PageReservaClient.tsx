"use client";

import React, { use, useEffect, useState } from "react";
import { Building2, Pencil, TriangleAlert } from "lucide-react";
import { ReservationForm } from "@/components/organism/FormReservation";
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
import { TypeFilters, Solicitud } from "@/types";
import { Loader } from "@/components/atom/Loader";

export function PageReservasClientes({ id_agente }) {
  const [allSolicitudes, setAllSolicitudes] = useState<Solicitud[]>([]);
  const [selectedItem, setSelectedItem] = useState<Solicitud | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [hoteles, setHoteles] = useState([]);
  const [createReserva, setCreateReserva] = useState(false);
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
    console.log(id_agente);
    fetchSolicitudes(filters, { id_client: id_agente }, (data) => {
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
            >
              <button
                onClick={() => {
                  setCreateReserva(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Crear reserva
              </button>
            </Table>
          )}
        </div>
        {selectedItem && (
          <Modal
            onClose={() => {
              setSelectedItem(null);
            }}
            title={
              selectedItem.id_booking == null
                ? "Crear reserva"
                : "Editar reserva"
            }
            subtitle={
              selectedItem.id_booking == null
                ? "Modifica los detalles para crear la reserva"
                : "Modifica los detalles de una reservación anteriormente procesada."
            }
          >
            <ReservationForm
              hotels={hoteles}
              solicitud={selectedItem}
              onClose={() => {
                setSelectedItem(null);
                handleFetchSolicitudes();
              }}
              edicion={!!selectedItem.id_booking}
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
  status: null,
  startDate: null,
  endDate: null,
  traveler: null,
  paymentMethod: null,
  id_client: null,
  statusPagoProveedor: null,
  filterType: null,
  markup_end: null,
  markup_start: null,
};