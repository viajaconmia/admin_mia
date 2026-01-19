import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { useState, useEffect, useMemo, Dispatch } from "react";

export const Table = ({
  registros = [],
  renderers = {},
  maxHeight = "28rem",
  setPage = () => {},
  back = false,
  next = false,
  page,
  loading = false,
}: TableProps) => {
  const [displayData, setDisplayData] = useState<Registro[]>(registros);
  const [currentSort, setCurrentSort] = useState<{
    key: string;
    sort: boolean;
  }>({
    key: "",
    sort: false,
  });

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
    const baseColumns =
      registros &&
      registros.length > 0 &&
      typeof registros[0] === "object" &&
      registros[0] !== null
        ? Object.keys(registros[0])
        : [];

    return [...baseColumns];
  }, [registros]);

  const handleSort = (key: string) => {
    const isNewKey = key !== currentSort.key;
    const nextSortDirection = isNewKey ? true : !currentSort.sort;
    let updateSort = { key, sort: nextSortDirection };
    const sortedData = displayData.toSorted((a, b) =>
      (nextSortDirection ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1
    );
    setDisplayData(sortedData);
    setCurrentSort(updateSort);
  };

  return (
    <div className="relative w-full">
      {displayData.length > 0 ? (
        <>
          {loading ? (
            <>
              <Loader />
            </>
          ) : (
            <>
              <div
                className="overflow-y-auto relative border border-gray-200 rounded-sm w-full h-fit"
                style={{ maxHeight: maxHeight }}
              >
                <table className={`min-w-full divide-y divide-gray-200`}>
                  <thead className=" sticky z-10 bg-gray-50 top-0">
                    <tr>
                      {columnKeys.map((key) => (
                        <th
                          key={key}
                          scope="col"
                          onClick={() => handleSort(key)}
                          className="px-4 min-w-fit whitespace-nowrap py-2 text-left cursor-pointer text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          <span className="flex gap-2">
                            {key.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 odd:bg-black even:bg-green-800">
                    <>
                      {displayData.map((item, index) => (
                        <tr key={`${Math.round(Math.random() * 9999999999)}`}>
                          {columnKeys.map((colKey) => {
                            const Renderer = renderers[colKey];
                            const value =
                              colKey in item ? item[colKey] : { row: item };
                            return (
                              <td
                                key={`${
                                  item.id !== undefined ? item.id : index
                                }-${colKey}`}
                                className="px-4 py-2 whitespace-nowrap text-xs text-gray-900"
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
            </>
          )}
          <div className="p-2 flex justify-center items-center w-full">
            {back && (
              <Button
                icon={ArrowBigLeft}
                variant="ghost"
                size="sm"
                onClick={() => setPage((prev) => prev - 1)}
                disabled={loading}
              />
            )}
            {(back || next) && (
              <span className="font-semibold text-sm text-gray-700 rounded-full w-10 h-10 flex justify-center items-center bg-blue-300">
                {page}
              </span>
            )}
            {next && (
              <Button
                icon={ArrowBigRight}
                disabled={loading}
                variant="ghost"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
              />
            )}
          </div>
        </>
      ) : (
        <div className="px-6 py-4 w-full text-center text-sm text-gray-500 border rounded-sm bg-white">
          No se encontraron registros
        </div>
      )}
    </div>
  );
};

type Registro = {
  [key: string]: any;
};

type RendererMap = {
  [key: string]: React.FC<{ value: any }>;
};

interface TableProps {
  registros: Registro[];
  renderers?: RendererMap;
  maxHeight?: string;
  setPage?: Dispatch<React.SetStateAction<number>>;
  back?: boolean;
  next?: boolean;
  page?: number;
  loading?: boolean;
}
