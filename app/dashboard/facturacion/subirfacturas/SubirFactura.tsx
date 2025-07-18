'use client';
import { URL, API_KEY } from "@/lib/constants/index";
import { useState, useEffect } from 'react';
import { parsearXML } from './parseXmlCliente';
import VistaPreviaModal from './VistaPreviaModal';
import ConfirmacionModal from './confirmacion';

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
interface Cliente {
  id: string;
  nombre: string;
  email: string;
  rfc: string;
  razonSocial: string;
  id_usuario_generador: string;
  id_agente?: string; // Añade esta propiedad
}

export default function FacturasPage() {
  const [facturaData, setFacturaData] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [cliente, setCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [archivoPDF, setArchivoPDF] = useState<File | null>(null);
  const [archivoXML, setArchivoXML] = useState<File | null>(null);
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);


  // Esta sería tu lista de clientes (deberías obtenerla de tu API o contexto)
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: "1",
      nombre: "Cliente Ejemplo 1",
      email: "cliente1@example.com",
      rfc: "RFC123456789",
      razonSocial: "Razón Social Cliente 1",
      id_usuario_generador: "user123"
    },
    // Agrega más clientes según sea necesario
  ]);


  // Obtener clientes al montar el componente (ejemplo)
  useEffect(() => {
    // Aquí deberías hacer la llamada a tu API para obtener los clientes
    // fetchClientes().then(data => setClientes(data));
  }, []);

  const abrirModal = () => {
    setMostrarModal(true);
    // Opcional: cargar clientes al abrir el modal
    // fetchClientes().then(data => setClientes(data));
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setCliente('');
    setClientesFiltrados([]);
  };

  const handleConfirmarFactura = () => {
    // Lógica para aplicar la factura
    alert('Factura aplicada correctamente');
    // Aquí podrías hacer la llamada a tu API para guardar la factura
    cerrarVistaPrevia();
  };

  const handleBuscarCliente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setCliente(valor);

    if (valor.length > 2) {
      const filtrados = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(valor.toLowerCase()) ||
        cliente.email.toLowerCase().includes(valor.toLowerCase()) ||
        cliente.rfc.toLowerCase().includes(valor.toLowerCase()) ||
        cliente.razonSocial.toLowerCase().includes(valor.toLowerCase())
      );
      setClientesFiltrados(filtrados);
      setMostrarSugerencias(true);
    } else {
      setClientesFiltrados([]);
      setMostrarSugerencias(false);
    }
  };


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
                onChange={(e) => {
                  const valor = e.target.value;
                  setCliente(valor);
                  if (valor.length > 2) {
                    const filtrados = clientes.filter(c =>
                      c.nombre.toLowerCase().includes(valor.toLowerCase()) ||
                      c.email.toLowerCase().includes(valor.toLowerCase()) ||
                      c.rfc.toLowerCase().includes(valor.toLowerCase()) ||
                      c.razonSocial.toLowerCase().includes(valor.toLowerCase())
                    );
                    setClientesFiltrados(filtrados);
                    setMostrarSugerencias(true);
                  } else {
                    setClientesFiltrados([]);
                    setMostrarSugerencias(false);
                  }
                }}
                onFocus={() => cliente.length > 2 && setMostrarSugerencias(true)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
              />
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

