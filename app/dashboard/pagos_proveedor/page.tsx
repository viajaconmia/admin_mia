"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Upload, CreditCard, Send } from "lucide-react";
import Filters from "@/components/Filters";
import {
  calcularNoches,
  formatDate,
  formatRoom,
  getPaymentBadge,
  getStageBadge,
  getStatusBadge,
  getWhoCreateBadge,
} from "@/helpers/utils";
import { Table } from "@/components/Table5";
import { TypeFilters, SolicitudProveedor } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { currentDate } from "@/lib/utils";
import { fetchGetSolicitudesProveedores } from "@/services/pago_proveedor";

function App() {
  const [solicitudesPago, setSolicitudesPago] = useState<SolicitudProveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(defaultFiltersSolicitudes);
  const [activeFilter, setActiveFilter] = useState<string>("all"); // "all", "creditCard", "sentToPayments"

  // Filtrar las solicitudes según el filtro activo
  const filteredSolicitudes = solicitudesPago.filter(item => {
    if (activeFilter === "creditCard") {
      // Filtrar pagos con tarjeta de crédito
      return item.tarjeta && item.tarjeta.ultimos_4;
    } else if (activeFilter === "sentToPayments") {
      // Filtrar enviado a pagos (ajusta según tu lógica de negocio)
      return item.solicitud_proveedor.estado_solicitud === "enviado";
    }
    return true; // Mostrar todos si no hay filtro activo
  });

  let formatedSolicitudes = filteredSolicitudes
    .filter(
      (item) =>
        item.hotel.toUpperCase().includes(searchTerm?.toUpperCase() || "") ||
        item.nombre_agente_completo.toUpperCase().includes(searchTerm?.toUpperCase() || "") ||
        item.nombre_viajero_completo.toUpperCase().includes(searchTerm?.toUpperCase() || "")
    )
    .map((item) => ({
      id_cliente: item.id_agente,
      cliente: (item?.razon_social || "").toUpperCase(),
      creado: item.created_at,
      hotel: item.hotel.toUpperCase(),
      codigo_hotel: item.codigo_reservacion_hotel,
      viajero: (
        item.nombre_viajero_completo ||
        item.nombre_viajero ||
        ""
      ).toUpperCase(),
      check_in: item.check_in,
      check_out: item.check_out,
      noches: calcularNoches(item.check_in, item.check_out),
      habitacion: formatRoom(item.room),
      costo_proveedor: Number(item.costo_total) || 0,
      markup:
        ((Number(item.total || 0) - Number(item.costo_total || 0)) /
          Number(item.total || 0)) *
        100,
      precio_de_venta: parseFloat(item.total),
      metodo_de_pago: item.id_credito ? "credito" : "contado",
      reservante: item.id_usuario_generador ? "Cliente" : "Operaciones",
      etapa_reservacion: item.estado_reserva,
      estado_pago_proveedor: item.solicitud_proveedor.estado_solicitud,
      estado_factura_proveedor: item.solicitud_proveedor.estado_facturacion,
      estado: item.status,
      fecha_solicitud: item.solicitud_proveedor.fecha_solicitud,
      razon_social: item.proveedor.razon_social,
      rfc: item.proveedor.rfc,
      forma_de_pago_solicitada: item.solicitud_proveedor.forma_pago_solicitada,
      digitos_tajeta: item.tarjeta.ultimos_4,
      banco: item.tarjeta.banco_emisor,
      tipo_tarjeta: item.tarjeta.tipo_tarjeta,
      fecha_real_cobro: "",
      costo_facturado: "",
      fecha_facturacion: "",
      UUID: "",
    }));

  let componentes = {
    id_cliente: ({ value }: { value: null | string }) => (
      <span className="font-semibold text-sm">
        {value ? value.slice(0, 11) : ""}
      </span>
    ),
    creado: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
    hotel: (props: any) => (
      <span className="font-medium " title={props.value}>
        {props.value}
      </span>
    ),
    codigo_hotel: (props: any) => (
      <span className="font-semibold">{props.value}</span>
    ),
    check_in: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
    check_out: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
    costo_proveedor: (props: any) => (
      <span title={props.value}>${props.value.toFixed(2)}</span>
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
    precio_de_venta: (props: any) => (
      <span title={props.value}>${props.value.toFixed(2)}</span>
    ),
    metodo_de_pago: (props: any) => getPaymentBadge(props.value),
    reservante: (props: any) => getWhoCreateBadge(props.value),
    etapa_reservacion: (props: any) => getStageBadge(props.value),
    estado: (props: any) => getStatusBadge(props.value),
  };

  const handleFetchSolicitudesPago = () => {
    setLoading(true);
    fetchGetSolicitudesProveedores((data) => {
      setSolicitudesPago(data.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchSolicitudesPago();
  }, [filters]);

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Pagos a proveedor
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

        {/* Filtros adicionales para pagos con tarjeta y enviado a pagos */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex items-center px-4 py-2 rounded-md ${activeFilter === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
              }`}
          >
            <span>Todos</span>
          </button>
          <button
            onClick={() => setActiveFilter("creditCard")}
            className={`flex items-center px-4 py-2 rounded-md ${activeFilter === "creditCard"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
              }`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            <span>Pagos con Tarjeta</span>
          </button>
          <button
            onClick={() => setActiveFilter("sentToPayments")}
            className={`flex items-center px-4 py-2 rounded-md ${activeFilter === "sentToPayments"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
              }`}
          >
            <Send className="w-4 h-4 mr-2" />
            <span>Enviado a Pagos</span>
          </button>
        </div>

        <div>
          {loading ? (
            <Loader></Loader>
          ) : (
            <Table
              registros={formatedSolicitudes}
              renderers={componentes}
              defaultSort={defaultSort}
              leyenda={`Haz filtrado ${formatedSolicitudes.length} solicitudes de pago`}
            ></Table>
          )}
        </div>
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