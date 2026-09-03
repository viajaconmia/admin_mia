import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useAlert } from "@/context/useAlert";
import { agentesService } from "@/angel/services/agentes";
import { fmtDateCsv } from "@/angel/lib/format/date";
import {
  IVA_16,
  IvaRate,
  RFC_GENERICO,
  getExpeditionPlace,
  paymentDescriptions,
} from "@/angel/lib/cfdi/constants";
import { preflightCfdi } from "@/angel/lib/cfdi/calculos";
import {
  armarConceptos,
  buildCfdiPayload,
  CfdiFacturableItem,
  CfdiGeneradoResultado,
  CfdiPayload,
  CfdiReceiver,
  EmpresaDatosFiscales,
  InvoiceMode,
} from "@/angel/lib/cfdi/payload";

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};
const toInputDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// ---------------------------------------------------------------------------
// Todo el estado del formulario vive junto en un solo reducer: son ~20
// campos que cambian en conjunto (modo de factura, IVA, datos fiscales,
// conceptos custom por modo, overrides de descripción...) y varios efectos
// derivados dependen de combinaciones de ellos. Un reducer deja esas
// transiciones explícitas en un solo lugar en vez de 20 useState sueltos.
// ---------------------------------------------------------------------------

type CfdiBuilderState = {
  fiscalDataList: EmpresaDatosFiscales[];
  selectedFiscalData: EmpresaDatosFiscales | null;
  loadingFiscalData: boolean;
  ivaRate: IvaRate;
  invoiceMode: InvoiceMode;
  selectedCfdiUse: string;
  selectedPaymentForm: string;
  selectedPaymentMethod: string;
  dueDate: string;
  periodicity: string;
  month: string;
  year: string;
  selectedDescription: string;
  customDescription: string;
  omitObservations: boolean;
  useCustomConceptoConsolidada: boolean;
  customConceptoConsolidada: string;
  useCustomConceptoGrupo: boolean;
  customConceptoGrupo: string;
  useCustomConceptoItem: boolean;
  customConceptoItem: string;
  descOverrides: Record<string, string>;
  resultadoGenerado: { id: string } | null;
};

const createInitialState = (): CfdiBuilderState => {
  const now = new Date();
  return {
    fiscalDataList: [],
    selectedFiscalData: null,
    loadingFiscalData: false,
    ivaRate: IVA_16,
    invoiceMode: "consolidada",
    selectedCfdiUse: "G03",
    selectedPaymentForm: "99",
    selectedPaymentMethod: "PPD",
    dueDate: toInputDate(addDays(now, 15)),
    periodicity: "01",
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear()),
    selectedDescription: paymentDescriptions[0],
    customDescription: "",
    omitObservations: false,
    useCustomConceptoConsolidada: false,
    customConceptoConsolidada: "",
    useCustomConceptoGrupo: false,
    customConceptoGrupo: "",
    useCustomConceptoItem: false,
    customConceptoItem: "",
    descOverrides: {},
    resultadoGenerado: null,
  };
};

type Updater<T> = T | ((prev: T) => T);

type Action =
  | {
      [K in keyof CfdiBuilderState]: { type: "SET_FIELD"; field: K; value: Updater<CfdiBuilderState[K]> };
    }[keyof CfdiBuilderState]
  | { type: "SET_DESC_OVERRIDE"; key: string; value: string }
  | { type: "APPLY_RFC_GENERICO_DEFAULTS" };

const resolveUpdater = <T,>(value: Updater<T>, prev: T): T =>
  typeof value === "function" ? (value as (prev: T) => T)(prev) : value;

function reducer(state: CfdiBuilderState, action: Action): CfdiBuilderState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: resolveUpdater(action.value, state[action.field]) };
    case "SET_DESC_OVERRIDE":
      return { ...state, descOverrides: { ...state.descOverrides, [action.key]: action.value } };
    case "APPLY_RFC_GENERICO_DEFAULTS":
      return { ...state, selectedCfdiUse: "S01", selectedPaymentMethod: "PPD", selectedPaymentForm: "99" };
    default:
      return state;
  }
}

type UseCfdiBuilderParams = {
  agentId: string;
  items: CfdiFacturableItem[];
};

export function useCfdiBuilder({ agentId, items }: UseCfdiBuilderParams) {
  const { error } = useAlert();
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Setters con la misma firma que devolvía useState (aceptan valor o
  // updater), para no tener que tocar los componentes que ya los consumen.
  const setters = useMemo(() => {
    const setField =
      <K extends keyof CfdiBuilderState>(field: K) =>
      (value: Updater<CfdiBuilderState[K]>) =>
        dispatch({ type: "SET_FIELD", field, value } as Action);

    return {
      setSelectedFiscalData: setField("selectedFiscalData"),
      setIvaRate: setField("ivaRate"),
      setInvoiceMode: setField("invoiceMode"),
      setSelectedCfdiUse: setField("selectedCfdiUse"),
      setSelectedPaymentForm: setField("selectedPaymentForm"),
      setSelectedPaymentMethod: setField("selectedPaymentMethod"),
      setDueDate: setField("dueDate"),
      setPeriodicity: setField("periodicity"),
      setMonth: setField("month"),
      setYear: setField("year"),
      setSelectedDescription: setField("selectedDescription"),
      setCustomDescription: setField("customDescription"),
      setOmitObservations: setField("omitObservations"),
      setUseCustomConceptoConsolidada: setField("useCustomConceptoConsolidada"),
      setCustomConceptoConsolidada: setField("customConceptoConsolidada"),
      setUseCustomConceptoGrupo: setField("useCustomConceptoGrupo"),
      setCustomConceptoGrupo: setField("customConceptoGrupo"),
      setUseCustomConceptoItem: setField("useCustomConceptoItem"),
      setCustomConceptoItem: setField("customConceptoItem"),
    };
  }, []);

  const setDescOverride = useCallback((key: string, value: string) => {
    dispatch({ type: "SET_DESC_OVERRIDE", key, value });
  }, []);

  // ---- Datos fiscales ----
  useEffect(() => {
    if (!agentId) return;
    dispatch({ type: "SET_FIELD", field: "loadingFiscalData", value: true });
    agentesService
      .getDatosFiscales(agentId)
      .then(({ data }) => {
        const list = data ?? [];
        dispatch({ type: "SET_FIELD", field: "fiscalDataList", value: list });
        dispatch({ type: "SET_FIELD", field: "selectedFiscalData", value: list[0] ?? null });
      })
      .catch((err) => error(err.message || "Error al cargar los datos fiscales"))
      .finally(() => dispatch({ type: "SET_FIELD", field: "loadingFiscalData", value: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const isPublicoGeneral = state.selectedFiscalData?.rfc === RFC_GENERICO;

  useEffect(() => {
    if (!isPublicoGeneral) return;
    dispatch({ type: "APPLY_RFC_GENERICO_DEFAULTS" });
  }, [isPublicoGeneral]);

  const expeditionPlace = useMemo(() => getExpeditionPlace(state.ivaRate), [state.ivaRate]);
  const ivaRateStr = useMemo(() => state.ivaRate.toFixed(6), [state.ivaRate]);
  const minDueDate = useMemo(() => toInputDate(new Date()), []);

  // ---- Descripción / observaciones ----
  const defaultDescription = useMemo(
    () =>
      Array.from(new Set(items.map((it) => it.contexto?.titulo).filter(Boolean)))
        .map((titulo) => {
          const item = items.find((it) => it.contexto?.titulo === titulo);
          const fecha = item?.contexto?.fechaInicio ? fmtDateCsv(item.contexto.fechaInicio) : "";
          return fecha ? `${titulo} - ${fecha}` : titulo;
        })
        .join(" | "),
    [items],
  );
  const isCustomDescriptionValid =
    !!state.customDescription && /[a-zA-Z0-9\S]/.test(state.customDescription.trim());
  const descriptionToUse = isCustomDescriptionValid ? state.customDescription : defaultDescription;
  const observations = state.omitObservations ? "" : descriptionToUse;

  // ---- Receiver derivado de los datos fiscales seleccionados ----
  const receiver: CfdiReceiver | null = useMemo(() => {
    if (!state.selectedFiscalData) return null;
    if (isPublicoGeneral) {
      return {
        Name: "PUBLICO EN GENERAL",
        CfdiUse: "S01",
        Rfc: RFC_GENERICO,
        FiscalRegime: "616",
        TaxZipCode: expeditionPlace,
      };
    }
    return {
      Name: state.selectedFiscalData.razon_social_df,
      CfdiUse: state.selectedCfdiUse,
      Rfc: state.selectedFiscalData.rfc,
      FiscalRegime: state.selectedFiscalData.regimen_fiscal || "612",
      TaxZipCode: state.selectedFiscalData.codigo_postal_fiscal,
    };
  }, [state.selectedFiscalData, isPublicoGeneral, state.selectedCfdiUse, expeditionPlace]);

  // ---- Descripciones por línea (consolidada / grupo / ítem) ----
  const descripcionConsolidada =
    state.useCustomConceptoConsolidada && state.customConceptoConsolidada.trim()
      ? state.customConceptoConsolidada
      : state.selectedDescription;

  const descripcionPorGrupo = useCallback(
    (g: { titulo: string; fechaInicio: string; fechaFin: string; referencia: string }) => {
      if (state.useCustomConceptoGrupo && state.customConceptoGrupo.trim()) return state.customConceptoGrupo;
      return [
        state.selectedDescription,
        g.titulo,
        g.fechaInicio && g.fechaFin ? `${fmtDateCsv(g.fechaInicio)} - ${fmtDateCsv(g.fechaFin)}` : "",
        g.referencia ? `Ref: ${g.referencia}` : "",
      ]
        .filter(Boolean)
        .join(" - ");
    },
    [state.useCustomConceptoGrupo, state.customConceptoGrupo, state.selectedDescription],
  );

  const descripcionPorItem = useCallback(
    (it: CfdiFacturableItem) => {
      if (state.useCustomConceptoItem && state.customConceptoItem.trim()) return state.customConceptoItem;
      return [
        state.selectedDescription,
        it.contexto?.titulo,
        it.contexto?.fechaInicio && it.contexto?.fechaFin
          ? `${fmtDateCsv(it.contexto.fechaInicio)} - ${fmtDateCsv(it.contexto.fechaFin)}`
          : "",
        it.contexto?.referencia ? `Ref: ${it.contexto.referencia}` : "",
      ]
        .filter(Boolean)
        .join(" - ");
    },
    [state.useCustomConceptoItem, state.customConceptoItem, state.selectedDescription],
  );

  // ---- Preview (conceptos + totales) ----
  const previewLineas = useMemo(
    () =>
      armarConceptos({
        mode: state.invoiceMode,
        items,
        ivaRate: state.ivaRate,
        isPublicoGeneral,
        descripcionConsolidada,
        descripcionPorGrupo,
        descripcionPorItem,
        descOverrides: state.descOverrides,
      }),
    [
      state.invoiceMode,
      items,
      state.ivaRate,
      isPublicoGeneral,
      descripcionConsolidada,
      descripcionPorGrupo,
      descripcionPorItem,
      state.descOverrides,
    ],
  );

  const previewTotals = useMemo(() => {
    const total = previewLineas.reduce((s, x) => s + (x.Total || 0), 0);
    const base = previewLineas.reduce((s, x) => s + (x.Base || 0), 0);
    const tax = previewLineas.reduce((s, x) => s + (x.Tax || 0), 0);
    return { base, tax, total };
  }, [previewLineas]);

  // ---- Generar payload final ----
  const generar = useCallback(
    async (onGenerar: (payload: CfdiPayload) => Promise<CfdiGeneradoResultado>) => {
      if (!items.length) {
        error("No hay ítems seleccionados para facturar");
        return null;
      }
      if (!state.selectedFiscalData || !receiver) {
        error("Debes seleccionar datos fiscales");
        return null;
      }
      if (!receiver.Rfc || !receiver.TaxZipCode) {
        error("Faltan datos del receptor (RFC / código postal)");
        return null;
      }
      if (!state.selectedCfdiUse || !state.selectedPaymentForm) {
        error("Faltan uso de CFDI o forma de pago");
        return null;
      }

      const payload = buildCfdiPayload({
        mode: state.invoiceMode,
        ivaRate: state.ivaRate,
        items,
        agentId,
        receiver,
        expeditionPlace,
        paymentForm: state.selectedPaymentForm,
        paymentMethod: state.selectedPaymentMethod,
        observations,
        dueDate: state.dueDate,
        datosEmpresa: { rfc: receiver.Rfc, id_empresa: state.selectedFiscalData.id_empresa },
        descripcionConsolidada,
        descripcionPorGrupo,
        descripcionPorItem,
        descOverrides: state.descOverrides,
        globalInformation: isPublicoGeneral
          ? { periodicity: state.periodicity, month: state.month, year: state.year }
          : undefined,
      });

      const errores = preflightCfdi(payload.cfdi.Items, items);
      if (errores.length) {
        error("Totales no coinciden:\n- " + errores.join("\n- "));
        return null;
      }

      const resultado = await onGenerar(payload);
      if (resultado && "id" in resultado) {
        dispatch({ type: "SET_FIELD", field: "resultadoGenerado", value: resultado });
      }
      return payload;
    },
    [
      items,
      state.selectedFiscalData,
      receiver,
      state.selectedCfdiUse,
      state.selectedPaymentForm,
      state.selectedPaymentMethod,
      state.invoiceMode,
      state.ivaRate,
      agentId,
      expeditionPlace,
      observations,
      state.dueDate,
      descripcionConsolidada,
      descripcionPorGrupo,
      descripcionPorItem,
      state.descOverrides,
      isPublicoGeneral,
      state.periodicity,
      state.month,
      state.year,
      error,
    ],
  );

  return {
    // datos fiscales
    fiscalDataList: state.fiscalDataList,
    selectedFiscalData: state.selectedFiscalData,
    setSelectedFiscalData: setters.setSelectedFiscalData,
    loadingFiscalData: state.loadingFiscalData,
    isPublicoGeneral,
    // iva / modo
    ivaRate: state.ivaRate,
    setIvaRate: setters.setIvaRate,
    invoiceMode: state.invoiceMode,
    setInvoiceMode: setters.setInvoiceMode,
    expeditionPlace,
    ivaRateStr,
    // cfdi use / pago
    selectedCfdiUse: state.selectedCfdiUse,
    setSelectedCfdiUse: setters.setSelectedCfdiUse,
    selectedPaymentForm: state.selectedPaymentForm,
    setSelectedPaymentForm: setters.setSelectedPaymentForm,
    selectedPaymentMethod: state.selectedPaymentMethod,
    setSelectedPaymentMethod: setters.setSelectedPaymentMethod,
    // vencimiento / periodicidad
    dueDate: state.dueDate,
    setDueDate: setters.setDueDate,
    minDueDate,
    periodicity: state.periodicity,
    setPeriodicity: setters.setPeriodicity,
    month: state.month,
    setMonth: setters.setMonth,
    year: state.year,
    setYear: setters.setYear,
    // descripciones / observaciones
    selectedDescription: state.selectedDescription,
    setSelectedDescription: setters.setSelectedDescription,
    customDescription: state.customDescription,
    setCustomDescription: setters.setCustomDescription,
    defaultDescription,
    descriptionToUse,
    omitObservations: state.omitObservations,
    setOmitObservations: setters.setOmitObservations,
    // conceptos custom
    useCustomConceptoConsolidada: state.useCustomConceptoConsolidada,
    setUseCustomConceptoConsolidada: setters.setUseCustomConceptoConsolidada,
    customConceptoConsolidada: state.customConceptoConsolidada,
    setCustomConceptoConsolidada: setters.setCustomConceptoConsolidada,
    useCustomConceptoGrupo: state.useCustomConceptoGrupo,
    setUseCustomConceptoGrupo: setters.setUseCustomConceptoGrupo,
    customConceptoGrupo: state.customConceptoGrupo,
    setCustomConceptoGrupo: setters.setCustomConceptoGrupo,
    useCustomConceptoItem: state.useCustomConceptoItem,
    setUseCustomConceptoItem: setters.setUseCustomConceptoItem,
    customConceptoItem: state.customConceptoItem,
    setCustomConceptoItem: setters.setCustomConceptoItem,
    descOverrides: state.descOverrides,
    setDescOverride,
    // preview
    previewLineas,
    previewTotals,
    // resultado
    resultadoGenerado: state.resultadoGenerado,
    // acción
    generar,
  };
}

export type UseCfdiBuilderReturn = ReturnType<typeof useCfdiBuilder>;
