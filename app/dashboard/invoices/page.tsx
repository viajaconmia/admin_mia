"use client";

import { useState } from "react";
import { facturasService } from "@/angel/services/facturas";
import * as schema from "@/schemas/tables/facturas";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import { CompleteTable } from "@/v3/template/Table";
import { useAlert } from "@/context/useAlert";

const PAGE_SIZE = 50;

export default function InvoicesPage() {
  const [facturas, setFacturas] = useState<schema.FacturaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);
  const { error } = useAlert();

  const fetchFacturas = async (page: number = tracking.page) => {
    setLoading(true);
    facturasService
      .filtrarFacturas({ page, length: PAGE_SIZE })
      .then(({ data, metadata }) => {
        setFacturas((data ?? []).map((factura) => schema.mapFactura(factura)));
        setTracking((prev) => ({
          ...prev,
          page,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
        }));
      })
      .catch((er) => error(er.message || "Error al obtener las facturas"))
      .finally(() => setLoading(false));
  };

  return (
    <CompleteTable<schema.FacturaItem>
      pageTracking={tracking}
      fetchData={fetchFacturas}
      registros={facturas}
      loading={loading}
      renderers={schema.createFacturaRenderers()}
    />
  );
}
