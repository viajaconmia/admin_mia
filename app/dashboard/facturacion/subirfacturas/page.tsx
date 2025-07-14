'use client';

import { useState } from 'react';

export default function FacturasPage() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cliente, setCliente] = useState('');
  const [archivoPDF, setArchivoPDF] = useState<File | null>(null);
  const [archivoXML, setArchivoXML] = useState<File | null>(null);

  const abrirModal = () => setMostrarModal(true);
  const cerrarModal = () => setMostrarModal(false);

  const handleEnviar = () => {
    console.log('Cliente:', cliente);
    console.log('PDF:', archivoPDF);
    console.log('XML:', archivoXML);
    cerrarModal();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Subir Facturas del SAT</h1>
      <p className="mb-6 text-gray-600">
        Sube facturas en formato PDF y XML para asociarlas a reservaciones
      </p>

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
              Selecciona el cliente y sube los archivos PDF y XML de la factura
            </p>

            <label className="block mb-2 font-medium">Cliente *</label>
            <input
              type="text"
              placeholder="Buscar cliente por nombre, email, RFC o razón social..."
              className="w-full p-2 border border-gray-300 rounded mb-4"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />

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
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={!cliente || !archivoXML}
              >
                Procesar y Mostrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
