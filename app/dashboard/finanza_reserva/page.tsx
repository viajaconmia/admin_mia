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
import { Copy, Download, RefreshCwIcon, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFile } from "@/hooks/useFile";

// ── UuidCell ────────────────────────────────────────────────────────────────
const UuidCell = ({ value, label }: { value: string; label: string }) => {
  const [open, setOpen] = useState(false);

  if (!value) return <span className="text-gray-300 text-xs">—</span>;

  const uuids = value
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  if (uuids.length === 1) {
    return (
      <span className="font-mono text-[10px] text-gray-700 flex items-center gap-1">
        <span className="truncate max-w-[120px]" title={uuids[0]}>{uuids[0]}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(uuids[0])}
          className="text-gray-400 hover:text-blue-500 shrink-0"
          title="Copiar"
        >
          <Copy className="w-3 h-3" />
        </button>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] font-medium text-blue-600 hover:underline"
      >
        Ver {uuids.length} {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-1.5 max-h-72 overflow-y-auto">
              {uuids.map((uuid, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span className="font-mono text-xs text-gray-700 truncate">{uuid}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(uuid)}
                    className="text-gray-400 hover:text-blue-500 shrink-0"
                    title="Copiar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

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

      const splitUuids = (raw: string | null | undefined) =>
        (raw || "").split(",").map((u) => u.trim()).filter(Boolean);

      const formatData = response.data.flatMap((reserva) => {
        const base = {
          servicio: reserva.type,
          id_cliente: reserva.id_agente,
          cliente: reserva.agente,
          creado: reserva.created_at
            ? `${reserva.created_at.split("T")[0]} : ${reserva.created_at.split("T")[1]}`
            : "",
          proveedor: reserva.proveedor,
          intermediario: reserva.intermediario,
          codigo: reserva.codigo_confirmacion,
          viajero: reserva.viajero,
          check_in: reserva.check_in ? reserva.check_in.split("T")[0] : "",
          horario_salida: reserva.horario_salida,
          check_out: reserva.check_out ? reserva.check_out.split("T")[0] : "",
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
          total_factura: reserva.total_factura,
          total_facturado_recibido: reserva.monto_facturado_factura_recibida || "",
        };

        const emitidos = splitUuids(reserva.uuid_factura);
        const recibidos = splitUuids(reserva.uuid_recibido);
        const len = Math.max(emitidos.length, recibidos.length, 1);

        return Array.from({ length: len }, (_, i) => ({
          ...base,
          uuid_emitido: emitidos[i] ?? "",
          uuid_recibido: recibidos[i] ?? "",
        }));
      });

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
    id_proveedor: ({ value }: { value: string }) => (<p className="font-bold text-gray-800">{value || ""}</p>),
    rfc_proveedor: ({ value }: { value: string }) => (<p className="font-normal text-gray-700">{value || ""}</p>),
    razon_social_proveedor: ({ value }: { value: string }) => (<p className="font-normal text-gray-700">{value || ""}</p>),
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
    uuid_emitido: ({ value }) => (
      <UuidCell value={value} label="UUIDs emitidos" />
    ),
    uuid_recibido: ({ value }) => (
      <UuidCell value={value} label="UUIDs recibidos" />
    ),
  };

  const data = reservas.map((reserva) => ({
    serv: reserva.type,
    id: reserva.id_agente || "",
    cliente: reserva.agente,
    creado: reserva.created_at,// modificacion

    id_proveedor: reserva.id_proveedor,
    proveedor: reserva.proveedor,
    rfc_proveedor: reserva.rfc_proveedor || "",
    razon_social_proveedor: reserva.razon_social_proveedor || "",

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
    uuid_recibido: reserva.uuid_recibido || "",
    total_facturado_recibido: reserva.monto_facturado_factura_recibida || "",
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
              propiedad="id_proveedor"
              value={filters.id_proveedor || null}
              label="ID proveedor"
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
              propiedad="rfc_proveedor"
              value={filters.rfc_proveedor || null}
              label="RFC proveedor"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="razon_social_proveedor"
              value={filters.razon_social_proveedor || null}
              label="Razón social proveedor"
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
  razon_social_proveedor: null,
  rfc_proveedor: null,
  id_proveedor: null,
  filterType: "Transaccion",
};

export default PageReservas;
