"use client";

import { AdvancedFilterInput, FilterInput } from "@/component/atom/FilterInput";
import * as schema from "@/schemas/tables/hoteles_permitidos";
import { ExtraService } from "@/services/ExtraServices";
import { CompleteTable, TrackingPage, initial } from "@/v3/template/Table";
import { useState } from "react";

type HotelPermitidoFilter = {
  id_agente?: string;
  cliente?: string;
  nombre_comercial?: string;
  rfc?: string;

  hotel?: string;
  zona?: string;
  estado?: string;

  priority?: number;
  is_allowed?: number;
  activo?: number;

  precio_min?: number;
  precio_max?: number;
};

export const TableHotelesPermitidos = () => {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<schema.HotelPermitidoItem[]>([]);
  const [tracking, setTracking] = useState<TrackingPage>(initial);
  const [filtros, setFiltros] = useState<HotelPermitidoFilter>({});

  const fetchSaldos = async (page: number = tracking.page) => {
    setLoading(true);
    ExtraService.getInstance()
      .getHotelesPermitidos({ ...filtros, page, length: PAGE_SIZE })
      .then(({ data, metadata }) => {
        setRegistros(data.map((i) => schema.mapHotelPermitidoItem(i)));
        setTracking((prev) => ({
          ...prev,
          total: metadata?.total || 0,
          total_pages: Math.ceil((metadata?.total || 0) / PAGE_SIZE),
          page,
        }));
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (value, propiedad) => {
    if (value == null) {
      const newObj = Object.fromEntries(
        Object.entries({ ...filtros }).filter(([key]) => key != propiedad),
      );
      setFiltros(newObj);
      return;
    }

    setFiltros((prev) => ({ ...prev, [propiedad]: value }));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FilterInput
          type="text"
          onChange={handleFilterChange}
          propiedad="hotel"
          value={filtros.hotel || null}
          label="Hotel"
        />

        <FilterInput
          type="text"
          onChange={handleFilterChange}
          propiedad="zona"
          value={filtros.zona || null}
          label="Zona"
        />

        <FilterInput
          type="text"
          onChange={handleFilterChange}
          propiedad="estado"
          value={filtros.estado || null}
          label="Estado"
        />

        <AdvancedFilterInput
          type="select"
          onChange={handleFilterChange}
          propiedad="is_allowed"
          value={filtros.is_allowed ?? null}
          label="Permitido"
          options={[
            { label: "Sí", value: 1 },
            { label: "No", value: 0 },
          ]}
        />

        <AdvancedFilterInput
          type="select"
          onChange={handleFilterChange}
          propiedad="activo"
          value={filtros.activo ?? null}
          label="Activo"
          options={[
            { label: "Sí", value: 1 },
            { label: "No", value: 0 },
          ]}
        />

        <AdvancedFilterInput
          type="number"
          onChange={handleFilterChange}
          propiedad="precio_min"
          value={filtros.precio_min || null}
          label="Precio mínimo"
        />

        <AdvancedFilterInput
          type="number"
          onChange={handleFilterChange}
          propiedad="precio_max"
          value={filtros.precio_max || null}
          label="Precio máximo"
        />
      </div>
      <p>Total: {tracking.total}</p>
      <CompleteTable
        pageTracking={tracking}
        fetchData={fetchSaldos}
        registros={registros}
        renderers={schema.createHotelRenderers({
          onVerDetalle: (hotel) => console.log(hotel),
        })}
        loading={loading}
      />
    </>
  );
};

const PAGE_SIZE = 50;
