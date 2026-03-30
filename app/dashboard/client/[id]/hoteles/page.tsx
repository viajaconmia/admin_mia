"use client";

import { CompleteTable, TrackingPage } from "@/v3/template/Table";
import { useState } from "react";

export default function PageHoteles() {
  return (
    <section>
      <main>
        <TableHotelesPermitidos />
      </main>
    </section>
  );
}

const TableHotelesPermitidos = () => {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [tracking, setTracking] = useState<TrackingPage>({
    page: 1,
    total: 0,
    total_pages: 1,
  });

  const fetchSaldos = async (page: number = tracking.page) => {
    setLoading(true);
    // SaldosService.getInstance()
    // .obtenerSaldos({ page })
    // .then(({ data, metadata }) => {
    // setSaldos(data.map((saldo) => schema.mapSaldo(saldo)));
    // setTracking((prev) => ({
    // ...prev,
    // total: metadata?.total || 0,
    // total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
    // }));
    // })
    // .catch((error) => console.error(error))
    // .finally(() => setLoading(false));
  };
  return (
    <>
      <CompleteTable
        pageTracking={tracking}
        fetchData={fetchSaldos}
        registros={registros}
        loading={loading}
      />
    </>
  );
};
