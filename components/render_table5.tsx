import React from "react";
import { formatDate } from "@/helpers/utils";

type CellProps = { value: any; item: any; index: number };

const upper = (v: any) =>
  v != null && v !== "" ? String(v).toUpperCase() : <span className="text-gray-400">—</span>;

const plain = (v: any) =>
  v != null && v !== "" ? String(v) : <span className="text-gray-400">—</span>;

const date = (v: any) => {
  if (!v) return <span className="text-gray-400">—</span>;
  const formatted = formatDate(String(v));
  return <span>{formatted || plain(v)}</span>;
};

const money = (v: any) => {
  if (v == null || v === "") return <span className="text-gray-400">—</span>;
  const num = Number(v);
  if (isNaN(num)) return <span className="text-gray-400">—</span>;
  return (
    <span className="text-blue-600 font-medium">
      ${num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};

export const DEFAULT_RENDERERS: Record<
  string,
  React.FC<CellProps>
> = {
  viajero: ({ value }) => <>{upper(value)}</>,
  agente: ({ value }) => <>{upper(value)}</>,
  usuario_creador_notificacion: ({ value }) => <>{upper(value)}</>,
  usuario_update_notificacion: ({ value }) => <>{upper(value)}</>,
  atendio: ({ value }) => <>{upper(value)}</>,
  creo: ({ value }) => <>{upper(value)}</>,
  codigo_confirmacion: ({ value }) => <>{plain(value)}</>,
  proveedor: ({ value }) => <>{plain(value)}</>,
  total: ({ value }) => <>{money(value)}</>,
  check_in: ({ value }) => <>{date(value)}</>,
  fecha_notificacion: ({ value }) => <>{date(value)}</>,
  fecha_actualizacion_notificacion: ({ value }) => <>{date(value)}</>,
  check_out: ({ value }) => <>{date(value)}</>,
  numero_empleado: ({ value }) => <>{plain(value)}</>,
  etapa_reservacion: ({ value }) => <>{plain(value)}</>,
  type: ({ value }) => <>{plain(value)}</>,
  tipo_cuarto_vuelo: ({ value }) => <>{plain(value)}</>,
  id_booking: ({ value }) => <>{plain(value)}</>,
  id_relacion: ({ value }) => <>{plain(value)}</>,
  fecha_solucion:({value})=> <>{date(value)}</>,
  fecha_creada:({value})=> <>{date(value)}</>
};
