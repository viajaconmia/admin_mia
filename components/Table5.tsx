import { exportToCSV } from "@/helpers/utils";
import {
  ArrowDown,
  FileDown,
  Columns,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Loader } from "@/components/atom/Loader";

type Registro = {
  [key: string]: any;
};

type RendererMap<T> = {
  [key: string]: React.FC<{ value: any; item: T; index: number }>;
};

interface TableProps<T> {
  registros: Registro[];
  renderers?: RendererMap<T>;
  isExport?: boolean;
  defaultSort?: {
    key: string;
    sort: boolean;
  };
  exportButton?: boolean;
  leyenda?: string;
  children?: React.ReactNode;
  maxHeight?: string;
  customColumns?: string[];
  fillHeight?: boolean;
  getRowClassName?: (row: Registro, index: number) => string;

  /** Activa el split de strings por espacio a múltiples líneas */
  splitStringsBySpace?: boolean;
  /** Restringe el split a estas columnas (keys exactos del objeto) */
  splitColumns?: string[];

  /** NUEVA PROPIEDAD: Columnas que contienen arrays y pueden expandirse */
  expandableColumns?: string[];
    horizontalScroll?: boolean;
  stickyRightColumns?: string[];
  columnMinWidths?: Record<string, string>;
  respectCustomColumnOrder?: boolean;

  /** Activa paginación. Si no se pasa (o es false) el comportamiento es idéntico al actual */
  pagination?: boolean;
  /** Filas por página cuando pagination=true. Default: 50 */
  pageSize?: number;

  /** Mapa de filas expandidas (mismo formato que Table4): { [id | reservaId]: boolean } */
  filasExpandibles?: { [id: string]: boolean };
  /** Renderer del contenido expandido debajo de la fila */
  expandedRenderer?: (row: Registro) => React.ReactNode;
}

export const Table5 = <T,>({
  registros = [],
  renderers = {},
  defaultSort,
  exportButton = true,
  leyenda = "",
  children,
  maxHeight = "28rem",
  fillHeight = false,
  customColumns,
  getRowClassName,
  splitStringsBySpace = false,
  splitColumns,
  isExport = true,
  expandableColumns = [], // Nueva prop
    horizontalScroll = false,
  stickyRightColumns = [],
  columnMinWidths = {},
  respectCustomColumnOrder = false,
  pagination = false,
  pageSize = 50,
  filasExpandibles,
  expandedRenderer,
}: TableProps<T>) => {
  const [displayData, setDisplayData] = useState<Registro[]>(registros);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentSort, setCurrentSort] = useState<{
    key: string;
    sort: boolean;
  }>(
    defaultSort
      ? defaultSort
      : {
          key: registros.length > 0 ? Object.keys(registros[0])[0] : "",
          sort: true,
        },
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  // Estado para las filas expandidas
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const columnSelectorRef = useRef<HTMLDivElement | null>(null);

  const showAllColumns = () => {
    setVisibleColumns(new Set(columnKeys));
  };

  const hideAllColumns = () => {
    setVisibleColumns(new Set());
  };

  useEffect(() => {
    setDisplayData(registros);
    if (customColumns && customColumns.length > 0) {
      setVisibleColumns(new Set(customColumns));
    } else if (registros && registros.length > 0) {
      const allColumns = Object.keys(registros[0]).filter(
        (key) => key !== "item",
      );
      setVisibleColumns(new Set(allColumns));
    }
    setExpandedRows(new Set());
    setCurrentPage(0);
  }, [registros, customColumns]);

  const columnKeys = useMemo(() => {
    if (
      registros &&
      registros.length > 0 &&
      typeof registros[0] === "object" &&
      registros[0] !== null
    ) {
      return Object.keys(registros[0]).filter((key) => key !== "item");
    }
    return [];
  }, [registros]);

  const orderedColumnKeys = useMemo(() => {
  if (respectCustomColumnOrder && customColumns && customColumns.length > 0) {
    const existingCustom = customColumns.filter((key) =>
      columnKeys.includes(key)
    );
    const rest = columnKeys.filter((key) => !existingCustom.includes(key));
    return [...existingCustom, ...rest];
  }

  return columnKeys;
}, [columnKeys, customColumns, respectCustomColumnOrder]);

const visibleOrderedColumns = useMemo(() => {
  return orderedColumnKeys.filter((key) => visibleColumns.has(key));
}, [orderedColumnKeys, visibleColumns]);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const newVisible = new Set(prev);
      if (newVisible.has(key)) {
        newVisible.delete(key);
      } else {
        newVisible.add(key);
      }
      return newVisible;
    });
  };

  const handleSort = (key: string) => {
    setLoading(true);
    setTimeout(() => {
      const updateSort = { key, sort: !currentSort.sort };
      const sortedData = [...displayData].sort((a, b) =>
        currentSort.sort
          ? a[key] < b[key]
            ? 1
            : -1
          : a[key] > b[key]
            ? 1
            : -1,
      );
      setDisplayData(sortedData);
      setCurrentSort(updateSort);
      setCurrentPage(0);
      setLoading(false);
    }, 0);
  };

  const totalPages = pagination ? Math.ceil(displayData.length / pageSize) : 1;
  const pagedData = pagination
    ? displayData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : displayData;

  // Función para alternar expansión de fila
  const toggleRowExpansion = (index: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const isDateLikeKey = (key: string) => {
  const k = key.toLowerCase();
  return (
    k.includes("fecha") ||
    k.includes("date") ||
    k.includes("check_in") ||
    k.includes("check_out") ||
    k.includes("chin") ||
    k.includes("chout") ||
    k.includes("created_at") ||
    k.includes("creado")|| 
    k.includes("updated_at")
  );
};

const formatDateOnly = (value: any) => {
  if (value === null || value === undefined || value === "") return value;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    // ya viene como YYYY-MM-DD o YYYY-MM-DD HH:mm:ss o ISO
    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return value;
};

const normalizeExportRow = (row: Registro) => {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([k]) => !EXPORT_EXCLUDE_COLS.has(k))
      .map(([k, v]) => [k, isDateLikeKey(k) ? formatDateOnly(v) : v]),
  );
};


  // Verificar si una columna es expandible para una fila específica
  const isColumnExpandable = (colKey: string, value: any) => {
    // Verificar si la columna está en la lista de expandibleColumns
    const isInExpandableList = expandableColumns.includes(colKey);

    // Verificar si el valor es un array con más de un elemento
    const hasMultipleItems = Array.isArray(value) && value.length > 1;

    // Verificar si es un string que podría contener múltiples valores separados
    const isStringWithSeparators =
      typeof value === "string" &&
      (value.includes(",") || value.includes(";") || value.includes("|"));

    return isInExpandableList && (hasMultipleItems || isStringWithSeparators);
  };

  const EXPORT_EXCLUDE_COLS = new Set([
    "id_factura",
    "id_relacion",
  ]);

  // Formatear el valor de una columna expandible
  const renderExpandableValue = (
    colKey: string,
    value: any,
    rowIndex: number,
    isExpanded: boolean,
  ) => {
    let items: string[] = [];

    if (Array.isArray(value)) {
      items = value.map((item) => String(item));
    } else if (typeof value === "string") {
      // Dividir por comas, punto y coma o pipes
      items = value.split(/[,;|]/).map((item) => item.trim());
    } else if (value != null) {
      items = [String(value)];
    }

    const hasMultipleItems = items.length > 1;

    // Vista colapsada: solo el primero + "N más"
    if (!isExpanded) {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 min-w-0">
            <div className="truncate">
              {items[0] ?? ""}
              {hasMultipleItems && (
                <span className="ml-1 text-xs text-gray-500">
                  +{items.length - 1} más
                </span>
              )}
            </div>
          </div>

          {hasMultipleItems && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion(rowIndex);
              }}
              className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
              title="Expandir"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      );
    }

    // Vista expandida: separar en columnas internas que se desplazan a la derecha
    const chunkSize = 6; // cuántos elementos por columna
    const columns: string[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      columns.push(items.slice(i, i + chunkSize));
    }

    return (
      <div className="flex items-start justify-between w-full">
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex gap-6">
            {columns.map((colItems, colIndex) => (
              <div key={colIndex} className="min-w-[10rem] space-y-1">
                {colItems.map((item, idx) => (
                  <div key={idx} className="text-xs text-gray-700">
                    • {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {hasMultipleItems && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRowExpansion(rowIndex);
            }}
            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
            title="Contraer"
          >
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    );
  };
  useEffect(() => {
    if (!showColumnSelector) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnSelectorRef.current &&
        !columnSelectorRef.current.contains(event.target as Node)
      ) {
        setShowColumnSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumnSelector]);

  const formatColumnTitle = (key: string) => {
    const text = key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toUpperCase();

    const words = text.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0];
    }

    if (words.length % 2 !== 0) {
      const firstLineWords = Math.ceil(words.length / 2);
      const firstLine = words.slice(0, firstLineWords).join(" ");
      const secondLine = words.slice(firstLineWords).join(" ");
      return `${firstLine}\n${secondLine}`;
    }

    const half = words.length / 2;
    const firstLine = words.slice(0, half).join(" ");
    const secondLine = words.slice(half).join(" ");
    return `${firstLine}\n${secondLine}`;
  };

  const FORCE_SPLIT_COLS = new Set(["nombre", "cliente", "nombre_cliente"]);

  const toUpperNoAccents = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  const shouldSplitCol = (colKey: string) =>
    splitStringsBySpace &&
    (Array.isArray(splitColumns) ? splitColumns.includes(colKey) : true);

  const renderValue = (colKey: string, value: unknown, rowIndex: number) => {
    // Primero verificar si es una columna expandible
    if (isColumnExpandable(colKey, value)) {
      return renderExpandableValue(
        colKey,
        value,
        rowIndex,
        expandedRows.has(rowIndex),
      );
    }

    const lc = colKey.toLowerCase();
    const isForcedNameCol = FORCE_SPLIT_COLS.has(lc);

    if (typeof value === "string") {
      const base = toUpperNoAccents(value);

      if (isForcedNameCol) {
        const words = base.trim().split(/\s+/);

        if (words.length <= 1) {
          return (
            <span className="block break-words text-center text-[11px] leading-tight">
              {base}
            </span>
          );
        }

        // pares: mitad y mitad
        // nones: una palabra más abajo que arriba
        const firstLineWords =
          words.length % 2 === 0
            ? words.length / 2
            : Math.floor(words.length / 2);

        const firstLine = words.slice(0, firstLineWords).join(" ");
        const secondLine = words.slice(firstLineWords).join(" ");

        return (
          <span className="block whitespace-pre-line break-words text-center text-[11px] leading-tight">
            {firstLine + "\n" + secondLine}
          </span>
        );
      }

      // resto de columnas que sí usan splitStringsBySpace normal
      const mustSplit = shouldSplitCol(colKey);
      if (mustSplit) {
        const withNewLines = value.trim().split(/\s+/).join("\n");
        return (
          <span className="whitespace-pre-line break-words">
            {withNewLines}
          </span>
        );
      }

      return <span className="break-words">{value}</span>;
    }

    return String(value ?? "");
  };

  return (
    <div
      className="relative w-full flex flex-col"
      style={fillHeight ? { height: maxHeight } : undefined}
    >
      {exportButton && (
        <div className="flex w-full justify-between mb-2">
          <div className="flex flex-col justify-end">
            <span className="text-gray-600 text-sm font-normal ml-1">
              {leyenda}
            </span>
          </div>
          <div className="flex gap-4">
            {children}
            {isExport && (
              <button
                onClick={() => {
                  const dataToExport = displayData.map(({ item, ...rest }) =>
                    normalizeExportRow(rest),
                  );
                  exportToCSV(dataToExport, "Solicitudes.csv");
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar CSV
              </button>
            )}
            <div className="relative" ref={columnSelectorRef}>
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
                onClick={() => setShowColumnSelector(!showColumnSelector)}
              >
                <Columns className="w-4 h-4 mr-2" />
                Columnas
              </button>
              {showColumnSelector && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg z-30 border border-gray-200 max-h-72 overflow-y-auto">
                  <div className="p-2">
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showAllColumns();
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        Mostrar todas
                      </button>
                    </div>
                    {orderedColumnKeys.map((key) => (
                      <div
                        key={key}
                        className="flex items-center p-1 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`col-${key}`}
                          checked={visibleColumns.has(key)}
                          onChange={() => toggleColumn(key)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`col-${key}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {key.replace(/_/g, " ").toUpperCase()}
                          {expandableColumns.includes(key) && (
                            <span className="ml-1 text-xs text-blue-600">
                              [expandible]
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && <Loader />}

      {displayData.length > 0 && !loading ? (
        <div
  className={`flex-1 min-h-0 relative border border-gray-200 rounded-sm w-full ${
    horizontalScroll ? "overflow-auto" : "overflow-y-auto"
  }`}
  style={!fillHeight ? { maxHeight } : undefined}
>
  <table
    className={`divide-y divide-gray-200 ${
      horizontalScroll ? "w-max min-w-full" : "min-w-full"
    }`}
  >
            <thead className="sticky z-10 bg-gray-50 top-0">
              <tr>
                {visibleOrderedColumns.map((key) => {
  const isStickyRight = stickyRightColumns.includes(key);

  return (
    <th
      key={key}
      scope="col"
      onClick={() => {
        setLoading(true);
        handleSort(key);
      }}
      className={`px-3 min-w-fit whitespace-nowrap py-2 text-left cursor-pointer text-[11px] font-medium text-gray-600 uppercase tracking-wider ${
        isStickyRight
          ? "sticky right-0 z-20 border-l border-gray-200 bg-gray-50 shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.15)]"
          : ""
      }`}
      style={{
        minWidth: columnMinWidths[key] || undefined,
      }}
    >
      <span className="flex flex-col items-start gap-1">
        {key === (currentSort.key || "") && (
          <ArrowDown
            className={`w-3 h-3 transition-transform self-center ${
              !currentSort.sort ? "" : "rotate-180"
            }`}
          />
        )}
        <div className="whitespace-pre-line text-center w-full leading-tight">
          {formatColumnTitle(key)}
          {expandableColumns.includes(key) && (
            <div className="text-xs font-normal text-blue-600 mt-1">
              (Expandible)
            </div>
          )}
        </div>
      </span>
    </th>
  );
})}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {pagedData.map((item, localIndex) => {
                const index = pagination ? currentPage * pageSize + localIndex : localIndex;
                const rowKey = item.id !== undefined ? item.id : index;
                const zebraClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                const rowExtraClass = getRowClassName
                  ? getRowClassName(item, index)
                  : "";
                const baseBgClass =
                  rowExtraClass && rowExtraClass.includes("bg-")
                    ? rowExtraClass
                    : zebraClass + (rowExtraClass ? ` ${rowExtraClass}` : "");

                // filasExpandibles tiene prioridad sobre el estado interno expandedRows
                const isExpanded = filasExpandibles
                  ? !!(filasExpandibles[item.detalles?.reservaId] || filasExpandibles[item.id])
                  : expandedRows.has(index);

                return (
                  <React.Fragment key={`frag-${rowKey}`}>
                    <tr
                      className={`${baseBgClass} group cursor-pointer hover:bg-blue-50 transition-colors`}
                    >
                      {visibleOrderedColumns.map((colKey) => {
                        const Renderer = renderers[colKey];
                        const value = item[colKey];
                        const isStickyRight = stickyRightColumns.includes(colKey);
                        const stickyBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";

                        return (
                          <td
                            key={`${rowKey}-${colKey}`}
                            className={`px-2 py-1 text-[11px] text-gray-900 align-middle ${
                              expandableColumns.includes(colKey) ? "align-top w-72" : ""
                            } ${
                              isStickyRight
                                ? `sticky right-0 z-10 border-l border-gray-200 ${stickyBg} group-hover:bg-blue-50 shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.12)]`
                                : ""
                            }`}
                            style={{
                              minWidth:
                                columnMinWidths[colKey] ||
                                (isStickyRight ? "140px" : undefined),
                            }}
                          >
                            {Renderer ? (
                              <Renderer
                                value={value}
                                item={item.item ?? item}
                                index={index}
                              />
                            ) : (
                              <div className="whitespace-pre-line break-words">
                                {renderValue(colKey, value, index)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Fila expandida (expandedRenderer de Table4) */}
                    {isExpanded && expandedRenderer && (
                      <tr className="bg-gray-100">
                        <td colSpan={visibleOrderedColumns.length}>
                          {expandedRenderer(item)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <div className="px-6 py-4 w-full text-center text-sm text-gray-500 border rounded-sm">
            No se encontraron registros
          </div>
        )
      )}

      {pagination && totalPages > 1 && !loading && (
        <div className="flex items-center justify-between gap-2 mt-2 px-1">
          <span className="text-xs text-gray-500">
            Página {currentPage + 1} de {totalPages}
            {" · "}
            {displayData.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
