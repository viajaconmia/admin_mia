import { TipoServicioChip } from "@/angel/components/atoms/TipoServicioChip";
import { camposDeItem } from "@/angel/lib/cotizacionesIa";
import type { QuoteFoundOption, QuoteItem } from "@/angel/services/cotizacionesIa";

/** Detalle breve de una opción encontrada, para no amontonar todo en una sola línea. */
const detalleOpcion = (option: QuoteFoundOption): string =>
  [option.serviceClass, option.estimatedDuration, option.departureTimes?.join(", ")]
    .filter(Boolean)
    .join(" · ");

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
      {"foundOptions" in item && item.foundOptions && item.foundOptions.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Opciones encontradas para el cliente
          </p>
          <ul className="space-y-1">
            {item.foundOptions.map((option) => {
              const esPreferida = item.preferredOptionId === option.id;
              return (
                <li
                  key={option.id}
                  className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm ${
                    esPreferida
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-medium text-gray-800">
                      {option.provider || "Proveedor sin nombre"}
                    </span>
                    {detalleOpcion(option) && (
                      <span className="text-gray-400"> · {detalleOpcion(option)}</span>
                    )}
                  </div>
                  {esPreferida && (
                    <span className="shrink-0 text-[11px] font-semibold text-emerald-700">
                      Preferida por el cliente
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
