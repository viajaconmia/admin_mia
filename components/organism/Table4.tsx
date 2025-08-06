import { ArrowDown, Columns } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Loader } from "../atom/Loader";

type Registro = {
  [key: string]: any;
};

type RendererMap<T> = {
  [key: string]: React.FC<{ value: any; item: T }>;
};

interface TableProps<T> {
  registros: Registro[];
  renderers?: RendererMap<T>;
  defaultSort?: {
    key: string;
    sort: boolean;
  };
  leyenda?: string;
  children?: React.ReactNode;
  maxHeight?: string;
  customColumns?: string[];
}

export const Table4 = <T,>({
  registros = [],
  renderers = {},
  defaultSort,
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
    if (registros && registros.length > 0 && typeof registros[0] === "object") {
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
      const sortedData = displayData.toSorted((a, b) =>
        currentSort.sort ? (a[key] < b[key] ? 1 : -1) : a[key] > b[key] ? 1 : -1
      );
      setDisplayData(sortedData);
      setCurrentSort(updateSort);
      setLoading(false);
    }, 0);
  };

  return (
    <div className="relative w-full">
      <div className="flex w-full justify-between mb-2">
        <div className="flex flex-col justify-end">
          <span className="text-gray-600 text-sm font-normal ml-1">{leyenda}</span>
        </div>
        <div className="flex gap-4 items-center">
          {children}
          <div className="relative">
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              <Columns className="w-4 h-4" />
              Columnas
            </button>
            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                <div className="p-2 max-h-60 overflow-y-auto">
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
                    <div key={key} className="flex items-center p-1 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`col-${key}`}
                        checked={visibleColumns.has(key)}
                        onChange={() => toggleColumn(key)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`col-${key}`} className="ml-2 text-sm text-gray-700">
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

      {loading && <Loader />}
      {displayData.length > 0 && !loading ? (
        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm" style={{ maxHeight }}>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                {columnKeys
                  .filter((key) => visibleColumns.has(key))
                  .map((key) => (
                    <th
                      key={key}
                      scope="col"
                      onClick={() => handleSort(key)}
                      className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {key === currentSort.key && (
                          <ArrowDown
                            className={`w-4 h-4 text-blue-500 transition-transform ${!currentSort.sort ? "" : "rotate-180"}`}
                          />
                        )}
                        {key.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {displayData.map((item, index) => (
                <tr
                  key={item.id !== undefined ? item.id : index}
                  className="odd:bg-gray-50 even:bg-white hover:bg-blue-50 transition-colors duration-150"
                >
                  {columnKeys
                    .filter((key) => visibleColumns.has(key))
                    .map((colKey) => {
                      const Renderer = renderers[colKey];
                      const value = item[colKey];
                      return (
                        <td
                          key={`${index}-${colKey}`}
                          className="px-4 py-2 whitespace-nowrap text-xs text-gray-800"
                        >
                          {Renderer ? <Renderer value={value} item={item.item} /> : String(value ?? "")}
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
          <div className="px-6 py-4 w-full text-center text-sm text-gray-500 border rounded-md">
            No se encontraron registros
          </div>
        )
      )}
    </div>
  );
};
