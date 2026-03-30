import {
  PageTracker,
  TrackingPage,
} from "@/app/dashboard/invoices/_components/tracker_false";
import { Table } from "@/component/molecule/Table";
import Button from "@/components/atom/Button";
import { RefreshCcw } from "lucide-react";

type TablesProps<T> = {
  pageTracking: TrackingPage;
  fetchData: (page?: number) => void;
  registros: T[];
  loading: boolean;
  renderers?: Record<string, (value: any) => React.ReactNode>;
};

export type { TrackingPage };

export const CompleteTable = <T,>({
  pageTracking,
  fetchData,
  registros,
  loading,
  renderers = {},
}: TablesProps<T>) => {
  return (
    <div className="flex flex-col gap-4 bg-white rounded-lg p-4">
      <div className="flex justify-end items-center">
        <Button size="sm" onClick={() => fetchData()} icon={RefreshCcw}>
          {registros.length > 0 ? "Actualizar" : "Cargar datos"}
        </Button>
      </div>
      <Table
        registros={registros || []}
        loading={loading}
        renderers={renderers}
      />
      <PageTracker tracking={pageTracking} setPage={fetchData} />
    </div>
  );
};
