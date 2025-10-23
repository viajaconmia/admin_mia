import { exportToCSV } from "@/helpers/utils";
import { ArrowDown, FileDown, Columns } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
}

export const Table5 = <T,>({
  registros = [],
  renderers = {},
  defaultSort,
  exportButton = true,
  leyenda = "",
  children,
  maxHeight = "28rem",
  customColumns,
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

  return (
    // The main container remains a relative parent
    <div className="relative w-full">
      {exportButton && (
        <div className="flex w-full justify-between mb-2">
          <div className="flex flex-col justify-end">
            <span className="text-gray-600 text-sm font-normal ml-1">
              {leyenda}
            </span>
          </div>
          {/* Moved the column selector button and dropdown here,
          outside the overflow container */}
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
            <div className="relative">
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
      {/* The table container itself still needs the overflow styles */}
      {displayData.length > 0 && !loading ? (
        <div
          className="overflow-y-auto relative border border-gray-200 rounded-sm w-full h-fit"
          style={{ maxHeight: maxHeight }}
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
                      className="px-6 min-w-fit whitespace-nowrap py-3 text-left cursor-pointer text-xs font-medium text-gray-600 uppercase tracking-wider"
                    >
                      <span className="flex gap-2">
                        {key === (currentSort.key || "") && (
                          <ArrowDown
                            className={`w-4 h-4 transition-transform ${!currentSort.sort ? "" : "rotate-180"
                              }`}
                          />
                        )}
                        {key.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((item, index) => (
                <tr
                  key={item.id !== undefined ? item.id : index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } cursor-pointer hover:bg-blue-50 transition-colors`}
                >
                  {columnKeys
                    .filter((key) => visibleColumns.has(key))
                    .map((colKey) => {
                      const Renderer = renderers[colKey];
                      const value = item[colKey];

                      return (
                        <td
                          key={`${item.id !== undefined ? item.id : index
                            }-${colKey}`}
                          className="px-6 py-2 whitespace-nowrap text-xs text-gray-900"
                        >
                          {Renderer ? (
                            <Renderer value={value} item={item.item} index={index} />
                          ) : (
                            String(value || "")
                          )}
                        </td>
                      );
                    })}
                </tr>
              ))}
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