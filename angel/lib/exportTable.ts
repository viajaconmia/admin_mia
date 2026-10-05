import { exportToCSV } from "@/helpers/utils";
import { reordenarColumnas } from "@/angel/lib/reordenarColumnas";

/** Exporta solo las columnas visibles, en el orden configurado — reusa el motor
 * de CSV/descarga que ya usa Table5 (helpers/utils.tsx#exportToCSV).
 * `headerLabels` renombra el header de una key en el CSV sin tocar los datos. */
export function exportColumnasVisibles<T extends Record<string, unknown>>(
  registros: T[],
  columnasVisibles: string[],
  filename: string,
  headerLabels: Partial<Record<string, string>> = {},
): void {
  const reordenados = reordenarColumnas(registros, columnasVisibles);
  const data = reordenados.map((fila) =>
    Object.fromEntries(
      columnasVisibles
        .filter((key) => key in fila)
        .map((key) => [headerLabels[key] ?? key, fila[key]]),
    ),
  );
  exportToCSV(data, filename);
}
