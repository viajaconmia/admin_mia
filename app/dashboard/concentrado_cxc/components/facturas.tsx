  "use client";

  import { Table5 } from "@/components/Table5";
  import { DetalleFacturaModal } from "./detalles_modal";
  import React, { useState, useEffect, useMemo } from "react";
  import { formatDate } from "@/helpers/utils";
  import { PagarModalComponent } from "@/components/template/pagar_saldo";
  import { URL, API_KEY } from "@/lib/constants/index";

  /* ─────────────────────────────
    Tipos reutilizables
  ────────────────────────────── */

  export interface Factura {
    rfc: string;
    saldo: number;
    total: number;
    estado: string;
    url_pdf: string | null;
    url_xml: string | null;
    subtotal: number;
    id_agente: string | null;
    impuestos: number;
    created_at: string;
    id_empresa: string;
    id_factura: string;
    rfc_emisor: string | null;
    updated_at: string;
    id_facturama: string | null;
    uuid_factura: string;
    fecha_emision: string;
    usuario_creador: string | null;
    fecha_vencimiento: string | null;
    diasRestantes: number;
    diasCredito: number;
    [key: string]: any;
  }

  /* ─────────────────────────────
    Props del modal principal
  ────────────────────────────── */

  export interface DetallesFacturasProps {
    open: boolean;
    onClose: () => void;
    agente: {
      id_agente: string | null;
    } | null;
    facturas?: Factura[];
    money?: (n: number) => string;
    pagoData?: any;

    /** Abre el modal de detalle de factura */
    onOpenFacturaDetalle?: (factura: Factura) => void;

    /** Funciones para descargar facturas - OPCIONALES */
    descargarFactura?: (id: string) => Promise<{ Content: string }>;
    descargarFacturaXML?: (id: string) => Promise<{ Content: string }>;
    downloadFile?: (url: string, filename: string) => void;
  }

  const normalizeAgent = (a: any) => String(a ?? "");



  export const DetallesFacturas: React.FC<DetallesFacturasProps> = ({
    open,
    onClose,
    agente,
    facturas: propFacturas,
    pagoData,
    money,
    onOpenFacturaDetalle,
    // Estas props son opcionales y se pasan al modal de detalle
    descargarFactura,
    descargarFacturaXML,
    downloadFile,
  }) => {
    const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(
      null
    );
    const [selectedFacturas, setSelectedFacturas] = useState<Set<string>>(
      new Set()
    );
    const [facturaData, setFacturaData] = useState<any[] | null>(null);
    const [showPagarModal, setShowPagarModal] = useState(false);
    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [isApplying, setIsApplying] = useState(false); // State para loading
    const [datosAgentes, setDatosAgentes] = useState<any[]>([]); // Datos de los agentes
    const [isLoading, setIsLoading] = useState(false);
    const [montosAsignar, setMontosAsignar] = useState<Record<string, string>>({});
    const [busquedaUuid, setBusquedaUuid] = useState("");
    
    
  const [csvFeedback, setCsvFeedback] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

    /* ────────────────
      Fetch de datos cuando hay pagoData
    ───────────────── */
    const id_agente = agente?.id_agente || null;
    console.log("pagodata",id_agente,pagoData)
    const fetchDatosAgentes = async () => {
      if (!agente) return;
      
      const endpoint = `${URL}/mia/factura/getfacturasPagoPendienteByAgente`;
      setIsLoading(true);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify({ id_agente }),
        });

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Respuesta POST recibida:", data);

        // Extraer las facturas del array facturas_json
        if (Array.isArray(data)) {
          const facturasExtraidas: Factura[] = [];
          data.forEach((item: any) => {
            if (item.facturas_json && Array.isArray(item.facturas_json)) {
              facturasExtraidas.push(...item.facturas_json.map((factura: any) => ({
                ...factura,
                diasRestantes: factura.diasRestantes || 0,
                diasCredito: factura.diasCredito || 0,
                nombre_agente: item.nombre_agente || item.nombre || "Sin nombre"
              })));
            }
          });
          setDatosAgentes(facturasExtraidas);
        } else {
          throw new Error("Formato de respuesta inválido");
        }
      } catch (err: any) {
        console.error("Error en la consulta:", err);
        setDatosAgentes([]);
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      if (pagoData && agente && open) {
        fetchDatosAgentes();
      }
    }, [pagoData, agente, open]);

    // Determinar qué facturas usar
    const facturas = pagoData ? datosAgentes : (propFacturas || []);
    const mostrarFacturas = pagoData ? datosAgentes : propFacturas;

    const totalMontoAsignado = useMemo(() => {
      return facturas.reduce((acc, factura) => {
        if (!selectedFacturas.has(factura.id_factura)) return acc;
        return acc + Number(montosAsignar[factura.id_factura] || 0);
      }, 0);
    }, [facturas, selectedFacturas, montosAsignar]);

    const totalSaldoSeleccionado = useMemo(() => {
      return facturas.reduce((acc, factura) => {
        if (!selectedFacturas.has(factura.id_factura)) return acc;
        return acc + Number(factura.saldo || 0);
      }, 0);
    }, [facturas, selectedFacturas]);

    const facturasFiltradas = useMemo(() => {
      const q = busquedaUuid.trim().toLowerCase();
      if (!q) return facturas;

      return facturas.filter((factura) =>
        String(factura.uuid_factura || "").toLowerCase().includes(q)
      );
    }, [facturas, busquedaUuid]);


    //helper para csv

    const detectCsvDelimiter = (line: string) => {
    const commas = (line.match(/,/g) || []).length;
    const semicolons = (line.match(/;/g) || []).length;
    return semicolons > commas ? ";" : ",";
  };

  const splitCsvLine = (line: string, delimiter: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    result.push(current.trim());
    return result.map((v) => v.replace(/^\uFEFF/, "").trim());
  };

  const handleImportCsv = async (file: File | null) => {
    if (!file) return;

    try {
      setCsvFeedback(null);

      const text = (await file.text()).replace(/^\uFEFF/, "");
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        setCsvFeedback({
          type: "error",
          text: "El CSV está vacío.",
        });
        return;
      }

      const delimiter = detectCsvDelimiter(lines[0]);
      const rows = lines.map((line) => splitCsvLine(line, delimiter));

      const firstCol = String(rows[0]?.[0] || "").toLowerCase();
      const secondCol = String(rows[0]?.[1] || "").toLowerCase();

      const hasHeader =
        firstCol.includes("uuid") ||
        secondCol.includes("monto") ||
        firstCol.includes("factura");

      const dataRows = hasHeader ? rows.slice(1) : rows;

      const facturasByUuid = new Map(
        facturas.map((f) => [
          String(f.uuid_factura || "").trim().toLowerCase(),
          f,
        ])
      );

      const nextSelected = new Set<string>();
      const nextMontos: Record<string, string> = {};
      const notFound: string[] = [];
      const invalidAmount: string[] = [];

      for (const row of dataRows) {
        const uuidRaw = String(row[0] ?? "").trim();
        const montoRaw = String(row[1] ?? "").trim();

        if (!uuidRaw) continue;

        const factura = facturasByUuid.get(uuidRaw.toLowerCase());

        if (!factura) {
          notFound.push(uuidRaw);
          continue;
        }

        const saldoMaximo = Number(factura.saldo || 0);
        let montoAsignado = saldoMaximo;

        if (montoRaw !== "") {
          const parsed = Number(montoRaw.replace(/,/g, "."));

          if (!Number.isFinite(parsed) || parsed < 0) {
            invalidAmount.push(uuidRaw);
            continue;
          }

          montoAsignado = Math.min(parsed, saldoMaximo);
        }

        nextSelected.add(factura.id_factura);
        nextMontos[factura.id_factura] = String(montoAsignado);
      }

      setSelectedFacturas(nextSelected);
      setMontosAsignar(nextMontos);

      if (nextSelected.size === 0) {
        setCsvFeedback({
          type: "error",
          text: notFound.length
            ? `No se encontró ninguna factura del CSV. UUID no encontrados: ${notFound.join(", ")}`
            : "No se encontró ninguna factura válida en el CSV.",
        });
        return;
      }

      let message = `CSV cargado. Se seleccionaron ${nextSelected.size} factura(s).`;

      if (notFound.length) {
        message += ` UUID no encontrados: ${notFound.join(", ")}.`;
      }

      if (invalidAmount.length) {
        message += ` Monto inválido en: ${invalidAmount.join(", ")}.`;
      }

      setCsvFeedback({
        type: notFound.length || invalidAmount.length ? "warning" : "success",
        text: message,
      });
    } catch (error) {
      console.error("Error al importar CSV:", error);
      setCsvFeedback({
        type: "error",
        text: "No se pudo leer el archivo CSV.",
      });
    }
  };

  const handleCsvInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    await handleImportCsv(file);
    e.target.value = "";
  };

    // MOVER ESTO DESPUÉS DE TODOS LOS HOOKS
    if (!open) return null;

    /* ────────────────
      Manejo de detalle
    ───────────────── */

    const handleOpenDetalle = (factura: Factura) => {
      setFacturaSeleccionada(factura);
      setDetalleAbierto(true);

      if (onOpenFacturaDetalle) {
        onOpenFacturaDetalle(factura);
      }
    };

    const handleCloseDetalle = () => {
      setDetalleAbierto(false);
    };

    const handleCloseAll = () => {
      setDetalleAbierto(false);
      setFacturaSeleccionada(null);
      onClose();
    };

    /* ────────────────
      Selección de facturas
    ───────────────── */

    const handleSelectFactura = (id: string, idAgente: string) => {
    const factura = facturas.find((f) => f.id_factura === id);
    if (!factura) return;

    const saldoFactura = Number(factura.saldo || 0);

    setSelectedFacturas((prevSelected) => {
      const newSelected = new Set(prevSelected);
      const wasSelected = newSelected.has(id);

      if (wasSelected) {
        newSelected.delete(id);

        setMontosAsignar((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });

        return newSelected;
      }

      newSelected.add(id);

      const seleccionadas = facturas.filter((f) => newSelected.has(f.id_factura));
      const agentKey = normalizeAgent(idAgente);

      const allSameAgent = seleccionadas.every(
        (f) => normalizeAgent(f.id_agente) === agentKey
      );

      if (!allSameAgent) {
        newSelected.delete(id);
        return new Set(newSelected);
      }

      setMontosAsignar((prev) => ({
        ...prev,
        [id]: prev[id] ?? String(saldoFactura),
      }));

      return newSelected;
    });
  };

    const handleDeseleccionarPagos = () => {
    setSelectedFacturas(new Set());
    setMontosAsignar({});
    setFacturaData(null);
    setShowPagarModal(false);
  };

    /* ────────────────
      Crear facturaData y abrir modal de pago
    ───────────────── */

  const handleMontoAsignarChange = (idFactura: string, rawValue: string) => {
    const factura = facturas.find((f) => f.id_factura === idFactura);
    if (!factura) return;

    const saldoMaximo = Number(factura.saldo || 0);

    if (rawValue === "") {
      setMontosAsignar((prev) => ({
        ...prev,
        [idFactura]: "",
      }));
      return;
    }

    let value = rawValue.replace(/,/g, ".");
    let monto = Number(value);

    if (!Number.isFinite(monto)) monto = 0;
    if (monto < 0) monto = 0;
    if (monto > saldoMaximo) monto = saldoMaximo;

    setMontosAsignar((prev) => ({
      ...prev,
      [idFactura]: String(monto),
    }));
  };

    const handlePagos = async () => {
    const facturasSeleccionadas = facturas.filter(
    (f) =>
      selectedFacturas.has(f.id_factura) &&
      Number(montosAsignar[f.id_factura] || 0) > 0
  );

  if (facturasSeleccionadas.length === 0) return;

  // ✅ Si NO hay pagoData -> abre modal normal
  if (!pagoData) {
    const datosFacturas = facturasSeleccionadas.map((f) => {
      const montoAsignado = Math.min(
        Number(montosAsignar[f.id_factura] || 0),
        Number(f.saldo || 0)
      );

      return {
        monto: montoAsignado,
        monto_asignado: montoAsignado,
        saldo: Number(f.saldo ?? 0),
        total: Number(f.total ?? 0),
        facturaSeleccionada: f,
        id_factura: f.id_factura,
        uuid_factura: f.uuid_factura,
        id_agente: f.id_agente,
        agente: f.nombre_agente || f.nombre || "Sin nombre",
      };
    });

    setFacturaData(datosFacturas);
    setShowPagarModal(true);
    return;
  }

    if (facturasSeleccionadas.length === 0) return;

    // ✅ Si NO hay pagoData -> abre modal normal
    if (!pagoData) {
      const datosFacturas = facturasSeleccionadas.map((f) => ({
        monto: Number(f.total ?? 0),
        saldo: Number(f.saldo ?? 0),
        facturaSeleccionada: f,
        id_agente: f.id_agente,
        agente: f.nombre_agente || f.nombre || "Sin nombre",
      }));

      setFacturaData(datosFacturas);
      setShowPagarModal(true);
      return;
    }

    // ✅ Si hay pagoData -> aplica por saldo a favor
    const idsFacturasSeleccionadas = facturasSeleccionadas.map(factura => factura.id_factura);
    
    // Calcular total del saldo pendiente de las facturas seleccionadas
    const totalSaldoFacturasSeleccionadas = facturasSeleccionadas.reduce(
      (total, factura) => total + Number(factura.saldo || 0),
      0
    );

    // Obtener el monto total del saldo a favor desde pagoData
    const montoSaldoFavor = Number(pagoData.monto || 0);
    const montoAplicable = Math.min(montoSaldoFavor, totalSaldoFacturasSeleccionadas);
    
    // Calcular cuánto se aplica a cada factura (proporcionalmente)
    const aplicacionesPorFactura = facturasSeleccionadas.map((factura, index, array) => {
      const saldoFactura = Number(factura.saldo || 0);
      
      // Para la última factura, aplicar el restante
      if (index === array.length - 1) {
        return {
          id_factura: factura.id_factura,
          monto_aplicado: montoAplicable,
          saldo_restante_factura: Math.max(0, saldoFactura - montoAplicable)
        };
      }
      
      // Para las demás, aplicar proporcional al saldo
      const proporcion = saldoFactura / totalSaldoFacturasSeleccionadas;
      const montoAplicado = montoAplicable * proporcion;
      
      return {
        id_factura: factura.id_factura,
        monto_aplicado: montoAplicado,
        saldo_restante_factura: Math.max(0, saldoFactura - montoAplicado)
      };
    });

    // Crear el payload en la estructura requerida
    const payload = {
      ejemplo_saldos: [
        {
          id_saldo: pagoData.id_saldos,
          saldo_original: montoSaldoFavor,
          saldo_actual: montoSaldoFavor - montoAplicable, // Lo que queda después de aplicar
          aplicado: montoAplicable, // Total aplicado a todas las facturas
          id_agente: id_agente,
          metodo_de_pago: pagoData.metodo_pago?.toLowerCase() || 'wallet',
          fecha_pago: pagoData.fecha_pago,
          concepto: pagoData.concepto,
          referencia: pagoData.referencia,
          currency: (pagoData.currency || 'MXN').toLowerCase(),
          tipo_de_tarjeta: pagoData.tipo_tarjeta,
          link_pago: pagoData.link_stripe,
          last_digits: pagoData.ult_digits
        }
      ],
      id_agente: id_agente,
      id_factura: idsFacturasSeleccionadas,
      detalle_aplicacion: aplicacionesPorFactura // Opcional: para llevar control detallado
    };

    console.log("Payload a enviar:", payload);

    try {
      setIsApplying(true);

      const response = await fetch(
        `${URL}/mia/factura/AsignarFacturaPagos`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || "Error al aplicar el pago por saldo a favor");
      }

      const data = await response.json().catch(() => null);
      console.log("Respuesta del servidor:", data);

      // Mostrar mensaje de éxito
      alert(`Saldo a favor aplicado exitosamente:\nMonto aplicado: ${money ? money(montoAplicable) : `$${montoAplicable}`}\nSaldo restante: ${money ? money(montoSaldoFavor - montoAplicable) : `$${montoSaldoFavor - montoAplicable}`}`);

      // Limpia selección y cierra
      handleDeseleccionarPagos();
      onClose();
      
      // Opcional: refrescar datos
      fetchDatosAgentes();
      
    } catch (error) {
      console.error("Error en la petición:", error);
      alert("Error al aplicar el saldo a favor. Por favor, intente nuevamente.");
    } finally {
      setIsApplying(false);
    }
  };

    /* ────────────────
      Registros para Table5 - DEPENDE DE SI HAY PAGODATA O NO
    ───────────────── */

    const registros = pagoData 
      ? datosAgentes.map((f) => ({
          id_factura: f.id_factura,
          uuid_factura: f.uuid_factura,
          fecha_emision: f.fecha_emision,
          fecha_vencimiento: f.fecha_vencimiento,
          rfc: f.rfc,
          total: f.total,
          saldo: f.saldo,
          dias_a_credito: f.diasCredito || f.diasCredito || 0,
          dias_restantes: f.diasRestantes || f.diasRestantes || 0,
          seleccionar: f,
          item: f,
        }))
      : (facturasFiltradas || []).map((f) => ({
          id_factura: f.id_factura,
          uuid_factura: f.uuid_factura,
          fecha_emision: f.fecha_emision,
          fecha_vencimiento: f.fecha_vencimiento,
          rfc: f.rfc,
          total: f.total,
          saldo: f.saldo,
          dias_a_credito: f.diasCredito || 0,
          dias_restantes: f.diasRestantes || 0,
          monto_asignar: f,
          seleccionar: f,
          item: f,
        }));

    /* ────────────────
      Renderers de columnas
    ───────────────── */

    const renderers: {
      [key: string]: React.FC<{ value: any; item: any; index: number }>;
    } = {
      // Botón "Seleccionar / Seleccionada" por fila
      seleccionar: ({ item }) => {
        const selected = selectedFacturas.has(item.id_factura);

        return (
          <button
            type="button"
            onClick={() =>
              handleSelectFactura(item.id_factura, item.id_agente || "")
            }
            className={`px-2 py-1 rounded text-[11px] md:text-xs border ${
              selected
                ? "bg-emerald-50 text-emerald-700 border-emerald-500"
                : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {selected ? "Seleccionada" : "Seleccionar"}
          </button>
        );
      },

      uuid_factura: ({ value, item }) => (
        <button
          type="button"
          onClick={() => handleOpenDetalle(item as Factura)}
          className="font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] md:text-xs transition-colors"
          title={value}
        >
          <span>{value}</span>
        </button>
      ),

      monto_asignar: ({ item }) => {
    const selected = selectedFacturas.has(item.id_factura);
    const saldoMaximo = Number(item.saldo || 0);

    if (!selected) {
      return (
        <div className="flex justify-center">
          <span className="text-xs text-gray-400">—</span>
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <input
          type="number"
          min="0"
          max={saldoMaximo}
          step="0.01"
          value={montosAsignar[item.id_factura] ?? ""}
          onChange={(e) =>
            handleMontoAsignarChange(item.id_factura, e.target.value)
          }
          className="w-28 border rounded px-2 py-1 text-sm text-right"
        />
      </div>
    );
  },

      rfc: ({ value }) => (
        <div className="flex justify-center">
          <span className="text-gray-700">{value || "—"}</span>
        </div>
      ),

      fecha_emision: ({ value }) => (
        <div className="flex justify-center">
          <span className="text-gray-600">{formatDate(value ?? null)}</span>
        </div>
      ),

      fecha_vencimiento: ({ value }) => (
        <div className="flex justify-center">
          <span className="text-gray-600">{formatDate(value ?? null)}</span>
        </div>
      ),

      total: ({ value }) => (
        <div className="flex justify-end">
          <span className="font-bold text-blue-600">
            {money ? money(parseFloat(value) || 0) : `$${parseFloat(value) || 0}`}
          </span>
        </div>
      ),

      saldo: ({ value, item }) => {
        const saldo = parseFloat(value) || 0;
        const total = parseFloat(item.total) || 0;
        const porcentajePagado = total > 0 ? ((total - saldo) / total) * 100 : 0;
        const vencido = (item.dias_restantes ?? item.diasRestantes ?? 0) <= 0;

        return (
          <div className="flex flex-col items-end gap-1">
            <span
              className={`font-bold ${
                !vencido ? "text-green-600" : "text-red-500"
              }`}
            >
              {money ? money(saldo) : `$${saldo}`}
            </span>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`${
                  !vencido ? "bg-green-600" : "bg-red-600"
                } h-1.5 rounded-full`}
                style={{
                  width: `${100 - porcentajePagado}%`,
                }}
              />
            </div>
          </div>
        );
      },

      dias_a_credito: ({ value }) => (
        <div className="flex justify-center">
          <span className="text-xs text-gray-700">{value ?? "—"}</span>
        </div>
      ),

      dias_restantes: ({ value }) => {
        const dias = Number(value ?? 0);
        const vencida = dias <= 0;

        return (
          <div className="flex justify-center">
            <span
              className={`text-xs font-semibold ${
                vencida ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {vencida ? "Vencida" : `${dias} día(s)`}
            </span>
          </div>
        );
      },  
    };

    return (
      <>
        {/* Modal principal de facturas */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Facturas del cliente
                </h2>
                {agente && (
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="font-semibold">
                      {agente.id_agente ?? ""}
                    </span>
                    {pagoData && (
                      <span className="ml-2 text-blue-600">
                        (Aplicando saldo a favor)
                      </span>
                    )}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando facturas...</p>
                  </div>
                </div>
              ) : !mostrarFacturas || mostrarFacturas.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {pagoData 
                    ? "No hay facturas pendientes para aplicar saldo a favor." 
                    : "Este agente no tiene facturas pendientes."}
                </p>
              ) : (

                
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <input
        type="text"
        value={busquedaUuid}
        onChange={(e) => setBusquedaUuid(e.target.value)}
        placeholder="Buscar por UUID de factura"
        className="w-full md:max-w-md border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleCsvInputChange}
        className="block w-full md:w-auto border rounded px-3 py-2 text-sm"
      />
    </div>

    <div className="text-sm font-semibold text-gray-700 flex flex-col items-end">
      <span>
        Total saldo seleccionado:{" "}
        <span className="text-green-600">
          {money
            ? money(totalSaldoSeleccionado)
            : `$${totalSaldoSeleccionado.toFixed(2)}`}
        </span>
      </span>

      <span>
        Total a asignar:{" "}
        <span className="text-blue-600">
          {money
            ? money(totalMontoAsignado)
            : `$${totalMontoAsignado.toFixed(2)}`}
        </span>
      </span>
    </div>
  </div>
      <div className="p-2 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          

          <div className="text-sm font-semibold text-gray-700">
            Total saldo seleccionado:{" "}
            <span className="text-green-600">
              {money ? money(totalSaldoSeleccionado) : `$${totalSaldoSeleccionado.toFixed(2)}`}
            </span>
          </div>
        </div>
                    <Table5<any>
                      registros={registros}
                      renderers={renderers}
                      exportButton={true}
                      leyenda={`Mostrando ${registros.length} factura(s)`}
                      maxHeight="60vh"
                      customColumns={[
                      "seleccionar",
                      "monto_asignar",
                      "rfc",
                      "uuid_factura",
                      "fecha_emision",
                      "total",
                      "saldo",
                      "dias_a_credito",
                      "dias_restantes",
                      "fecha_vencimiento",
                    ]}
                    >
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                        onClick={handlePagos}
                        disabled={selectedFacturas.size === 0 || isApplying}
                      >
                        {isApplying 
                          ? "Aplicando..." 
                          : pagoData 
                            ? "Aplicar Saldo a Favor" 
                            : "Asignar Pago"}
                      </button>
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                        onClick={handleDeseleccionarPagos}
                        disabled={selectedFacturas.size === 0}
                      >
                        Deseleccionar pagos
                      </button>
                    </Table5>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Detalle de Factura */}
        <DetalleFacturaModal
          open={detalleAbierto}
          factura={facturaSeleccionada}
          onClose={handleCloseDetalle}
          onCloseAll={handleCloseAll}
          formatDate={formatDate}
          money={money}
          downloadFile={downloadFile}
        />

        {csvFeedback && (
    <div
      className={`rounded border px-3 py-2 text-sm ${
        csvFeedback.type === "error"
          ? "bg-red-50 border-red-200 text-red-700"
          : csvFeedback.type === "warning"
          ? "bg-yellow-50 border-yellow-200 text-yellow-700"
          : "bg-green-50 border-green-200 text-green-700"
      }`}
    >
      {csvFeedback.text}
    </div>
  )}

  <p className="text-xs text-gray-500">
    CSV: primera columna = UUID, segunda columna = monto a asignar. Si el monto
    viene vacío, se toma el saldo completo.
  </p>

        {/* Modal de pago usando facturaData */}
        {showPagarModal && facturaData && (
          <PagarModalComponent
            onClose={() => setShowPagarModal(false)}
            facturaData={facturaData}
            open={showPagarModal}
          />
        )}
      </>
    );
  };

  /* Si quieres que este sea el default: */
  export default DetallesFacturas;