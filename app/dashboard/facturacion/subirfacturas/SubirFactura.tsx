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

interface SubirFacturaProps {
  proveedoresRfc:String;
  pagoId?: string; // id del saldo tomado
  id_proveedor?: string;
  pagoData?: Pago | null; // datos del pago
  proveedoresData?: any | null; // puede ser object o array
  isBatch?: boolean;
  onSuccess: () => void; // callback al subir factura
  agentId?: string; // id del agente a precargar
  initialItems?: string[]; // ids de items seleccionados desde la tabla
  itemsJson?: string; // items en formato json
  autoOpen?: boolean; // abre el modal de inmediato
  onCloseExternal?: () => void; // permite cerrar desde el padre (opcional)
  initialItemsTotal?: number; // total de ítems opcional
  id_servicio?: string;
}

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

interface Pago {
  id_agente: string;
  raw_id: string;
  rawIds: any[];
  id_pago: string;
  pago_referencia: string;
  pago_concepto: string;
  pago_fecha_pago: string;
  metodo_de_pago: string;
  tipo_tarjeta?: string;
  tipo_de_tarjeta?: string;
  banco?: string;
  banco_tarjeta?: string;
  total: number;
  subtotal: number | null;
  impuestos: number | null;
  pendiente_por_cobrar: number;
  last_digits?: string;
  ult_digits?: number;
  autorizacion_stripe?: string;
  numero_autorizacion?: string;
  monto_por_facturar: any;
  monto: any;
  is_facturable: number;
  saldos: any[];
}

const AUTH = {
  "x-api-key": API_KEY,
};

export const getEmpresasDatosFiscales = async (agent_id: string) => {
  try {
    const response = await fetch(
      `${URL}/v1/mia/agentes/empresas-con-datos-fiscales?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Error al obtener empresas con datos fiscales:", error);
    throw error;
  }
};

// == interfaces para clientes / UI reutilizable
export interface Agente {
  id_agente: string;
  nombre_agente_completo: string;
  correo: string;
  rfc?: string;
  razon_social?: string;
}

// =======================
// NUEVO: payload batch
// =======================
type AsociacionSolicitudProveedor = {
  id_solicitud: string;
  id_proveedor: string;
  monto_asociar: string; // string para input controlado
  // puedes conservar campos extra si quieres:
  raw?: any;
};

// helpers batch
const toArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const extractFirstEmail = (text?: string): string => {
  if (!text) return "";
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m?.[0] ?? "";
};

const normalizeProveedoresAsAgentes = (res: any): Agente[] => {
  const arr = toArray(res);
  return arr
    .map((p: any) => ({
      id_agente: String(p?.id_proveedor ?? p?.id ?? ""),
      nombre_agente_completo: String(p?.proveedor ?? ""),
      correo: String(p?.correo ?? extractFirstEmail(p?.contactos_convenio) ?? ""),
      rfc: p?.rfc,
      razon_social: p?.razon_social,
    }))
    .filter((x) => x.id_agente && x.nombre_agente_completo);
};

const safeNumStr = (raw: string) => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  return parts.length <= 1
    ? parts[0]
    : `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
};

const getIdSolicitudFromRow = (row: any): string => {
  // tolerante a campos variantes
  console.log(row.id_solicitud_proveedor,"000000000🔽🔽🔽🔽")
  return String(
      row?.id_solicitud_proveedor ??
      row?.row_id??
      row?.id_solicitud ??
      row?.id_solicitud_pago_proveedor ??
      row?.id_solicitud_prov ??
      row?.id_solicitud_pp ??
      ""
  );
};

const getIdProveedorFromRow = (row: any): string => {
  console.log(row,"🤬🤬🤬,informacion de hote")
  return String(row?.id_proveedor ?? row?.proveedor_id ?? row?.id ?? "");
};
const getCodigoHotelFromRow = (row: any): string => {
  console.log(row,"🤬🤬🤬,informacion de hote")
  return String(row?.codigo_hotel ?? row?.proveedor_id ?? row?.id ?? "");
};

export default function SubirFactura({
  pagoId,
  pagoData,
  id_proveedor = null,
  proveedoresRfc=null,
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
  // ================================
  // Flags de modo
  // ================================
  const isProveedorBatch = Array.isArray(proveedoresData); // NUEVO
  const isProveedorMode = !!proveedoresData && !isProveedorBatch; // proveedor single
  const isNormalAgenteMode = !proveedoresData; // flujo actual
  const nombre = proveedoresData ? "Proveedor" : "cliente";
  const text = proveedoresData
    ? "Asignar factura a solicitud"
    : "Asignar factura al pago";

  const [asignacionPayload, setAsignacionPayload] = useState<any>(null);

  // ========== NUEVO: batch asociaciones ==========
  const [batchAsociaciones, setBatchAsociaciones] = useState<
    AsociacionSolicitudProveedor[]
  >([]);

  // inicializar batch cuando proveedoresData es array
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

        console.log(id_solicitud,"🤬🤬🤬🤬",id_proveedor,"cam",row)

        return {
          id_solicitud,
          id_proveedor,
          codigo_hotel,
          monto_asociar: "",
          raw: row,
        };
      })
      .filter((x) => x.id_solicitud);
      console.log(normalized,"informacion",arr)
    setBatchAsociaciones(normalized);

  }, [isProveedorBatch, proveedoresData]);


  const batchTotalAsociar = useMemo(() => {
    if (!isProveedorBatch) return 0;
    const sum = batchAsociaciones.reduce((acc, it) => {
      const n = Number(it.monto_asociar || 0);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    return Math.round((sum + Number.EPSILON) * 100) / 100;
  }, [isProveedorBatch, batchAsociaciones]);

  const updateMontoBatch = (index: number, raw: string) => {
    const normalized = safeNumStr(raw);
    setBatchAsociaciones((prev) =>
      prev.map((it, i) => (i === index ? { ...it, monto_asociar: normalized } : it))
    );
  };

  // ========== calcular total items ==========
  const getItemsTotal = useCallback((): number => {
    const itemsTotalProp =
      typeof initialItemsTotal === "number" ? initialItemsTotal : undefined;

    let total = 0;

    if (typeof itemsTotalProp === "number") {
      total = itemsTotalProp;
    } else if (Array.isArray(initialItems)) {
      total = initialItems.reduce(
        (acc, it: any) => acc + Number(it?.monto || 0),
        0
      );
    }

    return Math.round((total + Number.EPSILON) * 100) / 100;
  }, [initialItems, initialItemsTotal]);

  const hasItems = Array.isArray(initialItems) && initialItems.length > 0;

  // Estados iniciales
  const initialStates = {
    proveedoresData: null,
    id_proveedor: null,
    facturaData: null,
    cliente: pagoData?.id_agente || agentId || "",
    clienteSeleccionado: null,
    archivoPDF: null,
    archivoXML: null,
    empresasAgente: [],
    proveedores_data: null,
    empresaSeleccionada: null,
    facturaPagada: pagoData ? true : !hasItems ? true : false,
  };

  const [facturaCreada, setFacturaCreada] = useState<any>(null);
  const [facturaData, setFacturaData] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [cliente, setCliente] = useState(initialStates.cliente);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Agente | null>(
    initialStates.clienteSeleccionado
  );
  const [archivoPDF, setArchivoPDF] = useState<File | null>(
    initialStates.archivoPDF
  );
  const [archivoXML, setArchivoXML] = useState<File | null>(
    initialStates.archivoXML
  );
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
  const [empresaSeleccionada, setEmpresaSeleccionada] =
    useState<EmpresaFromAgent | null>(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [facturaPagada, setFacturaPagada] = useState(false);
  const [mostrarAsignarFactura, setMostrarAsignarFactura] = useState(false);

  // Bloqueamos cliente en batch porque NO debe mostrarse / editarse
  const isClienteBloqueado = !!agentId || !!pagoData?.id_agente || isProveedorBatch;

  const [uuid, setUuid] = useState(false);
  const [facturado, setFacturado] = useState<string | null>(null);

  console.log("proveedores",proveedoresData)

  // Autoabrir el modal si hay pagoData
  useEffect(() => {
    if (pagoData) {
      abrirModal();
    }
  }, [pagoData]);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setAsignacionPayload(initialItems);
    }
  }, [initialItems]);

  const subirArchivosAS3 = async (): Promise<{
    pdfUrl: string | null;
    xmlUrl: string;
  }> => {
    if (!archivoXML) {
      throw new Error("El archivo XML es requerido");
    }

    try {
      setSubiendoArchivos(true);
      const folder = "comprobantes";

      // Subir XML (requerido)
      const { url: urlXML, publicUrl: publicUrlXML } =
        await obtenerPresignedUrl(archivoXML.name, archivoXML.type, folder);
      await subirArchivoAS3(archivoXML, urlXML);

      // Subir PDF (opcional)
      let pdfUrl = null;
      if (archivoPDF) {
        const { url: urlPDF, publicUrl: publicUrlPDF } =
          await obtenerPresignedUrl(archivoPDF.name, archivoPDF.type, folder);
        await subirArchivoAS3(archivoPDF, urlPDF);
        pdfUrl = publicUrlPDF;
      }

      return { pdfUrl, xmlUrl: publicUrlXML };
    } catch (error) {
      console.error("Error al subir archivos:", error);
      throw error;
    } finally {
      setSubiendoArchivos(false);
    }
  };

  // Función para buscar clientes / proveedores (single) por nombre
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
      const normalized = toArray(data) as Agente[];
      setClientes(normalized);
      setLoading(false);
    })
      .catch((error) => {
        console.error("Error fetching agents:", error);
        setLoading(false);
      });
  }, []);

  const handlefecthProveedores = useCallback(() => {
    setLoading(true);
    fecthProveedores({}, {} as TypeFilters, (data) => {
      const normalized = normalizeProveedoresAsAgentes(data);
      setClientes(normalized);
      setLoading(false);
    })
      .catch((error) => {
        console.error("Error fetching proveedores:", error);
        setLoading(false);
      });
  }, []);

  // Auto seleccionar cliente/proveedor SOLO si NO es batch
  useEffect(() => {
    if (isProveedorBatch) return;
    if (!Array.isArray(clientes) || clientes.length === 0) return;

    // MODO PROVEEDOR SINGLE
    if (isProveedorMode) {
      const targetId = id_proveedor ? String(id_proveedor) : "";

      let matching: Agente | undefined =
        targetId
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
              String(c.nombre_agente_completo ?? "")
                .trim()
                .toLowerCase() === targetName
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

    // MODO AGENTE (normal)
    const targetId = pagoData?.id_agente || agentId;
    if (!targetId) return;

    const matching = clientes.find(
      (c) => String(c.id_agente) === String(targetId)
    );
    if (matching) {
      setCliente(matching.nombre_agente_completo);
      setClienteSeleccionado(matching);
      cargarEmpresasAgente(matching.id_agente);
    }
  }, [
    clientes,
    agentId,
    pagoData?.id_agente,
    id_proveedor,
    proveedoresData,
    isProveedorMode,
    isProveedorBatch,
  ]);

  // Reset campos
  const resetearCampos = useCallback(() => {
    setFacturaData(initialStates.facturaData);
    setCliente(initialStates.cliente);
    setClienteSeleccionado(initialStates.clienteSeleccionado);
    setArchivoPDF(initialStates.archivoPDF);
    setArchivoXML(initialStates.archivoXML);
    setEmpresasAgente(initialStates.empresasAgente);
    setEmpresaSeleccionada(initialStates.empresaSeleccionada);
    setFacturaPagada(initialStates.facturaPagada);
    setClientesFiltrados([]);
    setMostrarSugerencias(false);
    setErrors({});
    setFacturado(null);

    // batch: no borramos ids, solo montos
    setBatchAsociaciones((prev) =>
      prev.map((x) => ({ ...x, monto_asociar: "" }))
    );
  }, []);

  const abrirModal = useCallback(() => {
    resetearCampos();
    setMostrarModal(true);
    handleFetchClients();
  }, [resetearCampos, handleFetchClients]);

  const abrirModalProv = useCallback(() => {
    resetearCampos();
    setMostrarModal(true);

    // Si es batch, NO cargamos lista de proveedores
    if (!isProveedorBatch) {
      handlefecthProveedores();
    }
  }, [resetearCampos, handlefecthProveedores, isProveedorBatch]);

  useEffect(() => {
    if (autoOpen && proveedoresData) {
      abrirModalProv();
    } else if (autoOpen && !proveedoresData) {
      abrirModal();
    }
  }, [autoOpen, proveedoresData, abrirModal, abrirModalProv]);

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
    const normalized = safeNumStr(e.target.value);
    setFacturado(normalized);
  };

  // Cargar empresas fiscales del agente / proveedor (single)
  const cargarEmpresasAgente = async (id: string) => {
    if (!id) {
      console.error("ID no proporcionado");
      return;
    }

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

  const handlePagos = async ({
    url,
    fecha_vencimiento,
  }: {
    url?: string;
    fecha_vencimiento?: string;
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
        pagosAsociados.push({
          raw_id: raw_Ids[i],
          monto: montoAsignar,
        });

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
          impuestos: parseFloat(
            facturaData.impuestos?.traslado?.importe || "0.00"
          ),
          saldo: restante,
          rfc: facturaData.receptor.rfc,
          id_empresa: empresaSeleccionada?.id_empresa || null,
          uuid_factura: facturaData.timbreFiscal.uuid,
          rfc_emisor: facturaData.emisor.rfc,
          url_pdf: url ? url : archivoPDFUrl,
          url_xml: xmlUrl,
          fecha_vencimiento: fecha_vencimiento || null,
        };

        const pagoPayload = {
          ...basePayload,
          raw_id: raw_Ids[0],
        };

        const response = await fetch(
          `${URL}/mia/factura/CrearFacturaDesdeCargaPagos`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY,
            },
            body: JSON.stringify(pagoPayload),
          }
        );
        if (!response.ok) {
          throw new Error("Error al procesar el pago");
        }

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
          impuestos: parseFloat(
            facturaData.impuestos?.traslado?.importe || "0.00"
          ),
          saldo: 0,
          rfc: facturaData.receptor.rfc,
          id_empresa: empresaSeleccionada?.id_empresa || null,
          uuid_factura: facturaData.timbreFiscal.uuid,
          rfc_emisor: facturaData.emisor.rfc,
          url_pdf: url ? url : archivoPDFUrl,
          url_xml: xmlUrl,
          fecha_vencimiento: fecha_vencimiento || null,
        };

        const payloadCompleto = {
          factura: facturaPayload,
          pagos_asociados: pagosAsociados,
        };

        const response = await fetch(
          `${URL}/mia/factura/CrearFacturasMultiplesPagos`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY,
            },
            body: JSON.stringify(payloadCompleto),
          }
        );
        if (!response.ok) {
          throw new Error("Error al procesar el pago");
        }

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
  }: {
    payload?: any;
    url?: string;
    fecha_vencimiento?: string;
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

      // ===========================
      // NUEVO: proveedores payload
      // ===========================
      let proveedoresPayloadFinal: any = null;

      if (isProveedorBatch) {
        // Validar montos batch
        const invalid = batchAsociaciones.some(
          (x) => !x.monto_asociar || Number(x.monto_asociar) <= 0
        );
        if (invalid) {
          alert("Debes capturar un monto válido para cada solicitud.");
          return;
        }

        console.log("informacion",batchAsociaciones)

        proveedoresPayloadFinal = batchAsociaciones.map((x) => ({
          id_solicitud: x.id_solicitud,
          id_proveedor: x.id_proveedor,
          monto_asociar: Number(x.monto_asociar || 0),
          monto_solicitado:x.raw.costo_proveedor,
        }));
      } else if (isProveedorMode) {
        // proveedor single: mantenemos tu objeto original y agregamos monto
        proveedoresPayloadFinal = {
          ...(proveedoresData ?? {}),
          monto_asociar: facturado ? Number(facturado) : null,
        };
      } else {
        proveedoresPayloadFinal = null;
      }

      const totalFactura = parseFloat(facturaData?.comprobante?.total || "0");

      const totalAsociadoProveedor = isProveedorBatch
        ? batchTotalAsociar
        : facturado
        ? Number(facturado || 0)
        : 0;

      const saldoCalculado =
        isProveedorBatch || isProveedorMode
          ? totalFactura - totalAsociadoProveedor
          : totalFactura - initialItemsTotal;

      // id_agente:
      // - normal: clienteSeleccionado.id_agente
      // - proveedor single: id_proveedor o clienteSeleccionado.id_agente
      // - proveedor batch: mandamos el primero para cumplir estructura, pero la asociación real va en proveedoresData[]
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
        total: totalFactura,
        subtotal: parseFloat(facturaData.comprobante.subtotal),
        impuestos: parseFloat(facturaData.impuestos?.traslado?.importe || "0.00"),
        saldo: Math.round((saldoCalculado + Number.EPSILON) * 100) / 100,
        rfc: facturaData.receptor.rfc,
        id_empresa: empresaSeleccionada?.id_empresa || null,
        uuid_factura: facturaData.timbreFiscal.uuid,
        rfc_emisor: facturaData.emisor.rfc,
        url_pdf: url ? url : archivoPDFUrl,
        url_xml: xmlUrl || null,
        items: items,
        fecha_vencimiento: fecha_vencimiento || null,
        ...(proveedoresPayloadFinal != null ? { proveedoresData: proveedoresPayloadFinal } : {}),
      };

      const ENDPOINT = !proveedoresData
        ? `${URL}/mia/factura/CrearFacturaDesdeCarga`
        : `${URL}/mia/pago_proveedor/subir_factura`;

      if (basePayload.items !== "1") {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(basePayload),
        });

        if (!response.ok) {
          throw new Error("Error al asignar la factura");
        }

        const facturaResponse = await response.json();
        setFacturaCreada(facturaResponse);
      }

      if (payload ||proveedoresData) {
        alert("Factura asignada exitosamente");
        cerrarVistaPrevia();
      } else if (facturaPagada) {
        setMostrarConfirmacion(true);
      } else {
        alert("Documento guardado exitosamente");
        cerrarVistaPrevia();
      }
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar la factura.");
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleEnviar = async () => {
    // ========== Validación ==========
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

    // Validación extra: batch montos
    if (isProveedorBatch) {
      const invalid = batchAsociaciones.some(
        (x) => !x.monto_asociar || Number(x.monto_asociar) <= 0
      );
      if (invalid) {
        alert("Debes capturar un monto válido para cada solicitud.");
        return;
      }
    }

    try {
      setSubiendoArchivos(true);
      setErrors({});

      // 1) Parsear XML
      const data = await parsearXML(archivoXML);

      console.log("🚓🚓🚓🚓🚓informacion de xml",data)
      console.log("informacion🔽🔽🔽🔽🔽",data.emisor.rfc)

      // ==========================
      // NUEVO: Batch NO usa selección de cliente ni empresas aquí
      // El back se encargará del automatch + datos fiscales.
      // ==========================
      if (isProveedorBatch) {
        // const coincidencia = await fetchProveedoresDataFiscal()
        console.log(proveedoresData,"klf vknriorv 😒😒😒😒😒😒😒",data.emisor.rfc,"cambios",proveedoresRfc)
        

        if ((data.emisor.rfc !== proveedoresRfc)) {
          confirm(
          `No hubo coincidencia con el RFC de la factura y de las solicitudes`
        );
        return;
        }else if (data.comprobante.total < batchTotalAsociar) {
confirm(
          `No pueden ser esos montos`
        );
                return;
        }
        setFacturaData(data);
        setMostrarModal(false);
        setMostrarVistaPrevia(true);
        return;
      }

      // 2) Cargar empresas del cliente / proveedor (single) si no están cargadas
      if (empresasAgente.length === 0 && clienteSeleccionado?.id_agente) {
        await cargarEmpresasAgente(clienteSeleccionado.id_agente);
      }

      // 3) Buscar empresa por RFC del receptor
      const rfcReceptor = !proveedoresData ? data.receptor.rfc:data.emisor.rfc;
      const empresaCoincidente = empresasAgente.find(
        (emp) => emp.rfc === rfcReceptor
      );

      if (!empresaCoincidente) {
        confirm(
          `No se encontró una empresa con RFC ${rfcReceptor} para este cliente. Deberas crear empresa`
        );
        return;
      } else {
        setEmpresaSeleccionada(empresaCoincidente);
      }

      // 4) Mostrar vista previa
      setFacturaData(data);
      setMostrarModal(false);
      setMostrarVistaPrevia(true);
    } catch (error) {
      alert("Error al procesar el XML");
      console.error(error);
    } finally {
      setSubiendoArchivos(false);
    }
  };

  return (
    <>
      <button
        onClick={proveedoresData ? abrirModalProv : abrirModal}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Subir Nueva Factura
      </button>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl">
            <h2 className="text-xl font-semibold mb-1">{text}</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sube los archivos PDF y XML de la factura
            </p>

            {/* ==============================
                NUEVO: si batch => NO mostrar input cliente
               ============================== */}
            {!isProveedorBatch && (
              <div className="relative mb-4">
                <label className="block mb-2 font-medium">{nombre}</label>

                {isClienteBloqueado ? (
                  <>
                    <div className="w-full p-2 border rounded bg-gray-100 text-gray-700">
                      {clienteSeleccionado?.nombre_agente_completo ||
                        cliente ||
                        "Cargando cliente..."}
                    </div>

                    <input
                      type="hidden"
                      name="id_agente"
                      value={
                        clienteSeleccionado?.id_agente ||
                        agentId ||
                        pagoData?.id_agente ||
                        ""
                      }
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre, email o RFC..."
                      className={`w-full p-2 border rounded ${
                        errors.clienteSeleccionado
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      value={cliente}
                      onChange={handleBuscarCliente}
                      onFocus={() =>
                        cliente.length > 2 && setMostrarSugerencias(true)
                      }
                      onBlur={() =>
                        setTimeout(() => setMostrarSugerencias(false), 200)
                      }
                    />

                    {mostrarSugerencias && clientesFiltrados.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {clientesFiltrados.map((c) => (
                          <li
                            key={c.id_agente}
                            className="p-2 mb-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setCliente(c.nombre_agente_completo);
                              setClienteSeleccionado(c);
                              setMostrarSugerencias(false);
                              cargarEmpresasAgente(c.id_agente);
                            }}
                          >
                            {c.nombre_agente_completo} - {c.correo}
                            {c.rfc && ` - ${c.rfc}`}
                          </li>
                        ))}
                      </ul>
                    )}

                    {errors.clienteSeleccionado && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.clienteSeleccionado}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ==============================
                NUEVO: panel informativo batch
               ============================== */}
            {isProveedorBatch && (
              <div className="mb-4 p-3 rounded border bg-gray-50">
                <p className="text-sm text-gray-700">
                  Asociación múltiple detectada:{" "}
                  <strong>{batchAsociaciones.length}</strong> solicitudes.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  No se selecciona proveedor en el front. Se enviarán los IDs al
                  back para el automatch y carga de datos fiscales.
                </p>
              </div>
            )}

            {/* XML */}
            <div>
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <label className="block text-gray-700 font-semibold mb-2">
                  Archivo XML (Requerido) <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  id="xml-upload"
                  accept="text/xml,.xml,application/xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (
                      file &&
                      !["text/xml", "application/xml"].includes(file.type)
                    ) {
                      alert("Por favor, sube solo archivos XML");
                      e.target.value = "";
                      setArchivoXML(null);
                      return;
                    }
                    setArchivoXML(file);
                  }}
                />

                <label
                  htmlFor="xml-upload"
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600 transition"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  Seleccionar archivo
                </label>

                <p className="text-sm text-gray-500 mt-2">
                  {archivoXML ? archivoXML.name : "Sin archivos seleccionados"}
                </p>
              </div>
            </div>

            {/* ==============================
                SINGLE proveedor: input monto único
               ============================== */}
            {isProveedorMode && (
              <div className="mt-4 mb-4">
                <label className="block mb-2 font-medium">
                  Monto a asociar a la solicitud (MXN)
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={facturado ?? ""}
                  onChange={handleFacturadoChange}
                  className="w-full p-2 border rounded border-gray-300"
                />

                <p className="text-xs text-gray-500 mt-1">
                  Este monto se guardará para usarlo en la asociación con la solicitud.
                </p>
              </div>
            )}

            {/* ==============================
                BATCH proveedor: N inputs montos
               ============================== */}
            {isProveedorBatch && (
              <div className="mt-4 mb-4">
                <label className="block mb-2 font-medium">
                  Montos a asociar por solicitud (MXN)
                </label>

                <div className="space-y-3">
                  {batchAsociaciones.map((it, idx) => {
                    const proveedorLabel =
                      it.raw?.proveedor ||
                      it.raw?.hotel ||
                      `Proveedor ${it.id_proveedor}`;
                    return (
                      <div
                        key={`${it.id_solicitud}-${it.id_proveedor}-${idx}`}
                        className="p-3 rounded border bg-white"
                      >
                        <div className="text-xs text-gray-600 mb-2">
                          <div>
                            <strong>Solicitud:</strong> {it.id_solicitud}
                          </div>
                          <div>
                            <strong>Proveedor:</strong> {proveedorLabel}
                          </div>
                        </div>

                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={it.monto_asociar}
                          onChange={(e) => updateMontoBatch(idx, e.target.value)}
                          className="w-full p-2 border rounded border-gray-300"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  <strong>Total asociado:</strong>{" "}
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(batchTotalAsociar)}
                </div>
              </div>
            )}

            {/* Checkbox factura pagada */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="facturaPagada"
                checked={facturaPagada}
                onChange={(e) =>
                  !pagoData && hasItems && setFacturaPagada(e.target.checked)
                }
                disabled={!!pagoData || hasItems}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                  !!pagoData || !hasItems ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <label
                htmlFor="facturaPagada"
                className={`ml-2 block text-sm ${
                  !!pagoData || !hasItems ? "text-gray-500" : "text-gray-900"
                }`}
              >
                {pagoData
                  ? "Factura marcada como pagada (asociada a pago)"
                  : !hasItems
                  ? "Factura marcada como pagada (sin ítems)"
                  : "La factura está pagada"}
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={
                  // si batch => no depende de cliente
                  ((!isProveedorBatch && !cliente) || !archivoXML || subiendoArchivos)
                }
              >
                {subiendoArchivos ? "Procesando..." : "Datos de factura"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarVistaPrevia && (
        <VistaPreviaModal
          facturaData={facturaData}
          pagoData={pagoData}
          itemsTotal={getItemsTotal()}
          onConfirm={(pdfUrl, fecha_vencimiento) => {
            setArchivoPDFUrl(pdfUrl);

            // Rama 1: Hay ítems => flujo normal (no pagada)
            if (hasItems) {
              setFacturaPagada(false);
              handleConfirmarFactura({
                url: pdfUrl,
                fecha_vencimiento: fecha_vencimiento,
              });
              return;
            }

            // Rama 2: NO hay ítems => flujo "pagada"
            setFacturaPagada(true);
            if (pagoData && facturaData) {
              handlePagos({
                url: pdfUrl,
                fecha_vencimiento: fecha_vencimiento,
              });
            } else {
              handleConfirmarFactura({
                url: pdfUrl,
                fecha_vencimiento: fecha_vencimiento,
              });
            }
          }}
          onClose={cerrarVistaPrevia}
          isLoading={subiendoArchivos}
        />
      )}

      {/* Totales de Ítems vs Factura */}
      {facturaData && getItemsTotal() > 0 && (
        <div className="mt-3 p-3 rounded border text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total ítems seleccionados:</span>
            <span>
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(getItemsTotal())}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-medium">Total de la factura (XML):</span>
            <span>
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(parseFloat(facturaData?.comprobante?.total || "0"))}
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

// manejo de errores
interface FacturaErrors {
  clienteSeleccionado?: string;
  empresaSeleccionada?: string;
  archivoXML?: string;
}

// Función de validación
const validateFacturaForm = (formData: {
  clienteSeleccionado: Agente | null;
  archivoXML: File | null;
  isProveedorBatch: boolean;
}): FacturaErrors => {
  const errors: FacturaErrors = {};

  // en batch NO se valida clienteSeleccionado
  if (!formData.isProveedorBatch) {
    if (!formData.clienteSeleccionado) {
      errors.clienteSeleccionado = "Debes seleccionar un cliente";
    }
  }

  if (!formData.archivoXML) {
    errors.archivoXML = "El archivo XML es requerido";
  }

  return errors;
};
