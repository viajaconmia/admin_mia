"use client";

import { useEffect } from "react";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";
import { TablaCompleta } from "@/angel/components/organisms/TablaCompleta";
import { useComisionables } from "@/angel/hooks/useComisionables";
import { mapComisionable, createComisionablesRenderers } from "./_components/schema";

export default function ComisionablesPage() {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.COMISIONABLES);

  const { registros, loading, paginacion, cobrandoId, fetchComisionables, cobrarComision } =
    useComisionables();

  useEffect(() => {
    fetchComisionables(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderers = createComisionablesRenderers(cobrarComision, cobrandoId);

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Comisionables
      </h1>
      <TablaCompleta
        paginacion={paginacion}
        irAPagina={fetchComisionables}
        onRefresh={() => fetchComisionables()}
        registros={registros.map(mapComisionable)}
        loading={loading}
        renderers={renderers}
        label={`Mostrando ${registros.length} registros`}
      />
    </div>
  );
}
