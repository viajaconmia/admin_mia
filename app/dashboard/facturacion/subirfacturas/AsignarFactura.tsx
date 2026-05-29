"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { URL, API_KEY } from "@/lib/constants/index";
import { Table5 } from "@/components/Table5";
import { Search, Upload, X } from "lucide-react";

interface AsignarFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  id_factura?: string;
  onAssign?: (payload: any) => void;
  onCloseVistaPrevia?: () => void;
  facturaData?: any;
  empresaSeleccionada?: any;
    tipo:boolean;
  clienteSeleccionado?: any;
  archivoPDFUrl?: string | null;
  archivoXMLUrl?: string | null;
  pagoData?: {
    monto: number;
    [key: string]: any;
  };
  saldo: number;
}

interface ReservaConItems {
  id_solicitud: string;
  id_hospedaje: string;
  id_booking: string;
  id_servicio: string;
  id_agente: string;
  id_viajero: string;
  id_hotel: string;
  agente: string;
  empresa: string | null;
  viajero: string;
  telefono_viajero: string | null;
  viajeros_adicionales_reserva: string | null;
  nombre_acompanantes_reserva: string | null;
  correo_cliente: string;
  telefono_cliente: string;
  quien_reservó: string;
  status_reserva: string;
  total_venta: string;
  subtotal_servicio: string;
  total_booking: string;
  check_in: string;
  check_out: string;
  confirmation_code: string;
  nombre_hotel: string;
  cadena_hotel: string | null;
  codigo_reservacion_hotel: string;
  tipo_cuarto: string;
  noches: number;
  is_rembolsable: string | null;
  monto_penalizacion: number | null;
  conciliado: string | null;
  credito: string | null;
  created_at: string;
  updated_at: string;
  comments: string;
  nuevo_incluye_desayuno: string | null;
  items_info: {
    items: Array<{
      id_item: string;
      total: number;
    }>;
  };
}

interface SelectedItem {
  id_item: string;
  saldo: number;
}

const sanitizeCodigoReservacionHotel = (codigo?: string | null) => {
  const v = String(codigo || "");
  return v.includes("_CANCEL_") ? "" : v;
};

const safeJsonParse = (raw: string) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AsignarFacturaModal: React.FC<AsignarFacturaProps> = ({
  isOpen,
  onClose,
  onAssign,
  onCloseVistaPrevia,
  facturaData,   
  id_factura,
  clienteSeleccionado,
  pagoData,
  saldo,
  tipo,
}) => {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [montoRestante, setMontoRestante] = useState<number>(0);

  const [reservas, setReservas] = useState<ReservaConItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [csvMessage, setCsvMessage] = useState<{ tipo: "info" | "warn"; texto: string } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [maxMontoPermitido, setMaxMontoPermitido] = useState<number>(() => {
    if (pagoData?.monto) return Number(pagoData.monto) || 0;
    const total =
      facturaData?.comprobante?.total ?? facturaData?.total ?? saldo ?? 0;
    return typeof total === "number" ? total : Number(total) || 0;
  });

  useEffect(() => {
    if (pagoData?.monto) {
      setMaxMontoPermitido(Number(pagoData.monto) || 0);
    } else {
      const total =
        facturaData?.comprobante?.total ?? facturaData?.total ?? saldo ?? 0;
      setMaxMontoPermitido(typeof total === "number" ? total : Number(total) || 0);
    }
  }, [pagoData, facturaData, saldo]);

  useEffect(() => {
    const suma = selectedItems.reduce(
      (acc, it) => acc + (Number(it.saldo) || 0),
      0
    );
    setMontoSeleccionado(suma);
    setMontoRestante(Math.max(0, maxMontoPermitido - suma));
  }, [selectedItems, maxMontoPermitido]);

  useEffect(() => {
    if (isOpen && clienteSeleccionado) {
      fetchReservasConItems();
    }
    // opcional: limpiar selección cada vez que se abre
    if (isOpen) {
      setSelectedItems([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clienteSeleccionado]);

  const fetchReservasConItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const cliente =
        clienteSeleccionado?.id_agente === undefined
          ? String(clienteSeleccionado || "")
          : String(clienteSeleccionado?.id_agente || "");

      const endpoint = `${URL}/mia/reservas/reservasConItems?id_agente=${encodeURIComponent(
        cliente
      )}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      });

      // ✅ LEER EL BODY SOLO UNA VEZ (evita: body stream already read)
      const raw = await response.text();
      const json = safeJsonParse(raw);

      if (!response.ok) {
        const msg =
          json?.message ||
          json?.error ||
          `Error al obtener reservas (HTTP ${response.status})`;
        throw new Error(msg);
      }

      // tu API manda: { message, data: [...] }
      const list = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.data)
        ? json.data.data
        : [];

      const filtered = list.filter(
        (r: ReservaConItems) => !isReservaCanceladaPorCodigo(r.codigo_reservacion_hotel)
      );

      setReservas(filtered);

    } catch (err: any) {
      console.error("Error fetching reservations:", err);
      setError(err?.message || "Error al cargar las reservas");
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (id_item: string, saldoItem: number) => {
    setSelectedItems((prev) => {
      const yaEsta = prev.some((i) => i.id_item === id_item);

      if (yaEsta) {
        return prev.filter((i) => i.id_item !== id_item);
      }

      const currentSum = prev.reduce(
        (acc, it) => acc + (Number(it.saldo) || 0),
        0
      );
      const candidateSum = currentSum + (Number(saldoItem) || 0);

      if (candidateSum > maxMontoPermitido) {
        alert(
          `No puedes exceder el monto total ${
            pagoData ? "del pago" : "de la factura"
          } ($${maxMontoPermitido.toFixed(2)})`
        );
        return prev;
      }

      return [...prev, { id_item, saldo: Number(saldoItem) || 0 }];
    });
  };

  const isItemSelected = (id_item: string) =>
    selectedItems.some((item) => item.id_item === id_item);

  const isReservaCanceladaPorCodigo = (codigo?: string | null) =>
  String(codigo || "").includes("_CANCEL_");


  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatIdItem = (id: string) =>
    id?.length > 4 ? `...${id.slice(-4)}` : id || "";

  const buildRenderers = () => ({
    id_item: ({ value }: { value: string }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {formatIdItem(value)}
      </span>
    ),
    seleccionado: ({ value }: { value: { id_item: string; total: number } }) => (
      <input
        type="checkbox"
        checked={isItemSelected(value.id_item)}
        disabled={maxMontoPermitido < value.total}
        onChange={() => handleItemSelection(value.id_item, value.total)}
        className="h-4 w-4 focus:ring-blue-500 border-gray-300 rounded"
      />
    ),
    precio: ({ value }: { value: number }) => (
      <span className="font-semibold text-sm px-2 py-1 rounded flex items-center justify-center bg-blue-50 text-blue-600">
        ${Number(value || 0).toFixed(2)}
      </span>
    ),
    fecha_uso: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-600">{formatDate(value)}</span>
    ),
    fecha_salida: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-600">{formatDate(value)}</span>
    ),
    descripcion: ({ value }: { value: string }) => (
      <span className="font-medium text-gray-800">{value}</span>
    ),
    codigo: ({ value }: { value: string }) => {
      const v = String(value || "");
      if (!v) return null; // ✅ si está cancelado (""), no se muestra nada
      return (
        <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-sm border border-yellow-100">
          {v}
        </span>
      );
    },
  });

  const reservasFiltradas = useMemo(() => {
    const q = searchCode.trim().toLowerCase();
    const base = reservas.filter(
      (r) => !isReservaCanceladaPorCodigo(r.codigo_reservacion_hotel),
    );
    if (!q) return base;
    return base.filter(
      (r) =>
        r.confirmation_code?.toLowerCase().includes(q) ||
        r.codigo_reservacion_hotel?.toLowerCase().includes(q) ||
        r.nombre_hotel?.toLowerCase().includes(q),
    );
  }, [reservas, searchCode]);

  const SectionReserva: React.FC<{ reserva: ReservaConItems }> = ({ reserva }) => {
    const codigoHotel = sanitizeCodigoReservacionHotel(
      reserva.codigo_reservacion_hotel
    );

    const registros = (reserva.items_info?.items || []).map((item) => ({
      id_item: item.id_item,
      codigo: codigoHotel,
      descripcion: reserva.nombre_hotel,
      fecha_uso: reserva.check_in,
      fecha_salida: reserva.check_out,
      precio: item.total,
      seleccionado: item,
      item,
    }));

    return (
      <div className="border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-gray-200">
          <div className="space-y-0.5">
            <p className="font-semibold text-gray-900 text-sm">{reserva.nombre_hotel}</p>
            <p className="text-xs text-gray-500">
              {codigoHotel ? (
                <>Cód. hotel: <span className="font-mono text-gray-700">{codigoHotel}</span> · </>
              ) : null}
              Check-in: {formatDate(reserva.check_in)} · Check-out: {formatDate(reserva.check_out)} · {reserva.noches} noche{reserva.noches !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex sm:justify-end items-center gap-2">
            <span className="text-xs text-gray-500">Confirmación:</span>
            <span className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              {reserva.confirmation_code}
            </span>
          </div>
        </div>

        <div className="p-3">
          {registros.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 py-3">No hay ítems en esta reserva.</p>
          ) : (
            <Table5
              registros={registros as any}
              renderers={buildRenderers() as any}
              customColumns={[
                "seleccionado",
                "id_item",
                "codigo",
                "descripcion",
                "fecha_uso",
                "fecha_salida",
                "precio",
              ]}
              maxHeight="260px"
              fillHeight={false}
              exportButton={false}
            />
          )}
        </div>
      </div>
    );
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const codes: string[] = [];
      for (const line of lines) {
        const code = line.split(",")[0].trim().replace(/^["']|["']$/g, "");
        const lower = code.toLowerCase();
        if (code && lower !== "confirmation_code" && lower !== "codigo" && lower !== "code") {
          codes.push(code);
        }
      }

      if (codes.length === 0) {
        setCsvMessage({ tipo: "warn", texto: "El CSV no contiene códigos válidos." });
        return;
      }

      const noEntran: string[] = [];
      const noEncontrados: string[] = [];

      let currentSum = selectedItems.reduce((acc, it) => acc + (Number(it.saldo) || 0), 0);
      const newSelected: SelectedItem[] = [...selectedItems];

      for (const code of codes) {
        const q = code.toLowerCase();
        const reserva = reservas.find(
          (r) =>
            !isReservaCanceladaPorCodigo(r.codigo_reservacion_hotel) &&
            (r.confirmation_code?.toLowerCase() === q ||
              r.codigo_reservacion_hotel?.toLowerCase() === q)
        );

        if (!reserva) {
          noEncontrados.push(code);
          continue;
        }

        const items = (reserva.items_info?.items || []).filter(
          (item) => !newSelected.some((s) => s.id_item === item.id_item)
        );

        if (items.length === 0) continue;

        const totalItems = items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);

        if (currentSum + totalItems <= maxMontoPermitido) {
          for (const item of items) {
            newSelected.push({ id_item: item.id_item, saldo: Number(item.total) || 0 });
          }
          currentSum += totalItems;
        } else {
          noEntran.push(code);
        }
      }

      setSelectedItems(newSelected);

      const partes: string[] = [];
      const agregados = codes.length - noEntran.length - noEncontrados.length;
      if (agregados > 0) partes.push(`${agregados} código(s) seleccionado(s).`);
      if (noEncontrados.length > 0) partes.push(`No encontrados: ${noEncontrados.join(", ")}.`);
      if (noEntran.length > 0)
        partes.push(
          `No entraron por exceder $${maxMontoPermitido.toFixed(2)}: ${noEntran.join(", ")}.`
        );

      setCsvMessage({
        tipo: noEntran.length > 0 || noEncontrados.length > 0 ? "warn" : "info",
        texto: partes.join(" "),
      });
    };

    reader.readAsText(file);
  };

  const handleAssign = async () => {
    try {
      const itemsAsignados = reservas
  .filter((r) => !isReservaCanceladaPorCodigo(r.codigo_reservacion_hotel))
  .flatMap((reserva) => reserva.items_info?.items || [])
  .filter((item) => selectedItems.some((s) => s.id_item === item.id_item));


      let asignacionPayload: any = null;
      let endpoint: string | null = null;
      let method: string | undefined;

      if (pagoData) {
        endpoint = `${URL}/mia/pagos/AsignarPagoItems`;
        method = "PATCH";
        asignacionPayload = {
          ...pagoData,
          items: JSON.stringify(itemsAsignados),
          monto_asignado: montoSeleccionado,
        };
      } else if (id_factura) {
        endpoint = `${URL}/mia/factura/AsignarFacturaItems`;
        method = "PATCH";
        asignacionPayload = {
          id_factura,
          items: JSON.stringify(itemsAsignados),
        };
      } else {
        // Flujo de creación: regreso al padre
        onAssign?.({
          itemsAsignados,
          monto_asignado: montoSeleccionado,
        });
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(asignacionPayload),
        });

        const raw = await response.text();
        const json = safeJsonParse(raw);

        if (!response.ok) {
          const msg =
            json?.message || `Error al asignar los items (HTTP ${response.status})`;
          throw new Error(msg);
        }
      }

      onClose();
      onCloseVistaPrevia?.();
    } catch (e: any) {
      console.error("Error al asignar items:", e);
      alert(e?.message || "Ocurrió un error al asignar. Revisa consola.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl border">
          <div className="px-4 sm:px-6 py-3 border-b">
            <h2 className="text-lg font-semibold">
              {pagoData
                ? "Asignar Pago a Items de Reservación"
                : "Asignar Factura a Items de Reservación"}
            </h2>
          </div>

          <div className="px-4 sm:px-6 py-4 max-h-[70vh] overflow-y-auto">
            <p className="text-sm text-gray-700">
              Selecciona los items específicos a los que quieres asignar{" "}
              {pagoData ? "este pago" : "esta factura"}.
            </p>

            <div className="grid grid-cols-3 gap-4 my-4">
              <div>
                <p className="text-xs text-gray-600">
                  {pagoData ? "Monto pago:" : "Monto factura:"}
                </p>
                <p className="text-base font-semibold">
                  ${maxMontoPermitido.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Monto restante:</p>
                <p className="text-base text-green-600 font-semibold">
                  ${montoRestante.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Seleccionado:</p>
                <p
                  className={`text-base font-semibold ${
                    montoSeleccionado > maxMontoPermitido
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  ${montoSeleccionado.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Carga masiva CSV */}
            {!loading && !error && reservas.length > 0 && (
              <div className="mb-4">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                />
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Asignación masiva por CSV
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  El CSV debe tener en la primera columna el código de confirmación o el código de hotel.
                </p>
                {csvMessage && (
                  <div
                    className={`mt-2 text-sm px-3 py-2 rounded border ${
                      csvMessage.tipo === "warn"
                        ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                        : "bg-green-50 border-green-300 text-green-800"
                    }`}
                  >
                    {csvMessage.texto}
                    <button
                      type="button"
                      onClick={() => setCsvMessage(null)}
                      className="ml-2 text-current opacity-60 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5 inline" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Buscador por código */}
            {!loading && !error && reservas.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Buscar por código de confirmación, código hotel o nombre..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {searchCode && (
                  <button
                    type="button"
                    onClick={() => setSearchCode("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-sm text-gray-500">Cargando reservas...</div>
              ) : error ? (
                <div className="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded-lg">{error}</div>
              ) : reservas.length === 0 ? (
                <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                  No hay reservas con ítems pendientes de{" "}
                  {pagoData ? "pago" : "facturación"}
                </div>
              ) : reservasFiltradas.length === 0 ? (
                <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                  No se encontraron reservas con el código <span className="font-mono font-semibold">{searchCode}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {reservasFiltradas.map((res) => (
                    <SectionReserva key={res.id_booking || res.id_solicitud} reserva={res} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 border-t flex justify-end gap-3">
            <button
              onClick={() => {
                onClose();
                onCloseVistaPrevia?.();
              }}
              className="px-3 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors text-sm"
            >
              Cancelar
            </button>

            <button
              onClick={handleAssign}
              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
            >
              Confirmar Asignación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignarFacturaModal;
