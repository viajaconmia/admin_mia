"use client";

import { CorreosService } from "@/services/CorreosService";
import { useEffect, useState } from "react";
import * as track from "@/app/dashboard/invoices/_components/tracker_false";
import * as schema from "@/schemas/tables/correos_procesados";
import { CompleteTable } from "@/v3/template/Table";
import { FilterInput } from "@/component/atom/FilterInput";

const PAGE_SIZE = 50;

type FiltrosCorreos = {
  id_correo?: string;
  subject?: string;
  status?: string;
  procesado?: string;
  startDate?: string;
  endDate?: string;
  filterType?: string;
};

export default function CotizacionPage() {
  const [correos, setCorreos] = useState<schema.CorreoProcesadoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosCorreos>({});
  const [tracking, setTracking] = useState<track.TypeTracking>(track.initial);

  useEffect(() => {
    setTracking((prev) => ({ ...prev, page: 1 }));
  }, [filtros]);

  const fetchCorreos = async (page: number = tracking.page) => {
    setLoading(true);
    const { procesado, ...rest } = filtros;
    CorreosService.getInstance()
      .obtenerCorreos({
        ...rest,
        ...(procesado === "Sí"
          ? { procesado: "1" }
          : procesado === "No"
            ? { procesado: "0" }
            : {}),
        page,
        length: PAGE_SIZE,
      })
      .then(({ data, metadata }) => {
        setCorreos((data ?? []).map((correo) => schema.mapCorreoProcesado(correo)));
        setTracking((prev) => ({
          ...prev,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
        }));
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (value: string | null, propiedad: string) => {
    if (value == null) {
      const newObj = Object.fromEntries(
        Object.entries({ ...filtros }).filter(([key]) => key !== propiedad),
      );
      setFiltros(newObj);
      return;
    }
    setFiltros((prev) => ({ ...prev, [propiedad]: value }));
  };

  return (
    <>
      <div className="w-full grid md:grid-cols-4 bg-gray-50 border rounded-md p-4 gap-4 mb-4">
        <FilterInput
          type="text"
          onChange={handleFilterChange}
          propiedad="id_correo"
          value={filtros.id_correo || null}
          label="ID Correo"
        />
        <FilterInput
          type="text"
          onChange={handleFilterChange}
          propiedad="subject"
          value={filtros.subject || null}
          label="Asunto"
        />
        <FilterInput
          type="select"
          onChange={handleFilterChange}
          propiedad="status"
          value={filtros.status || null}
          label="Status"
          options={["pendiente", "procesado", "error"]}
        />
        <FilterInput
          type="select"
          onChange={handleFilterChange}
          propiedad="procesado"
          value={filtros.procesado || null}
          label="Procesado"
          options={["Sí", "No"]}
        />
        <FilterInput
          type="date"
          onChange={handleFilterChange}
          propiedad="startDate"
          value={filtros.startDate || null}
          label="Fecha inicio"
        />
        <FilterInput
          type="date"
          onChange={handleFilterChange}
          propiedad="endDate"
          value={filtros.endDate || null}
          label="Fecha fin"
        />
        <FilterInput
          type="select"
          onChange={handleFilterChange}
          propiedad="filterType"
          value={filtros.filterType || null}
          label="Tipo de fecha"
          options={["created", "procesado", "updated"]}
        />
      </div>
      <CompleteTable<schema.CorreoProcesadoItem>
        pageTracking={tracking}
        fetchData={fetchCorreos}
        registros={correos}
        loading={loading}
        renderers={schema.createCorreoRenderers()}
      />
    </>
  );
}
