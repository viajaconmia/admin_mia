"use client";

import { URL, API_KEY } from "@/lib/constants/index";
import { useState, useEffect, useCallback, useMemo } from "react";
import { parsearXML } from "./parseXmlCliente";
import VistaPreviaModal from "./VistaPreviaModal";
import ConfirmacionModal from "./confirmacion";
import {
  fetchAgentes,
  fetchEmpresasAgentesDataFiscal,
  fecthProveedores,
  fetchProveedoresDataFiscal,
} from "@/services/agentes";
import { TypeFilters, EmpresaFromAgent } from "@/types";
import AsignarFacturaModal from "./AsignarFactura";
import { obtenerPresignedUrl, subirArchivoAS3 } from "@/helpers/utils";
import { useAlert } from "@/context/useAlert";
import ModalSubirFactura from "./ModalSubirFactura";
import {
  toArray,
  normalizeProveedoresAsAgentes,
  safeNumStr,
  getIdSolicitudFromRow,
  getIdProveedorFromRow,
  getCodigoHotelFromRow,
  getResponseErrorMessage,
  round2,
  normalizeCurrency,
  isMXNCurrency,
  convertAmountToMXN,
  validateFacturaForm,
  fetchDatosFiscalesProveedor,
  consultarFacturadoSolicitudes,
  type Agente,
  type Pago,
  type AsociacionSolicitudProveedor,
  type FacturaErrors,
} from "./helpers";

// Re-exportamos para no romper importaciones externas
export { getEmpresasDatosFiscales, type Agente } from "./helpers";

// ─── Interfaces locales ───────────────────────────────────────────────────────

interface Proveedores {
  id_proveedor: string;
  id_solicitud: string;
  monto_solicitado: string;
  total: number;
  subtotal: number | null;
  impuestos: number | null;
  fecha_pago: string;
  proveedores_data?: any;
}

interface SubirFacturaProps {
  proveedoresRfc?: string | null;
  pagoId?: string;
  id_proveedor?: string;
  pagoData?: Pago | null;
  proveedoresData?: any | null;
  isBatch?: boolean;
  onSuccess: () => void;
  agentId?: string;
  initialItems?: string[];
  itemsJson?: string;
  autoOpen?: boolean;
  onCloseExternal?: () => void;
  initialItemsTotal?: number;
  id_servicio?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SubirFactura({
  pagoId,
  pagoData,
  id_proveedor = null,
  proveedoresRfc = null,
  id_servicio,
  proveedoresData = null,
  onSuccess,
  agentId,
  initialItems = [],
  initialItemsTotal = 0,
  itemsJson = "",
  autoOpen = false,
  onCloseExternal,
}: SubirFacturaProps) {
  // ── Flags de modo ──────────────────────────────────────────────────────────
console.log("provedordataaaaaaaaaaaaa",proveedoresData)
  const proveedorFlowType = Array.isArray(proveedoresData)
    ? "batch"
    : proveedoresData
      ? "single"
      : "none";

  const isProveedorBatch = proveedorFlowType === "batch";
  const isProveedorMode = proveedorFlowType === "single";
  const shouldIncludeFechaVencimiento = !pagoData && !proveedoresData;
  const isNormalAgenteMode = !proveedoresData;
  const nombre = proveedoresData ? "Proveedor" : "cliente";
  const text = proveedoresData
    ? "Asignar factura a solicitud"
    : "Asignar factura al pago";

  // ── Estado ─────────────────────────────────────────────────────────────────

  const [asignacionPayload, setAsignacionPayload] = useState<any>(null);
  const [batchAsociaciones, setBatchAsociaciones] = useState<AsociacionSolicitudProveedor[]>([]);

  const [facturaCreada, setFacturaCreada] = useState<any>(null);
  const [facturaData, setFacturaData] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [cliente, setCliente] = useState(pagoData?.id_agente || agentId || "");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Agente | null>(null);
  const [archivoPDF, setArchivoPDF] = useState<File | null>(null);
  const [archivoXML, setArchivoXML] = useState<File | null>(null);
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [archivoPDFUrl, setArchivoPDFUrl] = useState<string | null>(null);
  const [archivoXMLUrl, setArchivoXMLUrl] = useState<string | null>(null);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);
  const [errors, setErrors] = useState<FacturaErrors>({});
  const [clientes, setClientes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresasAgente, setEmpresasAgente] = useState<EmpresaFromAgent[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaFromAgent | null>(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [facturaPagada, setFacturaPagada] = useState(false);
  const [mostrarAsignarFactura, setMostrarAsignarFactura] = useState(false);

  const isClienteBloqueado = !!agentId || !!pagoData?.id_agente || isProveedorBatch;

  const [uuid, setUuid] = useState(false);
  const [facturado, setFacturado] = useState<string | null>(null);

  type ModoFacturaProveedor = "nueva" | "subida";
  const [modoFacturaProveedor, setModoFacturaProveedor] = useState<ModoFacturaProveedor>("nueva");
  const [uuidBusqueda, setUuidBusqueda] = useState("");
  const [buscandoFactura, setBuscandoFactura] = useState(false);
  const [facturaEncontrada, setFacturaEncontrada] = useState<any>(null);

  const [facturadoPrevioData, setFacturadoPrevioData] = useState<any>(null);
  const [loadingFacturadoPrevio, setLoadingFacturadoPrevio] = useState(false);
  const [asignandoFacturaPrevia, setAsignandoFacturaPrevia] = useState(false);
  const [propinaActivaPrevia, setPropinaActivaPrevia] = useState(false);
  const [propinaMontoPrevia, setPropinaMontoPrevia] = useState("");

  console.log("proveedores", proveedoresData);

  // ── Derived ────────────────────────────────────────────────────────────────

  const mostrarSwitchFacturaProveedor = !!proveedoresData;
  const esFacturaSubidaMode = mostrarSwitchFacturaProveedor && modoFacturaProveedor === "subida";
  const esFacturaNuevaMode = !mostrarSwitchFacturaProveedor || modoFacturaProveedor === "nueva";

  const hasItems = Array.isArray(initialItems) && initialItems.length > 0;

  const getItemsTotal = useCallback((): number => {
    const itemsTotalProp =
      typeof initialItemsTotal === "number" ? initialItemsTotal : undefined;
    let total = 0;
    if (typeof itemsTotalProp === "number") {
      total = itemsTotalProp;
    } else if (Array.isArray(initialItems)) {
      total = initialItems.reduce(
        (acc, it: any) => acc + Number(it?.monto || 0),
        0,
      );
    }
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }, [initialItems, initialItemsTotal]);

  // ── Efectos ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isProveedorBatch) {
      setBatchAsociaciones([]);
      return;
    }
    const arr = toArray(proveedoresData);
    const normalized: AsociacionSolicitudProveedor[] = arr
      .map((row: any) => {
        const id_solicitud = getIdSolicitudFromRow(row);
        const id_proveedor = getIdProveedorFromRow(row);
        const codigo_hotel = getCodigoHotelFromRow(row);
        console.log(id_solicitud, "🤬🤬🤬🤬", id_proveedor, "cam", row);
        return { id_solicitud, id_proveedor, codigo_hotel, monto_asociar: "", raw: row };
      })
      .filter((x) => x.id_solicitud);
    console.log(normalized, "informacion", arr);
    setBatchAsociaciones(normalized);
  }, [isProveedorBatch, proveedoresData]);

  useEffect(() => {
    console.log("🟦 proveedoresData (prop) =>", proveedoresData);
    console.log("🟦 isProveedorBatch/isProveedorMode =>", {
      isProveedorBatch, isProveedorMode, isNormalAgenteMode,
    });
  }, [proveedoresData, isProveedorBatch, isProveedorMode, isNormalAgenteMode]);

  useEffect(() => {
    if (pagoData) abrirModal();
  }, [pagoData]);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setAsignacionPayload(initialItems);
    }
  }, [initialItems]);

  useEffect(() => {
    if (autoOpen && proveedoresData) {
      abrirModalProv();
    } else if (autoOpen && !proveedoresData) {
      abrirModal();
    }
  }, [autoOpen, proveedoresData]);

  useEffect(() => {
    if (isProveedorBatch) return;
    if (!Array.isArray(clientes) || clientes.length === 0) return;

    if (isProveedorMode) {
      const targetId = id_proveedor ? String(id_proveedor) : "";
      let matching: Agente | undefined = targetId
        ? clientes.find((c) => String(c.id_agente) === targetId)
        : undefined;

      if (!matching) {
        const targetNameRaw =
          (typeof (proveedoresData as any)?.hotel === "string"
            ? (proveedoresData as any)?.hotel
            : "") ||
          (typeof (proveedoresData as any)?.proveedor === "string"
            ? (proveedoresData as any)?.proveedor
            : "");
        const targetName = String(targetNameRaw).trim().toLowerCase();
        if (targetName) {
          matching = clientes.find(
            (c) =>
              String(c.nombre_agente_completo ?? "").trim().toLowerCase() === targetName,
          );
        }
      }

      if (matching) {
        setCliente(matching.nombre_agente_completo);
        setClienteSeleccionado(matching);
        cargarEmpresasAgente(matching.id_agente);
      }
      return;
    }

    const targetId = pagoData?.id_agente || agentId;
    if (!targetId) return;
    const matching = clientes.find((c) => String(c.id_agente) === String(targetId));
    if (matching) {
      setCliente(matching.nombre_agente_completo);
      setClienteSeleccionado(matching);
      cargarEmpresasAgente(matching.id_agente);
    }
  }, [clientes, agentId, pagoData?.id_agente, id_proveedor, proveedoresData, isProveedorMode, isProveedorBatch]);

  // ── Memos (declared before effects that depend on them) ───────────────────

  const batchTotalAsociar = useMemo(() => {
    if (!isProveedorBatch) return 0;
    const sum = batchAsociaciones.reduce((acc, it) => {
      const n = Number(it.monto_asociar || 0);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    return Math.round((sum + Number.EPSILON) * 100) / 100;
  }, [isProveedorBatch, batchAsociaciones]);

  const idsSolicitudFacturaPrevia = useMemo(() => {
    if (isProveedorBatch) {
      return Array.from(
        new Set(
          batchAsociaciones
            .map((x) => String(x?.id_solicitud ?? "").trim())
            .filter(Boolean),
        ),
      );
    }
    if (isProveedorMode && proveedoresData?.id_solicitud) {
      return [String(proveedoresData.id_solicitud).trim()];
    }
    return [];
  }, [isProveedorBatch, isProveedorMode, batchAsociaciones, proveedoresData]);

  useEffect(() => {
    let cancelled = false;

    async function loadFacturadoPrevio() {
      try {
        if (!esFacturaSubidaMode) return;
        if (!facturaEncontrada) return;
        if (!idsSolicitudFacturaPrevia.length) return;

        setLoadingFacturadoPrevio(true);
        const resp = await consultarFacturadoSolicitudes(idsSolicitudFacturaPrevia);
        if (!cancelled) setFacturadoPrevioData(resp);
      } catch (error) {
        console.error("Error consultando facturado previo:", error);
        if (!cancelled) setFacturadoPrevioData(null);
      } finally {
        if (!cancelled) setLoadingFacturadoPrevio(false);
      }
    }

    loadFacturadoPrevio();
    return () => { cancelled = true; };
  }, [esFacturaSubidaMode, facturaEncontrada, idsSolicitudFacturaPrevia.join("|")]);

  const facturadoPrevioMap = useMemo(() => {
    const out: Record<string, any> = {};
    if (facturadoPrevioData?.data_by_id && typeof facturadoPrevioData.data_by_id === "object") {
      return facturadoPrevioData.data_by_id;
    }
    if (Array.isArray(facturadoPrevioData?.data)) {
      for (const row of facturadoPrevioData.data) {
        const id = String(row?.id_solicitud ?? "").trim();
        if (id) out[id] = row;
      }
    }
    return out;
  }, [facturadoPrevioData]);

  const saldoDisponibleFacturaPrevia = useMemo(() => {
    return Number(
      facturaEncontrada?.restante_por_facturar ??
        facturaEncontrada?.saldo_x_aplicar_items ??
        0,
    );
  }, [facturaEncontrada]);

  const totalAsignadoFacturaPrevia = useMemo(() => {
    if (isProveedorBatch) {
      return round2(
        batchAsociaciones.reduce((acc, it) => {
          const n = Number(it.monto_asociar || 0);
          return acc + (Number.isFinite(n) ? n : 0);
        }, 0),
      );
    }
    if (isProveedorMode) return round2(Number(facturado || 0));
    return 0;
  }, [isProveedorBatch, isProveedorMode, batchAsociaciones, facturado]);

  const singleAsociacionProveedor = useMemo(() => {
    if (!isProveedorMode || !proveedoresData) return null;
    return {
      id_solicitud: String(proveedoresData?.id_solicitud ?? "").trim(),
      id_proveedor: String(proveedoresData?.id_proveedor ?? id_proveedor ?? "").trim(),
      monto_asociar: facturado ?? "",
      raw: proveedoresData,
    };
  }, [isProveedorMode, proveedoresData, id_proveedor, facturado]);

  // ── Helpers internos ───────────────────────────────────────────────────────

  const monedaFacturaPrevia = "MXN";
  const requiereConversionProveedorPrevia = false;
  const tipoCambioFacturaPrevia = 1;

  const formatCurrency = (value: string | number, currency = "MXN") => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(n);
  };

  const fromMXNToOriginal = (amount: any) => {
    const n = Number(amount || 0);
    if (!Number.isFinite(n)) return 0;
    if (!requiereConversionProveedorPrevia) return round2(n);
    const tc = Number(tipoCambioFacturaPrevia || 0);
    if (!Number.isFinite(tc) || tc <= 0) return 0;
    return round2(n / tc);
  };

  const getPreviewConversion = (amount: any) => {
    const original = Number(amount || 0);
    const mxn = requiereConversionProveedorPrevia
      ? convertAmountToMXN(original, tipoCambioFacturaPrevia, true)
      : round2(original);
    return {
      original: round2(original),
      currencyOriginal: monedaFacturaPrevia,
      mxn,
      hasConversion: requiereConversionProveedorPrevia,
    };
  };

  const getMaximoAsignableSolicitud = ({
    idSolicitud,
    excludeIndex = null,
  }: {
    idSolicitud: string;
    excludeIndex?: number | null;
  }) => {
    const maxSolicitud = Number(facturadoPrevioMap?.[idSolicitud]?.maximo_asignar ?? 0);
    const sumOtros = batchAsociaciones.reduce((acc, it, i) => {
      if (excludeIndex !== null && i === excludeIndex) return acc;
      const n = Number(it.monto_asociar || 0);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    const disponibleFactura = Math.max(0, saldoDisponibleFacturaPrevia - sumOtros);
    return Math.max(0, Math.min(maxSolicitud, disponibleFactura));
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const subirArchivosAS3 = async (): Promise<{ pdfUrl: string; xmlUrl: string }> => {
    if (!archivoXML) throw new Error("El archivo XML es requerido");
    if (!archivoPDF) throw new Error("El archivo PDF es requerido");

    const folder = "comprobantes";

    const { url: urlXML, publicUrl: publicUrlXML } = await obtenerPresignedUrl(
      archivoXML.name, archivoXML.type, folder,
    );
    await subirArchivoAS3(archivoXML, urlXML);

    const { url: urlPDF, publicUrl: publicUrlPDF } = await obtenerPresignedUrl(
      archivoPDF.name, archivoPDF.type, folder,
    );
    await subirArchivoAS3(archivoPDF, urlPDF);

    console.log(urlXML, publicUrlXML, "🚓🚓🚓🚓🚓🚓");
    console.log(urlPDF, publicUrlPDF, "😎😎😎");

    setArchivoXMLUrl(publicUrlXML);
    setArchivoPDFUrl(publicUrlPDF);

    return { pdfUrl: publicUrlPDF, xmlUrl: publicUrlXML };
  };

  const handleBuscarCliente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const valor = raw.toLowerCase();
    setCliente(raw);

    const source = Array.isArray(clientes) ? clientes : [];

    if (valor.length > 2) {
      const filtrados = source.filter((c: any) => {
        const nombre = (c?.nombre_agente_completo ?? "").toLowerCase();
        const correo = (c?.correo ?? "").toLowerCase();
        const rfc = (c?.rfc ?? "").toLowerCase();
        const id = String(c?.id_agente ?? "").toLowerCase();

        if (isProveedorMode) {
          return nombre.includes(valor) || id.includes(valor) || correo.includes(valor);
        }
        return (
          nombre.includes(valor) ||
          correo.includes(valor) ||
          rfc.includes(valor) ||
          id.includes(valor)
        );
      });
      setClientesFiltrados(filtrados);
      setMostrarSugerencias(true);
    } else {
      setClientesFiltrados([]);
      setMostrarSugerencias(false);
    }
  };

  const handleFetchClients = useCallback(() => {
    setLoading(true);
    fetchAgentes({}, {} as TypeFilters, (data) => {
      setClientes(toArray(data) as Agente[]);
      setLoading(false);
    }).catch((error) => {
      console.error("Error fetching agents:", error);
      setLoading(false);
    });
  }, []);

  const handlefecthProveedores = useCallback(() => {
    setLoading(true);
    fecthProveedores({}, {} as TypeFilters, (data) => {
      setClientes(normalizeProveedoresAsAgentes(data));
      setLoading(false);
    }).catch((error) => {
      console.error("Error fetching proveedores:", error);
      setLoading(false);
    });
  }, []);

  const cargarEmpresasAgente = async (id: string) => {
    if (!id) { console.error("ID no proporcionado"); return; }
    setLoadingEmpresas(true);
    setEmpresaSeleccionada(null);
    try {
      const empresas = isProveedorMode
        ? await fetchProveedoresDataFiscal(id)
        : await fetchEmpresasAgentesDataFiscal(id);
      setEmpresasAgente(empresas || []);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      setEmpresasAgente([]);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const resetearCampos = useCallback(() => {
    setFacturaData(null);
    setCliente(pagoData?.id_agente || agentId || "");
    setClienteSeleccionado(null);
    setArchivoPDF(null);
    setArchivoXML(null);
    setEmpresasAgente([]);
    setEmpresaSeleccionada(null);
    setModoFacturaProveedor("nueva");
    setUuidBusqueda("");
    setFacturaEncontrada(null);
    setFacturaPagada(pagoData ? true : !hasItems ? true : false);
    setClientesFiltrados([]);
    setMostrarSugerencias(false);
    setErrors({});
    setFacturado(null);
    setPropinaActivaPrevia(false);
    setPropinaMontoPrevia("");
    setBatchAsociaciones((prev) => prev.map((x) => ({ ...x, monto_asociar: "" })));
  }, [pagoData, agentId, hasItems]);

  const abrirModal = useCallback(() => {
    resetearCampos();
    setMostrarModal(true);
    handleFetchClients();
  }, [resetearCampos, handleFetchClients]);

  const abrirModalProv = useCallback(() => {
    resetearCampos();
    setMostrarModal(true);
    if (!isProveedorBatch) handlefecthProveedores();
  }, [resetearCampos, handlefecthProveedores, isProveedorBatch]);

  const cerrarModal = useCallback(() => {
    setMostrarModal(false);
    resetearCampos();
    onSuccess();
  }, [resetearCampos, onSuccess]);

  const cerrarVistaPrevia = () => {
    setMostrarVistaPrevia(false);
    cerrarModal();
  };

  const handleFacturadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFacturado(safeNumStr(e.target.value));
  };

  const updateMontoBatch = (index: number, raw: string) => {
    const normalized = safeNumStr(raw);
    setBatchAsociaciones((prev) =>
      prev.map((it, i) => (i === index ? { ...it, monto_asociar: normalized } : it)),
    );
  };

  const handleChangeMontoBatchFacturaPrevia = (idx: number, raw: string) => {
    const normalized = safeNumStr(raw);
    const val = Number(normalized || 0);
    const row = batchAsociaciones[idx];
    const idSolicitud = String(row?.id_solicitud ?? "").trim();
    const maxThis = getMaximoAsignableSolicitud({ idSolicitud, excludeIndex: idx });
    if (val > maxThis) { updateMontoBatch(idx, maxThis.toFixed(2)); return; }
    updateMontoBatch(idx, normalized);
  };

  const handleChangeMontoSingleFacturaPrevia = (raw: string) => {
    const normalized = safeNumStr(raw);
    const val = Number(normalized || 0);
    const idSolicitud = String(proveedoresData?.id_solicitud ?? "").trim();
    const maxSolicitud = Number(
      facturadoPrevioMap?.[idSolicitud]?.maximo_asignar ?? saldoDisponibleFacturaPrevia,
    );
    const maxThis = Math.max(0, Math.min(maxSolicitud, saldoDisponibleFacturaPrevia));
    if (val > maxThis) { setFacturado(maxThis.toFixed(2)); return; }
    setFacturado(normalized);
  };

  const buscarFacturaPorUUID = async () => {
    const normalizeUUIDInput = (value: string) =>
      String(value ?? "")
        .trim()
        .toUpperCase()
        .replace(/[‐‑‒–—―−⁃﹘﹣－]/g, "-")
        .replace(/\s+/g, "")
        .replace(/[^A-F0-9-]/g, "");

    const uuid = normalizeUUIDInput(uuidBusqueda);
    if (!uuid) { alert("Debes ingresar el UUID de la factura"); return; }

    try {
      setBuscandoFactura(true);
      setFacturaEncontrada(null);
      setFacturadoPrevioData(null);

      const response = await fetch(
        `${URL}/mia/pago_proveedor/buscar_factura?uuid=${encodeURIComponent(uuid)}`,
        { method: "GET", headers: { "Content-Type": "application/json", "x-api-key": API_KEY } },
      );

      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.message || "No se pudo buscar la factura");

      const factura = json?.data ?? json ?? null;
      if (!factura) { alert("No se encontró una factura con ese UUID"); return; }

      const saldoDisponible = Number(factura?.restante_por_facturar ?? 0);
      if (!Number.isFinite(saldoDisponible) || saldoDisponible <= 0) {
        alert("La factura encontrada ya no tiene saldo disponible para asignar.");
        return;
      }

      if (isProveedorBatch) {
        const proveedoresPermitidos = new Set(
          batchAsociaciones.map((x) => String(x.id_proveedor || "").trim()).filter(Boolean),
        );
        const idProveedorFactura = String(
          factura?.id_proveedor ?? factura?.id_agente ?? factura?.proveedoresData?.id_proveedor ?? "",
        ).trim();
      } else if (isProveedorMode) {
        const idProveedorEsperado = String(
          id_proveedor ?? proveedoresData?.id_proveedor ?? clienteSeleccionado?.id_agente ?? "",
        ).trim();
        const idProveedorFactura = String(
          factura?.id_proveedor ?? factura?.id_agente ?? factura?.proveedoresData?.id_proveedor ?? "",
        ).trim();
        if (!idProveedorFactura || idProveedorFactura !== idProveedorEsperado) {
          alert(
            `La factura encontrada no corresponde al proveedor seleccionado.\n` +
              `Esperado: ${idProveedorEsperado || "N/D"}\n` +
              `Recibido: ${idProveedorFactura || "N/D"}`,
          );
          return;
        }
      }

      setFacturaEncontrada(factura);
      alert("Factura encontrada correctamente");
    } catch (error) {
      console.error("Error buscando factura por UUID:", error);
      alert("Error al buscar la factura");
    } finally {
      setBuscandoFactura(false);
    }
  };

  const asignarFacturaPrevia = async () => {
    try {
      if (!facturaEncontrada?.uuid_factura) { alert("No hay una factura encontrada válida"); return; }

      const saldoDisponible = Number(facturaEncontrada?.restante_por_facturar ?? 0);
      if (!Number.isFinite(saldoDisponible) || saldoDisponible <= 0) {
        alert("La factura ya no tiene saldo disponible para asignar.");
        return;
      }

      let proveedoresPayloadFinal: any = null;
      let totalAsignado = 0;

      if (isProveedorBatch) {
        const rowsValidas = batchAsociaciones.filter((x) => Number(x.monto_asociar || 0) > 0);
        if (!rowsValidas.length) { alert("Debes capturar al menos un monto a asignar."); return; }

        totalAsignado = round2(rowsValidas.reduce((acc, x) => acc + Number(x.monto_asociar || 0), 0));
        if (totalAsignado > saldoDisponible) {
          alert("El total a asignar excede el saldo disponible de la factura.");
          return;
        }

        for (const row of rowsValidas) {
          const idSolicitud = String(row?.id_solicitud ?? "").trim();
          const monto = Number(row?.monto_asociar || 0);
          const maximoAsignar = Number(facturadoPrevioMap?.[idSolicitud]?.maximo_asignar ?? 0);
          if (monto > maximoAsignar) {
            alert(`El monto de la solicitud ${idSolicitud} excede el máximo permitido.`);
            return;
          }
        }

        proveedoresPayloadFinal = rowsValidas.map((x) => {
          const idSolicitud = String(x?.id_solicitud ?? "").trim();
          return {
            id_solicitud: x.id_solicitud,
            id_proveedor: x.id_proveedor,
            monto_asociar: Number(x.monto_asociar || 0),
            monto_solicitado: Number(
              facturadoPrevioMap?.[idSolicitud]?.monto_solicitado ??
                x.raw?.monto_solicitado ?? x.raw?.costo_proveedor ?? x.raw?.monto_por_facturar ?? 0,
            ),
          };
        });
      } else if (isProveedorMode) {
        const monto = Number(facturado || 0);
        const idSolicitud = String(proveedoresData?.id_solicitud ?? "").trim();
        const maximoAsignar = Number(
          facturadoPrevioMap?.[idSolicitud]?.maximo_asignar ?? saldoDisponible,
        );
        if (!monto || monto <= 0) { alert("Debes capturar un monto a asignar."); return; }
        if (monto > saldoDisponible) { alert("El monto a asignar excede el saldo disponible de la factura."); return; }
        if (monto > maximoAsignar) { alert("El monto a asignar excede el máximo permitido para la solicitud."); return; }

        totalAsignado = monto;
        proveedoresPayloadFinal = {
          ...(proveedoresData ?? {}),
          monto_asociar: monto,
          monto_solicitado: Number(
            facturadoPrevioMap?.[idSolicitud]?.monto_solicitado ??
              proveedoresData?.monto_solicitado ?? proveedoresData?.costo_proveedor ??
              proveedoresData?.monto_por_facturar ?? 0,
          ),
        };
      } else {
        alert("Este flujo aplica solo para proveedor.");
        return;
      }

      const propinaMonto = propinaActivaPrevia ? Math.max(0, Number(propinaMontoPrevia || 0)) : 0;

      const payload = {
        uuid_cfdi: facturaEncontrada.uuid_factura,
        proveedoresData: proveedoresPayloadFinal,
        ...(propinaActivaPrevia && propinaMonto > 0
          ? { propina_data: { tiene_propina: true, monto_propina: propinaMonto, detectada_xml: false } }
          : {}),
      };

      setAsignandoFacturaPrevia(true);
      const response = await fetch(`${URL}/mia/pago_proveedor/asignar_factura_previa`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.message || "No se pudo asignar la factura previa");

      alert("Factura asignada exitosamente");
      cerrarModal();
    } catch (error: any) {
      console.error("Error asignando factura previa:", error);
      alert(error?.message || "Ocurrió un error al asignar la factura previa.");
    } finally {
      setAsignandoFacturaPrevia(false);
    }
  };

  const handlePagos = async ({
    url,
    fecha_vencimiento,
    tipoCambioData,
  }: {
    url?: string;
    fecha_vencimiento?: string;
    tipoCambioData?: { moneda: string; tipo_cambio: number; source: string; manual: boolean };
  }) => {
    try {
      setSubiendoArchivos(true);
      const { xmlUrl } = await subirArchivosAS3();
      if (!facturaData || !clienteSeleccionado || !pagoData) {
        throw new Error("Faltan datos necesarios para procesar el pago");
      }

      const totalFactura = parseFloat(facturaData.comprobante.total);
      let restante = totalFactura;
      const pagosAsociados: any[] = [];
      const raw_Ids = pagoData.rawIds || [pagoData.raw_id];
      const saldos2 = pagoData.saldos || [pagoData.monto_por_facturar];

      for (let i = 0; i < raw_Ids.length; i++) {
        if (restante <= 0) break;
        const montoAsignar = Math.min(restante, Number(saldos2[i] || 0));
        pagosAsociados.push({ raw_id: raw_Ids[i], monto: montoAsignar });
        restante -= montoAsignar;
      }

      if (raw_Ids.length < 2) {
        const basePayload = {
          fecha_emision: facturaData.comprobante.fecha.split("T")[0],
          estado: "Confirmada",
          usuario_creador: clienteSeleccionado.id_agente,
          id_agente: clienteSeleccionado.id_agente,
          total: parseFloat(facturaData.comprobante.total),
          subtotal: parseFloat(facturaData.comprobante.subtotal),
          impuestos: parseFloat(facturaData.impuestos?.traslado?.importe || "0.00"),
          saldo: restante,
          rfc: facturaData.receptor.rfc,
          id_empresa: empresaSeleccionada?.id_empresa || null,
          uuid_factura: facturaData.timbreFiscal.uuid,
          rfc_emisor: facturaData.emisor.rfc,
          url_pdf: url ? url : archivoPDFUrl,
          url_xml: xmlUrl,
          ...(shouldIncludeFechaVencimiento ? { fecha_vencimiento: fecha_vencimiento || null } : {}),
        };

        const response = await fetch(`${URL}/mia/factura/CrearFacturaDesdeCargaPagos`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
          body: JSON.stringify({ ...basePayload, raw_id: raw_Ids[0] }),
        });
        if (!response.ok) throw new Error("Error al procesar el pago");
        alert("Factura asignada al pago exitosamente");
        cerrarVistaPrevia();
      } else {
        const facturaPayload = {
          fecha_emision: facturaData.comprobante.fecha.split("T")[0],
          estado: "Confirmada",
          usuario_creador: clienteSeleccionado.id_agente,
          id_agente: clienteSeleccionado.id_agente,
          total: totalFactura,
          subtotal: parseFloat(facturaData.comprobante.subtotal),
          impuestos: parseFloat(facturaData.impuestos?.traslado?.importe || "0.00"),
          saldo: 0,
          rfc: facturaData.receptor.rfc,
          id_empresa: empresaSeleccionada?.id_empresa || null,
          uuid_factura: facturaData.timbreFiscal.uuid,
          rfc_emisor: facturaData.emisor.rfc,
          url_pdf: url ? url : archivoPDFUrl,
          url_xml: xmlUrl,
          ...(shouldIncludeFechaVencimiento ? { fecha_vencimiento: fecha_vencimiento || null } : {}),
        };

        const response = await fetch(`${URL}/mia/factura/CrearFacturasMultiplesPagos`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
          body: JSON.stringify({ factura: facturaPayload, pagos_asociados: pagosAsociados }),
        });
        if (!response.ok) throw new Error("Error al procesar el pago");
        alert("Factura asignada al pago exitosamente");
        cerrarVistaPrevia();
      }
    } catch (error) {
      console.error("Error en handlePagos:", error);
      alert("Error al procesar el pago");
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleConfirmarFactura = async ({
    payload,
    url,
    fecha_vencimiento,
    tipoCambioData,
    propinaData,
  }: {
    payload?: any;
    url?: string;
    fecha_vencimiento?: string;
    tipoCambioData?: { moneda: string; tipo_cambio: number; source: string; manual: boolean };
    propinaData?: { activa: boolean; monto: number; detectada: boolean } | null;
  }) => {
    try {
      setSubiendoArchivos(true);
      const { xmlUrl } = await subirArchivosAS3();

      let items = "";
      if (initialItems && initialItems.length > 0) {
        items = itemsJson;
      } else {
        items = JSON.stringify([]);
      }

      const isProveedorFlow = !!proveedoresData;
      const monedaFactura = normalizeCurrency(
        tipoCambioData?.moneda || facturaData?.comprobante?.moneda || "MXN",
      );
      const tipoCambioFactura = isMXNCurrency(monedaFactura)
        ? 1
        : Number(tipoCambioData?.tipo_cambio || 0);
      const requiereConversionProveedor = isProveedorFlow && !isMXNCurrency(monedaFactura);

      if (
        requiereConversionProveedor &&
        (!Number.isFinite(tipoCambioFactura) || tipoCambioFactura <= 0)
      ) {
        throw new Error("No se recibió un tipo de cambio válido desde la vista previa");
      }

      const totalFacturaOriginal = parseFloat(facturaData?.comprobante?.total || "0");
      const subtotalFacturaOriginal = parseFloat(facturaData?.comprobante?.subtotal || "0");
      const impuestosFacturaOriginal = parseFloat(facturaData?.impuestos?.traslado?.importe || "0.00");

      const totalFacturaMXN = convertAmountToMXN(totalFacturaOriginal, tipoCambioFactura, requiereConversionProveedor);
      const subtotalFacturaMXN = convertAmountToMXN(subtotalFacturaOriginal, tipoCambioFactura, requiereConversionProveedor);
      const impuestosFacturaMXN = convertAmountToMXN(impuestosFacturaOriginal, tipoCambioFactura, requiereConversionProveedor);

      let proveedoresPayloadFinal: any = null;

      if (isProveedorBatch) {
        proveedoresPayloadFinal = batchAsociaciones.map((x) => {
          const montoOriginal = Number(x.monto_asociar || 0);
          const montoMXN = convertAmountToMXN(montoOriginal, tipoCambioFactura, requiereConversionProveedor);
          return {
            id_solicitud: x.id_solicitud,
            id_proveedor: x.id_proveedor,
            monto_asociar: montoMXN,
            monto_solicitado: Number(
              x.raw?.monto_solicitado ?? x.raw?.costo_proveedor ?? x.raw?.monto_por_facturar ?? 0,
            ),
            montos_originales: {
              moneda: monedaFactura,
              tipo_cambio: tipoCambioFactura,
              tipo_cambio_source: tipoCambioData?.source || null,
              tipo_cambio_manual: !!tipoCambioData?.manual,
              monto_asociar: montoOriginal,
            },
          };
        });
      } else if (isProveedorMode) {
        const montoOriginal = Number(facturado || 0);
        const montoMXN = convertAmountToMXN(montoOriginal, facturaData, requiereConversionProveedor);
        proveedoresPayloadFinal = {
          ...(proveedoresData ?? {}),
          monto_asociar: montoMXN,
          montos_originales: {
            moneda: monedaFactura,
            tipo_cambio: tipoCambioFactura,
            tipo_cambio_source: tipoCambioData?.source || null,
            tipo_cambio_manual: !!tipoCambioData?.manual,
            monto_asociar: montoOriginal,
          },
        };
      } else {
        proveedoresPayloadFinal = null;
      }

      const totalAsociadoProveedor = isProveedorBatch
        ? round2(
            batchAsociaciones.reduce(
              (acc, x) =>
                acc +
                convertAmountToMXN(Number(x.monto_asociar || 0), tipoCambioFactura, requiereConversionProveedor),
              0,
            ),
          )
        : facturado
          ? convertAmountToMXN(Number(facturado || 0), tipoCambioFactura, requiereConversionProveedor)
          : 0;

      const saldoCalculado = isProveedorFlow
        ? round2(totalFacturaMXN - totalAsociadoProveedor)
        : round2(totalFacturaOriginal - initialItemsTotal);

      const idAgenteFinal = isProveedorBatch
        ? String(batchAsociaciones?.[0]?.id_proveedor || "")
        : id_proveedor || clienteSeleccionado?.id_agente || "";

      const usuarioCreadorFinal =
        clienteSeleccionado?.id_agente || agentId || pagoData?.id_agente || "";

      const basePayload: any = {
        fecha_emision: facturaData.comprobante.fecha.split("T")[0],
        estado: "Confirmada",
        usuario_creador: usuarioCreadorFinal,
        id_agente: idAgenteFinal,
        total: isProveedorFlow ? totalFacturaMXN : totalFacturaOriginal,
        subtotal: isProveedorFlow ? subtotalFacturaMXN : subtotalFacturaOriginal,
        impuestos: isProveedorFlow ? impuestosFacturaMXN : impuestosFacturaOriginal,
        saldo: round2(saldoCalculado),
        rfc: facturaData.receptor.rfc,
        id_empresa: empresaSeleccionada?.id_empresa || null,
        uuid_factura: facturaData.timbreFiscal.uuid,
        rfc_emisor: facturaData.emisor.rfc,
        url_pdf: url ? url : archivoPDFUrl,
        url_xml: xmlUrl || null,
        items,
        ...(shouldIncludeFechaVencimiento ? { fecha_vencimiento: fecha_vencimiento || null } : {}),
        ...(proveedoresPayloadFinal != null ? { proveedoresData: proveedoresPayloadFinal } : {}),
        ...(isProveedorFlow
          ? {
              montos_originales_factura: {
                moneda: normalizeCurrency(
                  tipoCambioData?.moneda || facturaData?.comprobante?.moneda || "MXN",
                ),
                tipo_cambio: isMXNCurrency(
                  tipoCambioData?.moneda || facturaData?.comprobante?.moneda || "MXN",
                )
                  ? 1
                  : Number(tipoCambioData?.tipo_cambio || 0),
                tipo_cambio_source: tipoCambioData?.source || null,
                tipo_cambio_manual: !!tipoCambioData?.manual,
                total: parseFloat(facturaData.comprobante.total),
                subtotal: parseFloat(facturaData.comprobante.subtotal),
                impuestos: parseFloat(facturaData.impuestos?.traslado?.importe || "0.00"),
              },
            }
          : {}),
        facturas: { facturaData },
        ...(propinaData?.activa && propinaData.monto > 0
          ? {
              propina_data: {
                tiene_propina: true,
                monto_propina: propinaData.monto,
                detectada_xml: propinaData.detectada ?? false,
              },
            }
          : {}),
      };

      const ENDPOINT = !proveedoresData
        ? `${URL}/mia/factura/CrearFacturaDesdeCarga`
        : `${URL}/mia/pago_proveedor/subir_factura`;

      console.log(ENDPOINT, "endpoint");

      if (basePayload.items !== "1") {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
          body: JSON.stringify(basePayload),
          credentials: "include",
        });

        if (!response.ok) {
          const backendMessage = await getResponseErrorMessage(response);
          throw new Error(backendMessage);
        }

        const facturaResponse = await response.json();
        setFacturaCreada(facturaResponse);
      }

      if (payload || proveedoresData) {
        alert("Factura asignada exitosamente");
        cerrarVistaPrevia();
      } else if (facturaPagada) {
        setMostrarConfirmacion(true);
      } else {
        alert("Documento guardado exitosamente");
        cerrarVistaPrevia();
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Ocurrió un error al guardar la factura.");
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleEnviar = async () => {
    const validationErrors = validateFacturaForm({
      clienteSeleccionado,
      archivoXML,
      isProveedorBatch,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!archivoXML) return;

    try {
      setSubiendoArchivos(true);
      setErrors({});

      const data = await parsearXML(archivoXML);
      const totalXml = Number(data?.comprobante?.total ?? 0);
      const propinaXml = data?.propina?.tienePropina ? Number(data.propina.monto || 0) : 0;
      const totalMaxAsociar = round2(totalXml + propinaXml);

      console.log("🚓🚓🚓🚓🚓informacion de xml", data);
      console.log("informacion🔽🔽🔽🔽🔽", data.emisor.rfc);

      const monedaXml = normalizeCurrency(data?.comprobante?.moneda || "MXN");
      const tipoCambioXml = Number(data?.comprobante?.tipoCambio || 0);

      if (
        !!proveedoresData &&
        !isMXNCurrency(monedaXml) &&
        (!Number.isFinite(tipoCambioXml) || tipoCambioXml <= 0)
      ) {
        alert(`La factura viene en ${monedaXml} y no trae un TipoCambio válido en el XML.`);
        return;
      }

      if (isProveedorMode) {
        const montoSingle = Number(facturado || 0);
        if (montoSingle > totalMaxAsociar) {
          alert(
            `El monto a asociar (${montoSingle.toFixed(2)}) no puede ser mayor al total de la factura${propinaXml > 0 ? " + propina" : ""} (${totalMaxAsociar.toFixed(2)}).`,
          );
          return;
        }
      }

      if (isProveedorBatch) {
        const rfcXml = String(data?.emisor?.rfc ?? "").trim().toUpperCase();
        const proveedorIds = Array.from(
          new Set(batchAsociaciones.map((x) => String(x.id_proveedor)).filter(Boolean)),
        );

        if (isProveedorMode) {
          const montoSingle = Number(facturado || 0);
          if (montoSingle > totalMaxAsociar) {
            alert(
              `El monto a asociar (${montoSingle.toFixed(2)}) no puede ser mayor al total de la factura${propinaXml > 0 ? " + propina" : ""} (${totalMaxAsociar.toFixed(2)}).`,
            );
            return;
          }
        }

        const rfcDBs = new Set<string>();
        for (const idProv of proveedorIds) {
          const dfs = await fetchDatosFiscalesProveedor(idProv);
          for (const row of dfs) {
            const r = String(row?.rfc ?? "").trim().toUpperCase();
            if (r) rfcDBs.add(r);
          }
        }

        const coincideRfc = rfcDBs.has(rfcXml);
        if (!coincideRfc) {
          alert(
            `No hubo coincidencia de RFC.\nRFC XML(emisor): ${rfcXml}\nRFCs en DB: ${Array.from(rfcDBs).join(", ")}`,
          );
          return;
        }

        if (batchTotalAsociar > totalMaxAsociar) {
          alert(
            `La suma de montos a asociar (${batchTotalAsociar.toFixed(2)}) no puede ser mayor al total de la factura${propinaXml > 0 ? " + propina" : ""} (${totalMaxAsociar.toFixed(2)}).`,
          );
          return;
        }

        setFacturaData(data);
        setMostrarModal(false);
        setMostrarVistaPrevia(true);
        return;
      }

      if (empresasAgente.length === 0 && clienteSeleccionado?.id_agente) {
        await cargarEmpresasAgente(clienteSeleccionado.id_agente);
      }

      const rfcReceptor = !proveedoresData ? data.receptor.rfc : data.emisor.rfc;
      const empresaCoincidente = empresasAgente.find((emp) => emp.rfc === rfcReceptor);

      console.log(rfcReceptor, "cambios", rfcReceptor);

      if (!empresaCoincidente) {
        confirm(`No se encontró una empresa con RFC ${rfcReceptor} para este cliente. Deberas crear empresa`);
        return;
      } else {
        setEmpresaSeleccionada(empresaCoincidente);
      }

      setFacturaData(data);
      setMostrarModal(false);
      setMostrarVistaPrevia(true);
    } catch (error: any) {
      const msg = error?.message || "Error al procesar el XML";
      setErrors((prev) => ({ ...prev, archivoXML: msg }));
      console.error(error);
    } finally {
      setSubiendoArchivos(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <button
        onClick={proveedoresData ? abrirModalProv : abrirModal}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Subir Nueva Factura
      </button>

      {mostrarModal && (
        <ModalSubirFactura
          text={text}
          nombre={nombre}
          mostrarSwitchFacturaProveedor={mostrarSwitchFacturaProveedor}
          modoFacturaProveedor={modoFacturaProveedor}
          setModoFacturaProveedor={setModoFacturaProveedor}
          isProveedorBatch={isProveedorBatch}
          isProveedorMode={isProveedorMode}
          isClienteBloqueado={isClienteBloqueado}
          clienteSeleccionado={clienteSeleccionado}
          cliente={cliente}
          agentId={agentId}
          pagoData={pagoData}
          errors={errors}
          mostrarSugerencias={mostrarSugerencias}
          clientesFiltrados={clientesFiltrados}
          handleBuscarCliente={handleBuscarCliente}
          setMostrarSugerencias={setMostrarSugerencias}
          setCliente={setCliente}
          setClienteSeleccionado={setClienteSeleccionado}
          cargarEmpresasAgente={cargarEmpresasAgente}
          esFacturaNuevaMode={esFacturaNuevaMode}
          esFacturaSubidaMode={esFacturaSubidaMode}
          archivoXML={archivoXML}
          archivoPDF={archivoPDF}
          setArchivoXML={setArchivoXML}
          setArchivoPDF={setArchivoPDF}
          uuidBusqueda={uuidBusqueda}
          setUuidBusqueda={setUuidBusqueda}
          facturaEncontrada={facturaEncontrada}
          loadingFacturadoPrevio={loadingFacturadoPrevio}
          buscandoFactura={buscandoFactura}
          asignandoFacturaPrevia={asignandoFacturaPrevia}
          batchAsociaciones={batchAsociaciones}
          batchTotalAsociar={batchTotalAsociar}
          totalAsignadoFacturaPrevia={totalAsignadoFacturaPrevia}
          facturadoPrevioMap={facturadoPrevioMap}
          singleAsociacionProveedor={singleAsociacionProveedor}
          facturado={facturado}
          monedaFacturaPrevia={monedaFacturaPrevia}
          requiereConversionProveedorPrevia={requiereConversionProveedorPrevia}
          tipoCambioFacturaPrevia={tipoCambioFacturaPrevia}
          handleChangeMontoBatchFacturaPrevia={handleChangeMontoBatchFacturaPrevia}
          handleChangeMontoSingleFacturaPrevia={handleChangeMontoSingleFacturaPrevia}
          formatCurrency={formatCurrency}
          fromMXNToOriginal={fromMXNToOriginal}
          getPreviewConversion={getPreviewConversion}
          facturaPagada={facturaPagada}
          setFacturaPagada={setFacturaPagada}
          hasItems={hasItems}
          subiendoArchivos={subiendoArchivos}
          cerrarModal={cerrarModal}
          handleEnviar={handleEnviar}
          buscarFacturaPorUUID={buscarFacturaPorUUID}
          asignarFacturaPrevia={asignarFacturaPrevia}
          propinaActivaPrevia={propinaActivaPrevia}
          setPropinaActivaPrevia={setPropinaActivaPrevia}
          propinaMontoPrevia={propinaMontoPrevia}
          setPropinaMontoPrevia={setPropinaMontoPrevia}
        />
      )}

      {mostrarVistaPrevia && (
        <VistaPreviaModal
          facturaData={facturaData}
          pagoData={pagoData}
          itemsTotal={getItemsTotal()}
          archivoPDF={archivoPDF}
          isProveedorBatch={isProveedorBatch}
          batchAsociaciones={batchAsociaciones}
          updateMontoBatch={updateMontoBatch}
          batchTotalAsociar={batchTotalAsociar}
          showFechaVencimiento={!pagoData && !proveedoresData}
          proveedoresData={proveedoresData}
          onConfirm={(pdfUrl, fecha_vencimiento, tipoCambioData, propinaData) => {
            setArchivoPDFUrl(pdfUrl);

            if (hasItems) {
              setFacturaPagada(false);
              handleConfirmarFactura({
                url: pdfUrl ?? undefined,
                fecha_vencimiento,
                tipoCambioData,
                propinaData,
              });
              return;
            }

            setFacturaPagada(true);
            if (pagoData && facturaData) {
              handlePagos({ url: pdfUrl ?? undefined, fecha_vencimiento, tipoCambioData });
            } else {
              handleConfirmarFactura({
                url: pdfUrl ?? undefined,
                fecha_vencimiento,
                tipoCambioData,
                propinaData,
              });
            }
          }}
          onClose={cerrarVistaPrevia}
          isLoading={subiendoArchivos}
        />
      )}

      {facturaData && getItemsTotal() > 0 && (
        <div className="mt-3 p-3 rounded border text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total ítems seleccionados:</span>
            <span>
              {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                getItemsTotal(),
              )}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-medium">Total de la factura (XML):</span>
            <span>
              {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                parseFloat(facturaData?.comprobante?.total || "0"),
              )}
            </span>
          </div>
        </div>
      )}

      <ConfirmacionModal
        isOpen={mostrarConfirmacion}
        onCloseVistaPrevia={() => {
          cerrarVistaPrevia();
          setAsignacionPayload(null);
        }}
        onClose={() => {
          setMostrarConfirmacion(false);
          setAsignacionPayload(null);
        }}
        onConfirm={() => {
          setMostrarAsignarFactura(true);
          setAsignacionPayload(null);
        }}
        onSaveOnly={() => {
          handleConfirmarFactura({});
          setAsignacionPayload(null);
        }}
      />

      {mostrarAsignarFactura && (
        <AsignarFacturaModal
          isOpen={mostrarAsignarFactura}
          onCloseVistaPrevia={() => {
            cerrarVistaPrevia();
            setAsignacionPayload(null);
          }}
          onClose={() => {
            setMostrarAsignarFactura(false);
            setAsignacionPayload(null);
          }}
          onAssign={(payload) => {
            setAsignacionPayload(payload);
            handleConfirmarFactura({ payload });
          }}
          facturaData={facturaData}
          id_factura={facturaCreada?.data?.id_factura}
          empresaSeleccionada={empresaSeleccionada}
          clienteSeleccionado={clienteSeleccionado}
          archivoPDFUrl={archivoPDFUrl}
          archivoXMLUrl={archivoXMLUrl}
          saldo={facturaCreada?.data?.saldo}
        />
      )}
    </>
  );
}
