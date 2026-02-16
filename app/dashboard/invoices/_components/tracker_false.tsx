import Button from "@/components/atom/Button";

export interface TrackingPage {
  total: number;
  page: number;
  total_pages: number;
}

export const PageTracker = ({
  tracking,
  setPage,
}: {
  tracking: TrackingPage;
  setPage: (number) => void;
}) => {
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex gap-3 items-end relative px-3">
        {tracking.page > 1 && (
          <div className="absolute top-0 right-full flex items-end  gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage(tracking.page - 1)}
            >
              Anterior
            </Button>
            <span className="text-xs text-gray-400">{tracking.page - 1}</span>
          </div>
        )}
        {tracking.page && (
          <Button size="sm" variant="primary">
            {tracking.page}
          </Button>
        )}
        {tracking.page < tracking.total_pages && (
          <div className="absolute top-0 left-full flex  items-end gap-3">
            <span className="text-xs text-gray-400">{tracking.page + 1}</span>
            <Button
              size="sm"
              variant="secondary"
              // onClick={() => {
              //   setTracking((prev) => ({
              //     ...prev,
              //     page: prev.page + 1,
              //   }));
              //   fetchProveedores(tracking.page + 1);
              // }}
              onClick={() => setPage(tracking.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 font-semibold">
        {tracking.page}/{tracking.total_pages}
      </p>
    </div>
  );
};
