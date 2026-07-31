import {
  PageTracker,
  TrackingPage,
  initial,
} from "@/app/dashboard/invoices/_components/tracker_false";
import { Table } from "@/component/molecule/Table";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { RefreshCcw } from "lucide-react";

type TablesProps<T> = {
  pageTracking: TrackingPage;
  fetchData: (page?: number) => void;
  label?: string;
  registros: T[];
  loading: boolean;
  renderers?: Record<string, (value: any) => React.ReactNode>;
  hiddenHeaders?: boolean;
};

export type { TrackingPage };
export { initial };

export const CompleteTable = <T,>({
  pageTracking,
  fetchData,
  registros,
  label,
  loading,
  renderers = {},
  hiddenHeaders = false,
}: TablesProps<T>) => {
  return (
    <div className="flex flex-col gap-4 bg-white rounded-lg p-4">
      {loading && (
        <div className="sticky top-0 z-20 -mx-4 -mt-4 flex items-center gap-2 bg-blue-50 px-4 py-2 text-sm text-blue-600">
          <Loader size="sm" />
          Cargando...
        </div>
      )}
      {!hiddenHeaders && (
        <div className="flex justify-between items-center gap-2">
          <div>
            {label && (
              <span className="text-sm font-semibold text-gray-500">
                {label}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => fetchData()}
            icon={RefreshCcw}
            disabled={loading}
          >
            {registros.length > 0 ? "Actualizar" : "Cargar datos"}
          </Button>
        </div>
      )}
      <Table registros={registros || []} renderers={renderers} />
      <PageTracker tracking={pageTracking} setPage={fetchData} />
    </div>
  );
};
