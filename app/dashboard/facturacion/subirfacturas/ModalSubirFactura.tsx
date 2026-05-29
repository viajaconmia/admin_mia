"use client";

import React from "react";
import VistaPreviaSolicitudesBatch from "./solicitudes_proveedor";
import {
  normalizeUUIDInput,
  formatMoneyMXN,
  safeNumStr,
  type Agente,
  type AsociacionSolicitudProveedor,
  type FacturaErrors,
  type Pago,
} from "./helpers";

type ModoFacturaProveedor = "nueva" | "subida";

export interface ModalSubirFacturaProps {
  text: string;
  nombre: string;
  mostrarSwitchFacturaProveedor: boolean;
  modoFacturaProveedor: ModoFacturaProveedor;
  setModoFacturaProveedor: (m: ModoFacturaProveedor) => void;
  isProveedorBatch: boolean;
  isProveedorMode: boolean;
  isClienteBloqueado: boolean;
  clienteSeleccionado: Agente | null;
  cliente: string;
  agentId?: string;
  pagoData?: Pago | null;
  errors: FacturaErrors;
  mostrarSugerencias: boolean;
  clientesFiltrados: any[];
  handleBuscarCliente: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setMostrarSugerencias: (v: boolean) => void;
  setCliente: (v: string) => void;
  setClienteSeleccionado: (v: Agente | null) => void;
  cargarEmpresasAgente: (id: string) => void;
  esFacturaNuevaMode: boolean;
  esFacturaSubidaMode: boolean;
  archivoXML: File | null;
  archivoPDF: File | null;
  setArchivoXML: (f: File | null) => void;
  setArchivoPDF: (f: File | null) => void;
  uuidBusqueda: string;
  setUuidBusqueda: (v: string) => void;
  facturaEncontrada: any;
  loadingFacturadoPrevio: boolean;
  buscandoFactura: boolean;
  asignandoFacturaPrevia: boolean;
  batchAsociaciones: AsociacionSolicitudProveedor[];
  batchTotalAsociar: number;
  totalAsignadoFacturaPrevia: number;
  facturadoPrevioMap: Record<string, any>;
  singleAsociacionProveedor: any;
  facturado: string | null;
  monedaFacturaPrevia: string;
  requiereConversionProveedorPrevia: boolean;
  tipoCambioFacturaPrevia: number;
  handleChangeMontoBatchFacturaPrevia: (idx: number, raw: string) => void;
  handleChangeMontoSingleFacturaPrevia: (raw: string) => void;
  formatCurrency: (v: string | number, currency?: string) => string;
  fromMXNToOriginal: (amount: any) => number;
  getPreviewConversion: (amount: any) => any;
  facturaPagada: boolean;
  setFacturaPagada: (v: boolean) => void;
  hasItems: boolean;
  subiendoArchivos: boolean;
  cerrarModal: () => void;
  handleEnviar: () => void;
  buscarFacturaPorUUID: () => void;
  asignarFacturaPrevia: () => void;
  propinaActivaPrevia: boolean;
  setPropinaActivaPrevia: (v: boolean) => void;
  propinaMontoPrevia: string;
  setPropinaMontoPrevia: (v: string) => void;
}

export default function ModalSubirFactura({
  text,
  nombre,
  mostrarSwitchFacturaProveedor,
  modoFacturaProveedor,
  setModoFacturaProveedor,
  isProveedorBatch,
  isProveedorMode,
  isClienteBloqueado,
  clienteSeleccionado,
  cliente,
  agentId,
  pagoData,
  errors,
  mostrarSugerencias,
  clientesFiltrados,
  handleBuscarCliente,
  setMostrarSugerencias,
  setCliente,
  setClienteSeleccionado,
  cargarEmpresasAgente,
  esFacturaNuevaMode,
  esFacturaSubidaMode,
  archivoXML,
  archivoPDF,
  setArchivoXML,
  setArchivoPDF,
  uuidBusqueda,
  setUuidBusqueda,
  facturaEncontrada,
  loadingFacturadoPrevio,
  buscandoFactura,
  asignandoFacturaPrevia,
  batchAsociaciones,
  batchTotalAsociar,
  totalAsignadoFacturaPrevia,
  facturadoPrevioMap,
  singleAsociacionProveedor,
  facturado,
  monedaFacturaPrevia,
  requiereConversionProveedorPrevia,
  tipoCambioFacturaPrevia,
  handleChangeMontoBatchFacturaPrevia,
  handleChangeMontoSingleFacturaPrevia,
  formatCurrency,
  fromMXNToOriginal,
  getPreviewConversion,
  facturaPagada,
  setFacturaPagada,
  hasItems,
  subiendoArchivos,
  cerrarModal,
  handleEnviar,
  buscarFacturaPorUUID,
  asignarFacturaPrevia,
  propinaActivaPrevia,
  setPropinaActivaPrevia,
  propinaMontoPrevia,
  setPropinaMontoPrevia,
}: ModalSubirFacturaProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl">
        <h2 className="text-xl font-semibold mb-1">{text}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sube los archivos PDF y XML de la factura
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Recuerda el nombre de los archivos no debe de contener @ # .
        </p>

        {mostrarSwitchFacturaProveedor && (
          <div className="mb-4">
            <label className="block mb-2 font-medium">Tipo de factura</label>
            <div className="inline-flex rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setModoFacturaProveedor("nueva");
                  setUuidBusqueda("");
                }}
                className={`px-4 py-2 text-sm ${
                  modoFacturaProveedor === "nueva"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                Factura nueva
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoFacturaProveedor("subida");
                  setArchivoXML(null);
                  setArchivoPDF(null);
                }}
                className={`px-4 py-2 text-sm border-l ${
                  modoFacturaProveedor === "subida"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                Factura subida
              </button>
            </div>
          </div>
        )}

        {!isProveedorBatch && (
          <div className="relative mb-4">
            <label className="block mb-2 font-medium">{nombre}</label>

            {isClienteBloqueado ? (
              <>
                <div className="w-full p-2 border rounded bg-gray-100 text-gray-700">
                  {clienteSeleccionado?.nombre_agente_completo ||
                    cliente ||
                    "Cargando cliente..."}
                </div>
                <input
                  type="hidden"
                  name="id_agente"
                  value={
                    clienteSeleccionado?.id_agente ||
                    agentId ||
                    pagoData?.id_agente ||
                    ""
                  }
                />
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre, email o RFC..."
                  className={`w-full p-2 border rounded ${
                    errors.clienteSeleccionado
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  value={cliente}
                  onChange={handleBuscarCliente}
                  onFocus={() =>
                    cliente.length > 2 && setMostrarSugerencias(true)
                  }
                  onBlur={() =>
                    setTimeout(() => setMostrarSugerencias(false), 200)
                  }
                />

                {mostrarSugerencias && clientesFiltrados.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {clientesFiltrados.map((c) => (
                      <li
                        key={c.id_agente}
                        className="p-2 mb-2 hover:bg-gray-100 cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCliente(c.nombre_agente_completo);
                          setClienteSeleccionado(c);
                          setMostrarSugerencias(false);
                          cargarEmpresasAgente(c.id_agente);
                        }}
                      >
                        {c.nombre_agente_completo} - {c.correo}
                        {c.rfc && ` - ${c.rfc}`}
                      </li>
                    ))}
                  </ul>
                )}

                {errors.clienteSeleccionado && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.clienteSeleccionado}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {esFacturaNuevaMode && (
          <>
            {/* XML */}
            <div>
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <label className="block text-gray-700 font-semibold mb-2">
                  Archivo XML (Requerido){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="xml-upload"
                  accept="text/xml,.xml,application/xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (
                      file &&
                      !["text/xml", "application/xml"].includes(file.type)
                    ) {
                      alert("Por favor, sube solo archivos XML");
                      e.target.value = "";
                      setArchivoXML(null);
                      return;
                    }
                    setArchivoXML(file);
                  }}
                />
                <label
                  htmlFor="xml-upload"
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600 transition"
                >
                  Seleccionar archivo
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  {archivoXML ? archivoXML.name : "Sin archivos seleccionados"}
                </p>
              </div>
            </div>

            {/* PDF */}
            <div className="mt-4">
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <label className="block text-gray-700 font-semibold mb-2">
                  Archivo PDF (Requerido){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.type !== "application/pdf") {
                      alert("Por favor, sube solo archivos PDF");
                      e.target.value = "";
                      setArchivoPDF(null);
                      return;
                    }
                    setArchivoPDF(file);
                  }}
                />
                <label
                  htmlFor="pdf-upload"
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600 transition"
                >
                  Seleccionar archivo
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  {archivoPDF ? archivoPDF.name : "Sin archivos seleccionados"}
                </p>
              </div>
            </div>
          </>
        )}

        {esFacturaSubidaMode && (
          <div className="mt-4">
            <label className="block mb-2 font-medium">
              UUID de la factura
            </label>
            <input
              type="text"
              placeholder="Ej. 123E4567-E89B-12D3-A456-426614174000"
              value={uuidBusqueda}
              onChange={(e) =>
                setUuidBusqueda(normalizeUUIDInput(e.target.value))
              }
              className="w-full p-2 border rounded border-gray-300"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingresa el UUID de una factura ya subida para buscarla en sistema.
            </p>

            {facturaEncontrada && (
              <div className="mt-4 p-4 rounded border bg-blue-50">
                <div className="mb-3 text-sm text-gray-700">
                  <div>
                    <strong>UUID:</strong> {facturaEncontrada?.uuid_factura}
                  </div>
                  <div>
                    <strong>Total factura:</strong>{" "}
                    {formatMoneyMXN(facturaEncontrada?.total)}
                  </div>
                  <div>
                    <strong>Saldo disponible:</strong>{" "}
                    {formatMoneyMXN(facturaEncontrada?.restante_por_facturar)}
                  </div>
                </div>

                {loadingFacturadoPrevio && (
                  <div className="mb-3 text-sm text-blue-700">
                    Consultando montos disponibles por solicitud...
                  </div>
                )}
              </div>
            )}

            {facturaEncontrada && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-amber-800 text-sm">Propina</h3>
                  <button
                    type="button"
                    onClick={() => setPropinaActivaPrevia(!propinaActivaPrevia)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      propinaActivaPrevia ? "bg-amber-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        propinaActivaPrevia ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {propinaActivaPrevia && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-amber-900 mb-1">
                      Monto de propina
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={propinaMontoPrevia}
                      onChange={(e) => setPropinaMontoPrevia(safeNumStr(e.target.value))}
                      className="w-full p-2 border border-amber-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    {Number(propinaMontoPrevia || 0) > 0 && (
                      <div className="text-xs mt-2 text-amber-900 space-y-1 border-t border-amber-200 pt-2">
                        <div className="flex justify-between">
                          <span>Total factura:</span>
                          <span className="font-mono">{formatMoneyMXN(facturaEncontrada?.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Propina:</span>
                          <span className="font-mono">+ {formatMoneyMXN(Number(propinaMontoPrevia || 0))}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-amber-800 border-t border-amber-200 pt-1">
                          <span>Total con propina:</span>
                          <span className="font-mono">
                            {formatMoneyMXN(Number(facturaEncontrada?.total || 0) + Number(propinaMontoPrevia || 0))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(isProveedorBatch || isProveedorMode) && facturaEncontrada && (
          <VistaPreviaSolicitudesBatch
            isProveedorBatch={isProveedorBatch}
            isProveedorMode={isProveedorMode}
            monedaFactura={monedaFacturaPrevia}
            requiereConversionProveedor={requiereConversionProveedorPrevia}
            tipoCambioFactura={tipoCambioFacturaPrevia}
            totalFactura={Number(
              facturaEncontrada?.saldo_x_aplicar_items ?? 0,
            )}
            batchAsociaciones={batchAsociaciones}
            batchTotalAsociar={batchTotalAsociar}
            batchTotalAsociarMXN={batchTotalAsociar}
            restanteFacturaMXN={Math.max(
              0,
              Number(facturaEncontrada?.saldo_x_aplicar_items ?? 0) -
                totalAsignadoFacturaPrevia,
            )}
            loadingFacturado={loadingFacturadoPrevio}
            facturadoMap={facturadoPrevioMap}
            handleChangeMontoBatch={handleChangeMontoBatchFacturaPrevia}
            singleAsociacion={singleAsociacionProveedor}
            singleMontoAsociar={facturado ?? ""}
            handleChangeMontoSingle={handleChangeMontoSingleFacturaPrevia}
            formatCurrency={formatCurrency}
            fromMXNToOriginal={fromMXNToOriginal}
            getPreviewConversion={getPreviewConversion}
          />
        )}

        {/* Checkbox factura pagada */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="facturaPagada"
            checked={facturaPagada}
            onChange={(e) =>
              !pagoData && hasItems && setFacturaPagada(e.target.checked)
            }
            disabled={!!pagoData || hasItems}
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
              !!pagoData || !hasItems ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          <label
            htmlFor="facturaPagada"
            className={`ml-2 block text-sm ${
              !!pagoData || !hasItems ? "text-gray-500" : "text-gray-900"
            }`}
          >
            {pagoData
              ? "Factura marcada como pagada (asociada a pago)"
              : !hasItems
                ? "Factura marcada como pagada (sin ítems)"
                : "La factura está pagada"}
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
            onClick={
              esFacturaSubidaMode
                ? facturaEncontrada
                  ? asignarFacturaPrevia
                  : buscarFacturaPorUUID
                : handleEnviar
            }
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            disabled={
              esFacturaSubidaMode
                ? facturaEncontrada
                  ? asignandoFacturaPrevia || loadingFacturadoPrevio
                  : !uuidBusqueda || buscandoFactura
                : (!isProveedorBatch && !cliente) ||
                  !archivoXML ||
                  !archivoPDF ||
                  subiendoArchivos
            }
          >
            {esFacturaSubidaMode
              ? facturaEncontrada
                ? asignandoFacturaPrevia
                  ? "Asignando..."
                  : "Asignar factura"
                : buscandoFactura
                  ? "Buscando..."
                  : "Buscar factura"
              : subiendoArchivos
                ? "Procesando..."
                : "Datos de factura"}
          </button>
        </div>
      </div>
    </div>
  );
}
