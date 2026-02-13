"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import Filters from "@/components/Filters";
import { Balance } from "@/app/dashboard/facturas-pendientes/balance";
import { Table5 } from "@/components/Table5";
import { formatDate } from "@/helpers/formater";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  DownloadCloud,
  Link as LinkIcon,
  FileDown,
  FilePlus,
  Pencil,
} from "lucide-react";
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
import Link from "next/link";
import { InputToS3 } from "@/components/atom/SendToS3";
import { FacturaService } from "@/services/FacturasService";
import { useNotification } from "@/context/useNotificacion";
import { Button } from "@/components/ui/button";
import ModalDetalleFactura from "@/app/dashboard/invoices/_components/detalles";
import { PageTracker, TrackingPage } from "./tracker_false";
import { set } from "date-fns";

// Formato moneda
const fmtMoney = (n: any) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0));

// Fecha corta
const fmtDate = (v?: string | null) => {
  if (!v) return "N/A";

  const isoDate = v.split("T")[0]; // "2026-01-07"
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "N/A";

  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};



const MAX_REGISTER = 50; // para paginación, número de registros por página

/* ===================== Página con Table5 + filtros ===================== */

const defaultFiltersFacturas: TypeFilters = {
  estatusFactura: "Confirmada",
  id_factura: null,
  id_cliente: "",
  cliente: "",
  uuid: "",
  rfc: "",
};

export function TravelersPage() {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.FACTURAS);

  const { descargarFactura, descargarFacturaXML } = useApi();

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [tracking, setTracking] = useState<TrackingPage>({
    page: 1,
    total_pages: 0,
    total: 0,
  });

  // const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(defaultFiltersFacturas);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [id, setId] = useState<string | null>(null);
  const { Can } = usePermiso();
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Modales/acciones
  const [isModalOpen, setIsModalOpen] = useState<string>("");
  const [facturaAsignando, setFacturaAsignando] = useState<string | null>(null);
  const [facturaAgente, setFacturaAgente] = useState<string | null>(null);
  const [facturaDataSel, setFacturaDataSel] = useState<Factura | null>(null);
  const [facturaEmpresa, setFacturaEmpresa] = useState<string | null>(null);

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [detalleIdFactura, setDetalleIdFactura] = useState<string | null>(null);
  // ✅ Data seleccionada para el modal de detalle
const [detalleFacturaData, setDetalleFacturaData] = useState<any | null>(null);


const cargarFacturas = async (page = tracking.page) => {
  try {
    const response = await FacturaService.getInstance().obtenerFacturas({
      ...activeFilters,
      page,
      length: MAX_REGISTER,
    });

    // ✅ Normaliza shape (por si viene response.data.data)
    const rows = (response?.data && Array.isArray(response.data))
      ? response.data
      : (response?.data && Array.isArray(response.data))
        ? response.data
        : [];

    const total =
      response?.metadata?.total ??
      response?.metadata?.total ??
      rows.length ??
      0;

    console.log("FACTURAS raw response:", response);
    console.log("FACTURAS normalized rows:", rows);

    setFacturas(rows);

    setTracking((prev) => ({
      ...prev,
      page,
      total_pages: Math.ceil(Number(total) / MAX_REGISTER) || 1,
      total: Number(total) || 0,
    }));
  } catch (e) {
    console.error("Error al obtener facturas:", e);
    setFacturas([]);
    setTracking((prev) => ({ ...prev, total_pages: 0, total: 0 }));
  }
};


// ✅ cuando cambien filtros, resetea página a 1 y carga
useEffect(() => {
  const nextPage = 1;
  setTracking((prev) => ({ ...prev, page: nextPage }));
  cargarFacturas(nextPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeFilters]);

// ✅ carga inicial (solo una vez)
useEffect(() => {
  cargarFacturas(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // Inicial
  // useEffect(() => {
  //   // if (firstLoad.current) {
  //   //   firstLoad.current = false;
  //   //   cargarFacturas(defaultFiltersFacturas);
  //   // }
  // }, []);

  // Handlers de filtros

  /*Eliminar relacion de facturas existentes*/
  const handleQuitarRelacion = async (id_factura: string) => {
    if (!id_factura) return;

    const ok = window.confirm(
      "¿Seguro que quieres eliminar la relación de esta factura? Esto quitará sus detalles/asignación.",
    );
    if (!ok) return;

    try {
      setRemovingId(id_factura);

      const resp = await fetch(
        `${URL}/mia/factura/quitar_relacion?id_factura=${encodeURIComponent(
          id_factura,
        )}`,
        {
          method: "DELETE", // <-- si tu backend usa GET/POST, cámbialo aquí
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );

      let data: any = null;
      try {
        data = await resp.json();
      } catch {
        // por si tu backend no regresa JSON
      }

      if (!resp.ok) {
        throw new Error(data?.message || `HTTP error! status: ${resp.status}`);
      }

      showNotification("success", "Relación eliminada correctamente");

      // refresca tabla
      await cargarFacturas();
    } catch (error: any) {
      showNotification(
        "error",
        error?.message || "Error al eliminar la relación",
      );
    } finally {
      setRemovingId(null);
    }
  };
  const handleFilter = (filters: any) => {
    setActiveFilters(filters);
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
        String(f?.rfc ?? "")
          .toLowerCase()
          .includes(q) ||
        String(f?.nombre ?? "")
          .toLowerCase()
          .includes(q) ||
        String(f?.uuid_factura ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [searchTerm, facturas]);
  console.log(facturasFiltradas, "pagos");
  // Registros para Table5
  const registros = useMemo(() => {
    return (facturasFiltradas || []).map((f: any) => {
      const idCliente = f?.id_agente ?? f?.usuario_creador ?? null;
      const toNum = (v: any) => Number(v ?? 0);

      return {
        id_factura: String(f?.id_factura || ""),
        id_cliente: idCliente ?? "N/A",
        cliente: String(f?.nombre ?? "N/A"), // <-- NUEVO
        rfc: String(f?.rfc ?? "N/A"),
        uuid: String(f?.uuid_factura ?? "N/A"),
        estado: String(f?.estado ?? "N/A"),
        subtotal: toNum(f?.subtotal),
        iva: toNum(f?.impuestos),
        total: toNum(f?.total),
        saldo:
          f.saldo_x_aplicar_items != 0
            ? toNum(f?.saldo)
            : toNum(f?.saldo_x_aplicar_items),
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
        actualizar: String(f?.id_factura || ""),
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
    // cliente: ({ value }: { value: string }) => {
    //   const shouldSplitCol = (colKey: string) =>
    //     splitStringsBySpace &&
    //     (Array.isArray(splitColumns) ? splitColumns.includes(colKey) : true);
    //   const normalize = (str: string) =>
    //     str
    //       ?.normalize("NFD") // separa los acentos
    //       .replace(/[\u0300-\u036f]/g, "") // elimina los diacríticos
    //       .toUpperCase() || "N/A"; // convierte a mayúsculas

    //   return <span className="font-semibold text-gray-800">{normalize(value)}</span>;
    // },
    subtotal: ({ value }: { value: number }) => <span>{fmtMoney(value)}</span>,
    iva: ({ value }: { value: number }) => <span>{fmtMoney(value)}</span>,
    total: ({ value }: { value: number }) => (
      <span className="font-semibold text-blue-700">{fmtMoney(value)}</span>
    ),
    saldo: ({ value }: { value: number }) => (
      <span
        className={`${
          Number(value) > 0 ? "text-amber-700" : "text-emerald-700"
        } font-medium`}
      >
        {fmtMoney(value)}
      </span>
    ),
    fecha_emision: ({ value }: { value: string | null }) => (
      <span>{fmtDate(value)}</span>
    ),
    fecha_vencimiento: ({ value }: { value: string | null }) => (
      <span>{fmtDate(value)}</span>
    ),
    prepagada: ({ value }: { value: number | null }) =>
      value == null ? "N/A" : value === 1 ? "Sí" : "No",
    origen: ({ value }: { value: number }) =>
      value === 1 ? "Cliente" : "Operaciones",
    actualizar: ({ item }: { item: Factura }) => {
      const isRemoving = removingId === item.id_factura;

      return (
        <div className="flex gap-2">
          <Can permiso={PERMISOS.COMPONENTES.BOTON.ACTUALIZAR_PDF_FACTURA}>
            <Button onClick={() => setId(item.id_factura)} size="sm">
              Editar PDF
            </Button>
          </Can>

          <Button
            size="sm"
            variant="destructive"
            disabled={isRemoving}
            onClick={() => handleQuitarRelacion(item.id_factura)}
          >
            {isRemoving ? "Eliminando..." : "Eliminar relación"}
          </Button>
        </div>
      );
    },

    acciones: ({ value }: { value: { fila: any } }) => {
      const f = value.fila as any;
      const puedeAsignar =
        Number(f?.saldo ?? 0) > 0 && Number(f?.saldo_x_aplicar_items ?? 0) > 0;

      const handleDescargarFactura = async (
        id: string,
        tipo: "pdf" | "xml",
      ) => {
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
              <DropdownMenuItem
                onClick={() => {
                  setDetalleIdFactura(f.id_factura);
                  setModalDetalleOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>

              {!!f?.id_facturama && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      handleDescargarFactura(f.id_facturama || "", "pdf")
                    }
                  >
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleDescargarFactura(f.id_facturama || "", "xml")
                    }
                  >
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
                  <DropdownMenuItem
                    onClick={() => downloadFile(f.url_pdf, "factura.pdf")}
                  >
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
                  <DropdownMenuItem
                    onClick={() => downloadFile(f.url_xml, "factura.xml")}
                  >
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
    "cliente", // <-- NUEVO
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
    "actualizar",
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

  console.log(balance, "cambios");
  const { showNotification } = useNotification();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Facturas
      </h1>
      {id && (
        <Modal onClose={() => setId(null)} title="Sube el archivo PDF">
          <div className="p-8">
            <InputToS3
              setUrl={async (url: string | null) => {
                try {
                  if (!url) throw new Error("No existe archivo");

                  await FacturaService.getInstance().actualizarDocumentosFacturas(
                    { id, url },
                  );
                  showNotification(
                    "success",
                    "Se actualizo el archivo correctamente",
                  );
                  setId(null);
                } catch (error) {
                  showNotification(
                    "error",
                    error.message || "Error al subir archivo",
                  );
                }
              }}
            ></InputToS3>
          </div>
        </Modal>
      )}

      {balance && (
        <BalanceSummary
          balance={balance}
          formatCurrency={formatCurrency} // Pasa la función de formato de divisa
        />
      )}
      <Card>
        <div className="p-6 space-y-2">
          <Filters
            defaultFilters={defaultFiltersFacturas}
            onFilter={handleFilter}
            defaultOpen={true}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
          <Button size="sm" onClick={() => cargarFacturas()}>
            Cargar facturas
          </Button>

          <Table5
            registros={registros}
            renderers={renderers as any}
            customColumns={customColumns}
            defaultSort={{ key: "fecha_emision", sort: false }} // desc
            maxHeight="26rem"
            splitStringsBySpace
          />

          {facturas && (
            <PageTracker
              tracking={tracking}
              setPage={(page) => {
                cargarFacturas(page);
              }}
            ></PageTracker>
          )}
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
            // cargarFacturas(activeFilters);
          }}
          id_factura={facturaAsignando}
          clienteSeleccionado={facturaAgente as any}
          facturaData={facturaDataSel as any}
          onAssign={() => {}}
          onCloseVistaPrevia={() => {}}
          empresaSeleccionada={facturaEmpresa as any}
        />
      )}



      {modalDetalleOpen && (
        <ModalDetalleFactura
          open={modalDetalleOpen}
          onClose={() => {
            setModalDetalleOpen(false);
            setDetalleIdFactura(null);
          }}
          id_factura={detalleIdFactura}
          setDetalleFacturaData={setDetalleFacturaData} // ✅ aquí se manda
          title="Detalles de factura"
        />
      )}

      {/* Diálogo legacy si lo usas */}
      {/* <TravelerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} /> */}
    </div>
  );
}
