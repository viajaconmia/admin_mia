"use client";

import { SaldosService } from "@/services/SaldosService";
import { useEffect, useState } from "react";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import * as schema from "@/schemas/tables/complemento_pago";
import { CompleteTable } from "@/v3/template/Table";

type FiltrosComplementos = { proveedor?: string };
const PAGE_SIZE = 50;

export default function ReservationsPage() {
  const [saldos, setSaldos] = useState<schema.SaldoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosComplementos>({});
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);

  const fetchSaldos = async (page: number = tracking.page) => {
    setLoading(true);
    SaldosService.getInstance()
      .obtenerSaldos({ page })
      .then(({ data, metadata }) => {
        setSaldos(data.map((saldo) => schema.mapSaldo(saldo)));
        setTracking((prev) => ({
          ...prev,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
        }));
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setTracking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  return (
    <>
      <CompleteTable<schema.SaldoItem>
        pageTracking={tracking}
        fetchData={fetchSaldos}
        registros={saldos}
        loading={loading}
        renderers={schema.createRenderers({
          onVerDetalles: (id) =>
            console.log("Ver detalles de saldo con id:", id),
        })}
      />
    </>
  );
}
