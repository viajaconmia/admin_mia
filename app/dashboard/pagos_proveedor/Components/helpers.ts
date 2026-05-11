import {
  parseNum,
  norm,
  normUpper,
  EPS,
  isZero,
  extractPagosAsociados,
  extractFacturas,
} from "@/helpers/cfdiHelpers";
import { normalizeToArray } from "./dataUtils";

export const getFacturasProveedor = (raw: any): any[] => {
  const facturasHelper = normalizeToArray(extractFacturas(raw));
  const facturasNested = normalizeToArray(raw?.facturas_proveedor?.facturas);
  const facturasDirectas = normalizeToArray(raw?.facturas);
  const facturasPfp = normalizeToArray(raw?.pagos_facturas_proveedores_json);

  return [
    ...facturasHelper,
    ...facturasNested,
    ...facturasDirectas,
    ...facturasPfp,
  ].filter(Boolean);
};

export const getUuidFacturaProveedor = (raw: any): string => {
  const facturas = getFacturasProveedor(raw);
  const uuidsFromList = normalizeToArray(raw?.facturas_proveedor?.uuids_facturas);
  const all = [
    ...facturas.map((f: any) => f?.uuid_factura || f?.uuid_cfdi || f?.uuid),
    ...uuidsFromList,
    raw?.facturas_proveedor?.uuid_factura_principal,
    raw?.uuid_factura,
    raw?.uuid_cfdi,
  ]
    .filter(Boolean)
    .map((u: any) => String(u).trim().toUpperCase());
  return [...new Set(all)].join(", ");
};

export const getMontoSolicitado = (raw: any) =>
  parseNum(raw?.solicitud_proveedor?.monto_solicitado ?? raw?.monto_solicitado);

export const getSaldo = (raw: any) =>
  parseNum(raw?.solicitud_proveedor?.saldo ?? raw?.saldo);

export const getComentarioSistema = (raw: any) =>
  String(
    raw?.comentario_sistema ??
      raw?.solicitud_proveedor?.comentario_sistema ??
      raw?.solicitud_proveedor?.comentario_ajuste ??
      raw?.comentario_ajuste ??
      raw?.solicitud_proveedor?.comentarios ??
      "",
  ).trim();

export const getFormaPago = (raw: any) =>
  norm(
    raw?.solicitud_proveedor?.forma_pago_solicitada ??
      raw?.forma_pago_solicitada,
  );

export const getIdSolProv = (raw: any, index?: number) =>
  String(
    raw?.solicitud_proveedor?.id_solicitud_proveedor ??
      raw?.id_solicitud_proveedor ??
      index ??
      "",
  ).trim();

export const getTotalFacturadoLike = (raw: any) => {
  const direct = parseNum(
    (raw as any)?.total_facturado ??
      (raw as any)?.monto_facturado ??
      (raw as any)?.total_facturado_en_pfp,
  );
  if (direct > 0) return direct;

  const facturas = getFacturasProveedor(raw);
  if (!facturas.length) return 0;
  return facturas.reduce(
    (acc, f) =>
      acc + parseNum(f?.monto_facturado ?? f?.total ?? f?.importe ?? 0),
    0,
  );
};

export const isPagado = (raw: any) => {
  const saldo = getSaldo(raw);
  const estatus = norm(raw?.estatus_pagos ?? "");
  if (estatus === "pagado") return true;
  if (isZero(saldo)) return true;

  const montoSolicitado = getMontoSolicitado(raw);
  const pagos = extractPagosAsociados(raw);
  const totalPagado = pagos.reduce(
    (acc, p) => acc + parseNum(p?.monto_pagado ?? 0),
    0,
  );
  if (montoSolicitado > 0 && totalPagado >= montoSolicitado - EPS) return true;
  return false;
};

export const getPagoInfoFromRaw = (raw: any) => {
  const pagos = extractPagosAsociados(raw)
    .slice()
    .sort((a, b) => {
      const da = new Date(a.fecha_pago || a.creado_en || 0).getTime();
      const db = new Date(b.fecha_pago || b.creado_en || 0).getTime();
      return db - da;
    });

  const pendientePago = getSaldo(raw);
  const montoSolicitado = getMontoSolicitado(raw);
  const totalPagado = pagos.reduce(
    (acc, p) => acc + parseNum(p.monto_pagado ?? 0),
    0,
  );

  const fechas = pagos
    .map((p) => p.fecha_pago || p.creado_en)
    .filter(Boolean)
    .map((f) => new Date(f));

  const fechaUltimoPago = fechas.length
    ? new Date(Math.max(...fechas.map((d) => d.getTime()))).toISOString()
    : "";

  let estado_pago = "";
  if (isZero(pendientePago)) estado_pago = "Pagado";
  else if (!isZero(pendientePago) && !isZero(montoSolicitado) && pendientePago !== montoSolicitado)
    estado_pago = "Parcial";
  else estado_pago = "Pendiente";

  return { estado_pago, totalPagado, fechaUltimoPago, pendientePago };
};

export const getFacturaInfoFromRaw = (raw: any) => {
  const montoSolicitado = getMontoSolicitado(raw);
  const totalFacturado = getTotalFacturadoLike(raw);
  const porFacturar = Math.max(0, montoSolicitado - totalFacturado);

  let estado: "parcial" | "facturado" | "pendiente" | "sin factura" = "sin factura";
  if (montoSolicitado > 0) {
    if (porFacturar <= EPS) estado = "facturado";
    else if (totalFacturado > EPS) estado = "parcial";
    else estado = "pendiente";
  }

  const facturas = getFacturasProveedor(raw);
  const uuid = getUuidFacturaProveedor(raw);
  const facturaPrincipal = facturas?.[0] ?? null;

  const fechas = facturas
    .map((f) => f.fecha_factura || f.fecha_emision || f.created_at)
    .filter(Boolean)
    .map((f) => new Date(f));

  const fechaUltimaFactura = fechas.length
    ? new Date(Math.max(...fechas.map((d) => d.getTime()))).toISOString()
    : "";

  return { estado, totalFacturado, porFacturar, fechaUltimaFactura, uuid, facturaPrincipal };
};

export const getEstadoSolicitudPagado = (
  raw: any,
  categoria: string,
): "PAGADO TARJETA" | "PAGADO TRANSFERENCIA" | "PAGADO LINK" | null => {
  const estadoActual = normUpper(
    raw?.solicitud_proveedor?.estado_solicitud ?? raw?.estado_solicitud ?? "",
  );

  if (
    estadoActual === "PAGADO TARJETA" ||
    estadoActual === "PAGADO TRANSFERENCIA" ||
    estadoActual === "PAGADO LINK"
  ) {
    return estadoActual;
  }

  const forma = norm(
    raw?.solicitud_proveedor?.forma_pago_solicitada ??
      raw?.forma_pago_solicitada ??
      "",
  );

  if (categoria === "pago_link" || forma === "link") return "PAGADO LINK";
  if (categoria === "pago_tdc" || forma === "card") return "PAGADO TARJETA";
  if (categoria === "spei" || forma === "transfer") return "PAGADO TRANSFERENCIA";
  return null;
};

export const getConciliacionInfo = (raw: any) => {
  const pagoInfo = getPagoInfoFromRaw(raw);
  const facturaInfo = getFacturaInfoFromRaw(raw);

  const totalPagado = Number(pagoInfo?.totalPagado ?? 0);
  const totalFacturado = Number(facturaInfo?.totalFacturado ?? 0);
  const diferencia = Math.abs(totalPagado - totalFacturado);

  return { totalPagado, totalFacturado, diferencia, puedeConciliar: diferencia < 20 };
};

export const getProveedorCuentas = (raw: any) => {
  const cuentas = normalizeToArray(
    raw?.cuentas_proveedor ??
      raw?.proveedor?.cuentas ??
      raw?.proveedor?.cuentas_proveedor ??
      [],
  );
  return cuentas.filter(
    (c) => c && typeof c === "object" && Object.keys(c).length > 0,
  );
};
