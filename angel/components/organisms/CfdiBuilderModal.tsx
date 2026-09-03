"use client";

import { useState } from "react";
import { Modal } from "@/angel/components/molecules/Modal";
import { Dropdown } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import { fmtMoney } from "@/angel/lib/format/number";
import { useCfdiBuilder } from "@/angel/hooks/useCfdiBuilder";
import { CfdiFacturableItem, CfdiGeneradoResultado, CfdiPayload } from "@/angel/lib/cfdi/payload";
import { IVA_16, IVA_8, paymentDescriptions } from "@/angel/lib/cfdi/constants";
import { ModoFacturacionSelector } from "@/angel/components/molecules/cfdi/ModoFacturacionSelector";
import { ConceptoCustomToggle } from "@/angel/components/molecules/cfdi/ConceptoCustomToggle";
import { ConceptoPreviewTable } from "@/angel/components/molecules/cfdi/ConceptoPreviewTable";
import { DatosFiscalesList } from "@/angel/components/molecules/cfdi/DatosFiscalesList";
import { ControlesCfdi } from "@/angel/components/molecules/cfdi/ControlesCfdi";
import { ObservacionesCfdi } from "@/angel/components/molecules/cfdi/ObservacionesCfdi";

type Props = {
  open: boolean;
  agentId: string;
  items: CfdiFacturableItem[];
  onClose: () => void;
  /** El componente NO llama ningún endpoint de creación de factura — arma el
   * payload y lo entrega aquí. Quien implemente este callback decide a qué
   * endpoint mandarlo (hoy el `crearCfdi` legacy, mañana uno nuevo) y puede
   * devolver un `{id}` para una fase futura de descarga de PDF/XML. */
  onGenerar: (payload: CfdiPayload) => Promise<CfdiGeneradoResultado>;
  /** Lo controla quien use el componente mientras corre su propio submit. */
  loading?: boolean;
};

export function CfdiBuilderModal({ open, agentId, items, onClose, onGenerar, loading = false }: Props) {
  const [generando, setGenerando] = useState(false);
  const cfdi = useCfdiBuilder({ agentId, items });

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      await cfdi.generar(onGenerar);
    } finally {
      setGenerando(false);
    }
  };

  const submitDisabled = generando || loading || !cfdi.selectedFiscalData || items.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar factura (CFDI)"
      className="max-w-4xl"
      bodyClassName="max-h-[80vh] overflow-y-auto pr-1"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGenerar} disabled={submitDisabled} loading={generando || loading}>
            Generar factura
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <ModoFacturacionSelector mode={cfdi.invoiceMode} onChange={cfdi.setInvoiceMode} />

        <div className="border rounded-md p-4 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900">Vista previa CFDI</h4>
              <p className="text-xs text-gray-600 mt-1">
                Lugar de expedición: <b>{cfdi.expeditionPlace}</b> · IVA: <b>{cfdi.ivaRateStr}</b>
              </p>
            </div>
          </div>

          {cfdi.invoiceMode === "consolidada" && (
            <ConceptoCustomToggle
              titulo="Concepto (Consolidada)"
              activo={cfdi.useCustomConceptoConsolidada}
              onToggle={() => cfdi.setUseCustomConceptoConsolidada((v) => !v)}
              valor={cfdi.customConceptoConsolidada}
              onChange={cfdi.setCustomConceptoConsolidada}
              placeholder={cfdi.selectedDescription}
              hint={`Si está desactivado o vacío, se usa: ${cfdi.selectedDescription}`}
            />
          )}
          {cfdi.invoiceMode === "detallada_por_grupo" && (
            <ConceptoCustomToggle
              titulo="Prefijo de concepto (por grupo)"
              activo={cfdi.useCustomConceptoGrupo}
              onToggle={() => cfdi.setUseCustomConceptoGrupo((v) => !v)}
              valor={cfdi.customConceptoGrupo}
              onChange={cfdi.setCustomConceptoGrupo}
              placeholder={cfdi.selectedDescription}
              hint="Si está activo, se usará exactamente este texto como descripción del concepto."
            />
          )}
          {cfdi.invoiceMode === "detallada_por_item" && (
            <ConceptoCustomToggle
              titulo="Prefijo de concepto (por ítem)"
              activo={cfdi.useCustomConceptoItem}
              onToggle={() => cfdi.setUseCustomConceptoItem((v) => !v)}
              valor={cfdi.customConceptoItem}
              onChange={cfdi.setCustomConceptoItem}
              placeholder={cfdi.selectedDescription}
              hint={`Se añadirá: prefijo - título - fechas - referencia. Si está desactivado, usa: ${cfdi.selectedDescription}`}
            />
          )}

          <ConceptoPreviewTable
            lineas={cfdi.previewLineas}
            descOverrides={cfdi.descOverrides}
            onOverrideChange={cfdi.setDescOverride}
            totals={cfdi.previewTotals}
            ivaRateStr={cfdi.ivaRateStr}
          />
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Datos Fiscales</h4>
          <DatosFiscalesList
            loading={cfdi.loadingFiscalData}
            fiscalDataList={cfdi.fiscalDataList}
            selected={cfdi.selectedFiscalData}
            onSelect={cfdi.setSelectedFiscalData}
          />
        </div>

        <ControlesCfdi
          selectedCfdiUse={cfdi.selectedCfdiUse}
          onCfdiUseChange={cfdi.setSelectedCfdiUse}
          selectedPaymentForm={cfdi.selectedPaymentForm}
          onPaymentFormChange={cfdi.setSelectedPaymentForm}
          selectedPaymentMethod={cfdi.selectedPaymentMethod}
          onPaymentMethodChange={cfdi.setSelectedPaymentMethod}
          dueDate={cfdi.dueDate}
          onDueDateChange={cfdi.setDueDate}
          minDueDate={cfdi.minDueDate}
          isPublicoGeneral={cfdi.isPublicoGeneral}
          periodicity={cfdi.periodicity}
          onPeriodicityChange={cfdi.setPeriodicity}
          month={cfdi.month}
          onMonthChange={cfdi.setMonth}
          year={cfdi.year}
          onYearChange={cfdi.setYear}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dropdown
            label="Descripción base"
            value={cfdi.selectedDescription}
            onChange={cfdi.setSelectedDescription}
            options={[...paymentDescriptions]}
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">IVA</label>
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => cfdi.setIvaRate(IVA_16)}
                className={`px-3 py-2 text-sm ${
                  cfdi.ivaRate === IVA_16 ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                16%
              </button>
              <button
                type="button"
                onClick={() => cfdi.setIvaRate(IVA_8)}
                className={`px-3 py-2 text-sm ${
                  cfdi.ivaRate === IVA_8 ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                8%
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Por defecto es 16%.</p>
          </div>
        </div>

        <ObservacionesCfdi
          value={cfdi.customDescription}
          onChange={cfdi.setCustomDescription}
          placeholder={cfdi.defaultDescription}
          textoACopiar={cfdi.descriptionToUse}
          omitido={cfdi.omitObservations}
          onToggleOmitir={() => cfdi.setOmitObservations((v) => !v)}
        />

        <div className="p-4 bg-gray-50 rounded-md flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-700">Total a facturar:</span>
            <p className="text-xs text-gray-500 mt-1">{items.length} ítem(s)</p>
          </div>
          <span className="text-lg font-bold text-gray-900">{fmtMoney(cfdi.previewTotals.total)}</span>
        </div>

        {cfdi.resultadoGenerado && (
          <p className="text-xs text-gray-500">Factura generada: {cfdi.resultadoGenerado.id}</p>
        )}
      </div>
    </Modal>
  );
}
