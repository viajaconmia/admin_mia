'use client';
import React from 'react';
// import { Agente, EmpresaFromAgent } from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";


interface VistaPreviaProps {
  facturaData: any;
  onClose: () => void;
  onConfirm: () => void;
  // agente: Agente | null; // Hacerla opcional si no siempre está presente
  // empresa: EmpresaFromAgent | null; // Hacerla opcional si no siempre está presente
}

export default function VistaPreviaModal({
  facturaData,
  onClose,
  onConfirm,
  // agente,
  // empresa
}: VistaPreviaProps) {

  console.log(facturaData.comprobante.fecha)
  console.log(facturaData)
  // console.log(agente)
  // console.log(empresa)

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
        <h1 className="text-xl font-bold mb-1">Vista Previa de Factura XML</h1>
        <p className="text-gray-500 text-sm mb-4">
          Revisa la información extraída del archivo XML antes de proceder
        </p>


        <div className="flex justify-between bg-blue-50 px-6 py-3 rounded border text-sm font-medium mb-4">
          <div className='justify-center'>
            <p>Factura:<strong> {facturaData.comprobante.folio}</strong></p>
            {/*  */}

          </div>
          <p>Fecha: {facturaData?.comprobante?.fecha ? new Date(facturaData.comprobante.fecha).toISOString().split('T')[0] : ''}</p>
          {/* {facturaData.fecha} */}

          <p>Subtotal: <strong>${facturaData.comprobante.subtotal}</strong></p>
          {/* {facturaData.subtotal} */}

          <p>Total: <strong className='text-green-600'>${facturaData.comprobante.total}</strong></p>
          {/* {facturaData.total} */}
        </div>

        <div className="flex justify-between gap-6 mb-4">
          <div className="w-1/2 bg-gray-50 p-4 rounded">
            <h2><strong>Emisor</strong></h2>
            <p><strong>{facturaData.emisor.rfc}</strong></p>
            {/* {facturaData.emisor.rfc} */}
            <p>{facturaData.emisor.nombre}</p>
            {/* {facturaData.emisor.nombre} */}
          </div>
          <div className="w-1/2 bg-blue-50 p-4 rounded">
            <h3><strong className='text-blue-800'>Receptor</strong></h3>
            <p><strong>{facturaData.receptor.rfc}</strong></p>
            {/* {facturaData.receptor.rfc} */}
            <p>{facturaData.receptor.nombre}</p>
            {/* {facturaData.receptor.nombre} */}
          </div>
        </div>

        <div className="flex justify-between items-center bg-green-50 px-6 py-3 rounded text-sm font-medium mb-4">
          <div>
            <h3><strong className='text-green-900'>Impuestos</strong></h3>
            <p>{facturaData.impuestos.traslado.impuesto} ({facturaData.impuestos.traslado.tasa * 100}%)</p>
          </div>
          {/* {facturaData.impuestos.clave} ({facturaData.impuestos.tasa}) */}
          <div>
            <p><strong>${facturaData.impuestos.traslado.importe}</strong></p>
          </div>
          {/* {facturaData.impuestos.monto} */}
        </div>
        <div className="items-start bg-gray-50 px-6 py-3 rounded mb-4">
          <h3 className="text-base font-semibold mb-2"><strong>Conceptos</strong> ({facturaData?.conceptos?.length || 1})</h3>

          <div className='flex justify-between'>
            <div>
              <ol >
                {/* Versión fija de ejemplo */}
                {facturaData?.conceptos?.map((concepto: any, i: number) => (
                  <li key={i}>{concepto.descripcion}</li>
                ))}
              </ol>
            </div>
            <div>
              <ol >
                {/* Versión fija de ejemplo */}
                {facturaData?.conceptos?.map((concepto: any, i: number) => (
                  <li key={i}><strong>${concepto.valorUnitario}</strong></li>
                ))}
              </ol>
              {/* factraData.subtotal*/}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 text-sm text-gray-700 mb-4">
          <p>UUID: </p>
          <p className='text-blue-500'>{facturaData.timbreFiscal.uuid}</p>
          {/* {facturaData.uuid} */}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 rounded bg-red-500 hover:bg-red-800"
            onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-800"
            onClick={onConfirm}>Aceptar y Continuar</button>
        </div>
      </div>
    </div>
  );
}
