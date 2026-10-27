"use client";

import Link from "next/link";
import {
  DateTimeRenderer,
  MonoRenderer,
  TextRenderer,
} from "@/v3/atom/TableItemsComponent";
import type { CellRenderer } from "@/angel/components/atoms/TableCore";
import { CotizacionEstadoBadge } from "@/angel/components/atoms/CotizacionEstadoBadge";
import { TipoServicioChip } from "@/angel/components/atoms/TipoServicioChip";
import { normalizarTipos } from "@/angel/lib/cotizacionesIa";
import type { CotizacionIaListItem } from "@/angel/services/cotizacionesIa";

// Las keys son las columnas visibles (TableCore las muestra en mayúsculas).
export type CotizacionIaRow = {
  folio: string;
  estado: string;
  solicitante: string;
  correo: string;
  servicios: string;
  resumen: string;
  archivos: number;
  creada: string;
  acciones: string;
};

export const mapCotizacionIa = (c: CotizacionIaListItem): CotizacionIaRow => ({
  folio: c.id_cotizacion,
  estado: c.estado,
  solicitante: c.solicitante_nombre ?? "",
  correo: c.solicitante_correo ?? "",
  servicios: normalizarTipos(c.tipos).join(","),
  resumen: c.resumen ?? "",
  archivos: Number(c.total_archivos ?? 0),
  creada: c.created_at,
  acciones: c.id_cotizacion,
});

export const COTIZACIONES_IA_RUTA = "/dashboard/cotizaciones-ia";

export const createCotizacionIaRenderers = (): Partial<
  Record<keyof CotizacionIaRow, CellRenderer>
> => ({
  folio: ({ value }) => <MonoRenderer value={value as string} />,
  estado: ({ value }) => <CotizacionEstadoBadge estado={value as string} />,
  solicitante: ({ value }) => <TextRenderer value={(value as string) || null} />,
  correo: ({ value }) => <TextRenderer value={(value as string) || null} />,
  servicios: ({ value }) => (
    <div className="flex flex-wrap gap-1">
      {normalizarTipos(value).map((tipo) => (
        <TipoServicioChip key={tipo} tipo={tipo} />
      ))}
    </div>
  ),
  resumen: ({ value }) => (
    <span
      className="block max-w-xs truncate text-sm text-gray-700"
      title={(value as string) || undefined}
    >
      {(value as string) || "—"}
    </span>
  ),
  archivos: ({ value }) => (
    <span className="text-sm text-gray-700">{Number(value) || "—"}</span>
  ),
  creada: ({ value }) => <DateTimeRenderer value={value as string} />,
  acciones: ({ value }) => (
    <Link
      href={`${COTIZACIONES_IA_RUTA}/${encodeURIComponent(String(value))}`}
      className="text-sm font-medium text-blue-700 hover:underline"
    >
      Ver detalle
    </Link>
  ),
});
