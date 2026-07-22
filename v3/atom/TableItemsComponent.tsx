import { formatNumberWithCommas } from "@/helpers/formater";

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

export const Precio = ({ value }: Props) => {
  if (!value) {
    return <span className="text-gray-400">—</span>;
  }
  const numberValue = Number(value);
  if (isNaN(numberValue)) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <span className="text-sm font-medium text-gray-800">
      {`$${formatNumberWithCommas(numberValue)}`}
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

export const MonoCell = ({ value }: { value: string | null | undefined }) => (
  <span className="font-mono text-xs text-gray-600">{value ?? "—"}</span>
);

export const PorcentajeBadge = ({ value }: { value: string | number | null | undefined }) => {
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
