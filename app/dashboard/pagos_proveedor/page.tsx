"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Filters from "@/components/Filters";
import { VistaCarpeta, CarpetasTabs } from "./Components/CarpetasTabs";
import { extractFacturas, hasPagosAsociados } from "@/helpers/cfdiHelpers";
import { EditModal } from "./Components/EditModal";
import { createSolicitudesRenderers } from "./Components/renders";
import ModalDetalle from "@/app/dashboard/conciliacion/detalles";
import { calcularNoches, formatRoom } from "@/helpers/utils";
import { Table5 } from "@/components/Table5";
import { SolicitudProveedor, TypeFilters } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { OtrosMetodosPagoModal } from "./Components/OtrosMetodosPagoModal";
import {
  DispersionModal,
  SolicitudProveedorRaw,
} from "./Components/dispersion";
import { ComprobanteModal } from "./Components/comprobantes";
import { useAlert } from "@/context/useAlert";
import Button from "@/components/atom/Button";
import { Brush, File, Upload } from "lucide-react";
import { defaultSort } from "@/constant/solicitudConstants";
import {
  SolicitudSeleccionadaComprobante,
  ItemSolicitud,
} from "./Components/types";
import {
  getIdSolProv,
  getFormaPago,
  getMontoSolicitado,
  getSaldo,
  getPagoInfoFromRaw,
  getFacturaInfoFromRaw,
  getComentarioSistema,
  isPagado,
  getEstadoSolicitudPagado,
  getConciliacionInfo,
  getProveedorCuentas,
} from "./Components/helpers";
import {
  pagoTone3,
  facturaTone,
  getSolicitudSemaforoRowClass,
} from "./Components/uiHelpers";
import { useSolicitudesPago } from "./hooks/useSolicitudesPago";
import { useSeleccion } from "./hooks/useSeleccion";
import { usePatchSolicitud } from "./hooks/usePatchSolicitud";
import { formatNumberWithCommas } from "@/helpers/formater";

function App() {
  const { showNotification } = useAlert();
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.PROVEEDOR_PAGOS);

  const {
    counts,
    bucketData,
    fetchBucket,
    loading,
    filters,
    setFilters,
    limiteInput,
    setLimiteInput,
    pag,
    setPag,
    metaPag,
  } = useSolicitudesPago();

  const [showDispersionModal, setShowDispersionModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [showComprobanteModal2, setShowComprobanteModal2] = useState(false);
  const [solicitudesSeleccionadasModal, setSolicitudesSeleccionadasModal] =
    useState<SolicitudProveedorRaw[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoria, setCategoria] = useState<VistaCarpeta>("all");
  const [solicitudDetalle, setSolicitudDetalle] = useState<string | null>(null);

  // Carga perezosa: al cambiar de tab o de filtros trae solo ese bucket
  useEffect(() => {
    fetchBucket(categoria, filters, Number(limiteInput) || 50, pag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, filters]);

  // Callback compatible con usePatchSolicitud y los modales
  const handleFetchCurrentBucket = useCallback(
    (filtersArg?: TypeFilters, limiteArg?: number | null, pagArg?: number) => {
      fetchBucket(
        categoria,
        filtersArg ?? filters,
        limiteArg !== undefined ? limiteArg : Number(limiteInput) || 50,
        pagArg ?? pag,
      );
    },
    [categoria, filters, limiteInput, pag, fetchBucket],
  );

  // ------- Lista base por carpeta -------
  const baseList = useMemo<SolicitudProveedor[]>(() => {
    if (categoria === "all") return (bucketData as any).todos ?? [];
    return (bucketData as any)[categoria] ?? [];
  }, [bucketData, categoria]);

  // Debounce búsqueda
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 220);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // PASO 1 — mapeo pesado, solo corre cuando cambia baseList
  const mappedSolicitudes = useMemo(
    () =>
      baseList.map((raw) => {
        const item = raw as ItemSolicitud;
        const id_solicitud_proveedor = getIdSolProv(item);
        const forma = getFormaPago(item);
        const montoSolicitado = getMontoSolicitado(item);
        const saldo = getSaldo(item);
        const pagoInfo = getPagoInfoFromRaw(item);
        const facInfo = getFacturaInfoFromRaw(item);
        const _searchHotel = (item.hotel || "").toUpperCase();
        const _searchAgente = (item.agente || "").toUpperCase();
        const _searchViajero = (
          item.nombre_viajero_completo ||
          item.nombre_viajero ||
          ""
        ).toUpperCase();
        const _searchId = String(
          (item as any)?.solicitud_proveedor?.id_solicitud_proveedor ?? "",
        ).toUpperCase();
        const _searchFolio = (item.codigo_confirmacion || "").toUpperCase();
        const _searchUuid = extractFacturas(item)
          .map((f: any) =>
            (f?.uuid_factura || f?.uuid_cfdi || f?.uuid || "").toUpperCase(),
          )
          .filter(Boolean)
          .join(" ");

        return {
          serv: item.tipo_reserva,
          id_solicitud_proveedor,
          fecha_de_pago: item.solicitud_proveedor?.fecha_solicitud,
          dias_vencimiento_pago: (item as any).dias_vencimiento_factura ?? null,
          monto_solicitado: montoSolicitado,
          saldo,
          forma_pago_solicitada: forma,
          id_tarjeta_solicitada:
            item?.solicitud_proveedor?.id_tarjeta_solicitada ?? null,
          usuario_solicitante:
            item?.solicitud_proveedor?.usuario_solicitante ?? "",
          usuario_generador: item?.solicitud_proveedor?.usuario_generador ?? "",
          comentarios_sp: item?.solicitud_proveedor?.comentarios ?? "",
          notas_internas:
            item?.solicitud_proveedor?.notas_internas ??
            (item as any)?.notas_internas ??
            "",
          comentarios_Ap:
            item?.solicitud_proveedor?.comentarios_Ap ??
            (item as any)?.comentario_AP ??
            (item as any)?.comentarios_Ap ??
            (item as any)?.comentarios_ap ??
            "",
          estado_solicitud: item?.solicitud_proveedor?.estado_solicitud ?? "",
          estado_facturacion:
            item?.solicitud_proveedor?.estado_facturacion ?? "",
          estatus_pagos: item?.estatus_pagos ?? "",
          comentario_sistema: getComentarioSistema(item),
          seleccionar: "",
          carpeta: categoria,
          facturas_acciones: "",
          codigo_confirmacion:
            item.codigo_confirmacion || item.id_confirmacion || "",
          creado: item.created_at,
          proveedor: (item.hotel || "").toUpperCase(),
          intermediario: (item.intermediario || "").toUpperCase(),
          razon_social: item.proveedor?.razon_social,
          rfc: item.proveedor?.rfc,
          viajero: (
            item.nombre_viajero_completo ||
            item.nombre_viajero ||
            ""
          ).toUpperCase(),
          check_in: item.check_in,
          check_out: item.check_out,
          noches: calcularNoches(item.check_in, item.check_out),
          habitacion: formatRoom(item.room),
          costo_proveedor: formatNumberWithCommas(
            Number((item as any).costo_total) || 0,
          ),
          markup:
            ((Number(item.total || 0) -
              Number((item as any).costo_total || 0)) /
              Number(item.total || 0)) *
            100,
          precio_de_venta: formatNumberWithCommas(parseFloat(item.total)),
          metodo_de_pago: item.id_credito ? "credito" : "contado",
          etapa_reservacion: item.estado_reserva,
          estado: item.status,
          reservante: item.id_usuario_generador ? "Cliente" : "Operaciones",
          id_cliente: item.id_agente,
          cliente: (item.agente || "").toUpperCase(),
          forma_de_pago_solicitada:
            item.solicitud_proveedor?.forma_pago_solicitada,
          digitos_tajeta: item.tarjeta?.ultimos_4,
          banco: item.tarjeta?.banco_emisor,
          tipo_tarjeta: item.tarjeta?.tipo_tarjeta,
          comentarios_cxp:
            (item as any).comentario_CXP ?? (item as any).comments_cxp ?? "",
          estado_pago: pagoInfo.estado_pago,
          pendiente_a_pagar: pagoInfo.pendientePago,
          monto_pagado_proveedor: pagoInfo.totalPagado,
          fecha_pagado: pagoInfo.fechaUltimoPago,
          estado_factura_proveedor: facInfo.estado,
          total_facturado: facInfo.totalFacturado,
          monto_por_facturar: facInfo.porFacturar,
          fecha_facturacion: facInfo.fechaUltimaFactura,
          UUID: facInfo.uuid,
          uso_cfdi_factura: "",
          forma_pago_factura: "",
          metodo_pago_factura: "",
          moneda_factura: "",
          acciones: "",
          item: raw,
          _searchHotel,
          _searchAgente,
          _searchViajero,
          _searchId,
          _searchFolio,
          _searchUuid,
        };
      }),
    [baseList, categoria],
  );

  // PASO 2 — filtro rápido por búsqueda
  const formatedSolicitudes = useMemo(() => {
    if (!debouncedSearch) return mappedSolicitudes;
    const q = debouncedSearch.toUpperCase();
    return mappedSolicitudes.filter(
      (item) =>
        item._searchHotel.includes(q) ||
        item._searchAgente.includes(q) ||
        item._searchViajero.includes(q) ||
        item._searchId.includes(q) ||
        item._searchFolio.includes(q) ||
        item._searchUuid.includes(q),
    );
  }, [mappedSolicitudes, debouncedSearch]);

  const registrosVisibles = formatedSolicitudes;

  const {
    solicitud,
    setSolicitud,
    selectedSolicitudesMap,
    setSelectedSolicitudesMap,
    setDatosDispersion,
    clearSelection,
    seleccionables,
    allSelected,
    handleSelectAll,
  } = useSeleccion(registrosVisibles, categoria);

  const {
    editModal,
    setEditModal,
    openEditModal,
    closeEditModal,
    saveEditModal,
    patchSolicitudProveedor,
    patchSolicitudProveedorFields,
    marcarSolicitudPagada,
    cancelSolicitud,
    conciliarSolicitud,
    cancelarDispersion,
    marcarNotificadoPagado,
  } = usePatchSolicitud(categoria, clearSelection, handleFetchCurrentBucket);

  const selectedCount = solicitud.length;
  const canSelect = categoria !== "pagada" && categoria !== "canceladas";

  const selectedHasDispersion = useMemo(
    () =>
      solicitud.some((r: any) => {
        const estado = String(
          r?.solicitud_proveedor?.estado_solicitud ?? r?.estado_solicitud ?? "",
        ).toUpperCase();
        return estado === "DISPERSION" || estado === "DISPERSADO";
      }),
    [solicitud],
  );

  const canDispersion =
    canSelect && selectedCount > 0 && !selectedHasDispersion;
  const canUploadComprobante = selectedHasDispersion;

  const solicitudesSeleccionadasComprobante = useMemo<
    SolicitudSeleccionadaComprobante[]
  >(
    () =>
      solicitud
        .map((raw) => {
          const id_solicitud_proveedor = getIdSolProv(raw);
          const monto_solicitado = getMontoSolicitado(raw);
          const anyRaw = raw as any;
          const codigo_confirmacion =
            anyRaw?.codigo_confirmacion ??
            anyRaw?.item?.codigo_confirmacion ??
            anyRaw?.id_confirmacion ??
            anyRaw?.item?.id_confirmacion ??
            null;
          return {
            id_solicitud_proveedor,
            monto_solicitado,
            monto_pagado: Number(monto_solicitado || 0).toFixed(2),
            codigo_confirmacion,
          };
        })
        .filter((row) => row.id_solicitud_proveedor),
    [solicitud],
  );

  const dispersionDisabledReason =
    categoria === "pagada"
      ? "En carpeta pagada no se puede generar dispersión"
      : categoria === "canceladas"
        ? "En carpeta canceladas no se puede generar dispersión"
        : selectedCount === 0
          ? "Selecciona al menos 1 solicitud"
          : "";

  const clearDisabledReason =
    !canSelect || selectedCount === 0 ? "No hay selección para limpiar" : "";

  const handleDispersion = () => {
    if (!solicitud.length) {
      showNotification(
        "info",
        "No hay solicitudes seleccionadas para dispersión",
      );
      return;
    }

    const idsProveedor = [
      ...new Set(
        solicitud
          .map((s) => {
            const anyS = s as any;
            return String(anyS.id_proveedor ?? anyS.proveedor?.id ?? "").trim();
          })
          .filter(Boolean),
      ),
    ];

    if (idsProveedor.length > 1) {
      showNotification(
        "error",
        `No se puede dispersar: las solicitudes pertenecen a proveedores distintos (IDs: ${idsProveedor.join(", ")}). Selecciona solo solicitudes del mismo proveedor.`,
      );
      return;
    }

    const seleccion = solicitud.map((s) => {
      const anyS = s as any;
      const cuentasProveedor = getProveedorCuentas(s);
      const cuentaDefault = cuentasProveedor[0] ?? null;
      const idProveedor = anyS.id_proveedor ?? anyS.proveedor?.id ?? null;

      return {
        id_solicitud: anyS.id_solicitud ?? anyS.id ?? "",
        id_pago: anyS.id_pago ?? null,
        id_proveedor: idProveedor,
        hotel: s.hotel ?? null,
        codigo_reservacion_hotel: s.codigo_reservacion_hotel ?? null,
        codigo_confirmacion:
          (s as any).codigo_confirmacion ?? (s as any).id_confirmacion ?? null,
        costo_total:
          s.costo_total ?? s.solicitud_proveedor?.monto_solicitado ?? "0",
        check_out: s.check_out ?? null,
        codigo_dispersion: anyS.codigo_dispersion ?? null,
        cuentas_proveedor: cuentasProveedor,
        cuenta_de_deposito:
          anyS.cuenta_de_deposito ?? cuentaDefault?.cuenta ?? null,
        tipo_cuenta:
          anyS.tipo_cuenta ??
          (cuentaDefault?.cuenta?.length === 18 ? "Cta Clabe" : "Cta"),
        clave_proveedor: idProveedor != null ? String(idProveedor) : null,
        solicitud_proveedor: s.solicitud_proveedor
          ? {
              id_solicitud_proveedor:
                s.solicitud_proveedor.id_solicitud_proveedor,
              fecha_solicitud: s.solicitud_proveedor.fecha_solicitud ?? null,
              monto_solicitado: s.solicitud_proveedor.monto_solicitado ?? null,
              saldo: (s.solicitud_proveedor as any)?.saldo ?? null,
            }
          : null,
        razon_social: s.proveedor?.razon_social ?? null,
        rfc: s.proveedor?.rfc ?? null,
      } as SolicitudProveedorRaw;
    });

    console.group("📌 Elementos seleccionados antes de mandarse");
    seleccion.forEach((item, index) => {
      console.log(`Elemento seleccionado #${index + 1}:`, item);
    });
    console.table(
      seleccion.map((item) => ({
        id_solicitud: item.id_solicitud,
        id_solicitud_proveedor: item.id_solicitud_proveedor,
        hotel: item.hotel,
        monto: item.costo_total,
        razon_social: item.razon_social,
        rfc: item.rfc,
        cuenta: item.cuenta_de_deposito,
      })),
    );
    console.groupEnd();

    setSolicitudesSeleccionadasModal(seleccion);
    setShowDispersionModal(true);
  };

  const handleCsv = () => setShowComprobanteModal(true);
  const handleCsvnospei = () => setShowComprobanteModal2(true);

  const customColumns = useMemo(() => {
    const cols = [
      "serv",
      "id_solicitud_proveedor", // ID SOLICITUD PROVEEDOR
      "creado", // CREADO
      "monto_solicitado", // MONTO SOLICITADO
      "saldo", // SALDO
      "fecha_de_pago", // FECHA PROVISION CxP
      ...(categoria === "ap_credito" ? ["dias_vencimiento_pago"] : []), // FECHA PROVISION CxP
      "estado_solicitud", // ESTADO SOLICITUD
      "cliente", // CLIENTE
      "codigo_confirmacion", // CODIGO CONFIRMACION
      "proveedor", // PROVEEDOR
      "intermediario",
      "razon_social", // RAZON SOCIAL
      "viajero", // VIAJERO
      "check_in", // CHECK IN
      "check_out", // CHECK OUT
      "noches", // NOCHES
      "habitacion", // HABITACION
      "costo_proveedor", // COSTO PROVEEDOR
      "markup", // MARKUP
      "precio_de_venta", // PRECIO DE VENTA
      "estatus_pagos", // ESTATUS PAGOS
      "seleccionar", // SELECCIONAR
      "metodo_de_pago", // METODO DE PAGO
      "etapa_reservacion", // ETAPA RESERVACION
      "estado", // ESTADO
      "comentarios_sp", // COMENTARIOS SP
      "notas_internas", // NOTAS INTERNAS
      "comentarios_Ap", // COMENTARIOS FIN
      "comentarios_cxp", // COMENTARIOS CXP
      "rfc", // RFC
      "facturas_acciones", // FACTURAS ACCIONES
      "forma_pago_solicitada", // FORMA PAGO SOLICITADA
      "digitos_tajeta", // DIGITOS TAJETA
      "banco", // BANCO
      "tipo_tarjeta", // TIPO TARJETA
      "pendiente_a_pagar", // PENDIENTE A PAGAR
      "monto_pagado_proveedor", // MONTO PAGADO PROVEEDOR
      "fecha_pagado", // FECHA PAGADO
      "estado_factura_proveedor", // ESTADO FACTURA PROVEEDOR
      "total_facturado", // TOTAL FACTURADO
      "monto_por_facturar", // MONTO POR FACTURAR
      "fecha_facturacion", // FECHA FACTURACION
      "UUID", // UUID
      "uso_cfdi_factura", // USO CFDI FACTURA
      "forma_pago_factura", // FORMA PAGO FACTURA
      "metodo_pago_factura", // METODO PAGO FACTURA
      "moneda_factura", // MONEDA FACTURA
      "id_cliente", // ID CLIENTE
      "id_tarjeta_solicitada", // ID TARJETA SOLICITADA
      "usuario_solicitante", // USUARIO SOLICITANTE
      "usuario_generador", // USUARIO GENERADOR
      "estado_facturacion", // ESTADO FACTURACION
      "carpeta", // CARPETA
      "reservante", // RESERVANTE
      "forma_de_pago_solicitada", // FORMA DE PAGO SOLICITADA
      "estado_pago", // ESTADO PAGO
    ];
    if (categoria === "notificados") cols.push("comentario_sistema");
    cols.push("acciones");
    return cols;
  }, [categoria]);

  const renderers = useMemo(
    () =>
      createSolicitudesRenderers({
        categoria,
        selectedSolicitudesMap,
        setSelectedSolicitudesMap,
        setSolicitud,
        setDatosDispersion,
        getIdSolProv,
        getFormaPago,
        getSaldo,
        isPagado,
        hasPagosAsociados,
        pagoTone3,
        facturaTone,
        openEditModal,
        patchSolicitudProveedor,
        patchSolicitudProveedorFields,
        handleFetchSolicitudesPago: handleFetchCurrentBucket,
        marcarSolicitudPagada,
        cancelSolicitud,
        conciliarSolicitud,
        marcarNotificadoPagado,
        getEstadoSolicitudPagado,
        getConciliacionInfo,
        onOpenDetalle: setSolicitudDetalle,
        cancelarDispersion,
        showNotification,
      }),
    [
      categoria,
      selectedSolicitudesMap,
      setSelectedSolicitudesMap,
      setSolicitud,
      setDatosDispersion,
      openEditModal,
      patchSolicitudProveedor,
      patchSolicitudProveedorFields,
      handleFetchCurrentBucket,
      marcarSolicitudPagada,
      cancelSolicitud,
      conciliarSolicitud,
      marcarNotificadoPagado,
      setSolicitudDetalle,
      cancelarDispersion,
    ],
  );
  const renderersConVencimiento = useMemo(
    () => ({
      ...renderers,
      dias_vencimiento_pago: ({ value }: { value: number | null }) => {
        if (value === null || value === undefined) {
          return <span className="text-slate-300">—</span>;
        }

        if (value < 0) {
          return (
            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
              Vencido hace {Math.abs(value)} día
              {Math.abs(value) !== 1 ? "s" : ""}
            </span>
          );
        }

        if (value === 0) {
          return (
            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Vence hoy
            </span>
          );
        }

        if (value <= 3) {
          return (
            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Faltan {value} día{value !== 1 ? "s" : ""}
            </span>
          );
        }

        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
            Faltan {value} día{value !== 1 ? "s" : ""}
          </span>
        );
      },
    }),
    [renderers],
  );

  const tabs = useMemo(
    () =>
      [
        { key: "all", label: "Todos", count: counts.todos ?? 0 },
        { key: "spei", label: "SPEI", count: counts.spei ?? 0 },
        { key: "pago_tdc", label: "Pago TDC", count: counts.pago_tdc ?? 0 },
        { key: "pago_link", label: "Pago Link", count: counts.pago_link ?? 0 },
        {
          key: "pendiente_credito",
          label: "Pendiente credito",
          count: counts.pendiente_credito ?? 0,
        },
        {
          key: "ap_credito",
          label: "Ap Credito",
          count: counts.ap_credito ?? 0,
        },
        { key: "pagada", label: "Pagada", count: counts.pagada ?? 0 },
        {
          key: "notificados",
          label: "Notificados",
          count: counts.notificados ?? 0,
        },
        {
          key: "canceladas",
          label: "Canceladas",
          count: counts.canceladas ?? 0,
        },
      ] as Array<{ key: VistaCarpeta; label: string; count: number }>,
    [counts],
  );

  return (
    <div className="h-fit">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 my-4">
        Pagos a proveedor
      </h1>

      <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <Filters
          defaultFilters={filters}
          onFilter={setFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <CarpetasTabs
          activeTab={categoria}
          onTabChange={setCategoria}
          tabs={tabs}
        />

        {/* Barra de acciones */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs text-slate-600">
            {categoria === "pagada"
              ? "Carpeta pagada (sin selección)"
              : categoria === "canceladas"
                ? "Carpeta canceladas (sin selección)"
                : selectedCount > 0
                  ? `Seleccionadas: ${selectedCount}`
                  : "Sin selección"}
          </div>
          <div className="flex gap-2" />
        </div>

        <div>
          {loading ? (
            <Loader />
          ) : (
            <Table5<ItemSolicitud>
              registros={registrosVisibles as any}
              renderers={renderersConVencimiento}
              defaultSort={defaultSort as any}
              customColumns={customColumns}
              respectCustomColumnOrder
              headerRenderers={{
                fecha_de_pago: () => "FECHA SOLICITADA DE PAGO",
                dias_vencimiento_pago: () =>
                  "DIAS DE VENCIMIENTO DE LA FACTURA",
                comentarios_Ap: () => "COMENTARIOS FIN",
                seleccionar: () => (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={seleccionables.length === 0}
                    onChange={handleSelectAll}
                    title={
                      allSelected
                        ? "Deseleccionar todo"
                        : `Seleccionar todo (${seleccionables.length})`
                    }
                    className="h-4 w-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                    onClick={(e) => e.stopPropagation()}
                  />
                ),
              }}
              getRowClassName={(row) => {
                const raw = (row as any)?.item ?? row;
                const consolidado = Number(
                  (raw as any)?.consolidado ??
                    (raw as any)?.estatus_conciliado ??
                    (raw as any)?.conciliado ??
                    0,
                );
                const pagado = isPagado(raw);
                const fechaSolicitud =
                  raw?.solicitud_proveedor?.fecha_solicitud ??
                  (row as any)?.fecha_solicitud ??
                  null;
                return getSolicitudSemaforoRowClass({
                  categoria,
                  fechaSolicitud,
                  pagado,
                  consolidado,
                });
              }}
              leyenda={`Mostrando ${registrosVisibles.length} registros (${categoria === "all" ? "todas" : `categoría: ${categoria}`})`}
            >
              <Button
                onClick={handleCsv}
                disabled={!canUploadComprobante}
                icon={Upload}
                variant="ghost"
                size="md"
                className={[
                  "h-10 !rounded-xl px-3",
                  "border border-slate-200 bg-white text-slate-800",
                  "shadow-sm hover:shadow",
                  "hover:bg-slate-50 hover:border-slate-300",
                  "active:translate-y-[1px] transition-all",
                  "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                ].join(" ")}
                title={
                  canUploadComprobante
                    ? "Subir comprobante dispersado"
                    : "Selecciona solicitudes en estado DISPERSION"
                }
              >
                Subir comprobante dispersado
              </Button>

              <Button
                onClick={handleCsvnospei}
                icon={Upload}
                variant="ghost"
                size="md"
                className={[
                  "h-10 !rounded-xl px-3",
                  "border border-slate-200 bg-white text-slate-800",
                  "shadow-sm hover:shadow",
                  "hover:bg-slate-50 hover:border-slate-300",
                  "active:translate-y-[1px] transition-all",
                  "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                ].join(" ")}
                title="Subir comprobante no dispersado"
              >
                Subir comprobante no dispersado
              </Button>

              <Button
                onClick={handleDispersion}
                disabled={!canDispersion}
                icon={File}
                variant="secondary"
                size="md"
                title={
                  dispersionDisabledReason ||
                  `Generar dispersión (${selectedCount})`
                }
              >
                Generar dispersión
                {selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>

              <Button
                onClick={clearSelection}
                disabled={!canSelect || selectedCount === 0}
                icon={Brush}
                variant="ghost"
                size="md"
                className={[
                  "h-10 !rounded-xl px-3",
                  "border border-rose-200 bg-white text-rose-700",
                  "hover:bg-rose-50 hover:border-rose-300",
                  "active:translate-y-[1px] transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2",
                ].join(" ")}
                title={
                  clearDisabledReason || `Limpiar selección (${selectedCount})`
                }
              >
                Limpiar
              </Button>

              {/* Cantidad de registros por página + paginado */}
              <div className="flex items-center gap-2 ml-1 flex-wrap">
                <input
                  type="number"
                  min="1"
                  value={limiteInput}
                  onChange={(e) => setLimiteInput(e.target.value)}
                  placeholder="50"
                  className="w-24 h-9 px-2 text-sm border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-100"
                />
                <Button
                  variant="secondary"
                  size="md"
                  disabled={loading}
                  onClick={() => {
                    const n = limiteInput ? Number(limiteInput) : 50;
                    setPag(1);
                    handleFetchCurrentBucket(filters, n, 1);
                  }}
                  className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
                >
                  Cargar
                </Button>

                <div className="flex items-center gap-1 border border-gray-200 rounded-md px-1">
                  <button
                    disabled={pag <= 1 || loading}
                    onClick={() => {
                      const newPag = pag - 1;
                      setPag(newPag);
                      handleFetchCurrentBucket(
                        filters,
                        limiteInput ? Number(limiteInput) : 50,
                        newPag,
                      );
                    }}
                    className="h-9 px-2 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 rounded-l-md transition-colors"
                  >
                    ←
                  </button>
                  <span className="h-9 flex items-center px-2 text-sm text-slate-700 select-none min-w-[4rem] justify-center">
                    Pág. {pag}
                  </span>
                  <button
                    disabled={
                      loading ||
                      (metaPag !== null && metaPag.count < metaPag.limite)
                    }
                    onClick={() => {
                      const newPag = pag + 1;
                      setPag(newPag);
                      handleFetchCurrentBucket(
                        filters,
                        limiteInput ? Number(limiteInput) : 50,
                        newPag,
                      );
                    }}
                    className="h-9 px-2 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 rounded-r-md transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            </Table5>
          )}
        </div>
      </div>

      {solicitudDetalle !== null && (
        <ModalDetalle
          id_solicitud_proveedor={solicitudDetalle}
          onClose={() => setSolicitudDetalle(null)}
        />
      )}

      <EditModal
        open={editModal.open}
        idSolicitudProveedor={editModal.id_solicitud_proveedor}
        field={editModal.field}
        value={editModal.value}
        onClose={closeEditModal}
        onSave={saveEditModal}
        onValueChange={(value) => setEditModal((prev) => ({ ...prev, value }))}
        originalValue={editModal.originalValue}
        comentarioAp={editModal.comentarioAp}
        onComentarioApChange={(v) =>
          setEditModal((prev) => ({ ...prev, comentarioAp: v }))
        }
      />

      {showDispersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <DispersionModal
            solicitudesSeleccionadas={solicitudesSeleccionadasModal}
            onClose={() => setShowDispersionModal(false)}
            onSubmit={async (payload) => {
              console.group("🚀 Payload final antes de mandarse a la API");
              console.log("Payload completo:", payload);
              if (Array.isArray(payload)) {
                payload.forEach((item, index) => {
                  console.log(`Payload elemento #${index + 1}:`, item);
                });
              }
              console.groupEnd();
              setShowDispersionModal(false);
              handleFetchCurrentBucket(
                filters,
                limiteInput ? Number(limiteInput) : 50,
                pag,
              );
            }}
          />
        </div>
      )}

      {showComprobanteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <ComprobanteModal
            onClose={() => setShowComprobanteModal(false)}
            onSubmit={async (payload) => {
              console.log("Payload de comprobante listo para API:", payload);
              setShowComprobanteModal(false);
              handleFetchCurrentBucket(
                filters,
                limiteInput ? Number(limiteInput) : 50,
                pag,
              );
            }}
          />
        </div>
      )}

      {showComprobanteModal2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <OtrosMetodosPagoModal
            selectedSolicitudes={solicitudesSeleccionadasComprobante}
            onClose={() => setShowComprobanteModal2(false)}
            onSubmit={async (payload) => {
              console.log("Payload de comprobante listo para API:", payload);
              setShowComprobanteModal2(false);
              handleFetchCurrentBucket(
                filters,
                limiteInput ? Number(limiteInput) : 50,
                pag,
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
