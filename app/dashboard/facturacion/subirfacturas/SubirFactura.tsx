'use client';

import { useState, useEffect } from 'react';
import { parsearXML } from './parseXmlCliente';
import VistaPreviaModal from './VistaPreviaModal';

export default function FacturasPage() {
  const [facturaData, setFacturaData] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [cliente, setCliente] = useState('');
  const [archivoPDF, setArchivoPDF] = useState<File | null>(null);
  const [archivoXML, setArchivoXML] = useState<File | null>(null);
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Esta sería tu lista de clientes (deberías obtenerla de tu API o contexto)
  const [clientes, setClientes] = useState<any[]>([]);

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

  const seleccionarCliente = (clienteSeleccionado: any) => {
    setCliente(clienteSeleccionado.nombre); // O el campo que quieras mostrar
    setClientesFiltrados([]);
    setMostrarSugerencias(false);
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
                onChange={handleBuscarCliente}
                onFocus={() => cliente.length > 2 && setMostrarSugerencias(true)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
              />
              {mostrarSugerencias && clientesFiltrados.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {clientesFiltrados.map((cliente, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => seleccionarCliente(cliente)}
                    >
                      <div className="font-medium">{cliente.nombre}</div>
                      <div className="text-sm text-gray-600">
                        {cliente.rfc} | {cliente.email}
                      </div>
                    </div>
                  ))}
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
          onClose={cerrarVistaPrevia}
          onConfirm={() => {
            alert('Factura confirmada');
            cerrarVistaPrevia();
          }}
        />
      )}
    </>
  );
}