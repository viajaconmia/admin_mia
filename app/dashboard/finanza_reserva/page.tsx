"use client";

import { FilterInput } from "@/component/atom/FilterInput";
import {
  ServiceIcon,
  ButtonCopiar,
  Tooltip,
  MarginPercent,
} from "@/component/atom/ItemTable";
import { Table } from "@/component/molecule/Table";
import Button from "@/components/atom/Button";
import { useAlert } from "@/context/useAlert";
import {
  formatDate,
  formatNumberWithCommas,
  formatTime,
} from "@/helpers/formater";
import { calcularNoches, getStatusBadge } from "@/helpers/utils";
import { currentDate } from "@/lib/utils";
import { BookingAll, BookingsService } from "@/services/BookingService";
import { TypeFilters } from "@/types";
import { Dropdown } from "@/v2/components/atom/Dropdown";
import FilterPills from "@/v2/components/atom/FilterPills";
import {
  PageTracker,
  TrackingPage,
} from "@/v2/components/molecule/PageTracking";
import { Download, RefreshCwIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePermiso } from "@/hooks/usePermission";
import { useFile } from "@/hooks/useFile";

const PageReservas = ({ agente }: { agente?: Agente }) => {
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingPage>({
    page: 1,
    total: 0,
    total_pages: 1,
  });
  const [reservas, setReservas] = useState<BookingAll[]>([]);
  const [filters, setFilters] = useState<TypeFilters & { monto?: string }>(
    defaultFiltersSolicitudes,
  );
  const { showNotification } = useAlert();
  const { csv, loadingFile, setLoadingFile } = useFile();

  const booking_service = new BookingsService();
  const handleFetchSolicitudes = async (page = tracking.page) => {
    setLoading(true);
    let extras = agente?.id_agente ? { id_client: agente.id_agente } : {};
    const response = await booking_service.obtenerReservas({
      page,
      finanzas: true,
      length: MAX_REGISTERS,
      ...filters,
      ...extras,
    });
    console.log(response);
    setTracking((prev) => ({
      ...prev,
      total: response.metadata.total,
      total_pages: Math.ceil(response.metadata.total / MAX_REGISTERS),
    }));
    setReservas(response.data || []);
    setLoading(false);
  };

  const handleExport = async () => {
    setLoadingFile(true);
    try {
      let fileName = "Reservas";

      if (!confirm('¿Quieres usar el nombre "Reservas" por default?')) {
        const customName = prompt("Escribe el nombre del archivo:");

        if (customName && customName.trim() !== "") {
          fileName = customName.trim();
        }
      }
      let extras = agente?.id_agente ? { id_client: agente.id_agente } : {};

      const response = await booking_service.obtenerReservas({
        ...filters,
        ...extras,
        finanzas: true,
      });

      const formatData = response.data.map((reserva) => ({
        servicio: reserva.type,
        id_cliente: reserva.id_agente,
        cliente: reserva.agente,
        creado: `${reserva.created_at.split("T")[0]} : ${reserva.created_at.split("T")[1]}`,
        proveedor: reserva.proveedor,
        intermediario: reserva.intermediario,
        codigo: reserva.codigo_confirmacion,
        viajero: reserva.viajero,
        check_in: reserva.check_in.split("T")[0],
        horario_salida: reserva.horario_salida,
        check_out: reserva.check_out.split("T")[0],
        horario_llegada: reserva.horario_llegada,
        noches:
          reserva.check_in && reserva.check_out
            ? calcularNoches(reserva.check_in, reserva.check_out)
            : "",
        tipo: reserva.tipo_cuarto_vuelo,
        costo_proveedor: Number(reserva.costo_total || 0),
        markup:
          ((Number(reserva.total || 0) - Number(reserva.costo_total || 0)) /
            Number(reserva.total || 0)) *
          100,
        precio_de_venta: reserva.total,
        metodo_de_pago: reserva.metodo_pago,
        reservante: reserva.reservante,
        etapa_reservacion: reserva.etapa_reservacion,
        estado: reserva.estado,
        estado_pago: reserva.estado_pago,
        estado_facturacion: reserva.estado_facturacion,
        id_booking: reserva.id_booking,
        uuid_emitido: reserva.uuid_factura || "",
        total_factura: reserva.total_factura,
      }));

      csv(formatData, fileName);
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setLoadingFile(false);
    }
  };

  const renderers = {
    serv: ({ value }) => <ServiceIcon type={value} />,
    id: ({ value }: { value: string }) => (
      <ButtonCopiar copy_value={value} label={value.slice(0, 12)} />
    ),
    cliente: (valor) => {
      return <h1>{valor.value}</h1>;
    },
    creado: ({ value }) => <>{value ? formatDate(value) : ""}</>,
    proveedor: ({ value }: { value: string }) => (
      <Tooltip content={value}>{value || ""}</Tooltip>
    ),
    codigo: ({ value }) => <Tooltip content={value}>{value || ""}</Tooltip>,
    markup: ({ value }) => <MarginPercent value={value} />,
    viajero: ({ value }) => <>{value}</>,
    check_in: ({ value }) => <>{value ? formatDate(value) : ""}</>,
    horario_salida: ({ value }) => <>{value ? formatTime(value) : ""}</>,
    check_out: ({ value }) => <>{value ? formatDate(value) : ""}</>,
    horario_llegada: ({ value }) => <>{value ? formatTime(value) : ""}</>,
    costo_proveedor: ({ value }) => (
      <>{value ? "$" + formatNumberWithCommas(value) : ""}</>
    ),
    estado: ({ value }) => <span title={value}>{getStatusBadge(value)}</span>,
    precio_de_venta: ({ value }) => (
      <>{value ? "$" + formatNumberWithCommas(value) : ""}</>
    ),
  };

  const data = reservas.map((reserva) => ({
    serv: reserva.type,
    id: reserva.id_agente || "",
    cliente: reserva.agente,
    creado: reserva.created_at,
    proveedor: reserva.proveedor,
    codigo: reserva.codigo_confirmacion,
    viajero: reserva.viajero,
    check_in: reserva.check_in,
    horario_salida: reserva.horario_salida,
    check_out: reserva.check_out,
    horario_llegada: reserva.horario_llegada,
    noches:
      reserva.check_in && reserva.check_out
        ? calcularNoches(reserva.check_in, reserva.check_out)
        : "",
    tipo: reserva.tipo_cuarto_vuelo,
    costo_proveedor: Number(reserva.costo_total || 0),
    markup:
      ((Number(reserva.total || 0) - Number(reserva.costo_total || 0)) /
        Number(reserva.total || 0)) *
      100,
    precio_de_venta: Number(reserva?.total || 0),
    metodo_de_pago: reserva.metodo_pago,
    reservante: reserva.reservante,
    etapa_reservacion: reserva.etapa_reservacion,
    estado: reserva.estado,
    estado_pago: reserva.estado_pago,
    estado_facturacion: reserva.estado_facturacion,
    intermediario: reserva.intermediario,
    uuid_emitido: reserva.uuid_factura || "",
    total_factura: reserva.total_factura,
  }));

  const handleFilterChange = (value: string | null, propiedad: string) => {
    if (value == null) {
      const newObj = Object.fromEntries(
        Object.entries({ ...filters }).filter(([key]) => key != propiedad),
      );
      setFilters(newObj);
      return;
    }
    setFilters((prev) => ({ ...prev, [propiedad]: value }));
  };

  useEffect(() => {
    setTracking((prev) => ({ ...prev, page: 1 }));
  }, [filters]);

  return (
    <div className="w-full bg-white">
      <div className="grid md:grid-cols-2 gap-4 p-4 pb-0">
        <Dropdown label="Filtros" onConfirm={handleFetchSolicitudes}>
          <div className="w-full p-8 grid md:grid-cols-4 gap-4">
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="codigo_reservacion"
              value={filters.codigo_reservacion || null}
              label="Código de reservación"
            />
            <FilterInput
              type="date"
              onChange={handleFilterChange}
              propiedad="startDate"
              value={filters.startDate || null}
              label="Desde"
            />
            <FilterInput
              type="date"
              onChange={handleFilterChange}
              propiedad="endDate"
              value={filters.endDate || null}
              label="Hasta"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="proveedor"
              value={filters.proveedor || null}
              label="Proveedor"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="id_client"
              value={filters.id_client || null}
              label="ID del cliente"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="cliente"
              value={filters.cliente || null}
              label="Cliente"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="traveler"
              value={filters.traveler || null}
              label="Viajero"
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="status"
              value={filters.status || null}
              label="Estado"
              options={["Confirmada", "Cancelada", "Pendiente"]}
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="reservationStage"
              value={filters.reservationStage || null}
              label="Etapa de reservación"
              options={["Reservado", "In house", "Check out"]}
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="reservante"
              value={filters.reservante || null}
              label="Reservante"
              options={["Operaciones", "Cliente"]}
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="paymentMethod"
              value={filters.paymentMethod || null}
              label="Método de pago"
              options={["Credito", "Contado"]}
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="filterType"
              value={filters.filterType || null}
              label="Filtrar fecha por:"
              options={["transaccion", "Check in", "Check out"]}
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="monto"
              value={filters.monto || null}
              label="Monto"
            />
          </div>
        </Dropdown>
        <Button onClick={() => setFilters({})} icon={Trash2} variant="ghost">
          Limpiar
        </Button>
        <div className="col-span-2">
          <FilterPills filters={filters} onRemove={handleFilterChange} />
        </div>
      </div>
      <div className="w-full flex justify-end p-4 gap-2 pt-0">
        <Button
          onClick={handleExport}
          disabled={loading || loadingFile}
          variant="secondary"
          size="sm"
          icon={Download}
        >
          Exportar
        </Button>
        <Button
          onClick={() => handleFetchSolicitudes()}
          disabled={loading}
          variant="ghost"
          size="sm"
          icon={RefreshCwIcon}
        >
          {loading
            ? "Cargando..."
            : !reservas
              ? "Buscar resultados"
              : "Refrescar"}
        </Button>
      </div>

      <div className="overflow-hidden flex gap-2 flex-col">
        <p className="font-semibold text-gray-600 text-xs">
          Total de reservas: {tracking.total}
        </p>
        <Table
          maxHeight="25rem"
          registros={data}
          renderers={renderers}
          loading={loading}
        ></Table>
        {reservas && (
          <PageTracker
            tracking={tracking}
            setPage={(page) => {
              setTracking((prev) => ({
                ...prev,
                page,
              }));
              handleFetchSolicitudes(page);
            }}
          ></PageTracker>
        )}
      </div>
    </div>
  );
};

const MAX_REGISTERS = 50;

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
};

export default PageReservas;
