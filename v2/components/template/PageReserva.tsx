"use client";

import { FilterInput } from "@/component/atom/FilterInput";
import {
  ServiceIcon,
  ButtonCopiar,
  LinkCopiar,
  Tooltip,
  MarginPercent,
} from "@/component/atom/ItemTable";
import { Table } from "@/component/molecule/Table";
import Button from "@/components/atom/Button";
import { ReservationEditContainer } from "@/components/organism/FormReservation2";
import Modal from "@/components/organism/Modal";
import { PaymentModal } from "@/components/organism/PaymentProveedor/PaymentProveedor";
import { ROUTES } from "@/constant/routes";
import { useNotification } from "@/context/useNotificacion";
import {
  formatDate,
  formatNumberWithCommas,
  formatTime,
} from "@/helpers/formater";
import { getStatusBadge } from "@/helpers/utils";
import { currentDate } from "@/lib/utils";
import { BookingAll, BookingsService } from "@/services/BookingService";
import { TypeFilters } from "@/types";
import { Dropdown } from "@/v2/components/atom/Dropdown";
import FilterPills from "@/v2/components/atom/FilterPills";
import {
  PageTracker,
  TrackingPage,
} from "@/v2/components/molecule/PageTracking";
import { DollarSign, Pencil, Plus, RefreshCwIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PageReservas = ({ agente }: { agente?: Agente }) => {
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingPage>({
    page: 1,
    total: 0,
    total_pages: 1,
  });
  const [reservas, setReservas] = useState<BookingAll[]>([]);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes,
  );
  const [selectedItem, setSelectedItem] = useState<BookingAll>(null);
  const [selectedEdit, setSelectedEdit] = useState<string>(null);
  const router = useRouter();
  const { showNotification } = useNotification();

  const handleFetchSolicitudes = async (page = tracking.page) => {
    setLoading(true);
    let extras = agente?.id_agente ? { id_client: agente.id_agente } : {};
    const booking = new BookingsService();
    const response = await booking.obtenerReservas({
      page,
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

  const renderers = {
    serv: ({ value }) => <ServiceIcon type={value} />,
    id: ({ value }: { value: string }) => (
      <ButtonCopiar copy_value={value} label={value.slice(0, 12)} />
    ),
    cliente: (valor) => {
      return <h1>{valor.value}</h1>;
    },
    creado: ({ value }) => <>{formatDate(value)}</>,
    proveedor: ({ value }: { value: string }) => (
      <Tooltip content={value}>
        {(value || "").slice(0, 20)}
        {(value || "").length >= 20 && (
          <span className="font-semibold text-sm">. . .</span>
        )}
      </Tooltip>
    ),
    codigo: ({ value }) => (
      <Tooltip content={value}>
        {(value || "").slice(0, 15)}
        {(value || "").length >= 15 && (
          <span className="font-semibold text-sm">. . .</span>
        )}
      </Tooltip>
    ),
    markup: ({ value }) => <MarginPercent value={value} />,
    viajero: ({ value }) => <>{value}</>,
    check_in: ({ value }) => <>{formatDate(value)}</>,
    horario_salida: ({ value }) => <>{value ? formatTime(value) : ""}</>,
    check_out: ({ value }) => <>{formatDate(value)}</>,
    horario_llegada: ({ value }) => <>{value ? formatTime(value) : ""}</>,
    costo_proveedor: ({ value }) => (
      <>{value ? "$" + formatNumberWithCommas(value) : ""}</>
    ),
    estado: ({ value }) => <span title={value}>{getStatusBadge(value)}</span>,
    precio_de_venta: ({ value }) => (
      <>{value ? "$" + formatNumberWithCommas(value) : ""}</>
    ),
    detalles_cliente: ({ value }) => (
      <LinkCopiar link={ROUTES.BOOKING.ID_SOLICITUD(value) || ""} />
    ),
    editar: ({ value }: { value: string }) => {
      const book = new BookingsService();
      const handleCancel = async () => {
        try {
          const response = await book.cancelarBooking(value);
          console.log(response);
          handleFetchSolicitudes();
        } catch (error) {
          showNotification("error", error.message || "error");
        }
      };
      if (value.includes("sol-"))
        return (
          <Button
            icon={Pencil}
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedEdit(value);
            }}
          >
            Editar
          </Button>
        );
      const reserva = reservas.filter((boo) => boo.id_booking == value)[0];
      if (!reserva)
        return (
          <span>
            Si me ves avisale a angel de tecnologia, soy un bug que estuvo
            buscando, le ayudarias mucho 👍
          </span>
        );
      return (
        <>
          {reserva.estado != "Cancelada" && (
            <Button
              icon={Trash2}
              size="sm"
              variant="warning"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          )}
        </>
      );
    },
    pagar: ({ value }) => (
      <>
        {value && (
          <Button
            onClick={() =>
              setSelectedItem(
                reservas.filter((book) => book.id_solicitud == value)[0],
              )
            }
            icon={DollarSign}
            size="sm"
            variant="ghost"
          >
            Pagar
          </Button>
        )}
      </>
    ),
  };

  const data = reservas.map((reserva) => ({
    serv: reserva.type,
    id: reserva.id_agente,
    cliente: reserva.agente,
    creado: reserva.created_at,
    proveedor: reserva.proveedor,
    codigo: reserva.codigo_confirmacion,
    viajero: reserva.viajero,
    check_in: reserva.check_in,
    horario_salida: reserva.horario_salida,
    check_out: reserva.check_out,
    horario_llegada: reserva.horario_llegada,
    tipo: reserva.tipo_cuarto_vuelo,
    costo_proveedor: reserva.costo_total,
    markup:
      ((Number(reserva.total || 0) - Number(reserva.costo_total || 0)) /
        Number(reserva.total || 0)) *
      100,
    precio_de_venta: reserva.total,
    metodo_de_pago: reserva.metodo_pago,
    reservante: reserva.reservante,
    etapa_reservacion: reserva.etapa_reservacion,
    estado: reserva.estado,
    detalles_cliente: reserva.id_solicitud,
    editar: reserva.type == "hotel" ? reserva.id_solicitud : reserva.id_booking,
    pagar: reserva.estado == "Confirmada" ? reserva.id_solicitud : null,
  }));

  const handleFilterChange = (value, propiedad) => {
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
    <>
      <div className="grid md:grid-cols-2 gap-4 p-4 pb-0">
        <Dropdown label="Filtros" onClose={() => handleFetchSolicitudes()}>
          <div className="w-full p-4 pb-10 grid md:grid-cols-4 gap-4">
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
          </div>
          <div className="flex justify-end w-full mt-11">
            <Button
              onClick={() => handleFetchSolicitudes()}
              disabled={loading}
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
        </Dropdown>
        <Button onClick={() => setFilters({})} icon={Trash2} variant="ghost">
          Limpiar
        </Button>
        <div className="col-span-2">
          <FilterPills filters={filters} onRemove={handleFilterChange} />
        </div>
      </div>
      <div className="w-full flex justify-end p-4 gap-2 pt-0">
        {!agente?.id_agente ? (
          <Button
            icon={Plus}
            size="sm"
            onClick={() => router.replace("/dashboard/newreserva/crear")}
          >
            Crear reservacion
          </Button>
        ) : (
          <Button
            icon={Plus}
            size="sm"
            onClick={() =>
              window.location.assign(
                "/dashboard/newreserva/crear?client=" + agente.id_agente,
              )
            }
          >
            Crear reservacion
          </Button>
        )}
        <Button
          onClick={() => handleFetchSolicitudes()}
          disabled={loading}
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
      {selectedItem && (
        <Modal
          onClose={() => {
            setSelectedItem(null);
          }}
          title="Pagar reserva al proveedor"
        >
          <PaymentModal
            reservation={{
              ...selectedItem,
              codigo_confirmacion: selectedItem.codigo_confirmacion || "",
            }}
          />
        </Modal>
      )}
      {selectedEdit && (
        <Modal
          onClose={() => {
            setSelectedEdit(null);
          }}
          title="Editar reserva"
          subtitle="Modifica los detalles de una reservación anteriormente procesada."
        >
          <ReservationEditContainer
            id_solicitud={selectedEdit}
            onClose={() => {
              setSelectedItem(null);
              handleFetchSolicitudes();
            }}
          />
        </Modal>
      )}
    </>
  );
};

const MAX_REGISTERS = 20;

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
  // markup_end: null,
  // markup_start: null,
};

export default PageReservas;
