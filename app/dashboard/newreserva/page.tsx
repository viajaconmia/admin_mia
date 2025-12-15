"use client";

import { ButtonCopiar, Tooltip } from "@/component/atom/ItemTable";
import { Table } from "@/component/molecule/Table";
import { Loader } from "@/components/atom/Loader";
import { ToolTip } from "@/components/atom/ToolTip";
import Filters from "@/components/Filters";
import { useFilters } from "@/context/Filters";
import { formatDate } from "@/helpers/formater";
import { currentDate } from "@/lib/utils";
import { BookingAll, BookingsService } from "@/services/BookingService";
import { TypeFilters } from "@/types";
import { useEffect, useState } from "react";

const App = ({ agente }: { agente?: Agente }) => {
  const { search } = useFilters();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [reservas, setReservas] = useState<BookingAll[]>([]);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );

  const handleFetchSolicitudes = async () => {
    setLoading(true);
    // const payload = formatFilters(filters);
    // if (agente?.id_agente) payload["id_client"] = agente.id_agente;
    const booking = await new BookingsService();
    const response = booking.obtenerReservas();
    console.log(response);
    setReservas((await response).data);
    setLoading(false);
  };

  const renderers = {
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
    viajero: ({ value }) => <>{value}</>,
    check_in: ({ value }) => <>{formatDate(value)}</>,
    check_out: ({ value }) => <>{formatDate(value)}</>,
  };

  const inputSearch = search.toUpperCase();
  const data = reservas
    .filter(
      (reserva) =>
        (reserva.proveedor?.toUpperCase() || "").includes(inputSearch) ||
        (reserva.agente?.toUpperCase() || "").includes(inputSearch)
    )
    .map((reserva) => ({
      id: reserva.id_agente,
      cliente: reserva.agente,
      creado: reserva.created_at,
      proveedor: reserva.proveedor,
      codigo: reserva.codigo_confirmacion,
      viajero: reserva.viajero,
      check_in: reserva.check_in,
      check_out: reserva.check_out,
    }));

  useEffect(() => {
    handleFetchSolicitudes();
  }, [filters]);

  return (
    <>
      <Filters defaultFilters={filters} onFilter={setFilters} />

      <div className="overflow-hidden">
        {loading ? (
          <Loader />
        ) : (
          <Table
            registros={data}
            renderers={renderers}
            setPage={setPage}
            back={page > 0}
            next={reservas.length < MAX_REGISTERS}
          ></Table>
        )}
      </div>
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

export default App;
