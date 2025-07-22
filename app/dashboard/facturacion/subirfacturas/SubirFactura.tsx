'use client';
import { URL, API_KEY } from "@/lib/constants/index";
import { useState, useEffect } from 'react';
import { parsearXML } from './parseXmlCliente';
import VistaPreviaModal from './VistaPreviaModal';
import ConfirmacionModal from './confirmacion';
import { fetchAgentes, fetchEmpresasAgentesDataFiscal } from "@/services/agentes";
import { TypeFilters, EmpresaFromAgent } from "@/types";
import AsignarFacturaModal from './AsignarFactura';
import { obtenerPresignedUrl, subirArchivoAS3 } from "@/helpers/utils";


const AUTH = {
  "x-api-key": API_KEY,
};


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



export default function FacturasPage() {

  // Estados iniciales
  const initialStates = {
    facturaData: null,
    cliente: '',
    clienteSeleccionado: null,
    archivoPDF: null,
    archivoXML: null,
    empresasAgente: [],
    empresaSeleccionada: null,
    facturaPagada: false
  };

  const [facturaData, setFacturaData] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [cliente, setCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Agente | null>(initialStates.clienteSeleccionado);
  const [archivoPDF, setArchivoPDF] = useState<File | null>(initialStates.archivoPDF);
  const [archivoXML, setArchivoXML] = useState<File | null>(initialStates.archivoXML);
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  //useStates provisionales para considerar los url de carga a s3
  const [archivoPDFUrl, setArchivoPDFUrl] = useState<string | null>(null);
  const [archivoXMLUrl, setArchivoXMLUrl] = useState<string | null>(null);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  // Estado para los errores
  const [errors, setErrors] = useState<FacturaErrors>({});

  const subirArchivosAS3 = async (): Promise<{ pdfUrl: string | null, xmlUrl: string }> => {
    if (!archivoXML) {
      throw new Error("El archivo XML es requerido");
    }

    try {
      setSubiendoArchivos(true);
      const folder = "comprobantes";

      // XML
      const { url: urlXML, publicUrl: publicUrlXML } = await obtenerPresignedUrl(
        archivoXML.name,
        archivoXML.type,
        folder
      );
      await subirArchivoAS3(archivoXML, urlXML);
      setArchivoXMLUrl(publicUrlXML);

      let pdfUrl = null;
      // PDF (opcional)
      if (archivoPDF) {
        const { url: urlPDF, publicUrl: publicUrlPDF } = await obtenerPresignedUrl(
          archivoPDF.name,
          archivoPDF.type,
          folder
        );
        await subirArchivoAS3(archivoPDF, urlPDF);
        setArchivoPDFUrl(publicUrlPDF);
        pdfUrl = publicUrlPDF;
      }

      return { pdfUrl, xmlUrl: publicUrlXML };
    } catch (err) {
      console.error("Error al subir archivos:", err);
      throw err;
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const [clientes, setClientes] = useState<(Agente)[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresasAgente, setEmpresasAgente] = useState<EmpresaFromAgent[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaFromAgent | null>(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [facturaPagada, setFacturaPagada] = useState(false);

  //asignar factura a items de reservación
  const [mostrarAsignarFactura, setMostrarAsignarFactura] = useState(false);

  // Función para buscar clientes por nombre, email, RFC o razón social
  const handleBuscarCliente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toLowerCase();
    setCliente(e.target.value);

    if (valor.length > 2) {
      const filtrados = clientes.filter(cliente => {
        // Verificar que las propiedades existan antes de llamar toLowerCase()
        const nombre = cliente.nombre_agente_completo?.toLowerCase() || '';
        const correo = cliente.correo?.toLowerCase() || '';
        const rfc = cliente.rfc?.toLowerCase() || '';
        const razonSocial = cliente.razon_social?.toLowerCase() || '';

        return (
          nombre.includes(valor) ||
          correo.includes(valor) ||
          rfc.includes(valor) ||
          razonSocial.includes(valor)
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
  const handleFetchClients = () => {
    setLoading(true);
    fetchAgentes({}, {} as TypeFilters, (data) => {
      setClientes(data);
      setLoading(false);
    })
      .catch(error => {
        console.error("Error fetching agents:", error);
        setLoading(false);
      });
  };
  // Estados iniciales para resetear campos
  const resetearCampos = () => {
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
  };

  const abrirModal = () => {
    resetearCampos(); // Resetear campos antes de abrir
    setMostrarModal(true);
    handleFetchClients(); // Refrescar clientes al abrir el modal
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    resetearCampos(); // También resetear al cerrar
  };
  // Función para confirmar la factura

  const handleConfirmarFactura = async (payloadAdicional?: any) => {
    try {
      setSubiendoArchivos(true);

      // Upload files only when confirming
      const { pdfUrl, xmlUrl } = await subirArchivosAS3();

      const basePayload = {
        fecha_emision: facturaData.comprobante.fecha.split("T")[0], // solo la fecha
        estado: "En proceso",
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
        url_pdf: pdfUrl || null,
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

      console.log("payload enviado:", payloadAdicional);

      if (!response.ok) {
        throw new Error('Error al asignar la factura');
      }

      if (payloadAdicional) {
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

  // Función para enviar la factura
  const handleEnviar = async () => {

    // Validar antes de proceder
    const validationErrors = validateFacturaForm({
      clienteSeleccionado,
      empresaSeleccionada,
      archivoXML
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
      setFacturaData(data);

      // 2. Show preview without uploading
      setMostrarModal(false);
      setMostrarVistaPrevia(true);

      console.log(data);


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
            <h2 className="text-xl font-semibold mb-1">Subir Nueva Factura</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sube los archivos PDF y XML de la factura
            </p>

            <div className="relative mb-4">
              <label className="block mb-2 font-medium">Cliente</label>
              <input
                type="text"
                placeholder="Buscar cliente por nombre, email, RFC o razón social..."
                className={`w-full p-2 border rounded ${errors.clienteSeleccionado ? "border-red-500" : "border-gray-300"
                  }`}
                value={cliente}
                onChange={handleBuscarCliente}
                onFocus={() => cliente.length > 2 && setMostrarSugerencias(true)}
                onBlur={() => {
                  // Usamos setTimeout para permitir que el click en la lista se procese primero
                  setTimeout(() => {
                    setMostrarSugerencias(false);
                  }, 200);
                }}
              />

              {mostrarSugerencias && clientesFiltrados.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {clientesFiltrados.map(cliente => (
                    <li
                      key={cliente.id_agente}
                      className="p-2 mb-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={(e) => e.preventDefault()} // Esto previene que el onBlur se dispare primero
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

              {errors.clienteSeleccionado && (
                <p className="text-red-500 text-sm mt-1">{errors.clienteSeleccionado}</p>
              )}

              {clienteSeleccionado && (
                <div className="mb-4">
                  <label className="block mb-2 font-medium">Empresa</label>
                  {loadingEmpresas ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="animate-spin">↻</span>
                      Cargando empresas...
                    </div>
                  ) : (
                    <>
                      {empresasAgente.length > 0 ? (
                        <select
                          className="w-full p-2 border border-gray-300 rounded"
                          value={empresaSeleccionada?.id_empresa - 1 || ''}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const selected = empresasAgente.find(emp => emp.id_empresa === selectedId);
                            if (selected) {
                              setEmpresaSeleccionada(selected);
                              console.log("Empresa seleccionada:", selected);
                            }
                          }}
                        >
                          <option value="" disabled>
                            {empresaSeleccionada
                              ? `${empresaSeleccionada.razon_social} - ${empresaSeleccionada.rfc}`
                              : "Seleccione una empresa"}
                          </option>
                          {empresasAgente
                            .filter(emp => emp.id_empresa !== empresaSeleccionada?.id_empresa)
                            .map((empresa) => (
                              <option
                                key={`empresa-${empresa.id_empresa}`}
                                value={empresa.id_empresa}
                              >
                                {empresa.razon_social} - {empresa.rfc}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="text-yellow-600">
                          No se encontraron empresas con datos fiscales para este agente
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {errors.empresaSeleccionada && (
              <p className="text-red-500 text-sm mt-1">{errors.empresaSeleccionada}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* PDF */}
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <label className="block text-gray-700 font-semibold mb-2">
                  Archivo PDF (Opcional)
                </label>

                <input
                  type="file"
                  accept=".pdf"
                  className="file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-600 transition"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setArchivoPDF(file); // SOLO guardar el archivo
                  }}
                />

                <p className="text-sm text-gray-500 mt-2">
                  {archivoPDF ? archivoPDF.name : 'Sin archivos seleccionados'}
                </p>
              </div>

              {/* XML */}
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <label className="block text-gray-700 font-semibold mb-2">
                  Archivo XML (Requerido) <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  accept=".xml"
                  className="file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-500 file:text-white
                  hover:file:bg-green-600 transition"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setArchivoXML(file); // SOLO guardar el archivo
                    //RECUERDA QUE DEBES GURDAR LA URL PARA EL PAYLOAD
                  }}
                />

                {errors.archivoXML && (
                  <p className="text-red-500 text-sm mt-1">{errors.archivoXML}</p>
                )}

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
                onChange={(e) => setFacturaPagada(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="facturaPagada" className="ml-2 block text-sm text-gray-900">
                La factura está pagada
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
                disabled={!cliente || !archivoXML || subiendoArchivos || !empresaSeleccionada}
              >
                {subiendoArchivos ? "Procesando..." : "Mostrar Vista Previa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarVistaPrevia && (
        <VistaPreviaModal
          facturaData={facturaData}
          onConfirm={() => handleConfirmarFactura()}
          onClose={cerrarVistaPrevia}
          isLoading={subiendoArchivos}
        />
      )}

      <ConfirmacionModal
        isOpen={mostrarConfirmacion}
        onCloseVistaPrevia={() => cerrarVistaPrevia()}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={() => setMostrarAsignarFactura(true)}
        onSaveOnly={() => handleConfirmarFactura()}
      />

      {mostrarAsignarFactura && (
        <AsignarFacturaModal
          isOpen={mostrarAsignarFactura}
          onClose={() => setMostrarAsignarFactura(false)}
          onAssign={(payload) => handleConfirmarFactura(payload)}
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
  empresaSeleccionada: EmpresaFromAgent | null;
  archivoXML: File | null;
}): FacturaErrors => {
  const errors: FacturaErrors = {};

  if (!formData.clienteSeleccionado) {
    errors.clienteSeleccionado = "Debes seleccionar un cliente";
  }

  if (!formData.empresaSeleccionada) {
    errors.empresaSeleccionada = "Debes seleccionar una empresa";
  }

  if (!formData.archivoXML) {
    errors.archivoXML = "El archivo XML es requerido";
  }

  return errors;
};
