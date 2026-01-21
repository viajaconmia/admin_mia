"use client";

import {
  ServiceIcon,
  ButtonCopiar,
  LinkCopiar,
  Tooltip,
  MarginPercent,
} from "@/component/atom/ItemTable";
import { Table } from "@/component/molecule/Table";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import Filters from "@/components/Filters";
import { ReservationEditContainer } from "@/components/organism/FormReservation2";
import Modal from "@/components/organism/Modal";
import { PaymentModal } from "@/components/organism/PaymentProveedor/PaymentProveedor";
import { ROUTES } from "@/constant/routes";
import { useFilters } from "@/context/Filters";
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
import { DollarSign, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchParams } from "wouter";

const PageReservas = ({ agente }: { agente?: Agente }) => {
  const [parametros, setParametros] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(parametros.get("page")) || 0);
  const [reservas, setReservas] = useState<BookingAll[]>([]);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );
  const [selectedItem, setSelectedItem] = useState<BookingAll>(null);
  const [selectedEdit, setSelectedEdit] = useState<string>(null);
  const router = useRouter();
  const { showNotification } = useNotification();

  const setPageParam = (value) => {
    const params = parametros;
    params.set("page", value);
    setParametros(params.toString());
  };

  const handleFetchSolicitudes = async () => {
    setLoading(true);
    // const payload = formatFilters(filters);
    // if (agente?.id_agente) payload["id_client"] = agente.id_agente;
    const booking = await new BookingsService();
    const response = await booking.obtenerReservas(page, MAX_REGISTERS);
    console.log(response);
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
      console.log(value, reserva);
      return (
        <>
          {reserva.status_reserva != "Cancelada" && (
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
                reservas.filter((book) => book.id_solicitud == value)[0]
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
      ((Number(reserva.total_booking || 0) - Number(reserva.costo_total || 0)) /
        Number(reserva.total_booking || 0)) *
      100,
    precio_de_venta: reserva.total_booking,
    metodo_de_pago: reserva.metodo_pago,
    reservante: reserva.reservante,
    etapa_reservacion: reserva.etapa_reservacion,
    estado: reserva.status_reserva,
    detalles_cliente: reserva.id_solicitud,
    editar: reserva.type == "hotel" ? reserva.id_solicitud : reserva.id_booking,
    pagar: reserva.status_reserva == "Confirmada" ? reserva.id_solicitud : null,
  }));

  useEffect(() => {
    handleFetchSolicitudes();
    setPageParam(page);
  }, [filters, page]);

  return (
    <>
      <Filters defaultFilters={filters} onFilter={setFilters} />
      <div className="w-full flex justify-end p-4">
        <Button
          icon={Plus}
          size="sm"
          onClick={() => router.push("/dashboard/newreserva/crear")}
        >
          Crear reservacion
        </Button>
      </div>

      <div className="overflow-hidden">
        <Table
          registros={data}
          renderers={renderers}
          setPage={setPage}
          back={page > 0}
          next={reservas.length == MAX_REGISTERS}
          page={page}
          loading={loading}
        ></Table>
      </div>
      {selectedItem && (
        <Modal
          onClose={() => {
            setSelectedItem(null);
          }}
          title="Pagar reserva al proveedor"
        >
          <PaymentModal reservation={selectedItem} />
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

const formatFilters = (filters) =>
  Object.entries(filters)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as any);

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

export default PageReservas;
