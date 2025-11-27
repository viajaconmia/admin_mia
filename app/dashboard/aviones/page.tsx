"use client";

import React, { useEffect, useMemo, useState } from "react";
import Filters from "@/components/Filters";
import { Table5 } from "@/components/Table5";
import { Loader } from "@/components/atom/Loader";
import { TypeFilters } from "@/types";
import { currentDate } from "@/lib/utils";
import { formatDate } from "@/helpers/utils";
import Modal from "@/components/organism/Modal";
import { EditServiceModal, FieldConfig } from "@/app/dashboard/aviones/components/modal_edit";
import { Pencil } from "lucide-react";


// =========================
// Tipado local
// =========================
export type VueloComprado = {
  id_viaje_aereo: string | number;
  id_booking: string | number;
  id_servicio: string | number;
  trip_type: string;
  status: string;
  payment_status: string;
  total_passengers: number;
  aeropuerto_origen: string;
  ciudad_origen: string;
  aeropuerto_destino: string;
  ciudad_destino: string;
  regreso_aeropuerto_origen: string | null;
  regreso_ciudad_origen: string | null;
  regreso_aeropuerto_destino: string | null;
  regreso_ciudad_destino: string | null;
  adults: number;
  children: number;
  infants: number;
  subtotal: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
  cancellation_policies: string | null;
  created_at: string;
  updated_at: string | null;
  codigo_confirmacion: string;
};

// =========================
// Helpers
// =========================
const parseNum = (v: any) => (v == null || v === "" ? 0 : Number(v));

const Currency: React.FC<{ value: any; currency?: string }> = ({
  value,
  currency,
}) => (
  <span>
    {currency ? `${currency} ` : "$"}
    {parseNum(value).toFixed(2)}
  </span>
);

// Pills sencillas para status/pago
const StatusPill: React.FC<{ value: string }> = ({ value }) => {
  const v = (value || "").toUpperCase();
  let base =
    "px-2 py-1 text-xs rounded-full font-semibold border inline-flex items-center justify-center";
  if (v === "CONFIRMED" || v === "COMPLETED") {
    base += " bg-green-100 text-green-700 border-green-300";
  } else if (v === "CANCELLED" || v === "CANCELED") {
    base += " bg-red-100 text-red-700 border-red-300";
  } else if (v === "PENDING") {
    base += " bg-yellow-100 text-yellow-700 border-yellow-300";
  } else {
    base += " bg-gray-100 text-gray-700 border-gray-300";
  }
  return <span className={base}>{v || "-"}</span>;
};

const PaymentStatusPill: React.FC<{ value: string }> = ({ value }) => {
  const v = (value || "").toUpperCase();
  let base =
    "px-2 py-1 text-xs rounded-full font-semibold border inline-flex items-center justify-center";
  if (v === "PAID") {
    base += " bg-green-100 text-green-700 border-green-300";
  } else if (v === "PARTIALLY_PAID") {
    base += " bg-yellow-100 text-yellow-700 border-yellow-300";
  } else if (v === "UNPAID") {
    base += " bg-red-100 text-red-700 border-red-300";
  } else {
    base += " bg-gray-100 text-gray-700 border-gray-300";
  }
  return <span className={base}>{v || "-"}</span>;
};

// =========================
// Filtros por defecto
// =========================
const defaultFiltersVuelos: TypeFilters = {
  codigo_reservacion: null,
  client: null,
  reservante: null,
  reservationStage: null,
  hotel: null,
  status: null,
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

const defaultSortVuelos = { key: "created_at", sort: false as const };

// =========================
// Fetch mock — aquí luego conectas tu back real
// =========================
type FetchVuelosFn = (
  payload: Partial<TypeFilters>,
  options: any,
  cb: (data: VueloComprado[]) => void
) => void;

/**
 * TODO: cuando tengas el back, cambia el cuerpo de esta función
 * por la llamada real (fetch/axios/etc).
 */
const fetchVuelosComprados: FetchVuelosFn = (_payload, _options, cb) => {
  const ejemplos: VueloComprado[] = [
    {
      id_viaje_aereo: 1,
      id_booking: "BOOK-FLT-001",
      id_servicio: "SRV-FLT-001",
      trip_type: "round_trip",
      status: "CONFIRMED",
      payment_status: "PAID",
      total_passengers: 2,
      aeropuerto_origen: "MEX",
      ciudad_origen: "Ciudad de México",
      aeropuerto_destino: "JFK",
      ciudad_destino: "Nueva York",
      regreso_aeropuerto_origen: "JFK",
      regreso_ciudad_origen: "Nueva York",
      regreso_aeropuerto_destino: "MEX",
      regreso_ciudad_destino: "Ciudad de México",
      adults: 2,
      children: 0,
      infants: 0,
      subtotal: 12000,
      taxes: 1800,
      fees: 350,
      total: 14150,
      currency: "MXN",
      cancellation_policies:
        "Cancelación sin cargo hasta 48 horas antes de la salida.",
      created_at: "2025-11-20T10:30:00",
      updated_at: "2025-11-21T09:15:00",
      codigo_confirmacion: "ABC123",
    },
    {
      id_viaje_aereo: 2,
      id_booking: "BOOK-FLT-002",
      id_servicio: "SRV-FLT-002",
      trip_type: "one_way",
      status: "PENDING",
      payment_status: "PARTIALLY_PAID",
      total_passengers: 1,
      aeropuerto_origen: "GDL",
      ciudad_origen: "Guadalajara",
      aeropuerto_destino: "CUN",
      ciudad_destino: "Cancún",
      regreso_aeropuerto_origen: null,
      regreso_ciudad_origen: null,
      regreso_aeropuerto_destino: null,
      regreso_ciudad_destino: null,
      adults: 1,
      children: 0,
      infants: 0,
      subtotal: 3500,
      taxes: 600,
      fees: 150,
      total: 4250,
      currency: "MXN",
      cancellation_policies:
        "Aplican cargos por cancelación a partir de la compra.",
      created_at: "2025-11-22T14:05:00",
      updated_at: null,
      codigo_confirmacion: "XYZ789",
    },
    {
      id_viaje_aereo: 3,
      id_booking: "BOOK-FLT-003",
      id_servicio: "SRV-FLT-003",
      trip_type: "round_trip",
      status: "CANCELLED",
      payment_status: "UNPAID",
      total_passengers: 3,
      aeropuerto_origen: "MTY",
      ciudad_origen: "Monterrey",
      aeropuerto_destino: "LAX",
      ciudad_destino: "Los Ángeles",
      regreso_aeropuerto_origen: "LAX",
      regreso_ciudad_origen: "Los Ángeles",
      regreso_aeropuerto_destino: "MTY",
      regreso_ciudad_destino: "Monterrey",
      adults: 2,
      children: 1,
      infants: 0,
      subtotal: 18000,
      taxes: 2700,
      fees: 500,
      total: 21200,
      currency: "MXN",
      cancellation_policies:
        "Vuelo cancelado por el cliente. No reembolsable.",
      created_at: "2025-11-18T09:50:00",
      updated_at: "2025-11-19T11:20:00",
      codigo_confirmacion: "CNL456",
    },
  ];

  cb(ejemplos);
};

// =========================
// Página principal VUELOS
// =========================
const VuelosCompradosPage: React.FC = () => {
  const [allVuelos, setAllVuelos] = useState<VueloComprado[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(defaultFiltersVuelos);
  const [selectedVuelo, setSelectedVuelo] = useState<VueloComprado | null>(null);
  const [isEditVueloOpen, setIsEditVueloOpen] = useState(false);

  const vueloEditFields: FieldConfig<VueloComprado>[] = [
    //añadir campos a ditar   
  ];

  // Fetch de datos (mock por ahora)
  const handleFetchVuelos = () => {
    setLoading(true);

    const payload = Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as any);

    fetchVuelosComprados(payload, {}, (data) => {
      setAllVuelos(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchVuelos();
  }, [filters]);

  // Búsqueda rápida
  const vuelosFiltrados = useMemo(() => {
    const q = (searchTerm || "").toUpperCase();
    return allVuelos.filter((item) => {
      return (
        String(item.id_viaje_aereo).toUpperCase().includes(q) ||
        String(item.id_booking).toUpperCase().includes(q) ||
        (item.aeropuerto_origen || "").toUpperCase().includes(q) ||
        (item.ciudad_origen || "").toUpperCase().includes(q) ||
        (item.aeropuerto_destino || "").toUpperCase().includes(q) ||
        (item.ciudad_destino || "").toUpperCase().includes(q) ||
        (item.codigo_confirmacion || "").toUpperCase().includes(q) ||
        (item.status || "").toUpperCase().includes(q) ||
        (item.payment_status || "").toUpperCase().includes(q)
      );
    });
  }, [allVuelos, searchTerm]);

  // Formato final para Table5
  const formatedVuelos = useMemo(
    () =>
      vuelosFiltrados.map((item) => ({
        id_viaje_aereo: item.id_viaje_aereo,
        id_booking: item.id_booking,
        id_servicio: item.id_servicio,
        trip_type: item.trip_type,
        status: item.status,
        payment_status: item.payment_status,
        total_passengers: item.total_passengers,
        aeropuerto_origen: item.aeropuerto_origen,
        ciudad_origen: item.ciudad_origen,
        aeropuerto_destino: item.aeropuerto_destino,
        ciudad_destino: item.ciudad_destino,
        regreso_aeropuerto_origen: item.regreso_aeropuerto_origen,
        regreso_ciudad_origen: item.regreso_ciudad_origen,
        regreso_aeropuerto_destino: item.regreso_aeropuerto_destino,
        regreso_ciudad_destino: item.regreso_ciudad_destino,
        adults: item.adults,
        children: item.children,
        infants: item.infants,
        subtotal: item.subtotal,
        taxes: item.taxes,
        fees: item.fees,
        total: item.total,
        currency: item.currency,
        cancellation_policies: item.cancellation_policies,
        created_at: item.created_at,
        updated_at: item.updated_at,
        codigo_confirmacion: item.codigo_confirmacion,
        editar: "",
        item, // para posibles renderers futuros
      })),
    [vuelosFiltrados]
  );

  // Renderers para columnas específicas
  const renderers: Record<
    string,
    React.FC<{ value: any; item: VueloComprado; index: number }>
  > = {
    created_at: ({ value }) => (
      <span title={value}>{formatDate(value)}</span>
    ),
    updated_at: ({ value }) =>
      value ? (
        <span title={value}>{formatDate(value)}</span>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),

    subtotal: ({ value, item }) => (
      <Currency value={value} currency={item.currency} />
    ),
    taxes: ({ value, item }) => (
      <Currency value={value} currency={item.currency} />
    ),
    fees: ({ value, item }) => (
      <Currency value={value} currency={item.currency} />
    ),
    total: ({ value, item }) => (
      <Currency value={value} currency={item.currency} />
    ),

    status: ({ value }) => <StatusPill value={value} />,
    payment_status: ({ value }) => <PaymentStatusPill value={value} />,
    editar: ({ item }) => (
      <button
        onClick={() => {
          setSelectedVuelo(item);
          setIsEditVueloOpen(true);
        }}
        className="text-blue-600 hover:text-blue-900 text-xs font-semibold flex items-center gap-1"
      >
        <Pencil className="w-3 h-3" />
        Editar
      </button>
    ),
  };

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Vuelos comprados
      </h1>

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
            <Table5<VueloComprado>
              registros={formatedVuelos}
              renderers={renderers}
              defaultSort={defaultSortVuelos}
              leyenda={`Vuelos: Has filtrado ${formatedVuelos.length} registros`}
              customColumns={[
                "id_viaje_aereo",
                "id_booking",
                "id_servicio",
                "trip_type",
                "status",
                "payment_status",
                "total_passengers",
                "aeropuerto_origen",
                "ciudad_origen",
                "aeropuerto_destino",
                "ciudad_destino",
                "regreso_aeropuerto_origen",
                "regreso_ciudad_origen",
                "regreso_aeropuerto_destino",
                "regreso_ciudad_destino",
                "adults",
                "children",
                "infants",
                "subtotal",
                "taxes",
                "fees",
                "total",
                "currency",
                "cancellation_policies",
                "created_at",
                "updated_at",
                "codigo_confirmacion",
                "editar",
              ]}
            />
          )}
        </div>
      </div>
      {selectedVuelo && isEditVueloOpen && (
        <Modal
          onClose={() => {
            setIsEditVueloOpen(false);
            setSelectedVuelo(null);
          }}
          title="Editar vuelo"
          subtitle="Actualiza la información relevante del vuelo."
        >
          <EditServiceModal<VueloComprado>
            title="Editar vuelo"
            initialData={selectedVuelo}
            fields={vueloEditFields}
            onClose={() => {
              setIsEditVueloOpen(false);
              setSelectedVuelo(null);
            }}
            onSubmit={async (values) => {
              console.log("Actualizar VUELO", selectedVuelo.id_viaje_aereo, values);
              // await updateVuelo(selectedVuelo.id_viaje_aereo, values);
              handleFetchVuelos();
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default VuelosCompradosPage;
