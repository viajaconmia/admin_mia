import { exportToCSV } from "@/helpers/utils";
import { ArrowDown, FileDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

type Registro = {
  [key: string]: any;
};

type RendererMap = {
  [key: string]: React.FC<{ value: any }>;
};

interface TableProps {
  registros: Registro[];
  renderers?: RendererMap;
  defaultSort: {
    key: string;
    sort: boolean;
  };
  exportButton?: boolean;
  leyenda?: string;
  children?: React.ReactNode;
}

export const TableBilling = ({
  registros,
  renderers = {},
  defaultSort,
  exportButton = true,
  leyenda = "",
  children,
}: TableProps) => {
  const [displayData, setDisplayData] = useState<Registro[]>(registros);
  const [currentSort, setCurrentSort] = useState<{
    key: string;
    sort: boolean;
  }>(defaultSort);

  useEffect(() => {
    setDisplayData(registros);
  }, [registros]);

  const columnKeys = useMemo(() => {
    if (
      registros &&
      registros.length > 0 &&
      typeof registros[0] === "object" &&
      registros[0] !== null
    ) {
      return Object.keys(registros[0]);
    }
    return [];
  }, [registros]);

  const handleSort = (key: string) => {
    let updateSort = { key, sort: !currentSort.sort };

    const sortedData = displayData.toSorted((a, b) =>
      (currentSort.sort ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1
    );
    setDisplayData(sortedData);
    setCurrentSort(updateSort);
  };

  return (
    <div className="relative w-full">
      {exportButton && (
        <div className="flex w-full justify-between mb-2 ">
          <div className="flex flex-col justify-end">
            <span className="text-gray-600 text-sm font-normal ml-1">
              {leyenda}
            </span>
          </div>
          <div className="flex gap-4">
            {children}
            <button
              onClick={() => exportToCSV(displayData, "Solicitudes.csv")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar CSV
            </button>
          </div>
        </div>
      )}
      {displayData.length > 0 ? (
        <div className="overflow-y-auto border border-gray-200 rounded-sm w-full h-fit max-h-[28rem]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 absoluteg top-0">
              <tr>
                {columnKeys.map((key) => (
                  <th
                    key={key}
                    scope="col"
                    onClick={() => handleSort(key)}
                    className="px-6 min-w-fit whitespace-nowrap py-3 text-left cursor-pointer text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    <span className="flex gap-2">
                      {key == (currentSort.key || "") && (
                        <ArrowDown
                          className={`w-4 h-4 ${
                            !currentSort.sort ? "" : "rotate-180"
                          }`}
                        />
                      )}
                      {key.replace(/_/g, " ").toUpperCase()}{" "}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <>
                {displayData.map((item, index) => (
                  <tr
                    key={item.id !== undefined ? item.id : index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {columnKeys.map((colKey) => {
                      const Renderer = renderers[colKey];
                      const value = item[colKey];

                      return (
                        <td
                          key={`${
                            item.id !== undefined ? item.id : index
                          }-${colKey}`}
                          className="px-6 py-4 whitespace-nowrap text-xs text-gray-900"
                        >
                          {Renderer ? (
                            <Renderer value={value} />
                          ) : (
                            String(value || "")
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-4 w-full text-center text-sm text-gray-500 border rounded-sm">
          No se encontraron registros
        </div>
      )}
    </div>
  );
};
