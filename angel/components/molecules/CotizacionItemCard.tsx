import { TipoServicioChip } from "@/angel/components/atoms/TipoServicioChip";
import { camposDeItem } from "@/angel/lib/cotizacionesIa";
import type { QuoteItem } from "@/angel/services/cotizacionesIa";

/** Un servicio solicitado dentro de una cotización (solo lectura, sin precios). */
export const CotizacionItemCard = ({
  item,
  index,
}: {
  item: QuoteItem;
  index: number;
}) => {
  const campos = camposDeItem(item);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <TipoServicioChip tipo={item.type} />
        <span className="text-xs text-gray-400">Servicio {index + 1}</span>
      </div>
      {campos.length === 0 ? (
        <p className="text-sm text-gray-400">Sin detalles capturados.</p>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {campos.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-gray-400">
                {label}
              </dt>
              <dd className="text-sm font-medium text-gray-800 break-words">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};
