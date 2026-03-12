"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import Filters from "@/components/Filters";
import { Balance } from "@/app/dashboard/facturas-pendientes/balance";
import { Table5 } from "@/components/Table5";
import { formatDate } from "@/helpers/formater";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  DownloadCloud,
  Link as LinkIcon,
  FileDown,
  FilePlus,
  Pencil,
  Download,
} from "lucide-react";
import { fetchPagosPrepagobalance } from "@/services/pagos";
import BalanceSummary from "@/app/dashboard/facturas-pendientes/balance";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";
import useApi from "@/hooks/useApi";
import AsignarFacturaModal from "@/app/dashboard/facturacion/subirfacturas/AsignarFactura";
import Modal from "@/components/organism/Modal";

import { API_KEY, URL } from "@/lib/constants";
import { downloadFile } from "@/lib/utils";
import { fetchFacturas as fetchFacturasSvc } from "@/services/facturas";

import type { Factura } from "@/types/_types";
import type { TypeFilters } from "@/types";
import Link from "next/link";
import { InputToS3 } from "@/components/atom/SendToS3";
import { FacturaService } from "@/services/FacturasService";
import { useAlert } from "@/context/useAlert";
import { Button } from "@/components/ui/button";
import ModalDetalleFactura from "@/app/dashboard/invoices/_components/detalles";
import { PageTracker, TrackingPage } from "./tracker_false";
import { set } from "date-fns";
import { useFile } from "@/hooks/useFile";
import { downloadXML } from "@/helpers/utils";
import {
  ComboBox2,
  ComboBoxOption2,
  TextAreaInput,
} from "@/components/atom/Input";
//  from "@/helpers/utils";
//   ComboBox2,
//   ComboBoxOption2,
//   TextAreaInput,
// } from "@/components/atom/Input";

// Formato moneda
const fmtMoney = (n: any) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0));

// Fecha corta
const fmtDate = (v?: string | null) => {
  if (!v) return "N/A";

  const isoDate = v.split("T")[0]; // "2026-01-07"
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "N/A";

  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const MAX_REGISTER = 200; // para paginación, número de registros por página

/* ===================== Página con Table5 + filtros ===================== */

const defaultFiltersFacturas: TypeFilters = {
  estatusFactura: null,
  id_factura: null,
  id_cliente: "",
  cliente: "",
  uuid: "",
  rfc: "",
  startDate: null,
  endDate: null,
};

export function TravelersPage() {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.FACTURAS);

  const { descargarFactura, descargarFacturaXML } = useApi();

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [tracking, setTracking] = useState<TrackingPage>({
    page: 1,
    total_pages: 0,
    total: 0,
  });

  // const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(defaultFiltersFacturas);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [cancelarFactura, setCancelarFactura] = useState<string | null>(null);
  const { Can } = usePermiso();
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Modales/acciones
  const [isModalOpen, setIsModalOpen] = useState<string>("");
  const [facturaAsignando, setFacturaAsignando] = useState<string | null>(null);
  const [tipo_factura, setTipo_factura] = useState<boolean | null>(null);
  const [facturaAgente, setFacturaAgente] = useState<string | null>(null);
  const [facturaDataSel, setFacturaDataSel] = useState<Factura | null>(null);
  const [facturaEmpresa, setFacturaEmpresa] = useState<string | null>(null);
  const { csv, setLoadingFile, loadingFile } = useFile();

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [detalleIdFactura, setDetalleIdFactura] = useState<string | null>(null);
  // ✅ Data seleccionada para el modal de detalle
  const [detalleFacturaData, setDetalleFacturaData] = useState<any | null>(
    null,
  );

  const toText = (v: any, fallback = "N/A") => {
    if (v === null || v === undefined) return fallback;
    const s = String(v).trim();
    return s ? s : fallback;
  };

  const fmtDateTime = (v?: string | null) => {
    if (!v) return "N/A";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return fmtDate(v); // fallback a tu fecha corta
    return d.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExport = async () => {
    setLoadingFile(true);
    try {
      let fileName = "Facturas";

      if (!confirm(`¿Quieres usar el nombre ${fileName} por default?`)) {
        const customName = prompt("Escribe el nombre del archivo:");

        if (customName && customName.trim() !== "") {
          fileName = customName.trim();
        }
      }

      const { data } = await FacturaService.getInstance().obtenerFacturas({
        ...activeFilters,
      });

      const toNum = (v: any) => Number(v ?? 0);
      const formatData = data.map((f) => ({
        id_factura: String(f?.id_factura || ""),
        id_cliente: f?.id_agente ?? f?.usuario_creador ?? "N/A",
        cliente: toText(f?.nombre),
        rfc: toText(f?.rfc),
        folio: f.folio || "",
        uuid: toText(f?.uuid_factura),
        estado: toText(f?.estado),
        subtotal: toNum(f?.subtotal),
        iva: toNum(f?.impuestos),
        total: toNum(f?.total),
        saldo:
          f.saldo_x_aplicar_items != 0
            ? toNum(f?.saldo)
            : toNum(f?.saldo_x_aplicar_items),
        fecha_emision: f?.fecha_emision || null,
        fecha_vencimiento: f?.fecha_vencimiento || null,
        prepagada: f?.is_prepagada == null ? null : Number(f?.is_prepagada),
        origen: Number(f?.origen ?? 0),
        fecha_timbrado: f?.fecha_timbrado || null,
        serie: f?.serie ?? null,
        estado_sat: toText(f?.estado_sat),
        cfdi_version: toText(f?.cfdi_version),
        cfdi_tipo: toText(f?.cfdi_tipo),
        usuario_creador: toText(f?.usuario_creador),
        iva_16: f?.iva_16 == null ? null : toNum(f?.iva_16),
        iva_8: f?.iva_8 == null ? null : toNum(f?.iva_8),
        regimen_fiscal_receptor: toText(f?.regimen_fiscal_receptor),
        domicilio_fiscal_receptor: toText(f?.domicilio_fiscal_receptor),
        impuestos: toNum(f?.impuestos), // (sí, también existe en el objeto)
        created_at: f?.created_at || null,
        updated_at: f?.updated_at || null,
        id_facturama: f?.id_facturama || null,
        folio: toText(f?.folio),
        id_empresa: f?.id_empresa || null,
        id_agente: f?.id_agente || null,
        uuid_factura: toText(f?.uuid_factura),
        rfc_emisor: toText(f?.rfc_emisor),
        nombre_emisor: toText(f?.nombre_emisor),
        lugar_expedicion: toText(f?.lugar_expedicion),
        rfc_receptor: toText(f?.rfc_receptor),
        nombre_receptor: toText(f?.nombre_receptor),
        uso_cfdi: toText(f?.uso_cfdi),
        moneda: toText(f?.moneda),
        forma_pago: toText(f?.forma_pago),
        metodo_pago: toText(f?.metodo_pago),
        condicion_pago: toText(f?.condicion_pago),
        conceptos: f?.conceptos ?? null,
        nombre: toText(f?.nombre),
        razon_social: toText(f?.razon_social),
        url_pdf: f?.url_pdf || null,
        url_xml: f?.url_xml || null,
      }));

      csv(formatData, fileName);
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setLoadingFile(false);
    }
  };

  const cargarFacturas = async (page = tracking.page) => {
    try {
      const response = await FacturaService.getInstance().obtenerFacturas({
        ...activeFilters,
        page,
        length: MAX_REGISTER,
      });

      // ✅ Normaliza shape (por si viene response.data.data)
      const rows =
        response?.data && Array.isArray(response.data)
          ? response.data
          : response?.data && Array.isArray(response.data)
            ? response.data
            : [];

      const total =
        response?.metadata?.total ??
        response?.metadata?.total ??
        rows.length ??
        0;

      console.log("FACTURAS raw response:", response);
      console.log("FACTURAS normalized rows:", rows);

      setFacturas(rows);

      setTracking((prev) => ({
        ...prev,
        page,
        total_pages: Math.ceil(Number(total) / MAX_REGISTER) || 1,
        total: Number(total) || 0,
      }));
    } catch (e) {
      console.error("Error al obtener facturas:", e);
      setFacturas([]);
      setTracking((prev) => ({ ...prev, total_pages: 0, total: 0 }));
    }
  };

  useEffect(() => {
    const nextPage = 1;
    setTracking((prev) => ({ ...prev, page: nextPage }));
  }, [activeFilters]);

  const handleQuitarRelacion = async (id_factura: string) => {
    if (!id_factura) return;

    const ok = window.confirm(
      "¿Seguro que quieres eliminar la relación de esta factura? Esto quitará sus detalles/asignación.",
    );
    if (!ok) return;

    try {
      setRemovingId(id_factura);

      const resp = await fetch(
        `${URL}/mia/factura/quitar_relacion?id_factura=${encodeURIComponent(
          id_factura,
        )}`,
        {
          method: "DELETE", // <-- si tu backend usa GET/POST, cámbialo aquí
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );

      let data: any = null;
      try {
        data = await resp.json();
      } catch {
        // por si tu backend no regresa JSON
      }

      if (!resp.ok) {
        throw new Error(data?.message || `HTTP error! status: ${resp.status}`);
      }

      showNotification("success", "Relación eliminada correctamente");

      // refresca tabla
      await cargarFacturas();
    } catch (error: any) {
      showNotification(
        "error",
        error?.message || "Error al eliminar la relación",
      );
    } finally {
      setRemovingId(null);
    }
  };
  const handleFilter = (filters: any) => {
    setActiveFilters(filters);
  };

  const [balance, setBalance] = useState<Balance | null>(null);

  const obtenerBalance = async () => {
    try {
      const response = await fetchPagosPrepagobalance();
      const balanceObtenido: Balance = {
        montototal: response.montototal || "0",
        montofacturado: response.montofacturado || "0",
        restante: response.restante || "0",
        total_reservas_confirmadas: response.total_reservas_confirmadas || "3",
      };
      setBalance(balanceObtenido);
    } catch (err) {
      console.error("Error al obtener el balance:", err);

      setBalance(null);
    } finally {
    }
  };

  // Búsqueda local (client-side) sobre lo cargado
  const facturasFiltradas = useMemo(() => {
    if (!searchTerm?.trim()) return facturas;
    const q = searchTerm.trim().toLowerCase();
    return facturas.filter((f: any) => {
      const idCliente = f?.id_agente ?? f?.usuario_creador ?? "";
      return (
        String(idCliente).toLowerCase().includes(q) ||
        String(f?.rfc ?? "")
          .toLowerCase()
          .includes(q) ||
        String(f?.nombre ?? "")
          .toLowerCase()
          .includes(q) ||
        String(f?.uuid_factura ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [searchTerm, facturas]);
  // console.log(facturasFiltradas, "pagos");
  // Registros para Table5
  const registros = useMemo(() => {
    return (facturasFiltradas || []).map((f: any) => {
      const idCliente = f?.id_agente ?? f?.usuario_creador ?? null;
      const toNum = (v: any) => Number(v ?? 0);

      return {
        // ===== “Friendly” (los que ya usabas) =====
        id_factura: String(f?.id_factura || ""),
        id_cliente: idCliente ?? "N/A",
        cliente: toText(f?.nombre),
        rfc: toText(f?.rfc),
        folio: f.folio || "",
        uuid: toText(f?.uuid_factura),
        estado: toText(f?.estado),
        subtotal: toNum(f?.subtotal),
        iva: toNum(f?.impuestos),
        total: toNum(f?.total),

        // ✅ CONSERVADO tal cual lo tenías
        saldo:
          f.saldo_x_aplicar_items != 0
            ? toNum(f?.saldo)
            : toNum(f?.saldo_x_aplicar_items),

        fecha_emision: f?.fecha_emision || null,
        fecha_vencimiento: f?.fecha_vencimiento || null,
        prepagada: f?.is_prepagada == null ? null : Number(f?.is_prepagada),
        origen: Number(f?.origen ?? 0),

        // ===== Nuevos / faltantes (del objeto) =====
        fecha_timbrado: f?.fecha_timbrado || null,
        serie: f?.serie ?? null,
        estado_sat: toText(f?.estado_sat),
        cfdi_version: toText(f?.cfdi_version),
        cfdi_tipo: toText(f?.cfdi_tipo),
        usuario_creador: toText(f?.usuario_creador),

        iva_16: f?.iva_16 == null ? null : toNum(f?.iva_16),
        iva_8: f?.iva_8 == null ? null : toNum(f?.iva_8),

        regimen_fiscal_receptor: toText(f?.regimen_fiscal_receptor),
        domicilio_fiscal_receptor: toText(f?.domicilio_fiscal_receptor),

        impuestos: toNum(f?.impuestos), // (sí, también existe en el objeto)

        created_at: f?.created_at || null,
        updated_at: f?.updated_at || null,

        id_facturama: f?.id_facturama || null,
        folio: toText(f?.folio),

        id_empresa: f?.id_empresa || null,
        id_agente: f?.id_agente || null,

        uuid_factura: toText(f?.uuid_factura),
        rfc_emisor: toText(f?.rfc_emisor),
        nombre_emisor: toText(f?.nombre_emisor),
        lugar_expedicion: toText(f?.lugar_expedicion),

        rfc_receptor: toText(f?.rfc_receptor),
        nombre_receptor: toText(f?.nombre_receptor),

        uso_cfdi: toText(f?.uso_cfdi),
        moneda: toText(f?.moneda),
        forma_pago: toText(f?.forma_pago),
        metodo_pago: toText(f?.metodo_pago),
        condicion_pago: toText(f?.condicion_pago),

        conceptos: f?.conceptos ?? null,

        nombre: toText(f?.nombre),
        razon_social: toText(f?.razon_social),
        // ===== Mantengo campos para acciones internas =====
        // (NO se agregan como columnas url, pero siguen sirviendo al dropdown)
        url_pdf: f?.url_pdf || null,
        url_xml: f?.url_xml || null,

        actualizar: String(f?.id_factura || ""),
        acciones: { fila: f },
        item: f,

        facturada_por: f.saldo_x_aplicar_items != 0 ? true : false,
        // true es por wallets y false es por items
      };
    });
  }, [facturasFiltradas, removingId]);

  // Renderers para Table5
  const renderers = {
    // ====== ya existentes (deja los tuyos) ======
    id_cliente: ({ value }: { value: string | null }) => {
      const full = String(value ?? "");
      const short = full.slice(0, 12);
      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
        } catch {}
      };
      return (
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar"
          className="font-mono underline-offset-2 hover:underline"
        >
          {short}
        </button>
      );
    },

    subtotal: ({ value }: { value: number }) => <span>{fmtMoney(value)}</span>,
    iva: ({ value }: { value: number }) => <span>{fmtMoney(value)}</span>,
    total: ({ value }: { value: number }) => (
      <span className="font-semibold text-blue-700">{fmtMoney(value)}</span>
    ),
    saldo: ({ value }: { value: number }) => (
      <span
        className={`${
          Number(value) > 0 ? "text-amber-700" : "text-emerald-700"
        } font-medium`}
      >
        {fmtMoney(value)}
      </span>
    ),
    fecha_emision: ({ value }: { value: string | null }) => (
      <span>{fmtDate(value)}</span>
    ),
    fecha_vencimiento: ({ value }: { value: string | null }) => (
      <span>{fmtDate(value)}</span>
    ),
    prepagada: ({ value }: { value: number | null }) =>
      value == null ? "N/A" : value === 1 ? "Sí" : "No",
    origen: ({ value }: { value: number }) =>
      value === 1 ? "Cliente" : "Operaciones",

    // ====== NUEVOS renderers ======
    fecha_timbrado: ({ value }: { value: string | null }) => (
      <span>{fmtDateTime(value)}</span>
    ),
    created_at: ({ value }: { value: string | null }) => (
      <span>{fmtDateTime(value)}</span>
    ),
    updated_at: ({ value }: { value: string | null }) => (
      <span>{fmtDateTime(value)}</span>
    ),

    serie: ({ value }: { value: string | null }) => (
      <span>{toText(value)}</span>
    ),
    estado_sat: ({ value }: { value: string }) => <span>{toText(value)}</span>,
    cfdi_version: ({ value }: { value: string }) => (
      <span className="font-mono">{toText(value)}</span>
    ),
    cfdi_tipo: ({ value }: { value: string }) => <span>{toText(value)}</span>,

    usuario_creador: ({ value }: { value: string }) => {
      const full = toText(value);
      const short = full.slice(0, 12);
      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
        } catch {}
      };
      return (
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar usuario_creador"
          className="font-mono underline-offset-2 hover:underline"
        >
          {short}
        </button>
      );
    },

    iva_16: ({ value }: { value: number | null }) =>
      value == null ? "N/A" : <span>{fmtMoney(value)}</span>,
    iva_8: ({ value }: { value: number | null }) =>
      value == null ? "N/A" : <span>{fmtMoney(value)}</span>,

    impuestos: ({ value }: { value: number }) => <span>{fmtMoney(value)}</span>,
    saldo_x_aplicar_items: ({ value }: { value: number }) => (
      <span>{fmtMoney(value)}</span>
    ),

    rfc_emisor: ({ value }: { value: string }) => (
      <span className="font-mono">{toText(value).toUpperCase()}</span>
    ),
    rfc_receptor: ({ value }: { value: string }) => (
      <span className="font-mono">{toText(value).toUpperCase()}</span>
    ),

    id_agente: ({ value }: { value: string }) => {
      const full = toText(value);
      const short = full.slice(0, 12);
      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
        } catch {}
      };
      return (
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar id_agente"
          className="font-mono underline-offset-2 hover:underline"
        >
          {short}
        </button>
      );
    },

    id_empresa: ({ value }: { value: string }) => {
      const full = toText(value);
      const short = full.slice(0, 12);
      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
        } catch {}
      };
      return (
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar id_empresa"
          className="font-mono underline-offset-2 hover:underline"
        >
          {short}
        </button>
      );
    },

    id_facturama: ({ value }: { value: string | null }) => (
      <span className="font-mono">{toText(value)}</span>
    ),

    conceptos: ({ value }: { value: any }) => {
      if (value == null) return <span>N/A</span>;
      const raw = typeof value === "string" ? value : JSON.stringify(value);
      const short = raw.length > 80 ? raw.slice(0, 80) + "…" : raw;
      return <span title={raw}>{short}</span>;
    },

    // ====== deja tus renderers de actualizar/acciones tal cual ======
    actualizar: ({ item }: { item: Factura }) => {
      const isRemoving = removingId === item.id_factura;

      return (
        <div className="flex gap-2">
          <Can permiso={PERMISOS.COMPONENTES.BOTON.ACTUALIZAR_PDF_FACTURA}>
            <Button onClick={() => setId(item.id_factura)} size="sm">
              Editar PDF
            </Button>
          </Can>

          <Button
            size="sm"
            variant="destructive"
            disabled={isRemoving}
            onClick={() => handleQuitarRelacion(item.id_factura)}
          >
            {isRemoving ? "Eliminando..." : "Eliminar relación"}
          </Button>

          {item.id_facturama && (
            <Can permiso={PERMISOS.COMPONENTES.BOTON.ACTUALIZAR_PDF_FACTURA}>
              <Button
                onClick={() => setCancelarFactura(item.id_factura)}
                size="sm"
                variant="destructive"
              >
                Cancelar factura
              </Button>
            </Can>
          )}
        </div>
      );
    },

    acciones: ({ value }: { value: { fila: any } }) => {
      const f = value.fila as any;
      const puedeAsignar =
        Number(f?.saldo ?? 0) > 0 && Number(f?.saldo_x_aplicar_items ?? 0) > 0;

      const handleDescargarFactura = async (
        id: string,
        tipo: "pdf" | "xml",
        nombre = "factura",
      ) => {
        try {
          if (tipo === "pdf") {
            const obj = await descargarFactura(id);
            const a = document.createElement("a");
            a.href = `data:application/pdf;base64,${obj.Content}`;
            a.download = nombre;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
          } else {
            const obj = await descargarFacturaXML(id);
            const a = document.createElement("a");
            a.href = `data:application/xml;base64,${obj.Content}`;
            a.download = nombre;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
          }
        } catch {
          alert("Ha ocurrido un error al descargar la factura");
        }
      };

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setDetalleIdFactura(f.id_factura);
                  setModalDetalleOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>

              {!!f?.id_facturama && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      handleDescargarFactura(
                        f.id_facturama || "",
                        "pdf",
                        `Factura-${f?.folio || ""}-${f?.rfc}`,
                      )
                    }
                  >
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleDescargarFactura(
                        f.id_facturama || "",
                        "xml",
                        `Factura-${f?.folio || ""}-${f?.rfc}`,
                      )
                    }
                  >
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Descargar XML
                  </DropdownMenuItem>
                </>
              )}

              {!!f?.url_pdf && (
                <>
                  <DropdownMenuItem>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    <a target="_blank" href={f.url_pdf}>
                      Ver PDF
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      downloadFile(
                        f.url_pdf,
                        `Factura-${f?.folio || ""}-${f?.rfc}.pdf`,
                      )
                    }
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </DropdownMenuItem>
                </>
              )}

              {!!f?.url_xml && (
                <>
                  <DropdownMenuItem>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    <a target="_blank" href={f.url_xml}>
                      Ver XML
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      downloadFile(
                        f.url_xml,
                        `Factura-${f?.folio || ""}-${f?.rfc}.xml`,
                      )
                    }
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar XML
                  </DropdownMenuItem>
                </>
              )}

              {puedeAsignar && (
                <DropdownMenuItem
                  onClick={() => {
                    setFacturaAsignando(f.id_factura);
                    setFacturaAgente(f.id_agente);
                    setFacturaEmpresa(f.id_empresa);
                    setFacturaDataSel(f);
                    setTipo_factura(f.facturada_por);
                  }}
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  Asignar factura
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  };

  const customColumns = [
    // Identificación / cliente
    "id_factura",
    "folio",
    "id_cliente",
    "cliente",
    "nombre",
    "razon_social",

    // RFCs / UUIDs
    "rfc",
    "uuid",
    "uuid_factura",

    // Estatus CFDI
    "estado",
    "estado_sat",
    "cfdi_tipo",
    "cfdi_version",
    "serie",

    // Emisor/Receptor
    "rfc_emisor",
    "nombre_emisor",
    "lugar_expedicion",
    "nombre_receptor",

    // CFDI info
    "uso_cfdi",
    "moneda",
    "forma_pago",
    "metodo_pago",
    "condicion_pago",

    // Importes
    "subtotal",
    "iva",
    "impuestos",
    "total",
    "saldo",
    "saldo_x_aplicar_items",

    // Fechas
    "fecha_emision",
    "fecha_timbrado",
    "fecha_vencimiento",
    "created_at",
    "updated_at",

    // Relación / IDs
    "id_facturama",
    "id_empresa",
    "id_agente",
    "usuario_creador",

    // Otros
    "conceptos",

    // Acciones
    "actualizar",
    "acciones",
  ];

  useEffect(() => {
    obtenerBalance();
  }, []);
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const { showNotification } = useAlert();

  return (
    <div className="space-y-2 bg-white p-4">
      {id && (
        <Modal onClose={() => setId(null)} title="Sube el archivo PDF">
          <div className="p-8">
            <InputToS3
              setUrl={async (url: string | null) => {
                try {
                  if (!url) throw new Error("No existe archivo");

                  await FacturaService.getInstance().actualizarDocumentosFacturas(
                    { id, url },
                  );
                  showNotification(
                    "success",
                    "Se actualizo el archivo correctamente",
                  );
                  setId(null);
                } catch (error) {
                  showNotification(
                    "error",
                    error.message || "Error al subir archivo",
                  );
                }
              }}
            ></InputToS3>
          </div>
        </Modal>
      )}

      {balance && (
        <BalanceSummary
          balance={balance}
          formatCurrency={formatCurrency} // Pasa la función de formato de divisa
        />
      )}
      <Card>
        <div className="p-6 space-y-2">
          <Filters
            defaultFilters={defaultFiltersFacturas}
            onFilter={handleFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <Table5
            registros={registros}
            isExport={false}
            renderers={renderers as any}
            customColumns={customColumns}
            defaultSort={{ key: "fecha_emision", sort: false }} // desc
            maxHeight="26rem"
            splitStringsBySpace
          >
            <Button
              onClick={handleExport}
              disabled={loadingFile}
              variant="secondary"
              size="sm"
            >
              Exportar
            </Button>
            <Button size="sm" onClick={() => cargarFacturas()}>
              Cargar facturas
            </Button>
          </Table5>

          {facturas && (
            <PageTracker
              tracking={tracking}
              setPage={(page) => {
                cargarFacturas(page);
              }}
            ></PageTracker>
          )}
        </div>
      </Card>

      {/* Modal de Asignar */}
      {facturaAsignando && (
        <AsignarFacturaModal
          isOpen={!!facturaAsignando}
          onClose={() => {
            setFacturaAsignando(null);
            setFacturaAgente(null);
            setFacturaDataSel(null);
            setFacturaEmpresa(null);
            // refresco tras asignación
            // cargarFacturas(activeFilters);
          }}
          id_factura={facturaAsignando}
          tipo={tipo_factura}
          clienteSeleccionado={facturaAgente as any}
          facturaData={facturaDataSel as any}
          onAssign={() => {}}
          onCloseVistaPrevia={() => {}}
          empresaSeleccionada={facturaEmpresa as any}
        />
      )}

      {modalDetalleOpen && (
        <ModalDetalleFactura
          open={modalDetalleOpen}
          onClose={() => {
            setModalDetalleOpen(false);
            setDetalleIdFactura(null);
          }}
          id_factura={detalleIdFactura}
          setDetalleFacturaData={setDetalleFacturaData} // ✅ aquí se manda
          title="Detalles de factura"
        />
      )}
      {cancelarFactura && (
        <Modal
          onClose={() => setCancelarFactura(null)}
          title="Cancelar factura"
        >
          <ModalCancelarFactura
            id={cancelarFactura}
            onClose={() => setCancelarFactura(null)}
            onConfirm={() => {
              cargarFacturas();
            }}
          />
        </Modal>
      )}

      {/* Diálogo legacy si lo usas */}
      {/* <TravelerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} /> */}
    </div>
  );
}

export const ModalCancelarFactura = ({
  id,
  onClose,
  onConfirm,
}: {
  id: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    motive: "03",
    type: "issued",
    comentarios: null,
  });
  const { showNotification, error: showError, success, info } = useAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!data.motive || !data.type) {
      showNotification(
        "error",
        "Por favor, selecciona un motivo y tipo de cancelación.",
      );
      return;
    }
    try {
      let response = await FacturaService.getInstance().cancelarFactura(
        id,
        data,
      );
      if (response.data?.estado == "required_validation") {
        const confirmacion = confirm(
          "La factura es de meses anteriores ¿Continuar con la cancelación?",
        );
        if (!confirmacion) {
          info("Cancelación de factura cancelada por el usuario");
          return;
        }
        response = await FacturaService.getInstance().cancelarFactura(id, {
          ...data,
          force: true,
        });
      }
      downloadXML(response.data, `factura_cancelada_${id}.xml`);
      success(response.message || "Factura cancelada correctamente");
      onConfirm();
      onClose();
    } catch (error) {
      showError(error.message || "Error al cancelar la factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        className="w-[90vw] max-w-xl flex flex-col justify-between h-72 p-4 gap-2"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-2 w-full gap-2">
          <ComboBox2
            value={
              MOTIVOS_CANCELACION.filter((opt) => opt.value === data.motive)[0]
                ? {
                    name: MOTIVOS_CANCELACION.filter(
                      (opt) => opt.value === data.motive,
                    )[0].label,
                    content: MOTIVOS_CANCELACION.filter(
                      (opt) => opt.value === data.motive,
                    )[0],
                  }
                : {
                    name: "",
                    content: undefined,
                  }
            }
            onChange={function (
              value: ComboBoxOption2<{ value: string; label: string }>,
            ): void {
              setData((prev) => ({
                ...prev,
                motive: value.content.value,
              }));
            }}
            options={MOTIVOS_CANCELACION.map((opt) => ({
              name: opt.label,
              content: opt,
            }))}
            label="Motivo de cancelación"
            className="w-full"
          />
          <ComboBox2
            value={
              CFDI_STATUS.filter((opt) => opt.value === data.type)[0]
                ? {
                    name: CFDI_STATUS.filter(
                      (opt) => opt.value === data.type,
                    )[0].label,
                    content: CFDI_STATUS.filter(
                      (opt) => opt.value === data.type,
                    )[0],
                  }
                : {
                    name: "",
                    content: undefined,
                  }
            }
            onChange={function (
              value: ComboBoxOption2<{ value: string; label: string }>,
            ): void {
              setData((prev) => ({ ...prev, type: value.content.value }));
            }}
            options={CFDI_STATUS.map((opt) => ({
              name: opt.label,
              content: opt,
            }))}
            label="Tipo de factura"
            className="w-full"
          />
          <TextAreaInput
            className="col-span-2"
            label="¿Por qué se cancela la reserva?"
            value={data.comentarios}
            onChange={function (value: string): void {
              setData((prev) => ({ ...prev, comentarios: value }));
            }}
          ></TextAreaInput>
        </div>
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-2 w-full gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Conservar factura
            </Button>
            <Button variant="destructive" type="submit" disabled={loading}>
              Sí, cancelar factura
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

const MOTIVOS_CANCELACION = [
  {
    value: "01",
    label: "01 - Comprobante emitido con errores con relación",
  },
  {
    value: "02",
    label: "02 - Comprobante emitido con errores sin relación",
  },
  {
    value: "03",
    label: "03 - No se llevó a cabo la operación",
  },
  {
    value: "04",
    label: "04 - Operación nominativa relacionada en factura global",
  },
];

const CFDI_STATUS = [
  {
    value: "issued",
    label: "Issued - Factura emitida y timbrada",
  },
  {
    value: "canceled",
    label: "Canceled - Factura cancelada",
  },
  {
    value: "pending",
    label: "Pending - Factura pendiente de timbrar",
  },
  {
    value: "draft",
    label: "Draft - Borrador (no timbrada)",
  },
  {
    value: "payment",
    label: "Payment - Complemento de pago",
  },
  {
    value: "payroll",
    label: "Payroll - Nómina",
  },
];
