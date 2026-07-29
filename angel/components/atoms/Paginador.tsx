import Button from "@/components/atom/Button";
import { type Paginacion } from "@/angel/hooks/usePaginacion";

interface PaginadorProps {
  paginacion: Paginacion;
  irAPagina: (page: number) => void;
}

export const Paginador = ({ paginacion, irAPagina }: PaginadorProps) => {
  const { page, total_pages, total } = paginacion;

  if (total_pages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <div className="flex gap-3 items-end relative px-3">
        {page > 1 && (
          <div className="absolute top-0 right-full flex items-end gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => irAPagina(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-xs text-gray-400">{page - 1}</span>
          </div>
        )}
        <Button size="sm" variant="primary">
          {page}
        </Button>
        {page < total_pages && (
          <div className="absolute top-0 left-full flex items-end gap-3">
            <span className="text-xs text-gray-400">{page + 1}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => irAPagina(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 font-semibold">
        Página {page}/{total_pages} · {total} registros
      </p>
    </div>
  );
};
