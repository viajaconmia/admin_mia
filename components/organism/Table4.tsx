import { ArrowDown, Columns, FileDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Loader } from "../atom/Loader";
import React from "react";
import { exportToCSV } from "@/helpers/utils";



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
  filasExpandibles?: { [id: string]: boolean };
  expandedRenderer?: (row: Registro) => React.ReactNode; // NUEVO

}

export const Table4 = <T,>({
  registros = [],
  renderers = {},
  defaultSort,
  leyenda = "",
  children,
  maxHeight = "28rem",
  customColumns, filasExpandibles, expandedRenderer

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

  const shouldWrap = (value: any) => {
    if (typeof value !== 'string') return false;
    return value.length > 14;
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
    <div className="relative w-full h-full flex flex-col">
      {/* Encabezado y controles */}
      <div className="    sticky top-0 z-40 bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur
    border-b border-gray-200
    flex w-full justify-between items-center
    py-2 px-2 mb-2
  ">
        <div className="flex flex-col justify-end">
          <span className="text-gray-600 text-sm font-normal ml-1">{leyenda}</span>
        </div>
        <div className="flex gap-4 items-center">
          {children}
          <button
            onClick={() => {
              exportToCSV(
                displayData.map(({ item, ...rest }) => rest),
                "Solicitudes.csv"
              );
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
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
        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm flex-1 min-h-0">
          <table
            className="min-w-full divide-y divide-gray-200 text-sm h-full"
            style={{ tableLayout: 'auto' }} // <--- alto dinámico
          >
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
                      style={{ width: '200px' }} // Ajusta según necesites
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
              {displayData.map((item, index) => {
                const isExpanded = filasExpandibles?.[item.detalles?.reservaId] || filasExpandibles?.[item.id];

                return (
                  <React.Fragment key={item.id !== undefined ? item.id : index}>
                    <tr className="odd:bg-gray-50 even:bg-white hover:bg-blue-50 transition-colors duration-150">
                      {columnKeys
                        .filter((key) => visibleColumns.has(key))
                        .map((colKey) => {
                          const Renderer = renderers[colKey];
                          const value = item[colKey];
                          return (
                            <td
                              key={`${index}-${colKey}`}
                              className={`px-4 py-2 align-top text-xs text-gray-800 ${shouldWrap(value)
                                ? 'whitespace-normal break-words'
                                : 'whitespace-nowrap'
                                }`}
                              style={{
                                maxWidth: shouldWrap(value) ? '300px' : 'auto', // limita el ancho si es largo
                                lineHeight: '1.4em', // mejora lectura
                              }}
                              title={
                                typeof value === 'string' && value.length > 50 ? value : undefined
                              }
                            >
                              {Renderer ? (
                                <Renderer value={value} item={item.detalles} />
                              ) : (
                                String(value ?? '')
                              )}
                            </td>

                          );
                        })}
                    </tr>

                    {/* Fila expandida */}
                    {isExpanded && item.detalles?.saldos_facturables && (
                      <tr className="bg-gray-100">
                        <td colSpan={columnKeys.length}>
                          <div className="p-4">
                            <h4 className="text-sm font-semibold mb-2 text-gray-800">Saldos Facturables:</h4>
                            {item.detalles.saldos_facturables.length > 0 ? (
                              <ul className="space-y-1 text-xs text-gray-700">
                                {item.detalles.saldos_facturables.map((saldo: any, i: number) => (
                                  <li key={i} className="border-b py-1">
                                    <strong>Fecha pago:</strong> {saldo.fecha_pago} |{" "}
                                    <strong>Monto:</strong> ${saldo.monto} |{" "}
                                    <strong>Concepto:</strong> {saldo.concepto}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-xs italic">Sin saldos facturables.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    {/* fila expandida -> usa expandedRenderer si existe */}
                    {isExpanded && (
                      <tr className="bg-gray-100">
                        <td colSpan={columnKeys.length}>
                          {expandedRenderer ? (
                            expandedRenderer(item) // ← AQUÍ metes tu tabla de items/noches
                          ) : (
                            // fallback (tu contenido anterior si quieres conservarlo)
                            <div className="p-4 text-xs text-gray-600">
                              Sin renderer expandido.
                            </div>
                          )}
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
          <div className="px-6 py-4 w-full text-center text-sm text-gray-500 border rounded-md flex-1 flex items-center justify-center">
            No se encontraron registros
          </div>
        )
      )}
    </div>
  );
};
