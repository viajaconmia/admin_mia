'use client';
import { URL, API_KEY } from "@/lib/constants/index";
import { useState, useEffect } from 'react';
import { parsearXML } from './parseXmlCliente';
import VistaPreviaModal from './VistaPreviaModal';
import ConfirmacionModal from './confirmacion';
import { fetchAgentes, fetchEmpresasAgentesDataFiscal } from "@/services/agentes";
import { TypeFilters, EmpresaFromAgent } from "@/types";

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
  const [facturaData, setFacturaData] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [cliente, setCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Agente | null>(null);
  const [archivoPDF, setArchivoPDF] = useState<File | null>(null);
  const [archivoXML, setArchivoXML] = useState<File | null>(null);
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [clientes, setClientes] = useState<(Agente)[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresasAgente, setEmpresasAgente] = useState<EmpresaFromAgent[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaFromAgent | null>(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  // Función para buscar clientes por nombre, email, RFC o razón social
  const handleBuscarCliente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toLowerCase();
    setCliente(e.target.value);

    if (valor.length > 3) {
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

  const abrirModal = () => {
    setMostrarModal(true);
    handleFetchClients(); // Refrescar clientes al abrir el modal
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setCliente('');
    setClientesFiltrados([]);
  };
  // Función para confirmar la factura
  const handleConfirmarFactura = () => {
    // Lógica para aplicar la factura
    alert('Factura aplicada correctamente');
    // Aquí podrías hacer la llamada a tu API para guardar la factura
    cerrarVistaPrevia();
  };
  // Función para enviar la factura
  const handleEnviar = async () => {
    if (!archivoXML) return;

    try {
      const data = await parsearXML(archivoXML);
      setFacturaData(data);
      setMostrarModal(false);
      setMostrarVistaPrevia(true);
      console.log(data);
    } catch (error) {
      alert('Error al procesar el XML');
      console.error(error);
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
                className="w-full p-2 border border-gray-300 rounded"
                value={cliente}
                onChange={handleBuscarCliente}
                onFocus={() => cliente.length > 2 && setMostrarSugerencias(true)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
              />
              {mostrarSugerencias && clientesFiltrados.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {clientesFiltrados.map(cliente => (
                    <li
                      key={cliente.id_agente}
                      className="p-2 mb-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setCliente(cliente.nombre_agente_completo);
                        setClienteSeleccionado(cliente);
                        setMostrarSugerencias(false);
                        // Llamar a cargarEmpresasAgente cuando se selecciona un cliente
                        cargarEmpresasAgente(cliente.id_agente);
                      }}
                    >
                      {cliente.nombre_agente_completo} - {cliente.correo}
                      {cliente.rfc && ` - ${cliente.rfc}`}
                    </li>
                  ))}
                </ul>
              )}
              {/* Mostrar selector de empresas después de seleccionar agente */}
              {/* {clienteSeleccionado && (
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
                          value={empresaSeleccionada?.id || ''}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const selected = empresasAgente.find(emp => emp.id === selectedId);
                            if (selected) {
                              setEmpresaSeleccionada(selected);
                              console.log("Empresa seleccionada:", {
                                id: selected.id,
                                razon_social: selected.razon_social,
                                rfc: selected.rfc
                              });
                            }
                          }}
                        >
                          {!empresaSeleccionada ? (
                            <option value="" disabled>Seleccione una empresa</option>
                          ) : null}
                          {empresasAgente.map((empresa) => (
                            <option key={empresa.id} value={empresa.id}>
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
              )} */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border border-dashed p-4 rounded">
                <label className="block font-medium mb-2">Archivo PDF (Opcional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setArchivoPDF(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {archivoPDF ? archivoPDF.name : 'Sin archivos seleccionados'}
                </p>
              </div>

              <div className="border border-dashed p-4 rounded">
                <label className="block font-medium mb-2">Archivo XML (Requerido) *</label>
                <input
                  type="file"
                  accept=".xml"
                  onChange={(e) => setArchivoXML(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {archivoXML ? archivoXML.name : 'Sin archivos seleccionados'}
                </p>
              </div>
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
                disabled={!cliente || !archivoXML}
              >
                Mostrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarVistaPrevia && (
        <VistaPreviaModal
          facturaData={facturaData}
          // agente={clienteSeleccionado}
          // empresa={empresaSeleccionada}

          onConfirm={() => {
            setMostrarConfirmacion(true);
            cerrarVistaPrevia();
          }}
          onClose={cerrarVistaPrevia}
        />
      )}
      <ConfirmacionModal
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={handleConfirmarFactura}
      />
    </>
  );
}

