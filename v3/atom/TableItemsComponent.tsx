"use client";

import { useState } from "react";
import { TypeService } from "@/angel/lib/types";
import { ServiceIcon } from "@/component/atom/ItemTable";
import { fmtMoney, quitarCeroIzquierdo } from "@/angel/lib/format/number";
import { Checkbox } from "@/components/ui/checkbox";
import { TextInput } from "@/components/atom/Input";

type Props = {
  value?: string | null;
  hideTime?: boolean;
};

const parseISO = (value?: string | null) => {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart) return null;
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return null;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const formattedDate = date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  let time = "";
  if (timePart) {
    time = timePart.slice(0, 5);
  }
  return {
    date: formattedDate,
    time,
  };
};

export const DateTime = ({ value, hideTime = false }: Props) => {
  const parsed = parseISO(value);

  if (!parsed) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-medium text-gray-800">{parsed.date}</span>

      {!hideTime && parsed.time && (
        <span className="text-xs text-gray-500">{parsed.time}</span>
      )}
    </div>
  );
};

export const Precio = ({
  value,
}: {
  value: string | number | null | undefined;
}) => {
  if (value == null || value === "") {
    return <span className="text-gray-400">—</span>;
  }
  const numberValue = Number(value);
  if (isNaN(numberValue)) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <span className="text-sm font-medium text-gray-800">
      {fmtMoney(numberValue)}
    </span>
  );
};

type BadgeProps = {
  label: string;
  style: string;
};

export const Badge = ({ label, style }: BadgeProps) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${style}`}
  >
    {label}
  </span>
);

export const TextCell = ({ value }: { value: string | null | undefined }) => (
  <span className="text-sm text-gray-700">{value ?? "—"}</span>
);

export const BoldCell = ({ value }: { value: string }) => (
  <span className="font-medium text-gray-900">{value ?? "—"}</span>
);

export const MonoCell = ({ value }: { value: string | null | undefined }) => (
  <span className="font-mono text-xs text-gray-600">{value ?? "—"}</span>
);

export const IndiceTotal = ({
  value,
}: {
  value: { indice: number | null; total: number | null };
}) => {
  if (
    !value ||
    value.indice == null ||
    value.total == null ||
    value.total === 0
  ) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <span className="text-sm text-gray-700">
      {value.indice} de {value.total}
    </span>
  );
};

export const PorcentajeBadge = ({
  value,
}: {
  value: string | number | null | undefined;
}) => {
  const num = parseFloat(String(value ?? 0));
  const safe = !isFinite(num) || isNaN(num) ? 0 : num;
  const label = `${safe.toFixed(2)}%`;

  if (safe < 0)
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
        {label}
      </span>
    );

  if (safe > 0)
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
        {label}
      </span>
    );

  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
      {label}
    </span>
  );
};

export const DateRenderer = ({
  value,
}: {
  value: string | null | undefined;
}) => <DateTime value={value} hideTime />;

export const DateTimeRenderer = ({
  value,
}: {
  value: string | null | undefined;
}) => <DateTime value={value} />;

export const PrecioRenderer = ({
  value,
}: {
  value: string | number | null | undefined;
}) => <Precio value={value ?? "0"} />;

export const TextRenderer = ({
  value,
}: {
  value: string | null | undefined;
}) => <TextCell value={value} />;

export const MonoRenderer = ({
  value,
}: {
  value: string | null | undefined;
}) => <MonoCell value={value} />;

export const BoldRenderer = ({
  value,
}: {
  value: string | null | undefined;
}) => <BoldCell value={value ?? "—"} />;

export const PorcentajeRenderer = ({
  value,
}: {
  value: string | number | null | undefined;
}) => <PorcentajeBadge value={value} />;

export const IndiceTotalRenderer = ({
  value,
}: {
  value: { indice: number | null; total: number | null };
}) => <IndiceTotal value={value} />;

export const ServiceRenderer = ({ value }: { value: TypeService }) => (
  <ServiceIcon type={value} />
);

export const GetSeleccionRenderer = (
  toggleFila: (id: string) => void,
  estaSeleccionado: (id: string) => boolean,
) => {
  return ({ value }: { value: string }) => (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 hover:cursor-pointer hover:bg-black/30 transition-colors rounded-full"
        onClick={() => toggleFila(value)}
      >
        <Checkbox
          checked={estaSeleccionado(value)}
          onCheckedChange={() => {}}
        />
      </div>
    </div>
  );
};

export const GetEditableMontoRenderer = <T,>(
  getValue: (value: T) => string,
  onChange: (value: T, newValue: string) => void,
  className: string = "w-24",
) => {
  return ({ value }: { value: T }) => (
    <TextInput
      value={getValue(value)}
      onChange={(v) =>
        onChange(value, quitarCeroIzquierdo(v.replace(/[^\d.]/g, "")))
      }
      onFocus={(e) => e.target.select()}
      className={className}
    />
  );
};

export const GetBadgeRenderer = (
  styles: Record<string, string> = {},
  formatLabel?: (value: string) => string,
  defaultStyle: string = "bg-gray-100 text-gray-600 border border-gray-300",
) => {
  return ({ value }: { value: string }) => (
    <Badge
      label={value != null ? (formatLabel ? formatLabel(value) : value) : "—"}
      style={styles[value?.toLowerCase()] ?? defaultStyle}
    />
  );
};

type ListaSeparadaProps = {
  value?: string | null;
  separador?: string;
  titulo?: string;
};

export const ListaSeparada = ({
  value,
  separador = ",",
  titulo = "Detalle",
}: ListaSeparadaProps) => {
  const [open, setOpen] = useState(false);

  const items = (value ?? "")
    .split(separador)
    .map((v) => v.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  if (items.length === 1) {
    return <span className="text-sm text-gray-700">{items[0]}</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-blue-600 hover:underline focus:outline-none"
      >
        Ver ({items.length})
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-fit max-w-[90vw] rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
              <span className="text-sm font-medium text-gray-900">
                {titulo}
              </span>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="text-lg font-bold leading-none text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <ul className="max-h-[60vh] min-w-[220px] space-y-1.5 overflow-y-auto px-4 py-3">
              {items.map((item, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export const GetListaSeparadaRenderer = (
  separador: string = ",",
  titulo?: string,
) => {
  return ({ value }: { value: string | null | undefined }) => (
    <ListaSeparada value={value} separador={separador} titulo={titulo} />
  );
};
