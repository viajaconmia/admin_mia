import {
  IvaRate,
  PRODUCT_CODE_DEFAULT,
  PRODUCT_CODE_PUBLICO_GENERAL,
  RFC_GENERICO,
  UNIT_CODE,
  UNIT_LABEL,
} from "./constants";
import { groupByRelacion, round2, sortByDateAsc, splitIva } from "./calculos";

/** Ítem genérico a facturar. Lo arma quien use el componente (reservas,
 * pagos, comisiones...) — el builder del CFDI no sabe de dónde viene. */
export type CfdiFacturableItem = {
  id_item: string;
  /** Agrupador del origen (id_booking / id_pago / id_comision...). */
  id_origen: string;
  /** Agrupador para el modo "detallada_por_grupo" (ej. id_hospedaje). Si no
   * viene, cada ítem forma su propio grupo junto con los demás de su origen. */
  id_relacion?: string | null;
  id_solicitud?: string;
  total: number;
  fecha_uso?: string;
  contexto?: {
    /** Hotel, concepto de pago, concepto de comisión, etc. */
    titulo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    /** Viajero, agente, o lo que aplique como referencia humana. */
    referencia?: string;
  };
};

export type EmpresaDatosFiscales = {
  id_empresa: string;
  id_datos_fiscales: number;
  rfc: string;
  razon_social_df: string;
  calle: string;
  colonia: string;
  estado: string;
  municipio: string;
  codigo_postal_fiscal: string;
  regimen_fiscal: string;
  id_agente?: string;
};

export type InvoiceMode = "consolidada" | "detallada_por_grupo" | "detallada_por_item";

export type CfdiReceiver = {
  Name: string;
  CfdiUse: string;
  Rfc: string;
  FiscalRegime: string;
  TaxZipCode: string;
};

export type CfdiTax = {
  Name: string;
  Rate: string;
  Total: string;
  Base: string;
  IsRetention: string;
  IsFederalTax: string;
};

export type CfdiConcepto = {
  Quantity: string;
  ProductCode: string;
  UnitCode: string;
  Unit: string;
  Description: string;
  UnitPrice: string;
  Subtotal: string;
  TaxObject: string;
  Taxes: CfdiTax[];
  Total: string;
};

export type CfdiItemFacturado = {
  id_item: string;
  monto: number;
  id_servicio: string;
  id_relacion: string | null;
};

export type CfdiPayload = {
  cfdi: {
    Receiver: CfdiReceiver;
    CfdiType: string;
    NameId: string;
    Observations: string;
    ExpeditionPlace: string;
    Serie: null;
    Folio: number;
    PaymentForm: string;
    PaymentMethod: string;
    Exportation: string;
    Currency: string;
    Date: string;
    Items: CfdiConcepto[];
    GlobalInformation?: { Periodicity: string; Months: string; Year: string };
  };
  info_user: {
    fecha_vencimiento: string;
    id_user: string;
    id_solicitud: string[];
    datos_empresa: { rfc: string; id_empresa: string };
    items_facturados: CfdiItemFacturado[];
    addenda: string;
    addenda_type: string;
    invoice_mode: InvoiceMode;
    iva_rate: string;
  };
  items_facturados: CfdiItemFacturado[];
};

/** Lo que se espera que devuelva quien implemente `onGenerar` una vez que
 * llamó a su propio endpoint de creación de CFDI. Pensado para que, en una
 * fase futura, el componente pueda usar el `id` para ofrecer descarga de
 * PDF/XML — no se construye esa UI todavía, solo se deja el contrato listo. */
export type CfdiGeneradoResultado = { id: string } | void;

const sanitizeFacturamaText = (s: string, max = 1000) =>
  (s ?? "")
    .toString()
    .replace(/\|/g, " - ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);

export type CfdiPreviewLinea = {
  key: string;
  ProductCode: string;
  UnitCode: string;
  Unit: string;
  Quantity: string;
  Description: string;
  Base: number;
  TaxRate: string;
  Tax: number;
  Total: number;
};
type PreviewLineaBase = CfdiPreviewLinea;

type ArmarConceptosParams = {
  mode: InvoiceMode;
  items: CfdiFacturableItem[];
  ivaRate: IvaRate;
  isPublicoGeneral: boolean;
  descripcionConsolidada: string;
  descripcionPorGrupo: (grupo: { titulo: string; fechaInicio: string; fechaFin: string; referencia: string }) => string;
  descripcionPorItem: (item: CfdiFacturableItem) => string;
  descOverrides?: Record<string, string>;
};

/** Arma las líneas del CFDI (conceptos) según el modo de facturación.
 * Se usa tanto para el preview como para el payload final. */
export const armarConceptos = ({
  mode,
  items,
  ivaRate,
  isPublicoGeneral,
  descripcionConsolidada,
  descripcionPorGrupo,
  descripcionPorItem,
  descOverrides = {},
}: ArmarConceptosParams): PreviewLineaBase[] => {
  const QTY_ONE = "1";
  const productCode = isPublicoGeneral ? PRODUCT_CODE_PUBLICO_GENERAL : PRODUCT_CODE_DEFAULT;
  const ivaRateStr = ivaRate.toFixed(6);

  if (!items.length) return [];

  if (mode === "consolidada") {
    const totalFacturado = round2(items.reduce((s, it) => s + it.total, 0));
    const { subtotal, iva, total } = splitIva(totalFacturado, ivaRate);
    const key = "consolidada-1";

    return [
      {
        key,
        ProductCode: productCode,
        UnitCode: UNIT_CODE,
        Unit: UNIT_LABEL,
        Quantity: QTY_ONE,
        Description: descOverrides[key] ?? sanitizeFacturamaText(descripcionConsolidada, 1000),
        Base: subtotal,
        TaxRate: ivaRateStr,
        Tax: iva,
        Total: total,
      },
    ];
  }

  if (mode === "detallada_por_grupo") {
    return groupByRelacion(items).map((g) => {
      const { subtotal, iva, total } = splitIva(round2(g.total), ivaRate);
      const key = `grupo-${g.key}`;

      return {
        key,
        ProductCode: productCode,
        UnitCode: UNIT_CODE,
        Unit: UNIT_LABEL,
        Quantity: QTY_ONE,
        Description: descOverrides[key] ?? descripcionPorGrupo(g),
        Base: subtotal,
        TaxRate: ivaRateStr,
        Tax: iva,
        Total: total,
      };
    });
  }

  // detallada_por_item
  return items.map((it) => {
    const { subtotal, iva, total } = splitIva(round2(it.total), ivaRate);
    const key = `item-${it.id_item}`;

    return {
      key,
      ProductCode: productCode,
      UnitCode: UNIT_CODE,
      Unit: UNIT_LABEL,
      Quantity: QTY_ONE,
      Description: descOverrides[key] ?? descripcionPorItem(it),
      Base: subtotal,
      TaxRate: ivaRateStr,
      Tax: iva,
      Total: total,
    };
  });
};

const lineaToConcepto = (linea: PreviewLineaBase, ivaRateStr: string): CfdiConcepto => ({
  Quantity: linea.Quantity,
  ProductCode: linea.ProductCode,
  UnitCode: linea.UnitCode,
  Unit: linea.Unit,
  Description: linea.Description,
  UnitPrice: linea.Base.toFixed(2),
  Subtotal: linea.Base.toFixed(2),
  TaxObject: "02",
  Taxes: [
    {
      Name: "IVA",
      Rate: ivaRateStr,
      Total: linea.Tax.toFixed(2),
      Base: linea.Base.toFixed(2),
      IsRetention: "false",
      IsFederalTax: "true",
    },
  ],
  Total: linea.Total.toFixed(2),
});

/** Addenda: bitácora informativa (no la valida Facturama) con el detalle de
 * los orígenes facturados. Se agrupa por `id_origen` (antes "reserva"). */
const buildAddenda = (
  items: CfdiFacturableItem[],
  ivaRate: IvaRate,
  dueDate: string,
  observations: string,
) => {
  const porOrigen = new Map<string, CfdiFacturableItem[]>();
  for (const it of items) {
    if (!porOrigen.has(it.id_origen)) porOrigen.set(it.id_origen, []);
    porOrigen.get(it.id_origen)!.push(it);
  }

  const elementos = Array.from(porOrigen.entries()).map(([id_origen, itemsOrigen]) => {
    const total = round2(itemsOrigen.reduce((s, it) => s + it.total, 0));
    const { subtotal, iva, total: t } = splitIva(total, ivaRate);
    const primero = itemsOrigen[0];

    return {
      id_origen,
      titulo: primero?.contexto?.titulo,
      fecha_inicio: primero?.contexto?.fechaInicio,
      fecha_fin: primero?.contexto?.fechaFin,
      referencia: primero?.contexto?.referencia,
      cantidad_items: itemsOrigen.length,
      items: itemsOrigen.map((it) => ({
        id_item: it.id_item,
        fecha_uso: it.fecha_uso,
        total: it.total,
      })),
      totales: { subtotal, iva, total: t },
    };
  });

  const total = round2(elementos.reduce((s, e) => s + e.totales.total, 0));
  const { subtotal, iva } = splitIva(total, ivaRate);

  return {
    version: "1.0",
    source: "Noktos",
    generated_at: new Date().toISOString(),
    due_date: dueDate,
    cfdi_observations: observations,
    iva_rate: ivaRate.toFixed(6),
    elementos,
    totales_globales: { subtotal, iva, total },
  };
};

export type BuildCfdiPayloadParams = {
  mode: InvoiceMode;
  ivaRate: IvaRate;
  items: CfdiFacturableItem[];
  agentId: string;
  receiver: CfdiReceiver;
  expeditionPlace: string;
  paymentForm: string;
  paymentMethod: string;
  observations: string;
  dueDate: string;
  datosEmpresa: { rfc: string; id_empresa: string };
  descripcionConsolidada: string;
  descripcionPorGrupo: ArmarConceptosParams["descripcionPorGrupo"];
  descripcionPorItem: ArmarConceptosParams["descripcionPorItem"];
  descOverrides?: Record<string, string>;
  globalInformation?: { periodicity: string; month: string; year: string };
};

/** Arma el payload `{cfdi, info_user}` — mismo shape que hoy consume
 * `crearCfdi` (POST /mia/factura/combinada). No hace red: quien implemente
 * `onGenerar` decide a qué endpoint mandarlo. */
export const buildCfdiPayload = ({
  mode,
  ivaRate,
  items,
  agentId,
  receiver,
  expeditionPlace,
  paymentForm,
  paymentMethod,
  observations,
  dueDate,
  datosEmpresa,
  descripcionConsolidada,
  descripcionPorGrupo,
  descripcionPorItem,
  descOverrides = {},
  globalInformation,
}: BuildCfdiPayloadParams): CfdiPayload => {
  const isPublicoGeneral = receiver.Rfc === RFC_GENERICO;
  const ivaRateStr = ivaRate.toFixed(6);

  const itemsOrdenados = sortByDateAsc(items, "fecha_uso");

  const conceptos = armarConceptos({
    mode,
    items: itemsOrdenados,
    ivaRate,
    isPublicoGeneral,
    descripcionConsolidada,
    descripcionPorGrupo,
    descripcionPorItem,
    descOverrides,
  });

  const cfdiItems: CfdiConcepto[] = conceptos.map((l) => lineaToConcepto(l, ivaRateStr));

  const itemsFacturados: CfdiItemFacturado[] = itemsOrdenados.map((it) => ({
    id_item: it.id_item,
    monto: it.total,
    id_servicio: it.id_origen,
    id_relacion: it.id_relacion ?? null,
  }));

  const now = new Date();
  now.setHours(now.getHours() - 6);
  const formattedDate = now.toISOString().split(".")[0];

  const addenda = buildAddenda(itemsOrdenados, ivaRate, dueDate, observations);

  const cfdi: CfdiPayload["cfdi"] = {
    Receiver: receiver,
    CfdiType: "I",
    NameId: "1",
    Observations: observations,
    ExpeditionPlace: expeditionPlace,
    Serie: null,
    Folio: Math.round(Math.random() * 999999999),
    PaymentForm: paymentForm,
    PaymentMethod: paymentMethod,
    Exportation: "01",
    Currency: "MXN",
    Date: formattedDate,
    Items: cfdiItems,
  };

  if (isPublicoGeneral && globalInformation) {
    cfdi.GlobalInformation = {
      Periodicity: globalInformation.periodicity,
      Months: globalInformation.month,
      Year: globalInformation.year,
    };
  }

  return {
    cfdi,
    info_user: {
      fecha_vencimiento: dueDate,
      id_user: agentId,
      id_solicitud: Array.from(
        new Set(itemsOrdenados.map((it) => it.id_solicitud).filter((v): v is string => !!v)),
      ),
      datos_empresa: datosEmpresa,
      items_facturados: itemsFacturados,
      addenda: JSON.stringify(addenda),
      addenda_type: "Noktos",
      invoice_mode: mode,
      iva_rate: ivaRateStr,
    },
    items_facturados: itemsFacturados,
  };
};
