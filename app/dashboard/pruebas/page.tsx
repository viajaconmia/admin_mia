"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Filters from "@/components/Filters";
import { Balance } from "@/app/dashboard/facturas-pendientes/balance";
import { Table5 } from "@/components/Table5";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, DownloadCloud, Link as LinkIcon, FileDown, FilePlus } from "lucide-react";
import { fetchPagosPrepagobalance } from "@/services/pagos";
import BalanceSummary from "@/app/dashboard/facturas-pendientes/balance";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";
import useApi from "@/hooks/useApi";
import AsignarFacturaModal from "@/app/dashboard/facturacion/subirfacturas/AsignarFactura";
import Modal from "@/components/organism/Modal";

import { API_KEY, URL } from "@/lib/constants";
import { downloadFile } from "@/lib/utils";
import { fetchFacturas as fetchFacturasSvc } from "@/services/facturas";

import type { Factura } from "@/types/_types";
import type { TypeFilters } from "@/types";

/* ===================== Helpers ===================== */

// Soporta fetchFacturas con promesa o con callback: fetchFacturas(filters, cb)
const fetchFacturasSafe = (filters: any): Promise<Factura[]> =>
  new Promise((resolve, reject) => {
    try {
      if (fetchFacturasSvc.length >= 2) {
        // firma con callback
        (fetchFacturasSvc as any)(filters, (data: any) =>
          resolve(Array.isArray(data) ? data : data?.respuesta || data?.data || []),
        );
      } else {
        // firma tipo promesa
        Promise.resolve((fetchFacturasSvc as any)(filters))
          .then((data: any) => resolve(Array.isArray(data) ? data : data?.respuesta || data?.data || []))
          .catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });

// Formato moneda
const fmtMoney = (n: any) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(
    Number(n ?? 0),
  );

// Fecha corta
const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString("es-MX") : "N/A");

/* ===================== Modal de Detalle ===================== */
function FacturaDetails({ setModal, id_factura }: { setModal: (v: string) => void; id_factura: string }) {
  const [facturaData, setFacturaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDetails = async () => {
    try {
      setLoading(true);
      const resp = await fetch(
        `${URL}/mia/factura/getDetailsFactura?id_factura=${encodeURIComponent(id_factura)}`,
        {
          method: "GET",
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      const data = await resp.json();
      setFacturaData(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
      setFacturaData([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (id_factura) getDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_factura]);

  return (
    <Modal onClose={() => setModal("")} title="Detalles de factura" subtitle="Reservas relacionadas a la factura">
      {loading ? (
        <div className="flex justify-center items-center h-32">Cargando detalles…</div>
      ) : error ? (
        <div className="text-red-500 p-4">Error al cargar los detalles: {error}</div>
      ) : facturaData.length === 0 ? (
        <div className="p-4 text-gray-500">No se encontraron detalles para esta factura</div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto px-4">
          <div className="flex flex-col gap-5 mb-8">
            {facturaData.map((r, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                  <h3 className="m-0 text-base font-medium text-gray-800">{r.nombre_hotel}</h3>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{r.tipo_cuarto}</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Noches facturadas:</p>
                      <p className="text-sm font-medium">{r.noches_facturadas}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Código Reserva:</p>
                      <p className="text-sm font-medium">{r.codigo_reservacion_hotel || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Noches:</p>
                      <p className="text-sm font-medium">{r.noches}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fecha de uso:</p>
                      <p className="text-sm font-medium">{fmtDate(r.fecha_uso)}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                    <h4 className="mt-0 mb-3 text-sm font-semibold">Montos</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Subtotal:</p>
                        <p className="text-sm">{fmtMoney(r.subtotal_booking)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Impuestos:</p>
                        <p className="text-sm">{fmtMoney(r.impuestos_booking)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total:</p>
                        <p className="text-sm font-semibold text-blue-700">{fmtMoney(r.total_booking)}</p>
                      </div>
                    </div>
                  </div>

                  {r.comments && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1">Comentarios:</p>
                      <p className="text-sm italic">{r.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Resumen de Factura</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal:</span>
                <span className="text-sm font-medium">
                  {fmtMoney(facturaData.reduce((s, it) => s + Number(it.subtotal || 0) * Number(it.noches_facturadas || 0), 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Impuestos:</span>
                <span className="text-sm font-medium">
                  {fmtMoney(facturaData.reduce((s, it) => s + Number(it.impuestos || 0) * Number(it.noches_facturadas || 0), 0))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold">Total Factura:</span>
                <span className="font-semibold text-blue-700">
                  {fmtMoney(facturaData.reduce((s, it) => s + Number(it.total || 0) * Number(it.noches_facturadas || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ===================== Página con Table5 + filtros ===================== */

const defaultFiltersFacturas: TypeFilters = {
  estatusFactura: "Confirmada",
  id_factura: null,
  id_cliente: "",
  cliente: "",
  uuid: "",
  rfc: ""
};

function TravelersPage() {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.FACTURAS);

  const { descargarFactura, descargarFacturaXML } = useApi();

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(defaultFiltersFacturas);
  const [isLoading, setIsLoading] = useState(false);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const firstLoad = useRef(true);

  // Modales/acciones
  const [isModalOpen, setIsModalOpen] = useState<string>("");
  const [facturaAsignando, setFacturaAsignando] = useState<string | null>(null);
  const [facturaAgente, setFacturaAgente] = useState<string | null>(null);
  const [facturaDataSel, setFacturaDataSel] = useState<Factura | null>(null);
  const [facturaEmpresa, setFacturaEmpresa] = useState<string | null>(null);

  // Llamada unificada
  const cargarFacturas = async (filters: any) => {
    setIsLoading(true);
    try {
      const data = await fetchFacturasSafe(filters);
      setFacturas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error al obtener facturas:", e);
      setFacturas([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicial
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      cargarFacturas(defaultFiltersFacturas);
    }
  }, []);

  // Handlers de filtros
  const handleFilter = (filters: any) => {
    setActiveFilters(filters);
    cargarFacturas(filters);
  };

  const [balance, setBalance] = useState<Balance | null>(null);

  const obtenerBalance = async () => {
    try {
      const response = await fetchPagosPrepagobalance();
      const balanceObtenido: Balance = {
        montototal: response.montototal || "0",
        montofacturado: response.montofacturado || "0",
        restante: response.restante || "0",
        total_reservas_confirmadas: response.total_reservas_confirmadas || "3",
      };
      setBalance(balanceObtenido);
    } catch (err) {
      console.error("Error al obtener el balance:", err);

      setBalance(null);
    } finally {
    }
  };

  // Búsqueda local (client-side) sobre lo cargado
  const facturasFiltradas = useMemo(() => {
    if (!searchTerm?.trim()) return facturas;
    const q = searchTerm.trim().toLowerCase();
    return facturas.filter((f: any) => {
      const idCliente = f?.id_agente ?? f?.usuario_creador ?? "";
      return (
        String(idCliente).toLowerCase().includes(q) ||
        String(f?.rfc ?? "").toLowerCase().includes(q) ||
        String(f?.nombre ?? "").toLowerCase().includes(q) ||
        String(f?.uuid_factura ?? "").toLowerCase().includes(q)
      );
    });
  }, [searchTerm, facturas]);
  console.log(facturasFiltradas, "pagos")
  // Registros para Table5
  const registros = useMemo(() => {
    return (facturasFiltradas || []).map((f: any) => {
      const idCliente = f?.id_agente ?? f?.usuario_creador ?? null;
      const toNum = (v: any) => Number(v ?? 0);

      return {
        id_factura: String(f?.id_factura || ""),
        id_cliente: idCliente ?? "N/A",
        cliente: String(f?.nombre ?? "N/A"),  // <-- NUEVO
        rfc: String(f?.rfc ?? "N/A"),
        uuid: String(f?.uuid_factura ?? "N/A"),
        estado: String(f?.estado ?? "N/A"),
        subtotal: toNum(f?.subtotal),
        iva: toNum(f?.impuestos),
        total: toNum(f?.total),
        saldo: toNum(f?.saldo),
        fecha_emision: f?.fecha_emision || null,
        fecha_vencimiento: f?.fecha_vencimiento || null,
        prepagada: f?.is_prepagada == null ? null : Number(f?.is_prepagada),
        origen: Number(f?.origen ?? 0),
        // para acciones
        id_facturama: f?.id_facturama || null,
        url_pdf: f?.url_pdf || null,
        url_xml: f?.url_xml || null,
        id_agente: f?.id_agente || null,
        id_empresa: f?.id_empresa || null,
        acciones: { fila: f },
        item: f,
      };
    });
  }, [facturasFiltradas]);

  // Renderers para Table5
  const renderers = {
    id_cliente: ({ value }: { value: string | null }) => {
      const full = String(value ?? "");
      const short = full.slice(0, 12);
      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
          // Si tienes un toast, úsalo aquí. Si no, un fallback rápido:
          // alert("ID copiado");
        } catch {
          // alert("No se pudo copiar");
        }
      };
      return (
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar id_agente"
          className="font-mono underline-offset-2 hover:underline"
        >
          {short}
        </button>
      );
    },
    cliente: ({ value }: { value: string }) => {
      const normalize = (str: string) =>
        str
          ?.normalize("NFD") // separa los acentos
          .replace(/[\u0300-\u036f]/g, "") // elimina los diacríticos
          .toUpperCase() || "N/A"; // convierte a mayúsculas

      return <span className="font-semibold text-gray-800">{normalize(value)}</span>;
    },
    subtotal: ({ value }: { value: number }) => <span>{fmtMoney(value)}</span>,
    iva: ({ value }: { value: number }) => <span>{fmtMoney(value)}</span>,
    total: ({ value }: { value: number }) => <span className="font-semibold text-blue-700">{fmtMoney(value)}</span>,
    saldo: ({ value }: { value: number }) => (
      <span className={`${Number(value) > 0 ? "text-amber-700" : "text-emerald-700"} font-medium`}>{fmtMoney(value)}</span>
    ),
    fecha_emision: ({ value }: { value: string | null }) => <span>{fmtDate(value)}</span>,
    fecha_vencimiento: ({ value }: { value: string | null }) => <span>{fmtDate(value)}</span>,
    prepagada: ({ value }: { value: number | null }) => (value == null ? "N/A" : value === 1 ? "Sí" : "No"),
    origen: ({ value }: { value: number }) => (value === 1 ? "Cliente" : "Operaciones"),

    acciones: ({ value }: { value: { fila: any } }) => {
      const f = value.fila as any;
      const puedeAsignar = Number(f?.saldo ?? 0) > 0;

      const handleDescargarFactura = async (id: string, tipo: "pdf" | "xml") => {
        try {
          if (tipo === "pdf") {
            const obj = await descargarFactura(id);
            const a = document.createElement("a");
            a.href = `data:application/pdf;base64,${obj.Content}`;
            a.download = "factura.pdf";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
          } else {
            const obj = await descargarFacturaXML(id);
            const a = document.createElement("a");
            a.href = `data:application/xml;base64,${obj.Content}`;
            a.download = `factura_${Date.now()}.xml`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
          }
        } catch {
          alert("Ha ocurrido un error al descargar la factura");
        }
      };

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsModalOpen(f.id_factura)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>

              {!!f?.id_facturama && (
                <>
                  <DropdownMenuItem onClick={() => handleDescargarFactura(f.id_facturama || "", "pdf")}>
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDescargarFactura(f.id_facturama || "", "xml")}>
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Descargar XML
                  </DropdownMenuItem>
                </>
              )}

              {!!f?.url_pdf && (
                <>
                  <DropdownMenuItem>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    <a target="_blank" href={f.url_pdf}>
                      Ver PDF
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadFile(f.url_pdf, "factura.pdf")}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </DropdownMenuItem>
                </>
              )}

              {!!f?.url_xml && (
                <>
                  <DropdownMenuItem>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    <a target="_blank" href={f.url_xml}>
                      Ver XML
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadFile(f.url_xml, "factura.xml")}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar XML
                  </DropdownMenuItem>
                </>
              )}

              {puedeAsignar && (
                <DropdownMenuItem
                  onClick={() => {
                    setFacturaAsignando(f.id_factura);
                    setFacturaAgente(f.id_agente);
                    setFacturaEmpresa(f.id_empresa);
                    setFacturaDataSel(f);
                  }}
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  Asignar factura
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  };

  const customColumns = [
    "id_cliente",
    "cliente",       // <-- NUEVO
    "rfc",
    "uuid",
    "estado",
    "subtotal",
    "iva",
    "total",
    "saldo",
    "fecha_emision",
    "fecha_vencimiento",
    "prepagada",
    "origen",
    "acciones",
  ];

  useEffect(() => {
    obtenerBalance();

  }, []);
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  console.log(balance, "cambios")

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">Facturas</h1>
      {balance && (
        <BalanceSummary
          balance={balance}
          formatCurrency={formatCurrency} // Pasa la función de formato de divisa
        />
      )}
      <Card>
        <div className="p-6 space-y-4">
          <Filters
            defaultFilters={defaultFiltersFacturas}
            onFilter={handleFilter}
            defaultOpen={true}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <Table5
            registros={registros}
            renderers={renderers as any}
            customColumns={customColumns}
            defaultSort={{ key: "fecha_emision", sort: false }} // desc
            maxHeight="32rem"
          />
        </div>
      </Card>

      {/* Modal de Asignar */}
      {facturaAsignando && (
        <AsignarFacturaModal
          isOpen={!!facturaAsignando}
          onClose={() => {
            setFacturaAsignando(null);
            setFacturaAgente(null);
            setFacturaDataSel(null);
            setFacturaEmpresa(null);
            // refresco tras asignación
            cargarFacturas(activeFilters);
          }}
          id_factura={facturaAsignando}
          clienteSeleccionado={facturaAgente as any}
          facturaData={facturaDataSel as any}
          onAssign={() => { }}
          onCloseVistaPrevia={() => { }}
          empresaSeleccionada={facturaEmpresa as any}
        />
      )}

      {/* Modal Detalles */}
      {isModalOpen && <FacturaDetails setModal={setIsModalOpen} id_factura={isModalOpen} />}

      {/* Diálogo legacy si lo usas */}
      {/* <TravelerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} /> */}
    </div>
  );
}

export default TravelersPage