import { etiquetaTipo } from "@/angel/lib/cotizacionesIa";

const TIPO_STYLE: Record<string, string> = {
  flight: "bg-sky-50 text-sky-800 border border-sky-200",
  car_rental: "bg-amber-50 text-amber-800 border border-amber-200",
  hotel: "bg-violet-50 text-violet-800 border border-violet-200",
  bus: "bg-emerald-50 text-emerald-800 border border-emerald-200",
};

export const TipoServicioChip = ({ tipo }: { tipo: string }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
      TIPO_STYLE[tipo] ?? "bg-gray-100 text-gray-600 border border-gray-300"
    }`}
  >
    {etiquetaTipo(tipo)}
  </span>
);
