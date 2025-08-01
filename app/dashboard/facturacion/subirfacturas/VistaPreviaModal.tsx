// 'use client';
// import React from 'react';
// // import { Agente, EmpresaFromAgent } from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";


// interface VistaPreviaProps {
//   facturaData: any;
//   onClose: () => void;
//   onConfirm: () => void;
//   isLoading?: boolean;

//   // agente: Agente | null; // Hacerla opcional si no siempre está presente
//   // empresa: EmpresaFromAgent | null; // Hacerla opcional si no siempre está presente
// }

// export default function VistaPreviaModal({
//   facturaData,
//   onClose,
//   onConfirm,
//   isLoading = false
//   // agente,
//   // empresa
// }: VistaPreviaProps) {


//   return (
//     <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
//       <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
//         <h1 className="text-xl font-bold mb-1">Vista Previa de Factura XML</h1>
//         <p className="text-gray-500 text-sm mb-4">
//           Revisa la información extraída del archivo XML antes de proceder
//         </p>


//         <div className="flex justify-between bg-blue-50 px-6 py-3 rounded border text-sm font-medium mb-4">
//           <div className='justify-center'>
//             <p>Factura:<strong> {facturaData.comprobante.folio}</strong></p>
//             {/*  */}

//           </div>
//           <p>Fecha: {facturaData?.comprobante?.fecha ? new Date(facturaData.comprobante.fecha).toISOString().split('T')[0] : ''}</p>
//           {/* {facturaData.fecha} */}

//           <p>Subtotal: <strong>${facturaData.comprobante.subtotal}</strong></p>
//           {/* {facturaData.subtotal} */}

//           <p>Total: <strong className='text-green-600'>${facturaData.comprobante.total}</strong></p>
//           {/* {facturaData.total} */}
//         </div>

//         <div className="flex justify-between gap-6 mb-4">
//           <div className="w-1/2 bg-gray-50 p-4 rounded">
//             <h2><strong>Emisor</strong></h2>
//             <p><strong>{facturaData.emisor.rfc}</strong></p>
//             {/* {facturaData.emisor.rfc} */}
//             <p>{facturaData.emisor.nombre}</p>
//             {/* {facturaData.emisor.nombre} */}
//           </div>
//           <div className="w-1/2 bg-blue-50 p-4 rounded">
//             <h3><strong className='text-blue-800'>Receptor</strong></h3>
//             <p><strong>{facturaData.receptor.rfc}</strong></p>
//             {/* {facturaData.receptor.rfc} */}
//             <p>{facturaData.receptor.nombre}</p>
//             {/* {facturaData.receptor.nombre} */}
//           </div>
//         </div>

//         <div className="flex justify-between items-center bg-green-50 px-6 py-3 rounded text-sm font-medium mb-4">
//           <div>
//             <h3><strong className='text-green-900'>Impuestos</strong></h3>
//             <p>{facturaData.impuestos.traslado.impuesto} ({facturaData.impuestos.traslado.tasa * 100}%)</p>
//           </div>
//           {/* {facturaData.impuestos.clave} ({facturaData.impuestos.tasa}) */}
//           <div>
//             <p><strong>${facturaData.impuestos.traslado.importe}</strong></p>
//           </div>
//           {/* {facturaData.impuestos.monto} */}
//         </div>
//         <div className="items-start bg-gray-50 px-6 py-3 rounded mb-4">
//           <h3 className="text-base font-semibold mb-2"><strong>Conceptos</strong> ({facturaData?.conceptos?.length || 1})</h3>

//           <div className='flex justify-between'>
//             <div>
//               <ol >
//                 {/* Versión fija de ejemplo */}
//                 {facturaData?.conceptos?.map((concepto: any, i: number) => (
//                   <li key={i}>{concepto.descripcion}</li>
//                 ))}
//               </ol>
//             </div>
//             <div>
//               <ol >
//                 {/* Versión fija de ejemplo */}
//                 {facturaData?.conceptos?.map((concepto: any, i: number) => (
//                   <li key={i}><strong>${concepto.valorUnitario}</strong></li>
//                 ))}
//               </ol>
//               {/* factraData.subtotal*/}
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center justify-center gap-1 text-sm text-gray-700 mb-4">
//           <p>UUID: </p>
//           <p className='text-blue-500'>{facturaData.timbreFiscal.uuid}</p>
//           {/* {facturaData.uuid} */}
//         </div>

//         <div className="flex justify-end gap-2 mt-4">
//           <button
//             className="px-4 py-2 rounded bg-red-500 hover:bg-red-800"
//             onClick={onClose}
//             disabled={isLoading}
//           >
//             Cancelar
//           </button>
//           <button
//             className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-800"
//             onClick={onConfirm}
//             disabled={isLoading}
//           >
//             {isLoading ? "Procesando..." : "Aceptar y Continuar"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// 'use client';
// import React, { useEffect, useState } from 'react';
// import { generarFacturaPDF } from "./parsePdf";

// interface VistaPreviaProps {
//   facturaData: any;
//   onClose: () => void;
//   onConfirm: () => void;
//   isLoading?: boolean;
// }

// export default function VistaPreviaModal({
//   facturaData,
//   onClose,
//   onConfirm,
//   isLoading = false
// }: VistaPreviaProps) {
//   const [pdfUrl, setPdfUrl] = useState<string | null>(null);
//   const [showPdf, setShowPdf] = useState(false);

//   useEffect(() => {
//     async function generarPDF() {
//       const url = await generarFacturaPDF(facturaData);
//       setPdfUrl(url);
//     }

//     if (facturaData) generarPDF();
//   }, [facturaData]);

//   const toggleView = () => setShowPdf(!showPdf);

//   const formatCurrency = (value: string) => {
//     return parseFloat(value).toLocaleString('es-MX', {
//       style: 'currency',
//       currency: 'MXN'
//     });
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('es-MX', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   return (
//     <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
//       <div className="bg-white p-6 rounded shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <h1 className="text-2xl font-bold">Vista Previa de Factura</h1>
//             <p className="text-gray-500 text-sm">
//               {showPdf ? "Visualización del PDF generado" : "Datos estructurados de la factura"}
//             </p>
//           </div>
//           <button
//             onClick={toggleView}
//             className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
//           >
//             {showPdf ? 'Ver datos estructurados' : 'Ver vista PDF'}
//           </button>
//         </div>

//         {showPdf ? (
//           pdfUrl ? (
//             <iframe
//               src={pdfUrl}
//               className="w-full h-[600px] border"
//               title="Vista PDF"
//             />
//           ) : (
//             <p>Generando vista previa PDF...</p>
//           )
//         ) : (
//           <div className="border border-gray-200 rounded-lg p-6">
//             {/* Encabezado */}
//             <div className="flex justify-between items-start mb-8">
//               <div>
//                 <h2 className="text-xl font-bold text-blue-800">{facturaData.emisor.nombre}</h2>
//                 <p className="text-sm text-gray-600">RFC: {facturaData.emisor.rfc}</p>
//               </div>
//               <div className="text-right">
//                 <h3 className="text-lg font-bold">FACTURA</h3>
//                 <p className="text-sm">No. {facturaData.comprobante.folio}</p>
//                 <p className="text-sm">{formatDate(facturaData.comprobante.fecha)}</p>
//               </div>
//             </div>

//             {/* Datos del receptor */}
//             <div className="mb-6 p-4 bg-gray-50 rounded">
//               <h4 className="font-bold text-gray-700 mb-2">DATOS DEL RECEPTOR</h4>
//               <p className="font-semibold">{facturaData.receptor.nombre}</p>
//               <p className="text-sm">RFC: {facturaData.receptor.rfc}</p>
//             </div>

//             {/* Conceptos */}
//             <div className="mb-6">
//               <h4 className="font-bold text-gray-700 mb-3">CONCEPTOS</h4>
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="p-2 text-left border">Descripción</th>
//                     <th className="p-2 text-center border">Cantidad</th>
//                     <th className="p-2 text-right border">P. Unitario</th>
//                     <th className="p-2 text-right border">Importe</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {facturaData.conceptos.map((concepto: any, index: number) => (
//                     <tr key={index} className="border-b">
//                       <td className="p-2 border">{concepto.descripcion}</td>
//                       <td className="p-2 text-center border">{concepto.cantidad}</td>
//                       <td className="p-2 text-right border">{formatCurrency(concepto.valorUnitario)}</td>
//                       <td className="p-2 text-right border">{formatCurrency(concepto.importe)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Totales */}
//             <div className="flex justify-end">
//               <div className="w-1/2">
//                 <div className="flex justify-between py-2 border-b">
//                   <span className="font-semibold">Subtotal:</span>
//                   <span>{formatCurrency(facturaData.comprobante.subtotal)}</span>
//                 </div>
//                 <div className="flex justify-between py-2 border-b">
//                   <span className="font-semibold">IVA ({facturaData.impuestos.traslado.tasa * 100}%):</span>
//                   <span>{formatCurrency(facturaData.impuestos.traslado.importe)}</span>
//                 </div>
//                 <div className="flex justify-between py-2 font-bold text-lg">
//                   <span>Total:</span>
//                   <span className="text-green-600">{formatCurrency(facturaData.comprobante.total)}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Timbre fiscal */}
//             <div className="mt-6 pt-4 border-t text-xs text-gray-500">
//               <p className="font-semibold">TIMBRE FISCAL DIGITAL</p>
//               <p>UUID: <span className="text-blue-500">{facturaData.timbreFiscal.uuid}</span></p>
//               <p>Fecha de timbrado: {formatDate(facturaData.timbreFiscal.fechaTimbrado)}</p>
//             </div>
//           </div>
//         )}

//         {/* Botones de acción */}
//         <div className="flex justify-end gap-2 mt-6">
//           <button
//             className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
//             onClick={onClose}
//             disabled={isLoading}
//           >
//             Cancelar
//           </button>
//           <button
//             className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
//             onClick={onConfirm}
//             disabled={isLoading}
//           >
//             {isLoading ? "Procesando..." : "Aceptar y Continuar"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';
import React, { useEffect, useState } from 'react';
import { generarFacturaPDF } from "./parsePdf";

interface VistaPreviaProps {
  facturaData: any;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function VistaPreviaModal({
  facturaData,
  onClose,
  onConfirm,
  isLoading = false
}: VistaPreviaProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    async function generarPDF() {
      const url = await generarFacturaPDF(facturaData);
      setPdfUrl(url);
    }

    if (facturaData) generarPDF();
  }, [facturaData]);

  const toggleView = () => setShowPdf(!showPdf);

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Vista Previa de Factura</h1>
            <p className="text-gray-500 text-sm">
              {showPdf ? "Visualización del PDF generado" : "Datos estructurados de la factura"}
            </p>
          </div>
          <button
            onClick={toggleView}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            {showPdf ? 'Ver datos estructurados' : 'Ver vista PDF'}
          </button>
        </div>

        {showPdf ? (
          pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[600px] border"
              title="Vista PDF"
            />
          ) : (
            <p>Generando vista previa PDF...</p>
          )
        ) : (
          <FacturaEstructurada
            facturaData={facturaData}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : "Aceptar y Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const FacturaEstructurada = ({ facturaData, formatCurrency, formatDate }: any) => (
  <div className="border border-gray-200 rounded-lg p-6">
    {/* Encabezado */}
    <div className="flex justify-between items-start mb-8">
      <div>
        <h2 className="text-xl font-bold text-blue-800">{facturaData.emisor.nombre}</h2>
        <p className="text-sm text-gray-600">RFC: {facturaData.emisor.rfc}</p>
      </div>
      <div className="text-right">
        <h3 className="text-lg font-bold">FACTURA</h3>
        <p className="text-sm">No. {facturaData.comprobante.folio}</p>
        <p className="text-sm">{formatDate(facturaData.comprobante.fecha)}</p>
      </div>
    </div>

    {/* Datos del receptor */}
    <div className="mb-6 p-4 bg-gray-50 rounded">
      <h4 className="font-bold text-gray-700 mb-2">DATOS DEL RECEPTOR</h4>
      <p className="font-semibold">{facturaData.receptor.nombre}</p>
      <p className="text-sm">RFC: {facturaData.receptor.rfc}</p>
    </div>

    {/* Conceptos */}
    <div className="mb-6">
      <h4 className="font-bold text-gray-700 mb-3">CONCEPTOS</h4>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left border">Descripción</th>
            <th className="p-2 text-center border">Cantidad</th>
            <th className="p-2 text-right border">P. Unitario</th>
            <th className="p-2 text-right border">Importe</th>
          </tr>
        </thead>
        <tbody>
          {facturaData.conceptos.map((concepto: any, index: number) => (
            <tr key={index} className="border-b">
              <td className="p-2 border">{concepto.descripcion}</td>
              <td className="p-2 text-center border">{concepto.cantidad}</td>
              <td className="p-2 text-right border">{formatCurrency(concepto.valorUnitario)}</td>
              <td className="p-2 text-right border">{formatCurrency(concepto.importe)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Totales */}
    <div className="flex justify-end">
      <div className="w-1/2">
        <div className="flex justify-between py-2 border-b">
          <span className="font-semibold">Subtotal:</span>
          <span>{formatCurrency(facturaData.comprobante.subtotal)}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-semibold">IVA ({facturaData.impuestos.traslado.tasa * 100}%):</span>
          <span>{formatCurrency(facturaData.impuestos.traslado.importe)}</span>
        </div>
        <div className="flex justify-between py-2 font-bold text-lg">
          <span>Total:</span>
          <span className="text-green-600">{formatCurrency(facturaData.comprobante.total)}</span>
        </div>
      </div>
    </div>

    {/* Timbre fiscal */}
    <div className="mt-6 pt-4 border-t text-xs text-gray-500">
      <p className="font-semibold">TIMBRE FISCAL DIGITAL</p>
      <p>UUID: <span className="text-blue-500">{facturaData.timbreFiscal.uuid}</span></p>
      <p>Fecha de timbrado: {formatDate(facturaData.timbreFiscal.fechaTimbrado)}</p>
    </div>
  </div>
);