"use client";

import { DateTime, Precio } from "@/v3/atom/TableItemsComponent";
import Button from "@/components/atom/Button";
import { FileText, FileDown, Download, Eye, FilePlus } from "lucide-react";
import { downloadFromUrl } from "@/angel/lib/download";

export type FacturaFiltradaRaw = {
  id_factura: string;
  folio: string | null;
  id_agente: string | null;
  uuid_factura: string;
  estado: string;
  estado_sat: string;
  cfdi_tipo: string | null;
  rfc: string;
  rfc_receptor: string;
  nombre_cliente: string | null;
  razon_social: string | null;
  nombre_receptor: string | null;
  total: string;
  subtotal: string;
  impuestos: string;
  saldo: string;
  saldo_insoluto: string;
  fecha_emision: string;
  fecha_timbrado: string | null;
  fecha_vencimiento: string | null;
  saldo_x_aplicar_items: string;
  url_pdf: string | null;
  url_xml: string | null;
  id_facturama: string | null;
};

export type FacturaItem = Pick<
  FacturaFiltradaRaw,
  | "folio"
  | "uuid_factura"
  | "estado"
  | "rfc"
  | "total"
  | "saldo"
  | "fecha_emision"
> & {
  cliente: string;
  saldo_reservas: string;
  documentos: FacturaFiltradaRaw;
  acciones: FacturaFiltradaRaw;
};

export const mapFactura = (factura: FacturaFiltradaRaw): FacturaItem => ({
  cliente:
    factura.nombre_cliente ||
    factura.razon_social ||
    factura.nombre_receptor ||
    "—",
  rfc: factura.rfc_receptor || factura.rfc,
  folio: factura.folio,
  uuid_factura: factura.uuid_factura,
  estado: factura.estado,
  total: factura.total,
  saldo: factura.saldo_insoluto ?? factura.saldo,
  saldo_reservas: factura.saldo_x_aplicar_items,
  fecha_emision: factura.fecha_emision,
  documentos: factura,
  acciones: factura,
});

type DescargarFn = (
  id_facturama: string,
  tipo: "pdf" | "xml",
  nombre?: string,
) => void;

export const createFacturaRenderers = (opts?: {
  onDescargar?: DescargarFn;
  onVerDetalle?: (id_factura: string, factura: FacturaFiltradaRaw) => void;
  onAsignar?: (id_factura: string, factura: FacturaFiltradaRaw) => void;
}) => ({
  estado: ({ value }: { value: string }) => {
    const style =
      ESTADO_STYLES[value?.toLowerCase()] ??
      "bg-gray-100 text-gray-600 border border-gray-300";
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${style}`}
      >
        {value ?? "—"}
      </span>
    );
  },
  total: ({ value }: { value: string }) => <Precio value={value} />,
  saldo_reservas: ({ value }: { value: string }) => <Precio value={value} />,
  saldo: ({ value }: { value: string }) => <Precio value={value} />,
  fecha_emision: ({ value }: { value: string }) => <DateTime value={value} />,
  documentos: ({ value }: { value: FacturaFiltradaRaw }) => {
    const nombre = `Factura-${value.folio || value.id_factura}-${value.rfc_receptor || value.rfc}`;
    return (
      <div className="flex flex-wrap gap-2">
        {value.url_pdf && value.url_xml ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={FileText}
              onClick={() => downloadFromUrl(value.url_pdf!, `${nombre}.pdf`)}
            >
              PDF
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={FileDown}
              onClick={() => downloadFromUrl(value.url_xml!, `${nombre}.xml`)}
            >
              XML
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={Download}
              onClick={() =>
                opts.onDescargar!(value.id_facturama!, "pdf", nombre)
              }
            >
              PDF (Facturama)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={Download}
              onClick={() =>
                opts.onDescargar!(value.id_facturama!, "xml", nombre)
              }
            >
              XML (Facturama)
            </Button>
          </>
        )}
      </div>
    );
  },
  acciones: ({ value }: { value: FacturaFiltradaRaw }) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          icon={Eye}
          onClick={() => opts?.onVerDetalle?.(value.id_factura, value)}
        >
          Detalles
        </Button>
        {opts?.onAsignar &&
          value.saldo_x_aplicar_items &&
          Number(value.saldo_x_aplicar_items) > 0 && (
            <Button
              size="sm"
              variant="secondary"
              icon={FilePlus}
              onClick={() => opts.onAsignar!(value.id_factura, value)}
            >
              Asignar
            </Button>
          )}
      </div>
    );
  },
});

const ESTADO_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 border border-green-300",
  canceled: "bg-red-100 text-red-700 border border-red-300",
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
};
