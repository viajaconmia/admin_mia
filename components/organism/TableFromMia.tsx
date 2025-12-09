"use client";

import { useNotification } from "@/context/useNotificacion";
import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Copy,
  UserCheck,
  UserX,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import React from "react";
import Button from "../atom/Button";
import {
  capitalizarTexto,
  formatDate,
  formatNumberWithCommas,
} from "@/helpers/formater";
import { copyToClipboard } from "@/helpers/utils";
import { Loader } from "../atom/Loader";
import { UserProfileImage } from "../atom/UserProfileImage";
import { CheckboxInput } from "../atom/Input";

type ComponentPropsMap<T> = {
  text: { value: string };
  number: { value: number };
  id: { value: string; index: number };
  button: {
    item: T;
    onClick?: ({ item }: { item: T }) => void;
    label: string;
    variant?: "primary" | "secondary" | "ghost" | "warning";
  };
  date: { value: string };
  precio: { value: number | string | null | undefined };
  copiar_and_button: {
    item: T;
    onClick?: ({ item }: { item: T }) => void;
    value: string;
    variant?: "primary" | "secondary" | "ghost" | "warning";
  };
  profile_image: {
    value: string;
  };
  checkbox: {
    value: boolean;
    onChange: (value: boolean, item: T) => void;
    label: string;
    item: T;
  };
  titles: { value: string; subtitle: string; item: T };
  custom: {
    component: React.ElementType;
    item: T;
  };
  active: { value: 1 | 0 };
  acciones: { onClick: () => void; value: string };
};

export interface ColumnsTable<
  T,
  K extends keyof ComponentPropsMap<T> = keyof ComponentPropsMap<T>
> {
  key: keyof T | null;
  header: string;
  component: K;
  componentProps?: Omit<ComponentPropsMap<T>[K], "value" | "item" | "index">;
}

interface TableProps<T> {
  id?: string;
  data: T[];
  columns: ColumnsTable<T>[];
  defaultSort?: {
    key: string;
    direction: "asc" | "desc";
  };
  exportButton?: boolean;
  leyenda?: string;
  children?: React.ReactNode;
  maxHeight?: string;
  expandableContent?: (item: T) => React.ReactNode;
  loading?: boolean;
}

export const TableFromMia = <T extends Record<string, any>>({
  id,
  data = [],
  columns = [],
  defaultSort,
  maxHeight = "32rem",
  expandableContent,
  loading = false,
}: TableProps<T>) => {
  const components = createComponents();
  const [displayData, setDisplayData] = useState<T[]>(data);
  const [currentSort, setCurrentSort] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>(
    defaultSort || {
      key: columns.length > 0 ? String(columns[0].key) : "",
      direction: "asc",
    }
  );
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { showNotification } = useNotification();

  function createComponents<T>() {
    const map: {
      [K in keyof ComponentPropsMap<T>]: React.FC<
        ComponentPropsMap<T>[K] & { index: number; newValue: (keyof T)[] }
      >;
    } = {
      text: ({ value }) => <span className="text-xs">{value}</span>,
      id: ({ value, index }) => (
        <span className="text-xs">{value.slice(0, index)}</span>
      ),
      number: ({ value }) => <strong className="text-xs">{value}</strong>,
      button: ({ item, onClick, label, variant }) => (
        <div className="w-full flex items-center">
          <Button
            size="sm"
            onClick={() => onClick?.({ item })}
            variant={variant}
          >
            {String(label)}
          </Button>
        </div>
      ),
      date: ({ value }) => <span className="text-xs">{formatDate(value)}</span>,
      precio: ({ value }) => (
        <span className="text-xs">{formatNumberWithCommas(value)}</span>
      ),
      copiar_and_button: ({ item, onClick, value, variant }) => (
        <div className="w-full flex justify-between items-center">
          <Button
            size="sm"
            onClick={() => onClick?.({ item })}
            variant={variant}
          >
            {String(value)}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              try {
                copyToClipboard(value);
                showNotification("success", "Se ha copiado con exito");
              } catch (error: any) {
                console.error(error);
                showNotification(
                  "error",
                  error.message || "sucedio un error al copiar el valor"
                );
              }
            }}
            variant="secondary"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      ),
      active: ({ value }) => (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            Boolean(value)
              ? "bg-green-200 text-green-800 border-green-300"
              : "bg-gray-200 text-gray-800 border-gray-300"
          }`}
        >
          {Boolean(value) ? (
            <UserCheck className="w-4 h-4 mr-1" />
          ) : (
            <UserX className="w-4 h-4 mr-1" />
          )}
          {Boolean(value) ? "Activo" : "Inactivo"}
        </div>
      ),

      profile_image: ({ value }) => <UserProfileImage name={value} />,
      titles: ({ value, subtitle, item }) => (
        <div className="flex flex-col items-start">
          <h1 className="text-base font-semibold">{capitalizarTexto(value)}</h1>
          {subtitle && (
            <h2 className="text-xs font-semibold text-gray-500">
              {item[subtitle] || ""}
            </h2>
          )}
        </div>
      ),
      custom: ({ item, component: Comp }) => <Comp item={item} />,
      checkbox: ({ value, onChange, label, item }) => (
        <CheckboxInput
          label={label}
          checked={Boolean(value)}
          onChange={(value: boolean) => {
            onChange(value, item);
          }}
        />
      ),

      acciones: ({ value, onClick }) => (
        <>
          <button onClick={onClick}>{value}</button>
        </>
      ),
    };
    return map;
  }

  useEffect(() => {
    setDisplayData(data);
  }, [data]);

  // Aplicar ordenamiento por defecto al cargar
  useEffect(() => {
    if (defaultSort) {
      handleSort(defaultSort.key, false);
    }
  }, []);

  const handleSort = (key: string, updateState = true) => {
    if (key === "actions") return;

    const isAsc = currentSort.key === key && currentSort.direction === "asc";
    const newDirection = isAsc ? "desc" : "asc";

    const sortedData = [...displayData].sort((a, b) => {
      const aValue = (a as any)[key];
      const bValue = (b as any)[key];

      // Manejar valores nulos o indefinidos
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return newDirection === "asc" ? -1 : 1;
      if (bValue == null) return newDirection === "asc" ? 1 : -1;

      if (aValue < bValue) return newDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setDisplayData(sortedData);

    if (updateState) {
      setCurrentSort({ key, direction: newDirection });
    }
  };

  const toggleRowExpansion = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  // Columnas a mostrar
  const tableColumns = useMemo(() => {
    const cols = [...columns];
    return cols;
  }, [columns, expandableContent]);

  if (!data || data.length === 0) {
    return (
      <div className="px-6 py-4 w-full text-center text-sm text-gray-500 border rounded-md flex-1 flex items-center justify-center">
        No se encontraron registros.
      </div>
    );
  }

  return (
    <div className="relative w-full" id={id}>
      {loading && <Loader />}

      <div
        className="overflow-y-auto relative border border-gray-200 rounded-xl shadow-sm w-full"
        style={{ maxHeight }}
      >
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="sticky z-10 bg-gray-100 top-0">
            <tr>
              {tableColumns.map((column) => (
                <th
                  key={`${String(column.key)}-${(Math.random() * 9999).toFixed(
                    2
                  )}`}
                  onClick={() => handleSort(String(column.key))}
                  className={`px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    column.key !== "__expand__"
                      ? "cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex items-center justify-start space-x-2">
                    <span>{column.header}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((item, index) => (
              <React.Fragment key={index + (Math.random() * 9999).toFixed(2)}>
                <tr className="hover:bg-gray-50">
                  {tableColumns.map((column) => {
                    const columnKey = String(column.key);
                    const value = (item as any)[columnKey];
                    const Comp = components[column.component];
                    const baseProps: any = {
                      item,
                      index,
                      ...(column.componentProps ?? {}),
                    };
                    baseProps.value = value;

                    // Only access newValue if it exists on componentProps
                    if (
                      column.componentProps &&
                      "newValue" in column.componentProps
                    ) {
                      let columnas = (
                        column.componentProps.newValue as string[]
                      ).map((prop: string) => item[prop]);
                      let newValue;
                      for (let i = 0; i < columnas.length; i++) {
                        if (columnas[i] != undefined && columnas[i] != null) {
                          newValue = columnas[i];
                        }
                      }
                      baseProps.value = newValue ? newValue : "";
                    }

                    // Columna de expansión
                    // if (columnKey === "__expand__" && expandableContent) {
                    //   return (
                    //     <td
                    //       key={`${index}-${columnKey}`}
                    //       className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 text-left"
                    //     >
                    //       <button
                    //         onClick={() => toggleRowExpansion(index)}
                    //         className="p-1 rounded hover:bg-gray-200 transition-colors"
                    //       >
                    //         {expandedRows.has(index) ? (
                    //           <ChevronDown className="w-4 h-4" />
                    //         ) : (
                    //           <ChevronRight className="w-4 h-4" />
                    //         )}
                    //       </button>
                    //     </td>
                    //   );
                    // }

                    return (
                      <td
                        key={`${index}-${columnKey}-${(
                          Math.random() * 999900
                        ).toFixed(2)}`}
                        className="px-6 py-2 whitespace-nowrap text-sm text-gray-800 text-left"
                      >
                        {column.component ? (
                          <Comp {...baseProps} />
                        ) : (
                          String(
                            value !== undefined && value !== null ? value : ""
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
