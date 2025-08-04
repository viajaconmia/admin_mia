"use client";
import React, {
  useState,
  useEffect,
  useReducer,
  ChangeEvent,
  useMemo,
} from "react";
import {
  FileText,
  Tag,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Send,
  Plus,
  DollarSign,
  CreditCard,
  Calendar,
  X,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";

import { Table3 } from "@/components/organism/Table3";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types";
import Modal from "@//components/organism/Modal";
import { SaldoFavor, NuevoSaldoAFavor, Saldo } from "@/services/SaldoAFavor";
import { fetchAgenteById, fetchPagosByAgente } from "@/services/agentes";
import { Loader } from "@/components/atom/Loader";
import { API_KEY, URL } from "@/lib/constants/index";
import { PagarModalComponent } from "@/components/template/pagar_saldo";
import { format } from "date-fns";
import { es, se } from "date-fns/locale";
import {
  obtenerPresignedUrl,
  subirArchivoAS3,
  subirArchivosAS3Luis,
} from "@/helpers/utils";

import {
  CheckboxInput,
  DateInput,
  Dropdown,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "@/components/atom/Input";

import { formatNumberWithCommas } from "@/helpers/utils";
import { url } from "node:inspector";
// ========================================
// TIPOS DE DATOS
// ========================================

// helpers/utils.ts
export const normalizeText = (text: string): string => {
  if (!text) return "";

  return text
    .normalize("NFD") // Elimina acentos y diacríticos
    .replace(/[\u0300-\u036f]/g, "") // Elimina los caracteres de acentuación
    .toUpperCase(); // Convierte a mayúsculas
};

// ========================================
// COMPONENTE: MODAL DE PAGOS
// ========================================
interface PaymentModalProps {
  saldoAFavor?: number;
  onClose: () => void;
  agente: Agente;
  initialData?: {
    monto_pagado: number;
    referencia: string;
    paymentMethod: string;
    fecha_De_Pago: string;
    comentario: string;
    facturable: boolean;
    aplicable: boolean;
    link_Stripe: string;
    ult_digits: string;
    banco_tarjeta: string;
    numero_autorizacion: string;
    tipo_tarjeta: string;
  };

  onSubmit: (paymentData: NuevoSaldoAFavor) => Promise<any>;
  isEditing?: boolean;
  localWalletAmount?: number;
}

interface PaymentSummaryProps {
  totalBalance: number;
  assignedBalance: number;
  statusInfo?: {
    puedeCancelar: boolean;
    mensaje: string;
    diferencia: number;
  };
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalBalance,
  assignedBalance,
  statusInfo,
}) => {
  console.log("totalBalance", totalBalance, "/rvr", assignedBalance);
  const availableBalance = totalBalance - assignedBalance;

  // Estados necesarios para subirArchivosAS3
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);

  // const subirArchivosAS3 = async (): Promise<{ comprobante: string }> => {
  //   //
  //   try {
  //     setSubiendoArchivos(true);
  //     const folder = "comprobantes_pagos";

  //     const { urlComprobante, publicUrlComprobante } =
  //       await obtenerPresignedUrl(comprobante.name, comprobante.type, folder);
  //     await subirArchivoAS3(comprobante, urlComprobante);
  //     setComprobanteUrl(publicUrlComprobante);

  //     return { comprobante: publicUrlComprobante };
  //   } catch (err) {
  //     console.error("Error al subir archivos:", err);
  //     throw err;
  //   } finally {
  //     setSubiendoArchivos(false);
  //   }
  // };

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-emerald-100 mb-1">
            Saldo a Favor
          </h2>
          <p className="text-3xl font-bold">
            $
            {availableBalance.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full p-3">
          <DollarSign className="w-8 h-8" />
        </div>
      </div>
      {statusInfo && (
        <div className="mt-4 pt-4 border-t border-emerald-400">
          <p
            className={`text-sm font-medium ${statusInfo.puedeCancelar ? "text-emerald-100" : "text-yellow-200"
              }`}
          >
            {statusInfo.mensaje}
          </p>
          <p className="text-xs text-emerald-100 mt-1">
            Diferencia: $
            {statusInfo.diferencia.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      )}
    </div>
  );
};

//========================================
//comprobantes pagos
interface Comprobantepago {
  id_Cliente: string;
  archivo?: File | null;
  nombreArchivo?: string;
  tipoArchivo?: string;
  tamañoArchivo?: number;
  fechaSubida?: Date;
  estado?: "pendiente" | "aprobado" | "rechazado";
  urlArchivo?: string;
}

interface ComprobanteModalProps {
  idCliente: string;
  cliente: string;
  onClose: () => void;
  onSave: (comprobante: Comprobantepago) => void;
}

const ComprobanteModal: React.FC<ComprobanteModalProps> = ({
  idCliente,
  cliente,
  onClose,
  onSave,
}) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validaciones
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setError("Formato no válido. Sube un PDF, JPEG o PNG");
        return;
      }

      if (file.size > maxSize) {
        setError("El archivo es demasiado grande (máx. 5MB)");
        return;
      }

      setError(null);
      setArchivo(file);
    }
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!archivo) {
      setError("Debes seleccionar un archivo");
      return;
    }

    setLoading(true);

    try {
      // 2) Obtenemos URL presignada
      const folder = "comprobantes_pagos";
      const key = `${folder}/${archivo.name}`;
      const { url: uploadUrl, publicUrl } = await obtenerPresignedUrl(
        key,
        archivo.type,
        folder
      );

      // 3) Subimos a S3
      await subirArchivosAS3Luis(archivo, folder)
        .then((url) => {
          console.log("url", url);
        })
        .catch((err) => {
          console.error("Error al subir archivo:", err);
        })
        .finally(() => {
          setLoading(false);
        });

      // 4) Emitimos todo incluyendo publicUrl
      onSave({
        id_Cliente: idCliente,
        archivo,
        nombreArchivo: archivo.name,
        tipoArchivo: archivo.type,
        tamañoArchivo: archivo.size,
        fechaSubida: new Date(),
        estado: "pendiente",
        urlArchivo: publicUrl, // <-- pasamos la URL final
      });

      onClose();
    } catch (err) {
      console.error("Error subiendo comprobante:", err);
      setError("No se pudo subir el archivo. Intenta de nuevo.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800">
            Subir Comprobante para {cliente}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            {archivo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">Archivo seleccionado:</p>
                <p>{archivo.name}</p>
                <p className="text-sm text-gray-500">
                  {(archivo.size / 1024).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!archivo}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg ${!archivo ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                }`}
            >
              Guardar Comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
interface PageCuentasPorCobrarProps {
  agente: Agente;
  walletAmount?: number;
}

const PageCuentasPorCobrar: React.FC<PageCuentasPorCobrarProps> = ({
  agente,
  walletAmount = 0,
  //aqui traigo el saldo
}) => {
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [agente, setAgente] = useState<Agente | null>(null);
  const [loading, setLoading] = useState({
    agente: true,
    pagos: true,
  });

  console.log("wallet", walletAmount);
  const [localWalletAmount, setLocalWalletAmount] = useState(walletAmount);
  console.log("agente", agente.wallet);
  console.log("local", localWalletAmount);

  console.log("wallet2", walletAmount);

  const [filters, setFilters] = useState<TypeFilters>({
    paymentMethod: "",
    hasDiscount: "",
    id_stripe: null,
    facturable: null,
    comprobante: null,
    paydate: null,
    activo: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [saldoAFavor, setSaldoAFavor] = useState<number>(0);
  const [lloading, setloading] = useState(false);
  const [saldos, setSaldos] = useState<Saldo[]>([]);

  interface SortConfig {
    key: string;
    sort: boolean; // true = ascendente, false = descendente
  }

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "creado",
    sort: false, // false para descendente por defecto
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      sort: prev.key === key ? !prev.sort : false, // Si es la misma columna, alternar, sino descendente
    }));
  };

  // Función para manejar los filtros
  const handleFilter = (newFilters: TypeFilters) => {
    // Convertir los valores "SI"/"NO" a booleanos si es necesario
    const completeFilters: TypeFilters = {
      paymentMethod: newFilters.paymentMethod || "",
      hasDiscount: newFilters.hasDiscount || "",
      id_stripe: newFilters.id_stripe || null,
      facturable:
        typeof newFilters.facturable === "string"
          ? newFilters.facturable === "SI"
          : newFilters.facturable,
      comprobante:
        typeof newFilters.comprobante === "string"
          ? newFilters.comprobante === "SI"
          : newFilters.comprobante,
      paydate: newFilters.paydate || null,

      activo:
        typeof newFilters.activo === "string"
          ? newFilters.activo === "ACTIVO"
            ? 1
            : 0
          : newFilters.activo === true
            ? 1
            : newFilters.activo === false
              ? 0
              : null,
    };

    setFilters(completeFilters);
    if (completeFilters.paymentMethod) {
      setActiveFilter(completeFilters.paymentMethod);
    } else {
      setActiveFilter("all");
    }
  };

  // 1. Función centralizada para actualizar el saldo
  const updateAgentWallet = async () => {
    try {
      setLoading((prev) => ({ ...prev, agente: true }));
      const agenteActualizado = await fetchAgenteById(agente.id_agente);

      console.log("Respuesta completa:", agenteActualizado); // Verifica la estructura completa

      // Si la respuesta es un array (como en tu ejemplo), necesitas acceder al primer elemento
      const walletAmount = Array.isArray(agenteActualizado)
        ? parseFloat(agenteActualizado[0].wallet)
        : parseFloat(agenteActualizado.wallet);
      setLocalWalletAmount(walletAmount);
      return walletAmount;
    } catch (error) {
      console.error("Error al actualizar el saldo del agente:", error);
      setError("Error al actualizar el saldo disponible");
      throw error; // Es mejor lanzar el error para manejarlo donde se llame a esta función
    } finally {
      setLoading((prev) => ({ ...prev, agente: false }));
    }
  };
  // 2. Efecto para cargar datos iniciales y actualizar cuando cambia el ID del agente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading({ agente: true, pagos: true });
        await updateAgentWallet(); // Actualizar saldo del agente
        await reloadSaldos(); // Recargar saldos a favor
      } catch (err) {
        setError("Error al cargar los datos iniciales");
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading({ agente: false, pagos: false });
      }
    };

    fetchInitialData();
  }, [agente.id_agente]);

  // 3. Efecto para actualizar cuando la pestaña vuelve a estar visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        try {
          setLoading((prev) => ({ ...prev, agente: true }));
          await updateAgentWallet();
          await reloadSaldos();
        } catch (error) {
          console.error("Error al actualizar datos:", error);
          setError("Error al actualizar los datos");
        } finally {
          setLoading((prev) => ({ ...prev, agente: false }));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [agente.id_agente]);

  useEffect(() => {
    const fetchSaldoFavor = async () => {
      const response: { message: string; data: Saldo[] } =
        await SaldoFavor.getPagos(agente.id_agente);
      console.log("esto trae", response.data);
      setSaldos(response.data);
    };
    fetchSaldoFavor();
  }, []);

  const filteredData = useMemo(() => {
    // Filter the data
    const filteredItems = saldos.filter((saldo) => {
      // Filtro por método de pago
      if (filters.paymentMethod && saldo.metodo_pago) {
        const normalizedFilter = filters.paymentMethod.toLowerCase();
        const normalizedMethod = saldo.metodo_pago.toLowerCase();
        if (!normalizedMethod.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por fecha de pago
      if (filters.paydate && saldo.fecha_pago) {
        const paymentDate = new Date(saldo.fecha_pago).toISOString();
        if (paymentDate !== filters.paydate) {
          return false;
        }
      }

      // Filtro por descuento
      if (filters.hasDiscount !== undefined && filters.hasDiscount !== "") {
        const hasDiscount = Boolean(saldo.is_descuento);
        const filterValue = filters.hasDiscount === "SI";
        if (hasDiscount !== filterValue) {
          return false;
        }
      }

      // Filtro por facturable
      if (filters.facturable !== null) {
        const hasfacturable = Boolean(saldo.is_facturable);
        if (hasfacturable !== filters.facturable) {
          return false;
        }
      }

      // Filtro por comprobante
      if (filters.comprobante !== null) {
        const hasComprobante = Boolean(saldo.comprobante);
        if (hasComprobante !== filters.comprobante) {
          return false;
        }
      }

      // Filtro por link_stripe (case-insensitive)
      if (filters.id_stripe) {
        const stripeId = filters.id_stripe.toLowerCase();
        const saldoLink = saldo.link_stripe?.toLowerCase() || '';
        if (!saldoLink.includes(stripeId)) {
          return false;
        }
      }

      // Filtro por activo/inactivo
      if (filters.activo !== null && filters.activo !== undefined) {
        const saldoActive = Boolean(saldo.activo); // Converts both true/1 to true, false/0 to false
        const filterActive = Boolean(filters.activo);
        if (saldoActive !== filterActive) {
          return false;
        }
      }

      // Filtro por rango de fechas
      if (filters.startDate && saldo.created_at) {
        const createdDate = new Date(saldo.created_at);
        if (createdDate < new Date(filters.startDate)) {
          return false;
        }
      }

      if (filters.endDate && saldo.created_at) {
        const createdDate = new Date(saldo.created_at);
        if (createdDate > new Date(filters.endDate)) {
          return false;
        }
      }

      // Filtro por búsqueda de texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesReference = saldo.referencia
          ?.toLowerCase()
          .includes(searchLower);
        const matchesComment = saldo.comentario
          ?.toLowerCase()
          .includes(searchLower);
        const matchesId = saldo.id_saldos?.toString().includes(searchLower);

        if (!matchesReference && !matchesComment && !matchesId) {
          return false;
        }
      }

      return true;
    });

    console.log('Filters:', filters);
    console.log('Sample saldo:', saldos[0]);

    // Transform the filtered data
    const transformedData = filteredItems.map((saldo) => ({
      id_Cliente: saldo.id_agente,
      id_saldo: saldo.id_saldos,
      cliente: (saldo.nombre || "").toUpperCase(),
      creado: saldo.fecha_creacion ? new Date(saldo.fecha_creacion) : null,
      monto_pagado: Number(saldo.monto),
      saldo: saldo.saldo,
      forma_De_Pago:
        saldo.metodo_pago === "transferencia"
          ? "Transferencia Bancaria"
          : saldo.metodo_pago === "tarjeta credito"
            ? "Tarjeta de Crédito"
            : saldo.metodo_pago === "tarjeta debito"
              ? "Tarjeta de Débito"
              : saldo.metodo_pago || "",
      tipo_tarjeta: saldo.tipo_tarjeta || "",
      referencia: saldo.referencia || "",
      link_stripe: saldo.link_stripe || null,
      fecha_De_Pago: saldo.fecha_pago ? new Date(saldo.fecha_pago) : null,
      aplicable: saldo.is_descuento ? "Si" : "No",
      comentario: saldo.notas || saldo.comentario || null,
      facturable: saldo.is_facturable ? "Si" : "No",
      comprobante: saldo.comprobante || null,
      acciones: { row: saldo },
      item: saldo,
    }));

    // Sort the data
    return transformedData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle dates
      if (
        sortConfig.key.includes("fecha") ||
        sortConfig.key.includes("creado")
      ) {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortConfig.sort ? dateA - dateB : dateB - dateA;
      }

      // Handle numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.sort ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.sort
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [saldos, filters, searchTerm, sortConfig.key, sortConfig.sort]);

  const tableRenderers = {
    fecha_De_Pago: ({ value }: { value: Date | null }) => {
      if (!value) return <div className="text-gray-400 italic">Sin fecha</div>;

      return (
        <div className="whitespace-nowrap text-sm text-blue-900">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },

    // Renderizador para creado
    creado: ({ value }: { value: Date | null }) => {
      if (!value) return <div className="text-gray-400">N/A</div>;

      return (
        <div className="whitespace-nowrap text-sm text-blue-900">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },

    monto_pagado: ({ value, item }: { value: string; item: Saldo }) => {
      const isActive = Boolean(item?.activo);
      const formatted = formatNumberWithCommas(parseFloat(value).toFixed(2));

      return (
        <span
          className={`font-semibold text-sm px-2 py-1 rounded flex items-center justify-center
      ${isActive
              ? "bg-blue-100 text-blue-600"
              : "bg-red-100 text-red-600 line-through"
            }`}
        >
          ${formatted}
        </span>
      );
    },

    saldo: ({ item }: { item: Saldo }) => {
      const isActive = Boolean(item?.activo);
      const isDifferent = item?.saldo !== item?.monto;
      const value = item?.saldo ?? 0;
      const formatted = formatNumberWithCommas(Number(value).toFixed(2));

      return (
        <span
          className={`font-semibold text-sm px-2 py-1 rounded flex items-center justify-center
      ${isActive
              ? "bg-blue-100 text-blue-600"
              : "bg-red-100 text-red-600 line-through"
            }`}
        >
          ${formatted}
        </span>
      );
    },

    id_Cliente: ({ item }: { item: Saldo }) => {
      const isActive = Boolean(item.activo);
      return (
        <span
          className={`font-semibold text-sm px-2 py-1 rounded ${isActive
            ? "bg-blue-50 text-blue-600"
            : "bg-red-100 text-red-600 line-through"
            }`}
          title={item.id_agente}
        >
          {item.id_agente?.split("-").join("").slice(0, 10)}
        </span>
      );
    },

    id_saldo: ({ item }: { item: Saldo }) => {
      const isActive = Boolean(item.activo);
      return (
        <span
          className={`font-semibold text-sm px-2 py-1 rounded ${isActive
            ? "bg-blue-50 text-blue-600"
            : "bg-red-100 text-red-600 line-through"
            }`}
        >
          {item.id_saldos}
        </span>
      );
    },

    tipo_tarjeta: ({ value, row }: { value: string | null; row: any }) => {
      const isActive = row?.activo !== false;
      const lowerValue = value?.toLowerCase() || "";

      let iconColor = "text-gray-500";
      if (lowerValue.includes("crédito") || lowerValue.includes("credito"))
        iconColor = "text-green-600";
      else if (lowerValue.includes("débito") || lowerValue.includes("debito"))
        iconColor = "text-blue-600";

      const shouldShowIcon = !!value;

      return (
        <div
          className={`flex items-center gap-2 max-w-xs truncate ${!isActive ? "text-red-500 line-through" : ""
            }`}
        >
          {shouldShowIcon && <CreditCard className={`w-4 h-4 ${iconColor}`} />}
          <span>{value ? normalizeText(value) : ""}</span>
        </div>
      );
    },

    forma_De_Pago: ({ value, row }: { value: string; row: any }) => {
      const isActive = row?.activo !== false;
      const normalizedValue = value.toLowerCase();
      return (
        <div
          className={`flex items-center gap-2 ${!isActive ? "text-red-500 line-through" : ""
            }`}
        >
          {normalizedValue.includes("crédito") ||
            normalizedValue.includes("credito") ? (
            <CreditCard className="w-4 h-4 text-green-500" />
          ) : normalizedValue.includes("débito") ||
            normalizedValue.includes("debito") ? (
            <CreditCard className="w-4 h-4 text-blue-600" /> // Color diferente para débito
          ) : normalizedValue.includes("transferencia") ? (
            <DollarSign className="w-4 h-4 text-blue-500" />
          ) : normalizedValue.includes("wallet") ? (
            <Wallet className="w-4 h-4 text-green-500" /> // Asumiendo que tienes un ícono Wallet
          ) : (
            <DollarSign className="w-4 h-4 text-green-500" />
          )}
          <span>{normalizeText(value)}</span>
        </div>
      );
    },

    comprobante: ({ value }: { value: Comprobantepago | null }) => {
      const [showModal, setShowModal] = useState(false);

      const handleDownload = () => {
        if (value) {
          console.log("Descargando comprobante...", value);

          // Lógica de descarga aquí
        }
      };

      const handleView = () => {
        if (value) {
          console.log("Mostrando comprobante...", value);
          // Lógica para visualizar aquí
        }
      };

      if (!value) {
        return (
          <>
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Añadir Comprobante
            </button>
            {showModal && (
              <ComprobanteModal
                idCliente={agente?.id_agente || ""}
                cliente={agente?.nombre_agente_completo || ""}
                onClose={() => setShowModal(false)}
                onSave={(comprobante) => {
                  console.log("Comprobante guardado:", comprobante);
                  setShowModal(false);
                  // TODO: actualizar estado
                }}
              />
            )}
          </>
        );
      }

      return (
        <div className="flex gap-2">
          <button
            onClick={handleView}
            className="text-green-600 hover:underline cursor-pointer"
          >
            Ver
          </button>
          <span>|</span>
          <button
            onClick={handleDownload}
            className="text-green-600 hover:underline cursor-pointer"
          >
            Descargar
          </button>
        </div>
      );
    },
    aplicable: ({ value }: { value: "Si" | "No" }) => {
      return (
        <span
          className={`flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium w-full ${value === "Si"
            ? "bg-green-200 text-green-800"
            : "bg-red-200 text-red-800"
            }`}
        >
          <span className="text-center w-full">{normalizeText(value)}</span>
        </span>
      );
    },

    referencia: ({ value, row }: { value: string | null; row: any }) => {
      const isActive = row?.activo !== false;
      return (
        <div
          className={`max-w-xs truncate ${!isActive ? "text-red-500 line-through" : ""
            }`}
        >
          {value ? normalizeText(value) : ""}
        </div>
      );
    },
    comentario: ({ value, row }: { value: string | null; row: any }) => {
      const isActive = row?.activo !== false;
      return (
        <div
          className={`max-w-xs truncate ${!isActive ? "text-red-500 line-through" : ""
            }`}
        >
          {value ? normalizeText(value) : ""}
        </div>
      );
    },

    cliente: ({ value, row }: { value: string | null; row: any }) => {
      const isActive = row?.activo !== false;
      return (
        <div
          className={`max-w-xs truncate ${!isActive ? "text-red-500 line-through" : ""
            }`}
        >
          {normalizeText(value)}
        </div>
      );
    },

    facturable: ({ value }: { value: "Si" | "No" }) => {
      return (
        <span
          className={`flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium w-full ${value === "Si"
            ? "bg-green-200 text-green-800"
            : "bg-red-200 text-red-800"
            }`}
        >
          <span className="text-center w-full">{normalizeText(value)}</span>
        </span>
      );
    },
    //botones para eliminar y editar informacion
    acciones: ({ value }: { value: { row: any } }) => {
      const { row } = value;
      const [isEditModalOpen, setIsEditModalOpen] = useState(false);
      const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
      const [isPagarModalOpen, setIsPagarModalOpen] = useState(false);

      const isActive = row?.activo !== 0;
      let editar = true;
      const isDifferent = row?.saldo !== row?.monto;
      const hasBalance = row?.saldo > 0; // Verifica si el saldo es mayor a 0
      const hasLink = Boolean(
        row?.link_stripe && row.link_stripe.trim() !== ""
      );
      const showDeleteButtons = isActive && !isDifferent;
      const showEditbuttosn = isActive && !isDifferent && !hasLink;
      const showPagarButton = isActive && hasBalance;

      if (row.saldo !== row.monto_pagado) {
        editar = false;
      }
      // En la función handleEdit

      const handleEdit = async (updatedData: any) => {
        if (!isActive) return; // No permitir edición si está inactivo

        try {
          console.log("Datos recibidos del modal:", updatedData);

          // Obtener el pago original para calcular la diferencia
          const pagoOriginal = saldos.find(
            (s) => s.id_saldos === row.id_saldos
          );
          if (!pagoOriginal) throw new Error("No se encontró el pago original");

          // Validar que los datos requeridos estén presentes
          if (!updatedData)
            throw new Error("No se recibieron datos del formulario");

          const montoOriginal = parseFloat(pagoOriginal.monto.toString());
          const montoNuevo = parseFloat(updatedData.monto_pagado.toString());
          const diferencia = montoNuevo - montoOriginal;

          // Normalizar el método de pago correctamente
          const formaPago = updatedData.forma_pago.toLowerCase();

          const metodoPagoNormalizado = formaPago.includes("transferencia")
            ? "transferencia"
            : formaPago.includes("tarjeta")
              ? "tarjeta"
              : "wallet";

          // Preparar datos base
          const apiData: any = {
            id_saldos: row.id_saldos,
            id_agente: row.id_agente,
            monto: updatedData.monto_pagado?.toString() || row.monto,
            fecha_pago: updatedData.fecha_pago || row.fecha_pago,
            comentario: updatedData.comentario || row.comentario || null,
            is_facturable: updatedData.is_facturable,
            is_descuento: updatedData.descuento_aplicable,
            metodo_pago: metodoPagoNormalizado,
            saldo: updatedData.monto_pagado?.toString() || row.monto,
            activo: true, // Siempre activo al editar
            concepto: row.concepto || "pago",
            currency: row.currency || "MXN",
          };

          // Manejar campos específicos según el método de pago
          switch (metodoPagoNormalizado) {
            case "transferencia":
              apiData.referencia = updatedData.referencia || row.referencia;
              apiData.link_stripe = null;
              apiData.tipo_tarjeta = null;
              apiData.ult_digits = null;
              apiData.banco_tarjeta = null;
              apiData.numero_autorizacion = null;
              break;

            case "tarjeta":
              apiData.referencia = null;
              apiData.link_stripe =
                updatedData.link_Stripe || row.link_stripe || null;
              apiData.tipo_tarjeta =
                metodoPagoNormalizado === "tarjeta" ? "credito" : "debito";
              apiData.ult_digits =
                updatedData.ult_digits || row.ult_digits || null;
              apiData.banco_tarjeta =
                updatedData.banco_tarjeta || row.banco_tarjeta || null;
              apiData.numero_autorizacion =
                updatedData.numero_autorizacion ||
                row.numero_autorizacion ||
                null;
              break;

            case "wallet":
              apiData.referencia = null;
              apiData.link_stripe = null;
              apiData.tipo_tarjeta = null;
              apiData.ult_digits = null;
              apiData.banco_tarjeta = null;
              apiData.numero_autorizacion = null;
              break;
          }

          // Mostrar los datos que se enviarán a la API
          console.log("Datos para enviar a la API:", apiData);

          // Actualizar el saldo local con la diferencia
          setLocalWalletAmount((prev) => prev + diferencia);
          console.log("agwnte", agente);
          await updateAgentWallet();

          // Llamar a la API para actualizar
          await SaldoFavor.actualizarPago(apiData);

          // Actualizar la lista de pagos
          await reloadSaldos();

          // Cerrar el modal
          setIsEditModalOpen(false);
        } catch (error) {
          console.error("Error al actualizar el pago:", error);
          setError(
            `Error al actualizar el pago: ${error instanceof Error ? error.message : String(error)
            }`
          );
        }
      };

      const handleDelete = async () => {
        if (!isActive) return; // No permitir eliminación si ya está inactivo

        try {
          // Proceder con la eliminación lógica
          const deleteData = {
            id_saldos: row.id_saldos,
            id_agente: row.id_agente,
            saldo: row.saldo,
            monto: row.monto,
            metodo_pago: row.metodo_pago,
            fecha_pago: row.fecha_pago,
            notas: row.notas || null,
            is_facturable: row.is_facturable,
            is_descuento: row.is_descuento,
            link_stripe: row.link_stripe || null,
            tipo_tarjeta: row.tipo_tarjeta,
            activo: false, // Cambiamos a 0 para desactivar
            comentario: row.comentario || null,
            comprobante: row.comprobante,
            concepto: row.concepto,
            currency: row.currency || "MXN",
            referencia: row.referencia || null,
            ult_digits: row.ult_digits || null,
            banco_tarjeta: row.banco_tarjeta || null,
            numero_autorizacion: row.numero_autorizacion || null,
          };

          await updateAgentWallet();

          await SaldoFavor.actualizarPago(deleteData);
          // Actualizar el saldo local ANTES de recargar los datos
          if (row.activo) {
            setLocalWalletAmount(
              (prev) => prev - parseFloat(row.monto.toString())
            );
          }
          console.log("local eliminado", localWalletAmount);
          const updatedSaldos = await SaldoFavor.getPagos(row.id_agente);
          setSaldos(updatedSaldos.data);
          setIsDeleteModalOpen(false);
        } catch (error) {
          console.error("Error al eliminar el pago:", error);
          setError(
            `Error al eliminar el pago: ${error instanceof Error ? error.message : String(error)
            }`
          );
        }
      };

      return (
        <div className="flex gap-2">
          {/* Botón Editar */}

          {showEditbuttosn && (
            <button
              className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              onClick={() => setIsEditModalOpen(true)}
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {/* Botón Eliminar - Solo se muestra si el pago está activo */}
          {showDeleteButtons && (
            <button
              className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              onClick={() => setIsDeleteModalOpen(true)}
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Nuevo Botón para el Modal de asignar pagos */}
          {showPagarButton && (
            <button
              className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              onClick={() => setIsPagarModalOpen(true)}
              title="Pagar Saldo"
            >
              <DollarSign className="w-4 h-4" />{" "}
              {/* Cambié el icono a DollarSign para mejor representación */}
            </button>
          )}

          {/* Modal de Edición */}
          {isEditModalOpen && (
            <Modal
              title="Editar Pago"
              onClose={() => setIsEditModalOpen(false)}
            >
              <PaymentModal
                saldoAFavor={agente.monto_credito}
                onClose={() => setIsEditModalOpen(false)}
                agente={agente}
                initialData={{
                  monto_pagado: row.monto,
                  referencia: row.referencia,
                  paymentMethod:
                    row.metodo_pago === "transferencia"
                      ? "Transferencia"
                      : row.metodo_pago === "tarjeta"
                        ? "Tarjeta"
                        : "Wallet",
                  fecha_De_Pago: row.fecha_pago
                    ? new Date(row.fecha_pago).toISOString().split("T")[0]
                    : "",
                  comentario: row.comentario || row.notas || "",
                  facturable: row.is_facturable,
                  aplicable: row.is_descuento,

                  link_Stripe: row.link_stripe || '',
                  ult_digits: row.ult_digits || '',
                  banco_tarjeta: row.banco_tarjeta || '',
                  numero_autorizacion: (row.numero_autorizacion),
                  tipo_tarjeta: row.tipo_tarjeta || '',
                }}
                onSubmit={handleEdit}
                isEditing={true}
                localWalletAmount={localWalletAmount} // Pasa el valor actual
              />
            </Modal>
          )}

          {/* Modal de Eliminación */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Confirmar Eliminación
                  </h3>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    ¿Estás seguro que deseas eliminar este pago?
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setIsDeleteModalOpen(false);
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Nuevo Modal Pagar con saldo */}
          {isPagarModalOpen && (
            <Modal
              title={`Pagar Saldo - ${row.nombre}`}
              onClose={() => setIsPagarModalOpen(false)}
            >
              <PagarModalComponent
                saldoData={{
                  id_saldos: row.id_saldos,
                  id_agente: row.id_agente,
                  nombre: row.nombre,
                  monto: row.monto,
                  saldo: row.saldo,
                  fecha_pago: row.fecha_pago,
                  metodo_pago: row.metodo_pago,
                  referencia: row.referencia,
                  comentario: row.comentario,
                }}
                rowData={row} // Pasa el row completo como nueva prop
                onClose={() => {
                  console.log("Entrando al modal para mostrar datos");
                  updateAgentWallet()
                    .then((number) => setLocalWalletAmount(number || 0))
                    .catch((error) =>
                      console.error(
                        "Error en el saldo del modal al cerrar",
                        error
                      )
                    );
                  setIsPagarModalOpen(false);
                }}
                onSubmit={async () => {
                  console.log("Entrando al modal para mostrar datos");
                  updateAgentWallet()
                    .then((number) => {
                      console.log(number);
                      setLocalWalletAmount(number || 0);
                    })
                    .catch((error) =>
                      console.error(
                        "Error en el saldo del modal al cerrar",
                        error
                      )
                    );
                  const fetchSaldoFavor = async () => {
                    const response: { message: string; data: Saldo[] } =
                      await SaldoFavor.getPagos(agente.id_agente);
                    console.log("esto trae", response.data);
                    setSaldos(response.data);
                  };
                  fetchSaldoFavor();
                  walletAmount == localWalletAmount;
                  setIsPagarModalOpen(false);
                }}
              />
            </Modal>
          )}
        </div>
      );
    },
  };

  const reloadSaldos = async () => {
    try {
      setLoading((prev) => ({ ...prev, pagos: true }));
      const response = await SaldoFavor.getPagos(agente.id_agente);
      setSaldos(response.data);
      console.log("data", response);
    } catch (error) {
      console.error("Error al recargar saldos:", error);
      setError("Error al cargar los saldos");
    } finally {
      setLoading((prev) => ({ ...prev, pagos: false }));
    }
  };

  //Manejar nuevo pago

  const handleAddPayment = async (paymentData: NuevoSaldoAFavor) => {
    try {
      setLoading((prev) => ({ ...prev, pagos: true }));

      // Crear el pago
      const response = await SaldoFavor.crearPago({
        ...paymentData,
        id_cliente: agente.id_agente,
      });

      // Actualizar el estado local
      if (response.data) {
        setSaldos((prevSaldos) => [...prevSaldos, response.data]);
      }

      // Actualizar el saldo local sumando el monto del nuevo pago

      setLocalWalletAmount(
        walletAmount + parseFloat(paymentData.monto_pagado.toString())
      );

      await reloadSaldos();
      await updateAgentWallet();

      setAddPaymentModal(false);
      console.log("envio de pago", paymentData);
    } catch (err) {
      setError("Error al registrar el pago");
      console.error("Error:", err);
    } finally {
      setLoading((prev) => ({ ...prev, pagos: false }));
    }
  };

  if (loading.agente) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
        <span className="ml-2">Cargando información del agente...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!agente) {
    return (
      <div className="text-center py-8">
        No se encontró información del agente
      </div>
    );
  }

  if (localWalletAmount !== 0) {
    walletAmount = localWalletAmount;
  }

  console.log("local ", localWalletAmount);
  console.log("wallet", walletAmount);

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Resumen de saldo */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <PaymentSummary
            totalBalance={localWalletAmount || 0} // Usa localWalletAmount si está disponible
            assignedBalance={0}
          />

          <div className="flex justify-end items-center">
            <button
              onClick={() => setAddPaymentModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
              disabled={loading.pagos}
            >
              <Plus className="w-5 h-5" />
              {loading.pagos ? "Cargando..." : "Agregar Pago"}
            </button>
          </div>
        </div>

        {/* Tabla de pagos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Filters
            onFilter={handleFilter} // Pasamos handleFilter como prop
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            defaultFilters={filters}
          />

          {loading.pagos ? (
            <div className="p-8 flex justify-center">
              <Loader />
              <span className="ml-2">Cargando pagos...</span>
            </div>
          ) : (
            <Table3
              registros={filteredData}
              renderers={tableRenderers}

              customColumns={["saldo", "fecha_de_pago", "tipo_tarjeta", "forma_de_pago", "creado", "acciones", "referencia", "link_stripe", "facturable"]}
              //resto de columnas  
              //     id_Cliente:saldo.id_agente,
              //   id_saldo: saldo.id_saldos,
              // cliente: (saldo.nombre || '').toUpperCase(),
              // creado: saldo.fecha_creacion ? new Date(saldo.fecha_creacion) : null,
              // monto_pagado: Number(saldo.monto),
              // saldo: saldo.saldo,
              // forma_De_Pago: saldo.metodo_pago === 'transferencia'
              // ? 'Transferencia Bancaria'
              // : saldo.metodo_pago === 'tarjeta credito'
              // ? 'Tarjeta de Crédito'
              // : saldo.metodo_pago === 'tarjeta debito'
              // ? 'Tarjeta de Débito'
              // : saldo.metodo_pago || '',
              // tipo_tarjeta: saldo.tipo_tarjeta || '',
              // referencia: saldo.referencia || '',
              // link_stripe: saldo.link_stripe || null,
              // fecha_De_Pago: saldo.fecha_pago ? new Date(saldo.fecha_pago) : null,
              // aplicable: saldo.is_descuento ? 'Si' : 'No',
              // comentario: saldo.notas || saldo.comentario || null,
              // facturable: saldo.is_facturable ? 'Si' : 'No',
              // comprobante: saldo.comprobante || null,
              sortConfig={sortConfig}
              onSort={handleSort}
              defaultSort={{
                key: "creado", // Default sort column
                sort: false, // Default sort direction
              }}
              exportButton={true}
              maxHeight="70vh"
            />
          )}
        </div>
      </div>

      {/* Modal para agregar pago */}

      {addPaymentModal && agente && (
        <Modal
          title="Agregar Nuevo Pago"
          onClose={() => setAddPaymentModal(false)}
        >
          <PaymentModal
            saldoAFavor={agente.monto_credito}
            onClose={() => setAddPaymentModal(false)}
            agente={agente}
            onSubmit={handleAddPayment}
            localWalletAmount={localWalletAmount} // Pasa el valor actual
          />
        </Modal>
      )}
    </div>
  );
};

// Tipos para el formulario
//===========================
interface FormState {
  amount: string;
  reference: string;
  paymentMethod: string;
  paymentDate: string;
  discountApplied: boolean;
  facturable: boolean;
  comments: string;
  link_Stripe: string;
}

interface FormErrors {
  amount?: string;
  reference?: string;
  paymentMethod?: string;
  paymentDate?: string;
  link_Stripe?: string;
}

// Estado inicial
const initialState: FormState = {
  amount: "",
  reference: "",
  paymentMethod: "",
  paymentDate: "",
  discountApplied: false,
  facturable: false,
  comments: "",
  link_Stripe: "",
};

// Tipos de acciones
type ActionType =
  | { type: "SET_FIELD"; field: keyof FormState; value: string | boolean }
  | { type: "RESET_FORM" }
  | { type: "SET_FORM"; payload: FormState };

// Reducer
const formReducer = (state: FormState, action: ActionType): FormState => {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };
    case "RESET_FORM":
      return initialState;
    case "SET_FORM":
      return action.payload;
    default:
      return state;
  }
};

// Validaciones
const validateForm = (state: FormState): FormErrors => {
  const errors: FormErrors = {};

  if (!state.amount || parseFloat(state.amount) <= 0) {
    errors.amount = "El monto debe ser mayor a 0";
  }

  if (!state.paymentMethod) {
    errors.paymentMethod = "Selecciona una forma de pago";
  }

  if (!state.paymentDate) {
    errors.paymentDate = "La fecha de pago es requerida";
  }

  // Validar referencia solo si es transferencia
  if (state.paymentMethod === "Transferencia" && !state.reference.trim()) {
    errors.reference = "La referencia es requerida para transferencias";
  }

  // Validar link Stripe solo si es tarjeta
  if (state.paymentMethod === "Linkstripe" && !state.link_Stripe.trim()) {
    errors.link_Stripe =
      "El link de Stripe es requerido para pagos con tarjeta";
  }

  return errors;
};

//Modal de pagos
//para agregar pagos
const PaymentModal: React.FC<PaymentModalProps> = ({
  saldoAFavor = 0,
  onClose,
  agente,
  initialData,
  onSubmit,
  isEditing = false,
}) => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStripeLinked, setIsStripeLinked] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    ult_digits: "",
    banco_tarjeta: "",
    numero_autorizacion: "",
    tipo_tarjeta: "", // Establecer un valor por defecto
  });
  // Determinar qué campos mostrar según el método de pago
  const showReferenceField = () => {
    return state.paymentMethod === "Transferencia";
  };

  const showLinkStripeField = () => {
    return state.paymentMethod === "LinkStripe";
  };

  const showCardDetailsFields = () => {
    return (
      state.paymentMethod === "Tarjeta" || state.paymentMethod === "LinkStripe"
    );
  };

  // Inicializar con datos si estamos editando
  // Inicializar con datos si estamos editando
  useEffect(() => {
    console.log("editando", initialData);
    if (isEditing && initialData) {
      dispatch({
        type: "SET_FORM",
        payload: {
          amount: initialData.monto_pagado.toString(),
          reference: initialData.referencia,
          paymentMethod: initialData.paymentMethod,
          paymentDate: initialData.fecha_De_Pago,
          discountApplied: initialData.aplicable,
          facturable: initialData.facturable,
          comments: initialData.comentario,
          link_Stripe: initialData.link_Stripe,
        },
      });
      console.log("data de editar", initialData);
      setCardDetails({
        ult_digits: initialData.ult_digits || '',
        banco_tarjeta: initialData.banco_tarjeta || 'wer',
        numero_autorizacion: (initialData.numero_autorizacion) || 'erfgb',
        tipo_tarjeta: initialData.tipo_tarjeta || '',
      });
    }
  }, [isEditing, initialData]);



  const paymentMethods = isEditing
    ? ["Transferencia", "Wallet", "Tarjeta"]
    : ["Transferencia", "Wallet", "Tarjeta", "LinkStripe"];

  const fetchStripeInfo = async (chargeId: string) => {
    try {
      // Verificar que sea un ID de Stripe válido (empieza con ch_ o pi_ y tiene al menos 24 caracteres)
      const isValidStripeId = /^(ch|pi)_[a-zA-Z0-9]{24,}$/.test(chargeId);

      if (!isValidStripeId) {
        // No hacer fetch si no es un ID válido
        setIsStripeLinked(false);
        return;
      }

      const response = await fetch(
        `${URL}/mia/saldo/stripe-info?chargeId=${chargeId}`,
        {
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("Respuesta de Stripe:", data);

      if (data.data.estado !== "failed") {
        setCardDetails({
          ult_digits: data.data.ultimos_4_digitos || "No encontrado",
          banco_tarjeta: data.data.tipo_tarjeta || "No encontrado",
          numero_autorizacion: data.data.authorization_code || "No encontrado",
          tipo_tarjeta: data.data.funding || "No encontrado",
        });


        const amount = data.data.monto || '0';
        const paymentDate = data.data.fecha_pago ? new Date(data.data.fecha_pago).toISOString().split('T')[0] : '';

        handleInputChange("amount", amount);
        handleInputChange("paymentDate", paymentDate);

        setIsStripeLinked(true);

      } else {
        alert("Link de Stripe fallido");
        setIsStripeLinked(false);
        return;
      }
    } catch (error) {
      console.error('Error en fetchStripeInfo:', error);
      setErrors(prev => ({
        ...prev,
        link_Stripe: "Error al obtener información de Stripe",
      }));
      setIsStripeLinked(false);
    }
  };

  const handleInputChange = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    if (field === "paymentMethod") {
      // Resetear el estado de Stripe cuando cambia el método de pago
      setIsStripeLinked(value === "LinkStripe");
      if (value !== "LinkStripe") {
        dispatch({ type: "SET_FIELD", field: "link_Stripe", value: "" });
      }
    }

    dispatch({ type: "SET_FIELD", field, value });
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm(state);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (!state.paymentMethod) {
        throw new Error("El método de pago es requerido");
      }

      // Determinar el método de pago real
      let metodoPagoReal = "";
      let tipoTarjetaValue = "";

      if (state.paymentMethod === "LinkStripe") {
        metodoPagoReal = "tarjeta";
        tipoTarjetaValue = cardDetails.tipo_tarjeta || ""; // Default a crédito si no está definido
      } else if (state.paymentMethod === "Tarjeta") {
        metodoPagoReal = "tarjeta";
        // Determinar si es crédito o débito basado en la selección
        tipoTarjetaValue =
          cardDetails.tipo_tarjeta === "credito" ? "credito" : "debito";
      } else {
        metodoPagoReal = state.paymentMethod.toLowerCase();
      }

      const pagoData: NuevoSaldoAFavor = {
        id_cliente: agente.id_agente,
        monto_pagado: Number(state.amount),
        forma_pago: metodoPagoReal as "transferencia" | "tarjeta" | "wallet",
        is_facturable: state.facturable,
        referencia: state.reference,
        fecha_pago: state.paymentDate,
        // Campos específicos para tarjeta
        ...(metodoPagoReal === "tarjeta" && {
          tipo_tarjeta: tipoTarjetaValue,
          ult_digits: cardDetails.ult_digits,
          banco_tarjeta: cardDetails.banco_tarjeta,
          numero_autorizacion: cardDetails.numero_autorizacion,
          link_stripe: state.link_Stripe || "",
        }),
        descuento_aplicable: state.discountApplied,
        ...(state.comments && { comentario: state.comments }),
      };

      await onSubmit(pagoData);

      setIsSubmitting(false);
      setIsSubmitted(true);

      if (!isEditing) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setIsSubmitting(false);
      if (error instanceof Error) {
        setErrors({
          ...errors,
          amount: error.message.includes("monto") ? error.message : undefined,
          paymentMethod: error.message.includes("forma de pago")
            ? error.message
            : undefined,
        });
      } else {
        setErrors({
          ...errors,
          paymentMethod:
            "Ocurrió un error al procesar el pago. Intente nuevamente.",
        });
      }
    }
  };

  const resetForm = () => {
    dispatch({ type: "RESET_FORM" });
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div className="h-fit w-[95vw] max-w-sm relative">
      <div className="max-w-2xl mx-auto">
        {isSubmitted && (
          <div className="bg-green-50 border-b border-green-200 p-6 sticky top-0 z-10">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  {isEditing
                    ? "¡Pago actualizado exitosamente!"
                    : "¡Pago registrado exitosamente!"}
                </h3>
                <p className="text-green-600">
                  La información ha sido guardada correctamente.
                </p>
              </div>
            </div>
          </div>
        )}
        {Object.entries(errors).length > 0 && (
          <div className="bg-red-50 border-b border-red-200 p-6 sticky top-0 z-10">
            <div className="flex items-center">
              <X className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  ¡Ocurrio un error!
                </h3>
                {Object.values(errors)
                  .filter((item) => !!item)
                  .map((item) => (
                    <p key={item} className="text-red-600">
                      ◾{item}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <Dropdown
              label="Forma de Pago"
              value={state.paymentMethod}
              onChange={(value) => handleInputChange("paymentMethod", value)}
              options={paymentMethods}
            />

            {/* Mostrar Link Stripe solo para tarjetas */}
            {showLinkStripeField() && (
              <TextInput
                label="Link Stripe"
                value={state.link_Stripe}
                onChange={(value) => {
                  handleInputChange("link_Stripe", value);
                  // Solo hacer fetch si el método de pago es LinkStripe y hay texto
                  if (
                    state.paymentMethod === "LinkStripe" &&
                    value.trim() !== ""
                  ) {
                    fetchStripeInfo(value);
                  }
                }}
                placeholder="Agrega el Link Stripe"
              />
            )}

            {/* Mostrar Referencia solo para transferencias */}
            {showReferenceField() && (
              <TextInput
                label="Referencia"
                value={state.reference}
                onChange={(value) => handleInputChange("reference", value)}
                placeholder="Ingresa la referencia del pago"
              />
            )}

            {showCardDetailsFields() && (
              <>
                <TextInput
                  label="Últimos 4 dígitos"
                  value={cardDetails.ult_digits}
                  onChange={(value) => {
                    // Validar que solo sean números y máximo 4 dígitos
                    if (/^\d{0,4}$/.test(value)) {
                      setCardDetails((prev) => ({
                        ...prev,
                        ult_digits: value,
                      }));
                    }
                  }}
                  placeholder="Últimos 4 dígitos de la tarjeta"
                  disabled={
                    isStripeLinked && state.paymentMethod === "LinkStripe"
                  }
                />
                <TextInput
                  label="Banco de la tarjeta"
                  value={cardDetails.banco_tarjeta}
                  onChange={(value) =>
                    setCardDetails((prev) => ({
                      ...prev,
                      banco_tarjeta: value,
                    }))
                  }
                  placeholder="Nombre del banco"
                  disabled={
                    isStripeLinked && state.paymentMethod === "LinkStripe"
                  }
                />
                <TextInput
                  label="Número de autorización"
                  value={cardDetails.numero_autorizacion}
                  onChange={(value) =>
                    setCardDetails((prev) => ({
                      ...prev,
                      numero_autorizacion: value,
                    }))
                  }
                  placeholder="Número de autorización"
                  disabled={
                    isStripeLinked && state.paymentMethod === "LinkStripe"
                  }
                />
                <Dropdown
                  label="Tipo de Tarjeta"
                  value={
                    cardDetails.tipo_tarjeta === "credito"
                      ? "credit"
                      : cardDetails.tipo_tarjeta === "debito"
                        ? "debit"
                        : cardDetails.tipo_tarjeta
                  }
                  onChange={(value) => {
                    const tipo_tarjeta =
                      value === "credit" ? "credito" : "debito";
                    setCardDetails((prev) => ({ ...prev, tipo_tarjeta }));
                  }}
                  options={[
                    { value: "credit", label: "Crédito" },
                    { value: "debit", label: "Débito" },
                  ]}
                  disabled={
                    isStripeLinked && state.paymentMethod === "LinkStripe"
                  }
                />
              </>
            )}

            <DateInput
              label="Fecha de Pago"
              value={state.paymentDate}
              onChange={(value) => handleInputChange("paymentDate", value)}
              disabled={state.paymentMethod === "LinkStripe"} // Deshabilitar cuando es LinkStripe
            />

            <NumberInput
              label="Monto Pagado"
              value={Number(state.amount)}
              onChange={(value) => handleInputChange("amount", value)}
              disabled={
                isStripeLinked ||
                (isEditing && state.paymentMethod === "Tarjeta")
              } // Agregamos esta condición
            />

            <CheckboxInput
              checked={state.discountApplied}
              onChange={(e) => handleInputChange("discountApplied", e)}
              label={"Descuento aplicado"}
            />

            <CheckboxInput
              checked={state.facturable}
              onChange={(e) => handleInputChange("facturable", e)}
              label={"Facturable"}
            />

            <TextAreaInput
              label="Comentarios"
              value={state.comments}
              onChange={(value) => handleInputChange("comments", value)}
              placeholder="Agrega comentarios adicionales sobre el pago..."
            />
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {isEditing ? "Actualizar Pago" : "Registrar Pago"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="w-full md:flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageCuentasPorCobrar;
