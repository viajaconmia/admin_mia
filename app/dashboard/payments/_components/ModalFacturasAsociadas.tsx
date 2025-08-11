// components/ModalFacturasAsociadas.tsx
'use client';
import React from 'react';
import { X } from 'lucide-react';

interface ModalFacturasAsociadasProps {
  facturas: string[];
  onClose: () => void;
}

const ModalFacturasAsociadas: React.FC<ModalFacturasAsociadasProps> = ({ facturas, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Facturas asociadas al pago
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {facturas.length === 0 ? (
            <p className="text-gray-500">No hay facturas asociadas a este pago</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-600 border-b pb-2">
                <div className="col-span-1">#</div>
                <div className="col-span-11">ID Factura</div>
              </div>
              {facturas.map((factura, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center border-b pb-2">
                  <div className="col-span-1 text-gray-500">{index + 1}</div>
                  <div className="col-span-11">
                    <div className="flex items-center justify-between">
                      <span className="font-mono bg-gray-100 px-3 py-1 rounded text-sm">
                        {factura.trim()}
                      </span>
                      <a
                        href={`/dashboard/facturacion/ver-factura/${factura.trim()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver detalles
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalFacturasAsociadas;