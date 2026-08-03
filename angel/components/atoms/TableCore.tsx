"use client";
import { type ReactNode, useMemo, useState } from "react";
import { EmptyState } from "./EmptyState";

export type CellRenderer = (props: { value: unknown }) => React.ReactNode;
export type TotalFn<T> = (registros: T[]) => ReactNode;

type SortState = { key: string; asc: boolean };

interface TableCoreProps<T extends Record<string, unknown>> {
  registros: T[];
  renderers?: Partial<Record<string, CellRenderer>>;
  rowClassName?: (item: T) => string;
  maxHeight?: string;
  hiddenKeys?: string[];
  totales?: Partial<Record<string, TotalFn<T>>>;
}

export const TableCore = <T extends Record<string, unknown>>({
  registros,
  renderers = {},
  rowClassName,
  maxHeight = "28rem",
  hiddenKeys = [],
  totales,
}: TableCoreProps<T>) => {
  const [sort, setSort] = useState<SortState | null>(null);

  const columnKeys = useMemo(() => {
    if (!registros.length) return [];
    return Object.keys(registros[0]).filter(
      (k) => k !== "item" && !hiddenKeys.includes(k),
    );
  }, [registros, hiddenKeys]);

  const sorted = useMemo(() => {
    if (!sort) return registros;
    return [...registros].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.asc ? cmp : -cmp;
    });
  }, [registros, sort]);

  const handleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key ? { key, asc: !prev.asc } : { key, asc: true },
    );

  if (!registros.length) {
    return <EmptyState />;
  }

  return (
    <div
      className="overflow-y-auto relative border border-gray-200 rounded-sm w-full"
      style={{ maxHeight }}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="sticky z-10 bg-gray-50 top-0">
          <tr>
            {columnKeys.map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className="px-4 min-w-fit whitespace-nowrap py-2 text-left cursor-pointer text-xs font-semibold text-gray-600 uppercase tracking-wider select-none"
              >
                <span className="flex gap-1 items-center">
                  {key.replace(/_/g, " ")}
                  {sort?.key === key && (
                    <span className="text-gray-400">{sort.asc ? "↑" : "↓"}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((item, index) => (
            <TableRow
              key={index}
              item={item}
              columnKeys={columnKeys}
              renderers={renderers}
              rowClassName={rowClassName}
            />
          ))}
        </tbody>
        {totales && (
          <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t-2 border-gray-300">
            <tr>
              {columnKeys.map((key) => (
                <td
                  key={key}
                  className="px-4 py-2 whitespace-nowrap text-xs font-semibold text-gray-700"
                >
                  {totales[key]?.(registros) ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

const TableRow = <T extends Record<string, unknown>>({
  item,
  columnKeys,
  renderers,
  rowClassName,
}: {
  item: T;
  columnKeys: string[];
  renderers: Partial<Record<string, CellRenderer>>;
  rowClassName?: (item: T) => string;
}) => (
  <tr className={rowClassName?.(item) ?? ""}>
    {columnKeys.map((key) => {
      const Renderer = renderers[key];
      const value = item[key];
      return (
        <td
          key={key}
          className="px-4 py-2 whitespace-nowrap text-xs text-gray-900"
        >
          {Renderer ? <Renderer value={value} /> : String(value ?? "")}
        </td>
      );
    })}
  </tr>
);
