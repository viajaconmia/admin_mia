'use client';
import React from 'react';
import { X, Copy, Check, Trash2 } from 'lucide-react';

interface FacturaDetalle {
  id: string;
  total: string;
}

interface ModalFacturasAsociadasProps {
  facturas: string[];
  onClose: () => void;
  onDeleteFactura?: (facturaId: string) => void; // Nueva prop para manejar la eliminación
}

const ModalFacturasAsociadas: React.FC<ModalFacturasAsociadasProps> = ({
  facturas,
  onClose,
  onDeleteFactura
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [facturasDetalladas, setFacturasDetalladas] = React.useState<FacturaDetalle[]>([]);

  // Parsear facturas al montar el componente
  React.useEffect(() => {
    const parseFacturas = (facturasStr: string[]): FacturaDetalle[] => {
      if (facturasStr.length === 0) return [];

      const combined = facturasStr.join(' || ');
      const facturasSeparadas = combined.split('||').map(f => f.trim());

      return facturasSeparadas.map(facturaStr => {
        const idMatch = facturaStr.match(/Id factura: (.+?) \|/);
        const totalMatch = facturaStr.match(/Total: (.+?)$/);

        return {
          id: idMatch ? idMatch[1].trim() : 'N/A',
          total: totalMatch ? totalMatch[1].trim() : 'N/A'
        };
      });
    };

    setFacturasDetalladas(parseFacturas(facturas));
  }, [facturas]);

  const handleCopy = async (id: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (e) {
      console.error('No se pudo copiar:', e);
    }
  };

  const handleDelete = (facturaId: string, index: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta factura de la lista?')) {
      // Si se proporcionó un callback, llamarlo
      if (onDeleteFactura) {
        onDeleteFactura(facturaId);
      }

      // También eliminamos localmente para actualizar la UI
      const nuevasFacturas = [...facturasDetalladas];
      nuevasFacturas.splice(index, 1);
      setFacturasDetalladas(nuevasFacturas);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Facturas asociadas al pago
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {facturasDetalladas.length === 0 ? (
            <p className="text-gray-500">No hay facturas asociadas a este pago</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-600 border-b pb-2">
                <div className="col-span-1">#</div>
                <div className="col-span-5">ID Factura</div>
                <div className="col-span-1">Copiar</div>
                <div className="col-span-3 flex justify-center">Total</div>
                <div className="col-span-2 flex justify-center">Acciones</div>
              </div>
              {facturasDetalladas.map((factura, index) => {
                const isCopied = copiedIndex === index;
                return (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center border-b pb-2">
                    <div className="col-span-1 text-gray-500">{index + 1}</div>
                    <div className="col-span-5 font-mono text-sm break-all bg-gray-100 px-3 py-1 rounded">
                      {factura.id}
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => handleCopy(factura.id, index)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Copiar ID"
                      >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="col-span-3 text-sm font-medium flex justify-end">
                      ${factura.total}
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => handleDelete(factura.id, index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar factura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalFacturasAsociadas;