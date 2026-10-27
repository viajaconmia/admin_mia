"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Button from "@/components/atom/Button";
import { FilterInput } from "@/component/atom/FilterInput";
import {
  ESTADOS_FILTRO,
  TIPOS_FILTRO,
} from "@/angel/lib/cotizacionesIa";
import type { FiltrosListaCotizacionesIa } from "@/angel/hooks/useCotizacionesIa";

type Borrador = { q: string | null; estado: string | null; tipo: string | null };

const SIN_FILTROS: Borrador = { q: null, estado: null, tipo: null };

/**
 * Los filtros se editan en local y solo se aplican al pulsar "Consultar"
 * (o Enter en la búsqueda): cambiar un filtro no dispara peticiones.
 */
export const CotizacionesIaFiltros = ({
  loading,
  onConsultar,
}: {
  loading: boolean;
  onConsultar: (filtros: FiltrosListaCotizacionesIa) => void;
}) => {
  const [borrador, setBorrador] = useState<Borrador>(SIN_FILTROS);

  const cambiar = (value: string | null, propiedad: string) =>
    setBorrador((prev) => ({ ...prev, [propiedad]: value }));

  const consultar = () =>
    onConsultar({
      q: borrador.q?.trim() || undefined,
      estado: ESTADOS_FILTRO.find((e) => e.label === borrador.estado)?.codigo,
      tipo: TIPOS_FILTRO.find((t) => t.label === borrador.tipo)?.codigo,
    });

  const limpiar = () => {
    setBorrador(SIN_FILTROS);
    onConsultar({});
  };

  return (
    <form
      className="w-full grid md:grid-cols-4 bg-gray-50 border rounded-md p-4 gap-4 mb-4 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        consultar();
      }}
    >
      <FilterInput
        type="text"
        propiedad="q"
        label="Buscar (folio, solicitante, correo, resumen)"
        value={borrador.q}
        onChange={cambiar}
      />
      <FilterInput
        type="select"
        propiedad="estado"
        label="Estado"
        value={borrador.estado}
        onChange={cambiar}
        options={ESTADOS_FILTRO.map((e) => e.label)}
      />
      <FilterInput
        type="select"
        propiedad="tipo"
        label="Tipo de servicio"
        value={borrador.tipo}
        onChange={cambiar}
        options={TIPOS_FILTRO.map((t) => t.label)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="md" icon={Search} disabled={loading}>
          Consultar
        </Button>
        <Button
          type="button"
          size="md"
          variant="secondary"
          onClick={limpiar}
          disabled={loading}
        >
          Limpiar
        </Button>
      </div>
    </form>
  );
};
