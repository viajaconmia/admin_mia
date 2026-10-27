"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Paperclip } from "lucide-react";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { CotizacionEstadoBadge } from "@/angel/components/atoms/CotizacionEstadoBadge";
import { TipoServicioChip } from "@/angel/components/atoms/TipoServicioChip";
import { CotizacionItemCard } from "@/angel/components/molecules/CotizacionItemCard";
import { useCotizacionIaDetalle } from "@/angel/hooks/useCotizacionIaDetalle";
import {
  ORIGEN_ENTRADA_LABEL,
  fechaHoraLegible,
  tamanoLegible,
} from "@/angel/lib/cotizacionesIa";
import { COTIZACIONES_IA_RUTA } from "@/angel/schemas/tables/cotizaciones_ia";

const Dato = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0">
    <dt className="text-[11px] uppercase tracking-wide text-gray-400">
      {label}
    </dt>
    <dd className="text-sm font-medium text-gray-800 break-words">
      {value || "—"}
    </dd>
  </div>
);

const Seccion = ({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white rounded-lg shadow p-4 space-y-3">
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
      {titulo}
    </h2>
    {children}
  </section>
);

export const CotizacionIaDetalle = ({ id }: { id: string }) => {
  const { detalle, loading, error, archivoAbriendo, abrirArchivo, refetch } =
    useCotizacionIaDetalle(id);

  return (
    <div className="h-fit max-w-5xl mx-auto py-6 space-y-4">
      <Link
        href={COTIZACIONES_IA_RUTA}
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a cotizaciones
      </Link>

      {loading && (
        <div className="py-10">
          <Loader />
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={refetch}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && !detalle && (
        <div className="px-6 py-4 text-center text-sm text-gray-500 border rounded-sm bg-white">
          No se encontró la cotización.
        </div>
      )}

      {detalle && (
        <>
          <Seccion titulo="Cotización">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-gray-700 break-all">
                {detalle.id_cotizacion}
              </span>
              <CotizacionEstadoBadge estado={detalle.estado} />
              {detalle.tipos.map((tipo) => (
                <TipoServicioChip key={tipo} tipo={tipo} />
              ))}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
              <Dato label="Creada" value={fechaHoraLegible(detalle.created_at)} />
              <Dato
                label="Última actualización"
                value={fechaHoraLegible(detalle.updated_at)}
              />
              <Dato
                label="Información recibida como"
                value={ORIGEN_ENTRADA_LABEL[detalle.origen_entrada]}
              />
            </dl>
          </Seccion>

          <Seccion titulo="Solicitante">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <Dato label="Nombre" value={detalle.solicitante_nombre} />
              <Dato label="Correo" value={detalle.solicitante_correo} />
              <Dato label="ID de usuario" value={detalle.id_usuario} />
              <Dato label="ID de agente" value={detalle.id_agente} />
            </dl>
          </Seccion>

          {(detalle.resumen || detalle.notas) && (
            <Seccion titulo="Resumen">
              {detalle.resumen && (
                <p className="text-sm text-gray-800 whitespace-pre-line">
                  {detalle.resumen}
                </p>
              )}
              {detalle.notas && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Notas
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {detalle.notas}
                  </p>
                </div>
              )}
            </Seccion>
          )}

          <Seccion titulo={`Servicios solicitados (${detalle.items.length})`}>
            {detalle.items.length === 0 ? (
              <p className="text-sm text-gray-400">
                Esta cotización no trae servicios capturados.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {detalle.items.map((item, index) => (
                  <CotizacionItemCard
                    key={item.id ?? index}
                    item={item}
                    index={index}
                  />
                ))}
              </div>
            )}
          </Seccion>

          <Seccion titulo={`Archivos originales (${detalle.archivos.length})`}>
            {detalle.archivos.length === 0 ? (
              <p className="text-sm text-gray-400">
                No se adjuntaron archivos.
              </p>
            ) : (
              <ul className="divide-y border rounded-md overflow-hidden">
                {detalle.archivos.map((archivo) => (
                  <li
                    key={archivo.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {archivo.nombre_archivo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[archivo.tipo_mime, tamanoLegible(archivo.tamano_bytes)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      icon={ExternalLink}
                      loading={archivoAbriendo === archivo.id}
                      disabled={archivoAbriendo !== null}
                      onClick={() => abrirArchivo(archivo.id)}
                    >
                      Abrir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>
        </>
      )}
    </div>
  );
};
