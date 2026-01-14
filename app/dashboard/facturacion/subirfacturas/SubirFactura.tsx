"use client";
import { URL, API_KEY } from "@/lib/constants/index";
import { useState, useEffect, useCallback } from "react";
import { parsearXML } from "./parseXmlCliente";
import VistaPreviaModal from "./VistaPreviaModal";
import ConfirmacionModal from "./confirmacion";
import {
  fetchAgentes,
  fetchEmpresasAgentesDataFiscal,
  fecthProveedores,
  fetchProveedoresDataFiscal
} from "@/services/agentes";
import { TypeFilters, EmpresaFromAgent } from "@/types";
import AsignarFacturaModal from "./AsignarFactura";
import { obtenerPresignedUrl, subirArchivoAS3 } from "@/helpers/utils";

interface SubirFacturaProps {
  pagoId?: string; //id del saldo tomado
  id_proveedor?: string;
  pagoData?: Pago | null; //datos del pago
  proveedoresData?: any | null;
  isBatch?: boolean;
  onSuccess: () => void; //callback al subir factura
  agentId?: string; // id del agente a precargar
  initialItems?: string[]; // ids de items seleccionados desde la tabla
  itemsJson?: string; //items en formato json
  autoOpen?: boolean; // abre el modal de inmediato
  onCloseExternal?: () => void; // permite cerrar desde el padre (opcional)
  initialItemsTotal?: number; // <--- NUEVO: total de ítems opcional
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
  rawIds: [];
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
  monto_por_facturar: string;
  monto: string;
  is_facturable: number;
  saldos: [];
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
// ==interfaces para clientes
export interface Agente {
  id_agente: string;
  nombre_agente_completo: string;
  correo: string;
  rfc?: string;
  razon_social?: string;
}

export default function SubirFactura({
  pagoId,
  pagoData,
  id_proveedor=null,
  id_servicio,
  proveedoresData =  null,
  onSuccess,
  agentId,
  initialItems = [],
  initialItemsTotal = 0,
  itemsJson = "",
  autoOpen = false,
  onCloseExternal,
}: SubirFacturaProps) {
  const [asignacionPayload, setAsignacionPayload] = useState<any>(null);

  //calcular total items
  const getItemsTotal = useCallback((): number => {
    // @ts-ignore
    const itemsTotalProp =
      typeof initialItemsTotal === "number" ? initialItemsTotal : undefined;

    let total = 0;

    if (typeof itemsTotalProp === "number") {
      total = itemsTotalProp;
    } else if (Array.isArray(initialItems)) {
      // Sumar montos si initialItems es array de objetos con "monto"
      total = initialItems.reduce(
        (acc, it: any) => acc + Number(it?.monto || 0),
        0
      );
    }

    /**
     * Aplicamos redondeo a 2 decimales para evitar errores de precisión
     * (ejemplo: 0.1 + 0.2 = 0.30000000000000004)
     */
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }, [initialItems, initialItemsTotal]);
  // Al inicio del componente:
  const hasItems = Array.isArray(initialItems) && initialItems.length > 0;
  console.log("hasitems", hasItems);

  // Estados iniciales
  const initialStates = {
    proveedoresData: null,
    id_proveedor: null,
    facturaData: null,
    cliente: pagoData?.id_agente || agentId || "", // Prellenar con datos del pago si existen
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
  const isClienteBloqueado = !!agentId || !!pagoData?.id_agente;

  console.log(
    "informacion de proveedor",
    id_proveedor,
    proveedoresData,
    id_servicio
  );

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

  // Función para buscar clientes por nombre, email, RFC o id_cliente
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
        // modo proveedor: buscar en "proveedor" (ya mapeado a nombre_agente_completo)
        return nombre.includes(valor) || id.includes(valor) || correo.includes(valor);
      }

      // modo agente (actual)
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

const isProveedorMode = !!proveedoresData;

// Toma siempre un array (venga como [] o como { data: [] })
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

// Normaliza proveedores a la interfaz Agente para reutilizar tu UI/búsqueda
const normalizeProveedoresAsAgentes = (res: any): Agente[] => {
  const arr = toArray(res);
  return arr
    .map((p: any) => ({
      // id del proveedor -> lo metemos en id_agente para reusar lógica
      id_agente: String(p?.id_proveedor ?? p?.id ?? ""),
      // nombre del proveedor
      nombre_agente_completo: String(p?.proveedor ?? ""),
      // si quieres mostrar algo, intentamos sacar un email del bloque de contactos
      correo: String(p?.correo ?? extractFirstEmail(p?.contactos_convenio) ?? ""),
      rfc: p?.rfc,
      razon_social: p?.razon_social,
    }))
    .filter((x) => x.id_agente && x.nombre_agente_completo);
};


const handleFetchClients = useCallback(() => {
  setLoading(true);
  fetchAgentes({}, {} as TypeFilters, (data) => {
    const normalized = toArray(data) as Agente[]; // si tu fetch ya devuelve Agente[] directo
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


  //auto seleccionar al cliente
useEffect(() => {
  if (!Array.isArray(clientes) || clientes.length === 0) return;

  // MODO PROVEEDOR
  if (isProveedorMode) {
    // 1) Prioridad: id_proveedor (numérico/string)
    const targetId = id_proveedor ? String(id_proveedor) : "";

    let matching: Agente | undefined =
      targetId
        ? clientes.find((c) => String(c.id_agente) === targetId)
        : undefined;

    // 2) Si no hay match por id, intenta por nombre: proveedoresData.hotel
    //    (si tu objeto trae otro campo, agrégalo aquí)
    if (!matching) {
      const targetNameRaw =
        (typeof (proveedoresData as any)?.hotel === "string" ? (proveedoresData as any)?.hotel : "") ||
        (typeof (proveedoresData as any)?.proveedor === "string" ? (proveedoresData as any)?.proveedor : "");

      const targetName = String(targetNameRaw).trim().toLowerCase();

      if (targetName) {
        matching = clientes.find(
          (c) => String(c.nombre_agente_completo ?? "").trim().toLowerCase() === targetName
        );
      }
    }

    if (matching) {
      setCliente(matching.nombre_agente_completo);
      setClienteSeleccionado(matching);
      cargarEmpresasAgente(matching.id_agente); // aquí id_agente es id_proveedor normalizado
    }

    return;
  }

  // MODO AGENTE (actual)
  const targetId = pagoData?.id_agente || agentId;
  if (!targetId) return;

  const matching = clientes.find((c) => String(c.id_agente) === String(targetId));
  if (matching) {
    setCliente(matching.nombre_agente_completo);
    setClienteSeleccionado(matching);
    cargarEmpresasAgente(matching.id_agente);
  }
}, [clientes, agentId, pagoData?.id_agente, id_proveedor, proveedoresData, isProveedorMode]);

  // Estados iniciales para resetear campos
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
  }, []);

  const abrirModal = useCallback(() => {
    resetearCampos();
    setMostrarModal(true);
    handleFetchClients();
    console.log("entre al fetch de clientes")
    
  }, [resetearCampos, handleFetchClients,]);

    const abrirModalProv = useCallback(() => {
    resetearCampos();
    setMostrarModal(true);
 
      handlefecthProveedores();
      console.log("entre al fetch de proveedores");
    
  }, [resetearCampos,handlefecthProveedores]);

  useEffect(() => {
    console.log("envio de informacion",proveedoresData , autoOpen)
    if (autoOpen && proveedoresData) {
      abrirModalProv();
    } else if (autoOpen && !proveedoresData) {
      console.log("entre para clientes")
      abrirModal();
    }
  }, [autoOpen]);

  const cerrarModal = useCallback(() => {
    setMostrarModal(false);
    resetearCampos();
    onSuccess(); // Call the success callback when closing
    console.log("vrrrrrrrrrrr", onSuccess);
  }, [resetearCampos, onSuccess]);

  const handlePagos = async ({
    url,
    fecha_vencimiento,
  }: {
    url?: string;
    fecha_vencimiento?: string;
  }) => {
    try {
      setSubiendoArchivos(true);

      // Subir archivos a S3
      const { xmlUrl } = await subirArchivosAS3();

      if (!facturaData || !clienteSeleccionado || !pagoData) {
        throw new Error("Faltan datos necesarios para procesar el pago");
      }

      if (!url) {
        console.warn("URL del PDF no disponible");
      }

      const totalFactura = parseFloat(facturaData.comprobante.total);
      let restante = totalFactura;

      // Preparar array de pagos asociados
      const pagosAsociados = [];

      // Verificar si pagoData tiene rawIds (para múltiples pagos) o es un solo pago
      const raw_Ids = pagoData.rawIds || [pagoData.raw_id];
      const saldos2 = pagoData.saldos || [pagoData.monto_por_facturar];
      console.log("saldos", saldos2);
      console.log("montos", pagoData.monto_por_facturar);
      for (let i = 0; i < raw_Ids.length; i++) {
        if (restante <= 0) break;

        const montoAsignar = Math.min(restante, saldos2[i]);
        pagosAsociados.push({
          raw_id: raw_Ids[i],
          monto: montoAsignar,
        });

        restante -= montoAsignar;
      }

      if (raw_Ids.length < 2) {
        // Preparar payload de la factura
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
          fecha_vencimiento: fecha_vencimiento || null, // <-- NUEVO
        };

        // Agregar datos específicos del pago
        const pagoPayload = {
          ...basePayload,
          raw_id: raw_Ids[0],
        };
        console.log("Payload completo para API:", pagoPayload);

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
        // Preparar payload de la factura
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
          saldo: 0, // Asumimos que está completamente pagada
          rfc: facturaData.receptor.rfc,
          id_empresa: empresaSeleccionada?.id_empresa || null,
          uuid_factura: facturaData.timbreFiscal.uuid,
          rfc_emisor: facturaData.emisor.rfc,
          url_pdf: url ? url : archivoPDFUrl,
          url_xml: xmlUrl,
          fecha_vencimiento: fecha_vencimiento || null, // <-- NUEVO
        };

        // Payload completo para la API
        const payloadCompleto = {
          factura: facturaPayload,
          pagos_asociados: pagosAsociados,
        };

        console.log("Payload completo para API:", payloadCompleto);

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
      console.log("🔄 Iniciando handleConfirmarFactura");
      console.log("Payload recibido:", fecha_vencimiento);
      console.log("Payload proveedores:", proveedoresData);

      setSubiendoArchivos(true);

      // Upload files only when confirming
      const { xmlUrl } = await subirArchivosAS3();
      let items = "";
      if (initialItems && initialItems.length > 0) {
        items = itemsJson;
      } else {
        items = JSON.stringify([]);
      }
      console.log("items", items);
      if (!url) {
        console.warn("URL del PDF no disponible");
        // Puedes decidir si quieres continuar sin el PDF o lanzar un error
      }
      console.log("pdfurl", archivoPDFUrl);
      const basePayload = {
        fecha_emision: facturaData.comprobante.fecha.split("T")[0], // solo la fecha
        estado: "Confirmada",
        usuario_creador: clienteSeleccionado.id_agente,
        id_agente: id_proveedor|| clienteSeleccionado.id_agente,
        total: parseFloat(facturaData.comprobante.total),
        subtotal: parseFloat(facturaData.comprobante.subtotal),
        impuestos: parseFloat(
          facturaData.impuestos?.traslado?.importe || "0.00"
        ),
        saldo: parseFloat(facturaData.comprobante.total) - initialItemsTotal,
        rfc: facturaData.receptor.rfc,
        id_empresa: empresaSeleccionada.id_empresa || null,
        uuid_factura: facturaData.timbreFiscal.uuid,
        rfc_emisor: facturaData.emisor.rfc,
        url_pdf: url ? url : archivoPDFUrl,
        url_xml: xmlUrl || null,
        items: items,
        fecha_vencimiento: fecha_vencimiento || null, // <-- NUEVO
          ...(proveedoresData != null ? { proveedoresData } : {}),
      };

      console.log("Payload completo para API:", basePayload);

      const ENDPOINT = !proveedoresData
        ? `${URL}/mia/factura/CrearFacturaDesdeCarga`
        : `${URL}/mia/pago_proveedor/subir_factura`;

      if (basePayload.items != "1") {
        const response = !proveedoresData ? await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(basePayload),

        }):await fetch(ENDPOINT, {
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

        // Obtener la respuesta del servidor
        const facturaResponse = await response.json();
        console.log("Factura creada:", facturaResponse);

        // Guardar la respuesta en el estado
        setFacturaCreada(facturaResponse);
      }
      console.log("payload enviado:", basePayload);

      if (payload) {
        // Lógica para factura asignada
        alert("Factura asignada exitosamente");

        cerrarVistaPrevia();
      } else if (facturaPagada) {
        setMostrarConfirmacion(true);
        // cerrarVistaPrevia();
      } else {
        alert("Documento guardado exitosamente");
        cerrarVistaPrevia();
      }
      // cerrarVistaPrevia();
    } catch (error) {
      console.error(error);
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleEnviar = async () => {
    // Validar antes de proceder
    const validationErrors = validateFacturaForm({
      clienteSeleccionado,
      archivoXML,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!archivoXML || !clienteSeleccionado) return;

    try {
      setSubiendoArchivos(true);
      setErrors({});

      // 1. Parsear XML
      const data = await parsearXML(archivoXML);

      // 2. Cargar empresas del cliente (si no están ya cargadas)
      if (empresasAgente.length === 0) {
        await cargarEmpresasAgente(clienteSeleccionado.id_agente);
      }

      // 3. Buscar empresa por RFC del receptor
      const rfcReceptor = data.receptor.rfc;
      const empresaCoincidente = empresasAgente.find(
        (emp) => emp.rfc === rfcReceptor
      );

      if (!empresaCoincidente) {
        // Mostrar alerta y opción para crear empresa
        const confirmarCrearEmpresa = confirm(
          `No se encontró una empresa con RFC ${rfcReceptor} para este cliente. Deberas crear empresa`
        );
        return;
      } else {
        // Asignar empresa encontrada automáticamente
        setEmpresaSeleccionada(empresaCoincidente);
      }

      // 4. Mostrar vista previa
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

  const cerrarVistaPrevia = () => {
    setMostrarVistaPrevia(false);
    cerrarModal();
  };

  // Función para abrir el listado de empresas
const cargarEmpresasAgente = async (id: string) => {
  if (!id) {
    console.error("ID no proporcionado");
    return;
  }

  setLoadingEmpresas(true);
  setEmpresaSeleccionada(null);

  try {
    const empresas = isProveedorMode
      ? await fetchProveedoresDataFiscal(id)          // <--- usa el id recibido (proveedor)
      : await fetchEmpresasAgentesDataFiscal(id);     // <--- usa el id recibido (agente)

    setEmpresasAgente(empresas || []);
  } catch (error) {
    console.error("Error al cargar empresas:", error);
    setEmpresasAgente([]);
  } finally {
    setLoadingEmpresas(false);
  }
};

  console.log("items", initialItems, "total", initialItemsTotal);

  return (
    <>
      <button
        onClick={abrirModal}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Subir Nueva Factura
      </button>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl">
            <h2 className="text-xl font-semibold mb-1">
              Asignar factura al pago
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Sube los archivos PDF y XML de la factura
            </p>

            <div className="relative mb-4">
              <label className="block mb-2 font-medium">Cliente</label>

              {isClienteBloqueado ? (
                <>
                  {/* Modo bloqueado: solo lectura */}
                  <div className="w-full p-2 border rounded bg-gray-100 text-gray-700">
                    {clienteSeleccionado?.nombre_agente_completo ||
                      cliente ||
                      "Cargando cliente..."}
                  </div>
                  {/* Si quieres conservar el id para formularios */}
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
                      {clientesFiltrados.map((cliente) => (
                        <li
                          key={cliente.id_agente}
                          className="p-2 mb-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setCliente(cliente.nombre_agente_completo);
                            setClienteSeleccionado(cliente);
                            setMostrarSugerencias(false);
                            cargarEmpresasAgente(cliente.id_agente);
                          }}
                        >
                          {cliente.nombre_agente_completo} - {cliente.correo}
                          {cliente.rfc && ` - ${cliente.rfc}`}
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

            <div>
              {/* XML */}
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <label className="block text-gray-700 font-semibold mb-2">
                  Archivo XML (Requerido){" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  id="xml-upload"
                  accept="text/xml,.xml,application/xml"
                  className="hidden" // Ocultamos el input
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
                {/* Botón personalizado que activará el input */}
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

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="facturaPagada"
                checked={facturaPagada}
                onChange={(e) =>
                  !pagoData && hasItems && setFacturaPagada(e.target.checked)
                }
                disabled={!!pagoData || hasItems} // <-- bloqueado si hay pagos o NO hay ítems
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
                // disabled={!cliente || !archivoPDF || !archivoXML || subiendoArchivos || !empresaSeleccionada}
                disabled={!cliente || !archivoXML || subiendoArchivos}
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
              }); // items se envían desde handleConfirmarFactura
              return;
            }

            // Rama 2: NO hay ítems => flujo "pagada" como en pagos
            setFacturaPagada(true);
            if (pagoData && facturaData) {
              handlePagos({
                url: pdfUrl,
                fecha_vencimiento: fecha_vencimiento,
              }); // paga contra saldos/raw_ids
            } else {
              // Sin pagoData: guardar como pagada con saldo=0 (ver cambio en handleConfirmarFactura)
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
          setAsignacionPayload(null); // Limpiar payload al cerrar
        }}
        onClose={() => {
          setMostrarConfirmacion(false);
          setAsignacionPayload(null); // Limpiar payload al cerrar
        }}
        onConfirm={() => {
          setMostrarAsignarFactura(true);
          setAsignacionPayload(null); // Preparar para nuevo payload
        }}
        onSaveOnly={() => {
          handleConfirmarFactura({});
          setAsignacionPayload(null); // Limpiar payload
        }}
      />

      {mostrarAsignarFactura && (
        <AsignarFacturaModal
          isOpen={mostrarAsignarFactura}
          onCloseVistaPrevia={() => {
            cerrarVistaPrevia();
            setAsignacionPayload(null); // Limpiar payload al cerrar
          }}
          onClose={() => {
            setMostrarAsignarFactura(false);
            setAsignacionPayload(null); // Limpiar payload al cerrar
          }}
          onAssign={(payload) => {
            setAsignacionPayload(payload); // Guardar el payload
            handleConfirmarFactura({ payload });
          }}
          facturaData={facturaData}
          id_factura={facturaCreada.data.id_factura}
          empresaSeleccionada={empresaSeleccionada}
          clienteSeleccionado={clienteSeleccionado}
          archivoPDFUrl={archivoPDFUrl}
          archivoXMLUrl={archivoXMLUrl}
          saldo={facturaCreada.data.saldo}
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
}): FacturaErrors => {
  const errors: FacturaErrors = {};

  if (!formData.clienteSeleccionado) {
    errors.clienteSeleccionado = "Debes seleccionar un cliente";
  }

  if (!formData.archivoXML) {
    errors.archivoXML = "El archivo XML es requerido";
  }

  return errors;
};
