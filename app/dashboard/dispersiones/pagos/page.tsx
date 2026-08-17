"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  pagoProveedorService,
  type FiltrosReservasProveedor,
} from "@/angel/services/pago_proveedor";
import { TablaCompleta } from "@/angel/components/organisms/TablaCompleta";
import { FiltrosPanel } from "@/angel/components/molecules/FiltrosPanel";
import { FilterInput } from "@/component/atom/FilterInput";
import { TextInput } from "@/components/atom/Input";
import { usePaginacion } from "@/angel/hooks/usePaginacion";
import { useAlert } from "@/context/useAlert";
import {
  type PagoProveedorItem,
  mapPago,
  createPagoRenderers,
} from "./_components/schema";

const PAGE_SIZE = 100;

type FiltrosPagos = Pick<
  FiltrosReservasProveedor,
  "codigo_confirmacion" | "proveedor"
>;

export default function PagosDispersionesPage() {
  const [pagos, setPagos] = useState<PagoProveedorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosPagos>({});
  // Búsqueda por código de dispersión: filtra solo lo ya cargado en pantalla
  // (no es un filtro de backend todavía, con_dispersion no lo soporta aún).
  const [busquedaDispersion, setBusquedaDispersion] = useState("");
  const { paginacion, actualizarDesdeMetadata, resetear } =
    usePaginacion(PAGE_SIZE);
  const { error } = useAlert();

  const fetchPagos = useCallback(
    (page: number = paginacion.page) => {
      setLoading(true);
      pagoProveedorService
        .getReservas({
          ...filtros,
          includePagos: true,
          con_dispersion: true,
          order_by: "pago_created_at",
          order_dir: "desc",
          page,
          length: PAGE_SIZE,
        })
        .then(({ data, metadata }) => {
          setPagos((data ?? []).map(mapPago));
          actualizarDesdeMetadata(metadata?.total || 0, page);
        })
        .catch((err) => error(err.message || "Error al obtener los pagos"))
        .finally(() => setLoading(false));
    },
    [paginacion.page, actualizarDesdeMetadata, error, filtros],
  );

  // Fetch solo al montar. Cambiar un filtro no debe disparar la petición por
  // sí solo (ver CLAUDE.md) — solo resetea la paginación local; la petición
  // real la dispara el usuario (botón "Actualizar" de TablaCompleta, o
  // paginar).
  useEffect(() => {
    fetchPagos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resetear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const actualizarFiltro = (value: string | null, propiedad: string) => {
    setFiltros((prev) => {
      if (value == null || value === "") {
        const next = { ...prev };
        delete next[propiedad as keyof FiltrosPagos];
        return next;
      }
      return { ...prev, [propiedad]: value };
    });
  };

  const pagosFiltrados = useMemo(() => {
    const q = busquedaDispersion.trim().toLowerCase();
    if (!q) return pagos;
    return pagos.filter((p) => p.codigo_dispersion.toLowerCase().includes(q));
  }, [pagos, busquedaDispersion]);

  const renderers = createPagoRenderers();

  return (
    <div className="space-y-4 bg-white p-4 rounded-md shadow-sm">
      <FiltrosPanel
        always={
          <>
            <FilterInput
              type="text"
              onChange={actualizarFiltro}
              propiedad="codigo_confirmacion"
              value={filtros.codigo_confirmacion || null}
              label="Código de confirmación"
            />
            <FilterInput
              type="text"
              onChange={actualizarFiltro}
              propiedad="proveedor"
              value={filtros.proveedor || null}
              label="Proveedor"
            />
          </>
        }
      />

      <div className="max-w-xs">
        <TextInput
          label="Buscar por código de dispersión"
          placeholder="Ej. D1F14CDR"
          value={busquedaDispersion}
          onChange={setBusquedaDispersion}
        />
        <p className="text-xs text-gray-400 mt-1">
          Busca solo dentro de los registros ya cargados en esta página.
        </p>
      </div>

      <TablaCompleta<PagoProveedorItem>
        paginacion={paginacion}
        irAPagina={fetchPagos}
        onRefresh={() => fetchPagos(paginacion.page)}
        registros={pagosFiltrados}
        loading={loading}
        renderers={renderers}
        label={`Mostrando ${pagosFiltrados.length} de ${pagos.length} registros`}
      />
    </div>
  );
}
