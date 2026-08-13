"use client";
import { useEffect, useRef } from "react";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { TextInput } from "@/components/atom/Input";
import { TableCore, type CellRenderer } from "@/angel/components/atoms/TableCore";
import { fmtMoney } from "@/angel/lib/format/number";
import { useAnalizarFacturaXml } from "@/angel/hooks/useAnalizarFacturaXml";
import type { InvoiceResult, NormalizedInvoice } from "@/angel/lib/cfdi/types";

interface AnalizadorFacturaXmlProps {
  /** Se llama cada vez que termina un análisis exitoso, con el resultado y el
   * modelo normalizado completo — para prellenar un formulario externo. */
  onResultado?: (resultado: InvoiceResult, normalizado: NormalizedInvoice) => void;
  urlInicial?: string;
}

const RenderMoneda: CellRenderer = ({ value }) => <>{fmtMoney(Number(value) || 0)}</>;

const CONCEPTOS_RENDERERS: Partial<Record<string, CellRenderer>> = {
  valorUnitario: RenderMoneda,
  importe: RenderMoneda,
};

const IMPUESTO_RENDERERS: Partial<Record<string, CellRenderer>> = {
  base: RenderMoneda,
  importe: RenderMoneda,
};

function Campo({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900">
        {value !== undefined && value !== null && value !== "" ? value : "—"}
      </div>
    </div>
  );
}

// Organism reutilizable: solo maneja lógica de XML (URL → análisis →
// resultado). No conoce permisos, no guarda nada en backend — cualquier
// pantalla/formulario puede incrustarlo y usar `onResultado` para leer los
// datos extraídos.
export function AnalizadorFacturaXml({ onResultado, urlInicial }: AnalizadorFacturaXmlProps) {
  const { url, setUrl, loading, resultado, normalizado, errorMsg, analizar } =
    useAnalizarFacturaXml(urlInicial);

  const onResultadoRef = useRef(onResultado);
  onResultadoRef.current = onResultado;

  useEffect(() => {
    if (resultado && normalizado) {
      onResultadoRef.current?.(resultado, normalizado);
    }
  }, [resultado, normalizado]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <TextInput
          label="URL del XML"
          value={url}
          onChange={setUrl}
          placeholder="https://.../factura.xml"
          className="flex-1"
        />
        <Button onClick={analizar} loading={loading} disabled={loading}>
          Analizar XML
        </Button>
      </div>

      {errorMsg && (
        <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      {loading && <Loader size="sm" />}

      {resultado && normalizado && (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-gray-900">Información general</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Campo label="UUID" value={resultado.factura.uuid} />
              <Campo label="Serie" value={resultado.factura.serie} />
              <Campo label="Folio" value={resultado.factura.folio} />
              <Campo label="Fecha" value={resultado.factura.fecha} />
              <Campo label="Emisor" value={resultado.emisor.nombre ?? resultado.emisor.rfc} />
              <Campo label="Receptor" value={resultado.receptor.nombre ?? resultado.receptor.rfc} />
              <Campo label="Moneda" value={resultado.factura.moneda} />
              <Campo label="Subtotal" value={fmtMoney(resultado.factura.subtotal)} />
              <Campo label="Total" value={fmtMoney(resultado.factura.total)} />
            </div>
          </section>

          <section className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">Servicio detectado</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {resultado.tipoServicio}
            </span>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-gray-900">Impuestos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Campo label="IVA (total)" value={fmtMoney(resultado.impuestos.iva)} />
              <Campo label="IVA 16%" value={fmtMoney(resultado.impuestos.ivaPorTasa.tasa16)} />
              <Campo label="IVA 8%" value={fmtMoney(resultado.impuestos.ivaPorTasa.tasa8)} />
              <Campo label="IVA otras tasas" value={fmtMoney(resultado.impuestos.ivaPorTasa.otras)} />
              <Campo label="ISH" value={fmtMoney(resultado.impuestos.impuestosLocales.ish)} />
              <Campo label="TUA" value={fmtMoney(resultado.impuestos.tua)} />
              <Campo
                label="Cargos aéreos (YQ, YR, etc.)"
                value={fmtMoney(resultado.impuestos.otrosCargosAerolinea)}
              />
              <Campo label="ISR retenido" value={fmtMoney(resultado.impuestos.retenciones.isr)} />
              <Campo label="IVA retenido" value={fmtMoney(resultado.impuestos.retenciones.iva)} />
              <Campo label="IEPS" value={fmtMoney(resultado.impuestos.ieps)} />
              <Campo
                label="Otros impuestos locales"
                value={fmtMoney(resultado.impuestos.impuestosLocales.otros)}
              />
            </div>
            <div
              className={`text-xs px-3 py-2 rounded-md border ${
                resultado.validacion.cuadra
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {resultado.validacion.cuadra
                ? "El subtotal más los impuestos extraídos cuadra con el Total del XML."
                : `El subtotal más los impuestos extraídos (${fmtMoney(
                    resultado.validacion.totalCalculado,
                  )}) no cuadra con el Total del XML (${fmtMoney(
                    resultado.validacion.totalXml,
                  )}). Diferencia: ${fmtMoney(resultado.validacion.diferencia)}.`}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-gray-900">Conceptos</h3>
            <TableCore
              registros={resultado.conceptos}
              renderers={CONCEPTOS_RENDERERS}
              hiddenKeys={["traslados", "retenciones"]}
            />
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-gray-900">
              Detalle de impuestos (XML original)
            </h3>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Traslados</span>
              <TableCore registros={resultado.detalleOriginal.traslados} renderers={IMPUESTO_RENDERERS} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Retenciones</span>
              <TableCore
                registros={resultado.detalleOriginal.retenciones}
                renderers={IMPUESTO_RENDERERS}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Impuestos locales</span>
              <TableCore
                registros={resultado.detalleOriginal.impuestosLocales}
                renderers={IMPUESTO_RENDERERS}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                Cargos de aerolínea (complemento SAT)
              </span>
              <TableCore
                registros={resultado.detalleOriginal.otrosCargosAerolinea}
                renderers={IMPUESTO_RENDERERS}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
