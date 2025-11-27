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
export type SolicitudRentaAuto = {
  id_renta_autos: string | number;
  nombre_proveedor: string;
  id_proveedor: string | number;
  codigo_renta_carro: string;
  descripcion_auto: string;
  edad: number;
  max_pasajeros: number;
  conductor_principal: string;
  id_conductor_principal: string | number;
  conductores_adicionales: string | null;
  comentarios: string | null;
  vehicle_id: string;
  tipo_auto: string;
  nombre_auto: string;
  marca_auto: string;
  modelo: string;
  anio_auto: number;
  transmission: string;
  fuel_type: string;
  doors: number;
  seats: number;
  air_conditioning: boolean | number | null;
  hora_recoger_auto: string;
  lugar_recoger_auto: string;
  id_sucursal_recoger_auto: string | number;
  hora_dejar_auto: string;
  lugar_dejar_auto: string;
  id_sucursal_dejar_auto: string | number;
  dias: number;
  seguro_incluido: boolean | number;
  monto_seguro: number;
  gps: boolean | number;
  child_seat: boolean | number;
  additional_driver: boolean | number;
  wifi_hotspot: boolean | number;
  gps_price: number;
  child_seat_price: number;
  additional_driver_price: number;
  wifi_price: number;
  fuel_policy: string;
  mileage_limit: number | string;
  free_cancellation: boolean | number;
  created_at: string;
  id_booking: string | number;
  usuario_creador: string;
  is_operaciones_last_move: boolean | number;
  usuario_actualizador: string | null;
  updated_at: string | null;
};

// =========================
// Helpers
// =========================
const parseNum = (v: any) => (v == null || v === "" ? 0 : Number(v));
const toBool = (v: any) =>
  v === true || v === 1 || v === "1" || v === "true" || v === "SI";

// Pill para booleanos
const BooleanPill: React.FC<{ value: any; label?: string }> = ({
  value,
  label,
}) => {
  const flag = toBool(value);
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-semibold ${flag ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}
    >
      {label ? (flag ? `Sí (${label})` : `No (${label})`) : flag ? "Sí" : "No"}
    </span>
  );
};

const Currency: React.FC<{ value: any }> = ({ value }) => (
  <span>${parseNum(value).toFixed(2)}</span>
);

// =========================
// Filtros por defecto (reusamos TypeFilters)
// =========================
const defaultFiltersAutos: TypeFilters = {
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

const defaultSortAutos = { key: "created_at", sort: false as const };

// =========================
// Fetch mock — aquí luego conectas tu back real
// =========================
type FetchAutosFn = (
  payload: Partial<TypeFilters>,
  options: any,
  cb: (data: SolicitudRentaAuto[]) => void
) => void;

/**
 * TODO: cuando tengas el back, cambia el cuerpo de esta función
 * por la llamada real (fetch/axios/etc).
 */
const fetchSolicitudesAutos: FetchAutosFn = (_payload, _options, cb) => {
  const ejemplos: SolicitudRentaAuto[] = [
    {
      id_renta_autos: 1,
      nombre_proveedor: "Hertz",
      id_proveedor: "PROV-001",
      codigo_renta_carro: "AUTO-HTZ-001",
      descripcion_auto: "Sedán compacto automático",
      edad: 28,
      max_pasajeros: 5,
      conductor_principal: "Juan Pérez",
      id_conductor_principal: "COND-001",
      conductores_adicionales: "María López",
      comentarios: "Entrega en aeropuerto CDMX T2",
      vehicle_id: "VEH-001",
      tipo_auto: "Sedán",
      nombre_auto: "Versa",
      marca_auto: "Nissan",
      modelo: "Versa Advance",
      anio_auto: 2023,
      transmission: "Automática",
      fuel_type: "Gasolina",
      doors: 4,
      seats: 5,
      air_conditioning: true,
      hora_recoger_auto: "2025-12-01T10:00:00",
      lugar_recoger_auto: "Aeropuerto CDMX T2",
      id_sucursal_recoger_auto: "SUC-HTZ-MEX-T2",
      hora_dejar_auto: "2025-12-05T10:00:00",
      lugar_dejar_auto: "Aeropuerto CDMX T2",
      id_sucursal_dejar_auto: "SUC-HTZ-MEX-T2",
      dias: 4,
      seguro_incluido: true,
      monto_seguro: 900,
      gps: true,
      child_seat: false,
      additional_driver: true,
      wifi_hotspot: false,
      gps_price: 0,
      child_seat_price: 0,
      additional_driver_price: 250,
      wifi_price: 0,
      fuel_policy: "Tanque lleno / Tanque lleno",
      mileage_limit: 800,
      free_cancellation: true,
      created_at: "2025-11-25T12:30:00",
      id_booking: "BOOK-001",
      usuario_creador: "operaciones@noktos.com",
      is_operaciones_last_move: true,
      usuario_actualizador: "operaciones@noktos.com",
      updated_at: "2025-11-26T09:15:00",
    },
    {
      id_renta_autos: 2,
      nombre_proveedor: "Avis",
      id_proveedor: "PROV-002",
      codigo_renta_carro: "AUTO-AVS-045",
      descripcion_auto: "SUV mediana, ideal familia",
      edad: 35,
      max_pasajeros: 7,
      conductor_principal: "Laura Martínez",
      id_conductor_principal: "COND-002",
      conductores_adicionales: "Carlos Ruiz",
      comentarios: "Incluye silla para bebé",
      vehicle_id: "VEH-045",
      tipo_auto: "SUV",
      nombre_auto: "Tiguan",
      marca_auto: "Volkswagen",
      modelo: "Tiguan Comfortline",
      anio_auto: 2022,
      transmission: "Automática",
      fuel_type: "Gasolina",
      doors: 5,
      seats: 7,
      air_conditioning: true,
      hora_recoger_auto: "2025-12-10T08:30:00",
      lugar_recoger_auto: "Sucursal Centro Monterrey",
      id_sucursal_recoger_auto: "SUC-AVS-MTY-CENTRO",
      hora_dejar_auto: "2025-12-13T19:00:00",
      lugar_dejar_auto: "Sucursal Centro Monterrey",
      id_sucursal_dejar_auto: "SUC-AVS-MTY-CENTRO",
      dias: 3,
      seguro_incluido: true,
      monto_seguro: 1200,
      gps: true,
      child_seat: true,
      additional_driver: false,
      wifi_hotspot: true,
      gps_price: 150,
      child_seat_price: 200,
      additional_driver_price: 0,
      wifi_price: 300,
      fuel_policy: "Tanque lleno / Tanque lleno",
      mileage_limit: "Kilometraje ilimitado",
      free_cancellation: true,
      created_at: "2025-11-24T15:20:00",
      id_booking: "BOOK-002",
      usuario_creador: "agente1@noktos.com",
      is_operaciones_last_move: false,
      usuario_actualizador: null,
      updated_at: null,
    },
    {
      id_renta_autos: 3,
      nombre_proveedor: "Alamo",
      id_proveedor: "PROV-003",
      codigo_renta_carro: "AUTO-ALM-777",
      descripcion_auto: "Económico manual, sin extras",
      edad: 23,
      max_pasajeros: 4,
      conductor_principal: "Diego Hernández",
      id_conductor_principal: "COND-003",
      conductores_adicionales: null,
      comentarios: "Cliente indica posible extensión 1 día",
      vehicle_id: "VEH-777",
      tipo_auto: "Económico",
      nombre_auto: "March",
      marca_auto: "Nissan",
      modelo: "March Sense",
      anio_auto: 2021,
      transmission: "Manual",
      fuel_type: "Gasolina",
      doors: 4,
      seats: 5,
      air_conditioning: true,
      hora_recoger_auto: "2025-11-30T09:00:00",
      lugar_recoger_auto: "Aeropuerto Guadalajara",
      id_sucursal_recoger_auto: "SUC-ALM-GDL-AIR",
      hora_dejar_auto: "2025-12-02T09:00:00",
      lugar_dejar_auto: "Aeropuerto Guadalajara",
      id_sucursal_dejar_auto: "SUC-ALM-GDL-AIR",
      dias: 2,
      seguro_incluido: false,
      monto_seguro: 0,
      gps: false,
      child_seat: false,
      additional_driver: false,
      wifi_hotspot: false,
      gps_price: 0,
      child_seat_price: 0,
      additional_driver_price: 0,
      wifi_price: 0,
      fuel_policy: "Mismo nivel de combustible",
      mileage_limit: 400,
      free_cancellation: false,
      created_at: "2025-11-23T11:05:00",
      id_booking: "BOOK-003",
      usuario_creador: "operaciones@noktos.com",
      is_operaciones_last_move: true,
      usuario_actualizador: "operaciones@noktos.com",
      updated_at: "2025-11-24T10:00:00",
    },
  ];

  cb(ejemplos);
};

// =========================
// Página principal AUTOS
// =========================
const AutosPage: React.FC = () => {
  const [allRentas, setAllRentas] = useState<SolicitudRentaAuto[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(defaultFiltersAutos);
  const [selectedAuto, setSelectedAuto] = useState<SolicitudRentaAuto | null>(null);
  const [isEditAutoOpen, setIsEditAutoOpen] = useState(false);
  const autoEditFields: FieldConfig<SolicitudRentaAuto>[] = [
    //añadir campos editables
  ];
  // Fetch de datos (mock por ahora)
  const handleFetchRentas = () => {
    setLoading(true);

    const payload = Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as any);

    fetchSolicitudesAutos(payload, {}, (data) => {
      setAllRentas(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchRentas();
  }, [filters]);

  // Búsqueda rápida
  const rentasFiltradas = useMemo(() => {
    const q = (searchTerm || "").toUpperCase();
    return allRentas.filter((item) => {
      return (
        (item.nombre_proveedor || "").toUpperCase().includes(q) ||
        (item.codigo_renta_carro || "").toUpperCase().includes(q) ||
        (item.conductor_principal || "").toUpperCase().includes(q) ||
        (item.nombre_auto || "").toUpperCase().includes(q) ||
        (item.marca_auto || "").toUpperCase().includes(q) ||
        String(item.id_renta_autos).toUpperCase().includes(q)
      );
    });
  }, [allRentas, searchTerm]);

  // Formato final para Table5
  const formatedRentas = useMemo(
    () =>
      rentasFiltradas.map((item) => ({
        id_renta_autos: item.id_renta_autos,
        nombre_proveedor: item.nombre_proveedor,
        id_proveedor: item.id_proveedor,
        codigo_renta_carro: item.codigo_renta_carro,
        descripcion_auto: item.descripcion_auto,
        edad: item.edad,
        max_pasajeros: item.max_pasajeros,
        conductor_principal: item.conductor_principal,
        id_conductor_principal: item.id_conductor_principal,
        conductores_adicionales: item.conductores_adicionales,
        comentarios: item.comentarios,
        vehicle_id: item.vehicle_id,
        tipo_auto: item.tipo_auto,
        nombre_auto: item.nombre_auto,
        marca_auto: item.marca_auto,
        modelo: item.modelo,
        anio_auto: item.anio_auto,
        transmission: item.transmission,
        fuel_type: item.fuel_type,
        doors: item.doors,
        seats: item.seats,
        air_conditioning: item.air_conditioning,
        hora_recoger_auto: item.hora_recoger_auto,
        lugar_recoger_auto: item.lugar_recoger_auto,
        id_sucursal_recoger_auto: item.id_sucursal_recoger_auto,
        hora_dejar_auto: item.hora_dejar_auto,
        lugar_dejar_auto: item.lugar_dejar_auto,
        id_sucursal_dejar_auto: item.id_sucursal_dejar_auto,
        dias: item.dias,
        seguro_incluido: item.seguro_incluido,
        monto_seguro: item.monto_seguro,
        gps: item.gps,
        child_seat: item.child_seat,
        additional_driver: item.additional_driver,
        wifi_hotspot: item.wifi_hotspot,
        gps_price: item.gps_price,
        child_seat_price: item.child_seat_price,
        additional_driver_price: item.additional_driver_price,
        wifi_price: item.wifi_price,
        fuel_policy: item.fuel_policy,
        mileage_limit: item.mileage_limit,
        free_cancellation: item.free_cancellation,
        created_at: item.created_at,
        id_booking: item.id_booking,
        usuario_creador: item.usuario_creador,
        is_operaciones_last_move: item.is_operaciones_last_move,
        usuario_actualizador: item.usuario_actualizador,
        updated_at: item.updated_at,
        editar: "",
        item, // para posibles renderers futuros
      })),
    [rentasFiltradas]
  );

  // Renderers para columnas específicas
  const renderers: Record<
    string,
    React.FC<{ value: any; item: SolicitudRentaAuto; index: number }>
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
    monto_seguro: ({ value }) => <Currency value={value} />,
    gps_price: ({ value }) => <Currency value={value} />,
    child_seat_price: ({ value }) => <Currency value={value} />,
    additional_driver_price: ({ value }) => <Currency value={value} />,
    wifi_price: ({ value }) => <Currency value={value} />,

    air_conditioning: ({ value }) => (
      <BooleanPill value={value} label="A/C" />
    ),
    seguro_incluido: ({ value }) => (
      <BooleanPill value={value} label="Seguro" />
    ),
    gps: ({ value }) => <BooleanPill value={value} label="GPS" />,
    child_seat: ({ value }) => (
      <BooleanPill value={value} label="Silla bebé" />
    ),
    additional_driver: ({ value }) => (
      <BooleanPill value={value} label="Conductor adicional" />
    ),
    wifi_hotspot: ({ value }) => (
      <BooleanPill value={value} label="WiFi" />
    ),
    free_cancellation: ({ value }) => (
      <BooleanPill value={value} label="Cancelación gratis" />
    ),
    is_operaciones_last_move: ({ value }) => (
      <BooleanPill value={value} label="Ops" />
    ),

    hora_recoger_auto: ({ value }) => (
      <span title={value}>{formatDate(value)}</span>
    ),
    hora_dejar_auto: ({ value }) => (
      <span title={value}>{formatDate(value)}</span>
    ),
    editar: ({ item }) => (
      <button
        onClick={() => {
          setSelectedAuto(item);
          setIsEditAutoOpen(true);
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
        Renta de autos
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
            <Table5<SolicitudRentaAuto>
              registros={formatedRentas}
              renderers={renderers}
              defaultSort={defaultSortAutos}
              leyenda={`Autos: Has filtrado ${formatedRentas.length} solicitudes`}
              customColumns={[
                "id_renta_autos",
                "nombre_proveedor",
                "id_proveedor",
                "codigo_renta_carro",
                "descripcion_auto",
                "edad",
                "max_pasajeros",
                "conductor_principal",
                "id_conductor_principal",
                "conductores_adicionales",
                "comentarios",
                "vehicle_id",
                "tipo_auto",
                "nombre_auto",
                "marca_auto",
                "modelo",
                "anio_auto",
                "transmission",
                "fuel_type",
                "doors",
                "seats",
                "air_conditioning",
                "hora_recoger_auto",
                "lugar_recoger_auto",
                "id_sucursal_recoger_auto",
                "hora_dejar_auto",
                "lugar_dejar_auto",
                "id_sucursal_dejar_auto",
                "dias",
                "seguro_incluido",
                "monto_seguro",
                "gps",
                "child_seat",
                "additional_driver",
                "wifi_hotspot",
                "gps_price",
                "child_seat_price",
                "additional_driver_price",
                "wifi_price",
                "fuel_policy",
                "mileage_limit",
                "free_cancellation",
                "created_at",
                "id_booking",
                "usuario_creador",
                "is_operaciones_last_move",
                "usuario_actualizador",
                "updated_at",
                "editar"
              ]}
            />
          )}
        </div>
      </div>
      {selectedAuto && isEditAutoOpen && (
        <Modal
          onClose={() => {
            setIsEditAutoOpen(false);
            setSelectedAuto(null);
          }}
          title="Editar renta de auto"
          subtitle="Actualiza la información relevante de la renta de auto."
        >
          <EditServiceModal<SolicitudRentaAuto>
            title="Editar renta de auto"
            initialData={selectedAuto}
            fields={autoEditFields}
            onClose={() => {
              setIsEditAutoOpen(false);
              setSelectedAuto(null);
            }}
            onSubmit={async (values) => {
              // Aquí conectas tu back real para actualizar la renta
              console.log("Actualizar AUTO", selectedAuto.id_renta_autos, values);

              // Ejemplo de cómo se vería con servicio:
              // await updateRentaAuto(selectedAuto.id_renta_autos, values);

              // Refrescar la tabla
              handleFetchRentas();
            }}
          />
        </Modal>
      )}

    </div>
  );
};

export default AutosPage;
