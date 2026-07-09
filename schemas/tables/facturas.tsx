"use client";

import { DateTime, Precio } from "@/v3/atom/TableItemsComponent";
import Button from "@/components/atom/Button";
import { FileText, FileDown } from "lucide-react";

export type FacturaFiltradaRaw = {
  id_factura: string;
  folio: string | null;
  uuid_factura: string;
  estado: string;
  estado_sat: string;
  cfdi_tipo: string | null;
  rfc: string;
  rfc_receptor: string;
  nombre: string | null;
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
  url_pdf: string | null;
  url_xml: string | null;
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
  | "fecha_vencimiento"
> & {
  cliente: string;
  documentos: FacturaFiltradaRaw;
};

export const mapFactura = (factura: FacturaFiltradaRaw): FacturaItem => ({
  cliente:
    factura.razon_social || factura.nombre_receptor || factura.nombre || "—",
  rfc: factura.rfc_receptor || factura.rfc,
  folio: factura.folio,
  uuid_factura: factura.uuid_factura,
  estado: factura.estado,
  total: factura.total,
  saldo: factura.saldo_insoluto ?? factura.saldo,
  fecha_emision: factura.fecha_emision,
  fecha_vencimiento: factura.fecha_vencimiento,
  documentos: factura,
});

export const createFacturaRenderers = () => ({
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
  saldo: ({ value }: { value: string }) => <Precio value={value} />,
  fecha_emision: ({ value }: { value: string }) => <DateTime value={value} />,
  fecha_vencimiento: ({ value }: { value: string | null }) => (
    <DateTime value={value} />
  ),
  documentos: ({ value }: { value: FacturaFiltradaRaw }) => (
    <div className="flex gap-2">
      {value.url_pdf && (
        <a href={value.url_pdf} target="_blank" rel="noreferrer">
          <Button size="sm" variant="secondary" icon={FileText}>
            PDF
          </Button>
        </a>
      )}
      {value.url_xml && (
        <a href={value.url_xml} target="_blank" rel="noreferrer">
          <Button size="sm" variant="secondary" icon={FileDown}>
            XML
          </Button>
        </a>
      )}
    </div>
  ),
});

const ESTADO_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 border border-green-300",
  canceled: "bg-red-100 text-red-700 border border-red-300",
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
};
