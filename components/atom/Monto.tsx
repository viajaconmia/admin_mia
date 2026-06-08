import { formatNumberWithCommas } from "@/helpers/utils";

interface MontoProps {
  value: number | string | null | undefined;
  className?: string;
  /** Incluye el símbolo $ al inicio. Por defecto: true */
  currency?: boolean;
  /** Decimales a mostrar. Por defecto: 2 */
  decimals?: number;
}

/**
 * Renderiza un monto numérico con separadores de miles (coma) y decimales fijos.
 *
 * Uso:
 *   <Monto value={1234567.89} />            → $1,234,567.89
 *   <Monto value={total} className="text-red-600" />
 *   <Monto value={n} currency={false} />    → 1,234,567.89
 */
export function Monto({
  value,
  className,
  currency = true,
  decimals = 2,
}: MontoProps) {
  const num = Number(value ?? 0);
  const formatted = formatNumberWithCommas(
    Number.isFinite(num) ? num.toFixed(decimals) : "0.00",
  );

  return (
    <span className={className}>
      {currency ? `$${formatted}` : formatted}
    </span>
  );
}
