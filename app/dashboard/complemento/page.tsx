"use client";

import { SaldosService } from "@/services/SaldosService";
import { Saldo } from "@/types/database_tables";
import { useEffect, useState } from "react";
import {
  initialTracking,
  PageTracker,
  TrackingPage,
} from "../invoices/_components/tracker_false";
import { Table } from "@/component/molecule/Table";
import Button from "@/components/atom/Button";
import { RefreshCcw } from "lucide-react";

type FiltrosComplementos = { proveedor?: string };

export default function ReservationsPage() {
  const [saldos, setSaldos] = useState<SaldoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosComplementos>({});
  const [pageTracking, setPageTraking] =
    useState<TrackingPage>(initialTracking);

  const fetchSaldos = async (page: number = pageTracking.page) => {
    setLoading(true);
    SaldosService.getInstance()
      .obtenerSaldos({ page })
      .then(({ data }) => setSaldos(data.map((saldo) => mapSaldo(saldo))))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPageTraking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  return (
    <>
      <Tables<SaldoItem>
        pageTracking={pageTracking}
        fetchData={fetchSaldos}
        registros={saldos}
        loading={loading}
      />
    </>
  );
}

type TablesProps<T> = {
  pageTracking: TrackingPage;
  fetchData: (page?: number) => void;
  registros: T[];
  loading: boolean;
};

const Tables = <T,>({
  pageTracking,
  fetchData,
  registros,
  loading,
}: TablesProps<T>) => {
  return (
    <div className="flex flex-col gap-4 bg-white rounded-lg p-4">
      <div className="flex justify-end items-center">
        <Button size="sm" onClick={() => fetchData()} icon={RefreshCcw}>
          {registros.length > 0 ? "Actualizar" : "Cargar datos"}
        </Button>
      </div>
      <Table registros={registros || []} loading={loading} />
      <PageTracker tracking={pageTracking} setPage={fetchData} />
    </div>
  );
};

type SaldoItem = Pick<Saldo, "activo" | "nombre" | "banco_tarjeta"> & {
  acciones: number;
};

const mapSaldo = (saldo: Saldo): SaldoItem => {
  return {
    activo: saldo.activo,
    nombre: saldo.nombre,
    banco_tarjeta: saldo.banco_tarjeta,
    acciones: saldo.id_saldos,
  };
};

const createRenderers = ({
  onVerDetalles,
}: {
  onVerDetalles: (id: number) => void;
}) => {
  return {
    acciones: (value: number) => (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onVerDetalles(value)}
      >
        Ver detalle
      </Button>
    ),
  };
};
