import { exportToCSV } from "@/helpers/utils";
import { ArrowDown, FileDown, Columns, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Loader } from "@/components/atom/Loader"

type Registro = {
  [key: string]: any;
};

type RendererMap<T> = {
  [key: string]: React.FC<{ value: any; item: T; index: number }>;
};

interface TableProps<T> {
  registros: Registro[];
  renderers?: RendererMap<T>;
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
  expandableColumns = [], // Nueva prop
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
      }
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  // Estado para las filas expandidas
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
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
      const allColumns = Object.keys(registros[0]).filter((key) => key !== "item");
      setVisibleColumns(new Set(allColumns));
    }
    // Resetear expansiones cuando cambian los datos
    setExpandedRows(new Set());
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
          ? (a[key] < b[key] ? 1 : -1)
          : (a[key] > b[key] ? 1 : -1)
      );
      setDisplayData(sortedData);
      setCurrentSort(updateSort);
      setLoading(false);
    }, 0);
  };

  // Función para alternar expansión de fila
  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Verificar si una columna es expandible para una fila específica
  const isColumnExpandable = (colKey: string, value: any) => {
    // Verificar si la columna está en la lista de expandibleColumns
    const isInExpandableList = expandableColumns.includes(colKey);
    
    // Verificar si el valor es un array con más de un elemento
    const hasMultipleItems = Array.isArray(value) && value.length > 1;
    
    // Verificar si es un string que podría contener múltiples valores separados
    const isStringWithSeparators = typeof value === 'string' && 
      (value.includes(',') || value.includes(';') || value.includes('|'));
    
    return isInExpandableList && (hasMultipleItems || isStringWithSeparators);
  };

  // Formatear el valor de una columna expandible
  const renderExpandableValue = (
  colKey: string,
  value: any,
  rowIndex: number,
  isExpanded: boolean
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
            <div
              key={colIndex}
              className="min-w-[10rem] space-y-1"
            >
              {colItems.map((item, idx) => (
                <div
                  key={idx}
                  className="text-xs text-gray-700"
                >
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
    return renderExpandableValue(colKey, value, rowIndex, expandedRows.has(rowIndex));
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
            <button
              onClick={() =>
                exportToCSV(
                  displayData.map(({ item, ...rest }) => rest),
                  "Solicitudes.csv"
                )
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar CSV
            </button>
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
                    {columnKeys.map((key) => (
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
                            <span className="ml-1 text-xs text-blue-600">[expandible]</span>
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
  className="flex-1 min-h-0 overflow-y-auto relative border border-gray-200 rounded-sm w-full"
  style={!fillHeight ? { maxHeight } : undefined}
>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky z-10 bg-gray-50 top-0">
              <tr>
                {columnKeys
                  .filter((key) => visibleColumns.has(key))
                  .map((key) => (
                    <th
                      key={key}
                      scope="col"
                      onClick={() => {
                        setLoading(true);
                        handleSort(key);
                      }}
className="px-3 min-w-fit whitespace-nowrap py-2 text-left cursor-pointer text-[11px] font-medium text-gray-600 uppercase tracking-wider"
                    >
                      <span className="flex flex-col items-start gap-1">
                        {key === (currentSort.key || "") && (
                          <ArrowDown
                            className={`w-3 h-3 transition-transform self-center ${!currentSort.sort ? "" : "rotate-180"
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
                  ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
{displayData.map((item, index) => {
  const zebraClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
  const rowExtraClass = getRowClassName
    ? getRowClassName(item, index)
    : "";
  const baseBgClass =
    rowExtraClass && rowExtraClass.includes("bg-")
      ? rowExtraClass
      : zebraClass + (rowExtraClass ? ` ${rowExtraClass}` : "");
  const isExpanded = expandedRows.has(index);

  return (
    <tr
      key={`row-${item.id !== undefined ? item.id : index}`}
      className={`${baseBgClass} cursor-pointer hover:bg-blue-50 transition-colors`}
    >
      {columnKeys
        .filter((key) => visibleColumns.has(key))
        .map((colKey) => {
          const Renderer = renderers[colKey];
          const value = item[colKey];

          return (
            <td
  key={`${item.id !== undefined ? item.id : index}-${colKey}`}
  className={`px-2 py-1 text-[11px] text-gray-900 align-middle ${
    expandableColumns.includes(colKey) ? "align-top w-72" : ""
  }`}
>

  {Renderer ? (
    <Renderer value={value} item={item.item} index={index} />
  ) : (
    <div className="whitespace-pre-line break-words">
      {renderValue(colKey, value, index)}
    </div>
  )}
</td>
          );
        })}
    </tr>
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
    </div>
  );
};