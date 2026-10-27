import { Badge } from "@/v3/atom/TableItemsComponent";
import {
  ESTADO_STYLE,
  etiquetaEstado,
} from "@/angel/lib/cotizacionesIa";
import type { CotizacionIaEstado } from "@/angel/services/cotizacionesIa";

export const CotizacionEstadoBadge = ({ estado }: { estado: string }) => (
  <Badge
    label={etiquetaEstado(estado)}
    style={
      ESTADO_STYLE[estado as CotizacionIaEstado] ??
      "bg-gray-100 text-gray-600 border border-gray-300"
    }
  />
);
