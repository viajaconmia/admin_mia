"use client";
import { RefreshCcw } from "lucide-react";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { type ReactNode } from "react";
import {
  TableCore,
  type CellRenderer,
  type TotalFn,
} from "@/angel/components/atoms/TableCore";
import { CardList } from "@/angel/components/atoms/CardList";
import { Paginador } from "@/angel/components/atoms/Paginador";
import { type Paginacion } from "@/angel/hooks/usePaginacion";
import { useIsBelowBreakpoint, type Breakpoint } from "@/angel/hooks/useMediaQuery";

interface TablaCompletaProps<T extends Record<string, unknown>> {
  registros: T[];
  paginacion: Paginacion;
  irAPagina: (page: number) => void;
  onRefresh: () => void;
  loading: boolean;
  label?: string;
  renderers?: Partial<Record<string, CellRenderer>>;
  rowClassName?: (item: T) => string;
  maxHeight?: string;
  hiddenKeys?: string[];
  totales?: Partial<Record<string, TotalFn<T>>>;
  children?: ReactNode;
  renderCard?: (item: T, index: number) => ReactNode;
  cardBreakpoint?: Breakpoint;
}

export const TablaCompleta = <T extends Record<string, unknown>>({
  registros,
  paginacion,
  irAPagina,
  onRefresh,
  loading,
  label,
  renderers,
  rowClassName,
  maxHeight,
  hiddenKeys,
  totales,
  children,
  renderCard,
  cardBreakpoint = "md",
}: TablaCompletaProps<T>) => {
  const esMobile = useIsBelowBreakpoint(cardBreakpoint);
  const mostrarCards = Boolean(renderCard) && esMobile;

  return (
    <div className="flex flex-col gap-4 bg-white rounded-lg p-4">
      <div className="flex justify-between items-center gap-2">
        {label && (
          <span className="text-sm font-semibold text-gray-500">{label}</span>
        )}
        {loading && (
          <div className="flex items-center gap-2 w-full justify-center">
            <Loader size="sm" />
            Cargando...
          </div>
        )}
        <div className="flex gap-2 items-center flex-1 justify-end">
          {children}
          <Button
            size="sm"
            onClick={() => onRefresh()}
            icon={RefreshCcw}
            disabled={loading}
            className="ml-auto"
          >
            {registros.length > 0 ? "Actualizar" : "Cargar datos"}
          </Button>
        </div>
      </div>
      {mostrarCards ? (
        <CardList
          registros={registros}
          renderCard={renderCard!}
          rowClassName={rowClassName}
          maxHeight={maxHeight}
        />
      ) : (
        <TableCore
          registros={registros}
          renderers={renderers}
          rowClassName={rowClassName}
          maxHeight={maxHeight}
          hiddenKeys={hiddenKeys}
          totales={totales}
        />
      )}
      <Paginador paginacion={paginacion} irAPagina={irAPagina} />
    </div>
  );
};
