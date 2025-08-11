'use client';
import { URL, API_KEY } from "@/lib/constants/index";
import { useState, useEffect, useCallback } from 'react';
import { parsearXML } from './parseXmlCliente';
import VistaPreviaModal from './VistaPreviaModal';
import ConfirmacionModal from './confirmacion';
import { fetchAgentes, fetchEmpresasAgentesDataFiscal } from "@/services/agentes";
import { TypeFilters, EmpresaFromAgent } from "@/types";
import AsignarFacturaModal from './AsignarFactura';
import { obtenerPresignedUrl, subirArchivoAS3 } from "@/helpers/utils";
import { formatNumberWithCommas } from "@/helpers/utils";

interface SubirFacturaProps {
  pagoId?: string;  // Hacerlo opcional
  pagoData?: Pago | null;  // Hacerlo opcional
  isBatch?: boolean;
  onSuccess: () => void;
}

interface Pago {
  id_agente: string;
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
}

const AUTH = {
  "x-api-key": API_KEY,
};

// const [pagoData, setPagoData] = useState<Pago | null>(null);

export const getEmpresasDatosFiscales = async (agent_id: string) => {
  try {
    const response = await fetch(
      `${URL}/v1/mia/agentes/empresas-con-datos-fiscales?id_agente=${encodeURIComponent(agent_id)}`,
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



export default function SubirFactura({ pagoId, pagoData, onSuccess }: SubirFacturaProps) {

  // Estados iniciales
  const initialStates = {
    facturaData: null,
    cliente: pagoData?.id_agente || '',  // Prellenar con datos del pago si existen
    clienteSeleccionado: null,
    archivoPDF: null,
    archivoXML: null,
    empresasAgente: [],
    empresaSeleccionada: null,
    facturaPagada: pagoData ? true : false // Cambio aquí
  };

  const [facturaData, setFacturaData] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [cliente, setCliente] = useState(initialStates.cliente);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Agente | null>(initialStates.clienteSeleccionado);
  const [archivoPDF, setArchivoPDF] = useState<File | null>(initialStates.archivoPDF);
  const [archivoXML, setArchivoXML] = useState<File | null>(initialStates.archivoXML);
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [archivoPDFUrl, setArchivoPDFUrl] = useState<string | null>(null);
  const [archivoXMLUrl, setArchivoXMLUrl] = useState<string | null>(null);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);
  const [errors, setErrors] = useState<FacturaErrors>({});
  const [clientes, setClientes] = useState<(Agente)[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresasAgente, setEmpresasAgente] = useState<EmpresaFromAgent[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaFromAgent | null>(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [facturaPagada, setFacturaPagada] = useState(false);
  const [mostrarAsignarFactura, setMostrarAsignarFactura] = useState(false);

  //auto seleccionar al cliente
  useEffect(() => {
    if (pagoData?.id_agente && clientes.length > 0) {
      const matchingClient = clientes.find(c => c.id_agente === pagoData.id_agente);
      if (matchingClient) {
        setCliente(matchingClient.nombre_agente_completo);
        setClienteSeleccionado(matchingClient);
        cargarEmpresasAgente(matchingClient.id_agente);
      }
    }
  }, [pagoData, clientes]);

  // Autoabrir el modal si hay pagoData
  useEffect(() => {
    if (pagoData) {
      abrirModal();
    }
  }, [pagoData]);

  const subirArchivosAS3 = async (): Promise<{ pdfUrl: string | null, xmlUrl: string }> => {
    if (!archivoXML) {
      throw new Error("El archivo XML es requerido");
    }

    try {
      setSubiendoArchivos(true);
      const folder = "comprobantes";

      // Subir XML (requerido)
      const { url: urlXML, publicUrl: publicUrlXML } = await obtenerPresignedUrl(
        archivoXML.name,
        archivoXML.type,
        folder
      );
      await subirArchivoAS3(archivoXML, urlXML);

      // Subir PDF (opcional)
      let pdfUrl = null;
      if (archivoPDF) {
        const { url: urlPDF, publicUrl: publicUrlPDF } = await obtenerPresignedUrl(
          archivoPDF.name,
          archivoPDF.type,
          folder
        );
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
    const valor = e.target.value.toLowerCase();
    setCliente(e.target.value);

    if (valor.length > 2) {
      const filtrados = clientes.filter(cliente => {
        // Verificar que las propiedades existan antes de llamar toLowerCase()
        console.log("cliente", cliente)
        const nombre = cliente.nombre_agente_completo?.toLowerCase() || '';
        const correo = cliente.correo?.toLowerCase() || '';
        const rfc = cliente.rfc?.toLowerCase() || '';
        const id_cliente = cliente.id_agente?.toLowerCase() || '';

        return (
          nombre.includes(valor) ||
          correo.includes(valor) ||
          rfc.includes(valor) ||
          id_cliente.includes(valor)
        );
      });
      setClientesFiltrados(filtrados);
      setMostrarSugerencias(true);
    } else {
      setClientesFiltrados([]);
      setMostrarSugerencias(false);
    }
  };
  // Función para cargar los clientes al abrir el modal
  const handleFetchClients = useCallback(() => {
    setLoading(true);
    fetchAgentes({}, {} as TypeFilters, (data) => {
      setClientes(data);
      setLoading(false);
    })
      .catch(error => {
        console.error("Error fetching agents:", error);
        setLoading(false);
      });
  }, []);

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
  }, [initialStates]);

  const abrirModal = useCallback(() => {
    resetearCampos();
    setMostrarModal(true);
    handleFetchClients();
  }, [resetearCampos, handleFetchClients]);

  const cerrarModal = useCallback(() => {
    setMostrarModal(false);
    resetearCampos();
    onSuccess(); // Call the success callback when closing
  }, [resetearCampos, onSuccess]);


  // Función para confirmar la factura
  const handlePagos = async ({ payload, url }: { payload?: any, url?: string }) => {
    try {
      setSubiendoArchivos(true);

      // Subir archivos a S3
      const { xmlUrl } = await subirArchivosAS3();

      if (!facturaData || !clienteSeleccionado || !pagoData) {
        throw new Error("Faltan datos necesarios para procesar el pago");
      }

      if (!url) {
        console.warn("URL del PDF no disponible");
        // Puedes decidir si quieres continuar sin el PDF o lanzar un error
      }
      console.log("pdfurl", archivoPDFUrl)

      // Crear payload base similar a handleConfirmarFactura
      const basePayload = {
        fecha_emision: facturaData.comprobante.fecha.split("T")[0],
        estado: "Confirmada",
        usuario_creador: clienteSeleccionado.id_agente,
        id_agente: clienteSeleccionado.id_agente,
        total: parseFloat(facturaData.comprobante.total),
        subtotal: parseFloat(facturaData.comprobante.subtotal),
        impuestos: parseFloat(facturaData.impuestos?.traslado?.importe || "0.00"),
        saldo: parseFloat(facturaData.comprobante.total),
        rfc: facturaData.receptor.rfc,
        id_empresa: empresaSeleccionada?.id_empresa || null,
        uuid_factura: facturaData.timbreFiscal.uuid,
        rfc_emisor: facturaData.emisor.rfc,
        url_pdf: url ? url : archivoPDFUrl,
        url_xml: xmlUrl,
        items_json: JSON.stringify([]),
      };

      // Agregar datos específicos del pago
      const pagoPayload = {
        ...basePayload,
        id_pago: pagoData.id_pago,
        pago_referencia: pagoData.pago_referencia,
        pago_fecha_pago: pagoData.pago_fecha_pago,
        metodo_pago: pagoData.metodo_de_pago,
        banco: pagoData.banco || pagoData.banco_tarjeta,
        ultimos_digitos: pagoData.last_digits || pagoData.ult_digits,
        autorizacion: pagoData.autorizacion_stripe || pagoData.numero_autorizacion,
        tipo_tarjeta: pagoData.tipo_tarjeta || pagoData.tipo_de_tarjeta,
      };

      console.log("Payload completo para API con datos de pago:", pagoPayload);

      // Aquí decidimos si la factura cubre completamente el pago o no
      const montoPorFacturar = Number(pagoData.monto) || 0;
      const totalFactura = parseFloat(facturaData.comprobante.total);
      console.log("pagos y diferencias", pagoData.monto, "b", facturaData.comprobante.total)
      console.log("")
      if (montoPorFacturar <= totalFactura) {
        // Si el monto por facturar es menor que el total de la factura,
        // llamamos directamente a AsignarFacturaModal
        setArchivoPDFUrl(archivoPDFUrl);
        setArchivoXMLUrl(xmlUrl);
        setMostrarVistaPrevia(false);
        setMostrarAsignarFactura(true);
      } else {
        // Si el pago cubre completamente la factura, procesamos directamente
        // const response = await fetch(`${URL}/mia/factura/CrearFacturaDesdeCarga`, {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     "x-api-key": API_KEY,
        //   },
        //   body: JSON.stringify(pagoPayload),
        // });

        // if (!response.ok) {
        //   throw new Error('Error al asignar la factura al pago');
        // }

        alert('Factura asignada al pago exitosamente');
        cerrarVistaPrevia();
      }
    } catch (error) {
      console.error("Error en handlePagos:", error);
      alert('Error al procesar el pago');
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleConfirmarFactura = async ({ payload, url }: { payload?: any, url?: string }) => {
    try {
      setSubiendoArchivos(true);

      // Upload files only when confirming
      const { xmlUrl } = await subirArchivosAS3();

      if (!url) {
        console.warn("URL del PDF no disponible");
        // Puedes decidir si quieres continuar sin el PDF o lanzar un error
      }
      console.log("pdfurl", archivoPDFUrl)
      const basePayload = {
        fecha_emision: facturaData.comprobante.fecha.split("T")[0], // solo la fecha
        estado: "Confirmada",
        usuario_creador: clienteSeleccionado.id_agente,
        id_agente: clienteSeleccionado.id_agente,
        total: parseFloat(facturaData.comprobante.total),
        subtotal: parseFloat(facturaData.comprobante.subtotal),
        impuestos: parseFloat(facturaData.impuestos?.traslado?.importe || "0.00"),
        saldo: parseFloat(facturaData.comprobante.total),
        rfc: facturaData.receptor.rfc,
        id_empresa: empresaSeleccionada.id_empresa || null,
        uuid_factura: facturaData.timbreFiscal.uuid,
        rfc_emisor: facturaData.emisor.rfc,
        url_pdf: url ? url : archivoPDFUrl,
        url_xml: xmlUrl || null,
        items_json: JSON.stringify([]),
      };

      console.log("Payload completo para API:", basePayload);

      const response = await fetch(`${URL}/mia/factura/CrearFacturaDesdeCarga`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(basePayload),
      });

      console.log("payload enviado:", basePayload);

      if (!response.ok) {
        throw new Error('Error al asignar la factura');
      }

      if (payload) {
        // Lógica para factura asignada
        alert('Factura asignada exitosamente');

        cerrarVistaPrevia();
      } else if (facturaPagada) {
        setMostrarConfirmacion(true);
        // cerrarVistaPrevia();
      } else {
        alert('Documento guardado exitosamente');
        cerrarVistaPrevia();
      }
      // cerrarVistaPrevia();
    } catch (error) {
      alert('Error al subir archivos');
      console.error(error);
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleEnviar = async () => {
    // Validar antes de proceder
    const validationErrors = validateFacturaForm({
      clienteSeleccionado,
      archivoXML
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
      const empresaCoincidente = empresasAgente.find(emp => emp.rfc === rfcReceptor);

      if (!empresaCoincidente) {
        // Mostrar alerta y opción para crear empresa
        const confirmarCrearEmpresa = confirm(
          `No se encontró una empresa con RFC ${rfcReceptor} para este cliente. Deberas crear empresa`
        );
        // return;

      } else {
        // Asignar empresa encontrada automáticamente
        setEmpresaSeleccionada(empresaCoincidente);
      }

      // 4. Mostrar vista previa
      setFacturaData(data);
      setMostrarModal(false);
      setMostrarVistaPrevia(true);

    } catch (error) {
      alert('Error al procesar el XML');
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
  const cargarEmpresasAgente = async (agenteId: string) => {
    if (!agenteId) {
      console.error("ID de agente no proporcionado");
      return;
    }

    setLoadingEmpresas(true);
    setEmpresaSeleccionada(null); // Resetear selección al cargar nuevas empresas

    try {
      const empresas = await fetchEmpresasAgentesDataFiscal(agenteId);
      console.log("Empresas recibidas:", empresas);
      setEmpresasAgente(empresas || []);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      setEmpresasAgente([]);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  console.log(pagoData)
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
            <h2 className="text-xl font-semibold mb-1">Asignar factura al pago</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sube los archivos PDF y XML de la factura
            </p>

            <div className="relative mb-4">
              <label className="block mb-2 font-medium">Cliente</label>
              <input
                type="text"
                placeholder="Buscar cliente por nombre, email o RFC..."
                className={`w-full p-2 border rounded ${errors.clienteSeleccionado ? "border-red-500" : "border-gray-300"}`}
                value={cliente}
                onChange={handleBuscarCliente}
                onFocus={() => cliente.length > 2 && setMostrarSugerencias(true)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                disabled={!!pagoData?.id_agente} // Disable if we have pagoData
              />

              {mostrarSugerencias && clientesFiltrados.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {clientesFiltrados.map(cliente => (
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
                <p className="text-red-500 text-sm mt-1">{errors.clienteSeleccionado}</p>
              )}
            </div>
            <div>

              {/* XML */}
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <label className="block text-gray-700 font-semibold mb-2">
                  Archivo XML (Requerido) <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  id="xml-upload"
                  accept="text/xml,.xml,application/xml"
                  className="hidden"  // Ocultamos el input
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && !['text/xml', 'application/xml'].includes(file.type)) {
                      alert('Por favor, sube solo archivos XML');
                      e.target.value = '';
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
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  Seleccionar archivo
                </label>

                <p className="text-sm text-gray-500 mt-2">
                  {archivoXML ? archivoXML.name : 'Sin archivos seleccionados'}
                </p>
              </div>
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="facturaPagada"
                checked={facturaPagada}
                onChange={(e) => !pagoData && setFacturaPagada(e.target.checked)} // Solo permite cambios si no hay pagoData
                disabled={!!pagoData} // Deshabilitado si hay pagoData
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${!!pagoData ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              />
              <label
                htmlFor="facturaPagada"
                className={`ml-2 block text-sm ${!!pagoData ? 'text-gray-500' : 'text-gray-900'
                  }`}
              >
                {pagoData ? 'Factura marcada como pagada (asociada a pago)' : 'La factura está pagada'}
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
          onConfirm={(pdfUrl) => {
            setArchivoPDFUrl(pdfUrl);
            if (pagoData && facturaData) {
              handlePagos({ url: pdfUrl })
            } else {
              handleConfirmarFactura({ url: pdfUrl });
            }
          }}
          onClose={cerrarVistaPrevia}
          isLoading={subiendoArchivos}
        />
      )}

      <ConfirmacionModal
        isOpen={mostrarConfirmacion}
        onCloseVistaPrevia={() => cerrarVistaPrevia()}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={() => setMostrarAsignarFactura(true)}
        onSaveOnly={() => handleConfirmarFactura({})}
      />

      {mostrarAsignarFactura && (
        <AsignarFacturaModal
          isOpen={mostrarAsignarFactura}
          onCloseVistaPrevia={() => cerrarVistaPrevia()}
          onClose={() => setMostrarAsignarFactura(false)}
          onAssign={(payload) => handleConfirmarFactura({ payload })}
          facturaData={facturaData}
          empresaSeleccionada={empresaSeleccionada}
          clienteSeleccionado={clienteSeleccionado}
          archivoPDFUrl={archivoPDFUrl}
          archivoXMLUrl={archivoXMLUrl}
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
