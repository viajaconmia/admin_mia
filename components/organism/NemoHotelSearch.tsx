"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Building2,
  Calendar,
  Users,
  MapPin,
  Star,
  Info,
  Loader2,
  DollarSign,
  BedDouble,
  ShieldAlert,
  User,
  Briefcase,
  CreditCard,
  CheckCircle2,
  Wallet,
  AlertCircle,
  Receipt,
  Check,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  NemoHotel,
  NemoRate,
  searchNemoHotels,
  SearchNemoHotelsDto,
  createNemoReservation,
  CreateNemoReservationDto,
} from "@/services/nemo";
import { fetchAgentes } from "@/services/agentes";
import { fetchViajerosFromAgent } from "@/services/viajeros";
import { SaldoFavor, Saldo } from "@/services/SaldoAFavor";
import { Agente, Viajero } from "@/types";
import { useClientes } from "@/angel/context/ClientesContext";

const POPULAR_DESTINATIONS = [
  { label: "Mar del Plata (Argentina - Test Sandbox)", code: "5718" },
  { label: "Cancún (México)", code: "3690" },
  { label: "Ciudad de México (México)", code: "2757" },
  { label: "Madrid (España)", code: "2262" },
  { label: "Buenos Aires (Argentina)", code: "747" },
  { label: "Miami (EE.UU.)", code: "1340" },
];

export interface SelectedReservationContext {
  cliente: Agente;
  viajero: Viajero | null;
  hotel: NemoHotel;
  rate: NemoRate;
  checkIn: string;
  checkOut: string;
}

export interface NemoHotelSearchProps {
  onSelectReservation?: (context: SelectedReservationContext) => void;
  showSelectButton?: boolean;
}

interface AppliedSaldoItem {
  saldoItem: Saldo;
  aplicado: number;
}

export function NemoHotelSearch({
  onSelectReservation,
  showSelectButton = true,
}: NemoHotelSearchProps) {
  // CLIENTES CONTEXT (Catálogo precargado en memoria global)
  const { agentes, loading: loadingClientesCtx } = useClientes();

  // CLIENTE STATE
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Agente | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientContainerRef = useRef<HTMLDivElement>(null);

  // Filtrado instantáneo en memoria sin latencia de red
  const clientResults = useMemo(() => {
    if (!clientSearchTerm.trim() || clientSearchTerm.trim().length < 1) {
      return (agentes || []).slice(0, 8);
    }
    const term = clientSearchTerm.toLowerCase().trim();
    return (agentes || []).filter((cliente) => {
      const nombre = (cliente.nombre_agente_completo || "").toLowerCase();
      const correo = (cliente.correo || "").toLowerCase();
      const id = (cliente.id_agente || "").toLowerCase();
      return nombre.includes(term) || correo.includes(term) || id.includes(term);
    });
  }, [agentes, clientSearchTerm]);

  // VIAJERO STATE
  const [viajeros, setViajeros] = useState<Viajero[]>([]);
  const [selectedViajero, setSelectedViajero] = useState<Viajero | null>(null);
  const [loadingViajeros, setLoadingViajeros] = useState(false);

  // SEARCH PARAMS STATE
  const [destinationId, setDestinationId] = useState("5718");
  const [customDestination, setCustomDestination] = useState("");
  const [useCustomDestination, setUseCustomDestination] = useState(false);
  const [checkIn, setCheckIn] = useState("2026-11-11");
  const [checkOut, setCheckOut] = useState("2026-11-13");
  const [adults, setAdults] = useState(2);

  // RESULTS STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<NemoHotel[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<NemoHotel | null>(null);

  // RESERVATION MODAL STATE
  const [modalOpen, setModalOpen] = useState(false);
  const [reservationContext, setReservationContext] = useState<SelectedReservationContext | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"credito" | "wallet">("credito");
  const [reservationComments, setReservationComments] = useState("");
  const [submittingReservation, setSubmittingReservation] = useState(false);
  const [reservationSuccessData, setReservationSuccessData] = useState<any | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);

  // PRICING & MARKUP STATE FOR MODAL
  const [costoProveedor, setCostoProveedor] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [markupPercentage, setMarkupPercentage] = useState<number>(15);

  // SALDOS / WALLET STATE FOR MODAL
  const [agentSaldos, setAgentSaldos] = useState<Saldo[]>([]);
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  const [appliedSaldos, setAppliedSaldos] = useState<{ [id_saldo: number]: number }>({});

  // Click outside listener for Client Autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        clientContainerRef.current &&
        !clientContainerRef.current.contains(e.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejador del cambio en búsqueda de cliente (filtro instantáneo)
  const handleClientSearchChange = (value: string) => {
    setClientSearchTerm(value);
    setShowClientDropdown(true);
  };

  // Seleccionar cliente y cargar sus viajeros y saldos
  const handleSelectClient = async (cliente: Agente) => {
    setSelectedClient(cliente);
    setClientSearchTerm(cliente.nombre_agente_completo || "");
    setShowClientDropdown(false);
    setSelectedViajero(null);
    setViajeros([]);

    if (!cliente.id_agente) return;

    // Pre-cargar saldos para tener la cifra exacta de wallet al día
    SaldoFavor.getPagos(cliente.id_agente, true)
      .then((res) => {
        const saldos = (res?.data || []).filter(
          (s) => Number(s.saldo) > 0 && Number(s.activo) === 1
        );
        setAgentSaldos(saldos);
        const totalWalletCalculated = saldos.reduce(
          (acc, s) => acc + Number(s.saldo || 0),
          0
        );
        setSelectedClient((prev) =>
          prev ? { ...prev, wallet: totalWalletCalculated.toFixed(2) } : prev
        );
      })
      .catch((err) => {
        console.error("Error al pre-cargar saldos a favor:", err);
      });

    setLoadingViajeros(true);
    try {
      await fetchViajerosFromAgent(cliente.id_agente, (rawList: any) => {
        const list = Array.isArray(rawList)
          ? rawList
          : Array.isArray(rawList?.data)
          ? rawList.data
          : [];
        setViajeros(list);
        if (list.length > 0) {
          setSelectedViajero(list[0]);
        } else {
          setSelectedViajero(null);
        }
      });
    } catch (err) {
      console.error("Error al cargar viajeros del agente:", err);
      setViajeros([]);
      setSelectedViajero(null);
    } finally {
      setLoadingViajeros(false);
    }
  };

  // Deseleccionar cliente
  const handleClearClient = () => {
    setSelectedClient(null);
    setClientSearchTerm("");
    setViajeros([]);
    setSelectedViajero(null);
    setAgentSaldos([]);
    setAppliedSaldos({});
  };

  // Ejecutar búsqueda de hoteles en Nemo
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSelectedHotel(null);

    const activeDestination = useCustomDestination
      ? customDestination.trim()
      : destinationId;

    if (!activeDestination) {
      setError("Por favor ingresa o selecciona un destino.");
      setLoading(false);
      return;
    }

    try {
      const searchParams: SearchNemoHotelsDto = {
        destinationId: activeDestination,
        checkIn,
        checkOut,
        rooms: [{ roomSequence: 1, roomType: "NMO.HTL.RMT.DBL" }],
        passengers: Array.from({ length: adults }, () => ({
          ageType: "ADT" as const,
          roomSequence: 1,
        })),
      };

      const result = await searchNemoHotels(searchParams);
      setHotels(result.hotels || []);
      if (result.hotels && result.hotels.length > 0) {
        setSelectedHotel(result.hotels[0]);
      }
    } catch (err: any) {
      console.error("Error al buscar hoteles en Nemo:", err);
      setError(
        err?.message || "Ocurrió un error al consultar el catálogo de Nemo."
      );
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-selección greedy para cubrir el total con saldos a favor
  const autoCoverWithSaldos = (saldosList: Saldo[], requiredTotal: number) => {
    let remaining = requiredTotal;
    const initialApplied: { [id_saldo: number]: number } = {};
    for (const s of saldosList) {
      if (remaining <= 0) {
        initialApplied[s.id_saldos] = 0;
        continue;
      }
      const available = Number(s.saldo);
      const toApply = Math.min(available, remaining);
      initialApplied[s.id_saldos] = parseFloat(toApply.toFixed(2));
      remaining = parseFloat((remaining - toApply).toFixed(2));
    }
    setAppliedSaldos(initialApplied);
  };

  // Limpiar montos aplicados
  const clearAllSaldos = () => {
    const cleared: { [id_saldo: number]: number } = {};
    agentSaldos.forEach((s) => {
      cleared[s.id_saldos] = 0;
    });
    setAppliedSaldos(cleared);
  };

  // Cargar saldos a favor cuando se abre el modal y se elige wallet
  const loadAgentSaldos = async (agentId: string, requiredTotal: number) => {
    setLoadingSaldos(true);
    try {
      const response = await SaldoFavor.getPagos(agentId, true);
      const saldos = (response?.data || []).filter(
        (s) => Number(s.saldo) > 0 && Number(s.activo) === 1
      );
      setAgentSaldos(saldos);

      const totalWalletCalculated = saldos.reduce(
        (acc, s) => acc + Number(s.saldo || 0),
        0
      );
      setSelectedClient((prev) =>
        prev ? { ...prev, wallet: totalWalletCalculated.toFixed(2) } : prev
      );

      autoCoverWithSaldos(saldos, requiredTotal);
    } catch (err) {
      console.error("Error al cargar saldos a favor del agente:", err);
      setAgentSaldos([]);
    } finally {
      setLoadingSaldos(false);
    }
  };

  // Abrir Modal de Confirmación de Reserva
  const handleRateSelect = (hotel: NemoHotel, rate: NemoRate) => {
    if (!selectedClient) {
      alert("Por favor selecciona un Cliente en la Sección 1 antes de elegir la tarifa.");
      return;
    }

    if (!selectedViajero) {
      alert("Por favor selecciona un Viajero principal para la reserva.");
      return;
    }

    const context: SelectedReservationContext = {
      cliente: selectedClient,
      viajero: selectedViajero,
      hotel,
      rate,
      checkIn,
      checkOut,
    };

    const costo = Number(rate.amount || 0);
    const defaultMarkup = 15;
    const initialVenta = parseFloat((costo * (1 + defaultMarkup / 100)).toFixed(2));
    setCostoProveedor(costo);
    setPrecioVenta(initialVenta);
    setMarkupPercentage(defaultMarkup);

    setReservationContext(context);
    setReservationSuccessData(null);
    setReservationError(null);
    setReservationComments("");

    // Determinar método por defecto: si tiene crédito y saldo suficiente -> credito, sino evaluar wallet
    const clientCredit = Number(selectedClient.saldo || 0);
    if (clientCredit >= initialVenta) {
      setPaymentMethod("credito");
    } else {
      setPaymentMethod("wallet");
      loadAgentSaldos(selectedClient.id_agente, initialVenta);
    }

    setModalOpen(true);

    if (onSelectReservation) {
      onSelectReservation(context);
    }
  };

  // Manejadores para actualizar margen y precio de venta
  const handleMarkupChange = (markup: number) => {
    setMarkupPercentage(markup);
    const calculatedVenta = parseFloat((costoProveedor * (1 + markup / 100)).toFixed(2));
    setPrecioVenta(calculatedVenta);
    if (paymentMethod === "wallet" && selectedClient) {
      loadAgentSaldos(selectedClient.id_agente, calculatedVenta);
    }
  };

  const handlePrecioVentaChange = (venta: number) => {
    setPrecioVenta(venta);
    if (costoProveedor > 0) {
      const calculatedMarkup = parseFloat((((venta - costoProveedor) / costoProveedor) * 100).toFixed(2));
      setMarkupPercentage(calculatedMarkup);
    }
    if (paymentMethod === "wallet" && selectedClient) {
      loadAgentSaldos(selectedClient.id_agente, venta);
    }
  };

  // Cambiar método de pago en el modal
  const handlePaymentMethodChange = (method: "credito" | "wallet") => {
    setPaymentMethod(method);
    if (method === "wallet" && selectedClient) {
      loadAgentSaldos(selectedClient.id_agente, precioVenta);
    }
  };

  // Total aplicado en saldos a favor
  const totalSaldosAplicados = Object.values(appliedSaldos).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );

  // Confirmar y crear la reserva en el backend
  const handleConfirmReservation = async () => {
    if (!reservationContext || !selectedClient || !selectedViajero) return;

    setSubmittingReservation(true);
    setReservationError(null);

    try {
      const requiredTotal = precioVenta;

      let ejemplo_saldos_payload: any[] = [];
      if (paymentMethod === "wallet") {
        if (totalSaldosAplicados < requiredTotal) {
          throw new Error(
            `El monto aplicado de saldos ($${totalSaldosAplicados.toFixed(
              2
            )}) no cubre el total de venta de la reserva ($${requiredTotal.toFixed(2)}).`
          );
        }

        ejemplo_saldos_payload = Object.entries(appliedSaldos)
          .filter(([_, applied]) => Number(applied) > 0)
          .map(([idSaldoStr, applied]) => {
            const idSaldo = Number(idSaldoStr);
            const originalItem = agentSaldos.find((s) => s.id_saldos === idSaldo);
            const saldoOriginal = Number(originalItem?.saldo || applied);
            return {
              id_saldo: idSaldo,
              saldo_original: saldoOriginal,
              saldo_actual: Math.max(0, parseFloat((saldoOriginal - applied).toFixed(2))),
              aplicado: parseFloat(applied.toFixed(2)),
              id_agente: selectedClient.id_agente,
              metodo_de_pago: originalItem?.metodo_pago || "wallet",
              fecha_pago: originalItem?.fecha_pago || new Date().toISOString().slice(0, 10),
              concepto: originalItem?.concepto || null,
              referencia: originalItem?.referencia || null,
              currency: originalItem?.currency || "mxn",
              tipo_de_tarjeta: originalItem?.tipo_tarjeta || null,
              link_pago: originalItem?.link_stripe || null,
              last_digits: originalItem?.ult_digits || null,
            };
          });
      }

      const diffTime =
        new Date(checkOut).getTime() - new Date(checkIn).getTime();
      const noches = Math.max(
        1,
        Math.round(diffTime / (1000 * 60 * 60 * 24))
      );

      const payload: CreateNemoReservationDto = {
        bandera: paymentMethod === "credito" ? 0 : 1,
        id_agente: selectedClient.id_agente,
        id_viajero: selectedViajero.id_viajero,
        check_in: checkIn,
        check_out: checkOut,
        noches,
        habitacion:
          reservationContext.rate.roomRates[0]?.roomType || "HABITACIÓN ESTÁNDAR",
        hotel: {
          hotelCode: reservationContext.hotel.hotelCode,
          hotelName: reservationContext.hotel.hotelName,
          address: reservationContext.hotel.address?.street || "",
          destinationName: reservationContext.hotel.address?.city || "",
          city: reservationContext.hotel.address?.city || "",
          country: reservationContext.hotel.address?.countryCode || "MEXICO",
          latitude: reservationContext.hotel.latitude,
          longitude: reservationContext.hotel.longitude,
        },
        rate: {
          rateId: reservationContext.rate.tripProductId,
          roomDescription:
            reservationContext.rate.roomRates[0]?.roomType ||
            "HABITACIÓN ESTÁNDAR",
          boardDescription:
            reservationContext.rate.roomRates[0]?.boardDescription || "",
          total: costoProveedor,
          currency: reservationContext.rate.currency,
        },
        venta: {
          total: precioVenta,
          subtotal: parseFloat((precioVenta * 0.84).toFixed(2)),
          impuestos: parseFloat((precioVenta * 0.16).toFixed(2)),
        },
        proveedor: {
          total: costoProveedor,
          subtotal: parseFloat((costoProveedor * 0.84).toFixed(2)),
          impuestos: parseFloat((costoProveedor * 0.16).toFixed(2)),
        },
        comments: reservationComments.trim() || undefined,
        ejemplo_saldos:
          paymentMethod === "wallet" ? ejemplo_saldos_payload : [],
      };

      const result = await createNemoReservation(payload);
      setReservationSuccessData(result);

      // Actualizar balances locales del cliente
      if (paymentMethod === "credito") {
        setSelectedClient((prev) =>
          prev
            ? {
                ...prev,
                saldo: Math.max(0, Number(prev.saldo || 0) - requiredTotal),
              }
            : null
        );
      } else if (paymentMethod === "wallet") {
        setSelectedClient((prev) =>
          prev
            ? {
                ...prev,
                wallet: Math.max(0, Number(prev.wallet || 0) - totalSaldosAplicados).toFixed(2),
              }
            : null
        );
        // Descontar en agentSaldos locales
        setAgentSaldos((prev) =>
          prev
            .map((s) => {
              const applied = appliedSaldos[s.id_saldos] || 0;
              const newBal = Math.max(0, Number(s.saldo || 0) - applied);
              return { ...s, saldo: newBal.toFixed(2) };
            })
            .filter((s) => Number(s.saldo) > 0)
        );
        setAppliedSaldos({});
      }
    } catch (err: any) {
      console.error("Error al crear reserva en MIA:", err);
      setReservationError(
        err?.message || "Ocurrió un error al crear la reservación en MIA."
      );
    } finally {
      setSubmittingReservation(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ============================================================ */}
      {/* SECCIÓN 1: ASIGNACIÓN DE CLIENTE Y VIAJERO */}
      {/* ============================================================ */}
      <Card className="shadow-sm border border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-800">
                1. Asignar Cliente y Viajero Principal
              </CardTitle>
            </div>
            {selectedClient && (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Cliente Vinculado
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Indica el cliente al que se facturará/cargará la reserva y el
            viajero que se registrará ante el proveedor.
          </p>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Autocomplete de Cliente (Agente) */}
          <div className="relative" ref={clientContainerRef}>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Cliente (Razón Social o Nombre) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Escribe el nombre o razón social del cliente..."
                value={clientSearchTerm}
                onChange={(e) => handleClientSearchChange(e.target.value)}
                onFocus={() => {
                  if (clientResults.length > 0) setShowClientDropdown(true);
                }}
                className={`pr-8 text-sm ${
                  selectedClient
                    ? "border-emerald-500 bg-emerald-50/30 font-medium text-slate-900"
                    : ""
                }`}
              />
              {loadingClientesCtx ? (
                <Loader2 className="h-4 w-4 text-slate-400 animate-spin absolute right-2.5 top-2.5" />
              ) : selectedClient ? (
                <button
                  type="button"
                  onClick={handleClearClient}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  title="Cambiar cliente"
                >
                  ✕
                </button>
              ) : (
                <Search className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5" />
              )}
            </div>

            {/* Dropdown de Resultados */}
            {showClientDropdown && clientResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                {clientResults.map((cliente) => {
                  const tieneCredito = Number(cliente.tiene_credito_consolidado) === 1;
                  const creditoNum = Number(cliente.saldo || 0);
                  const walletNum = Number(cliente.wallet || 0);

                  return (
                    <div
                      key={cliente.id_agente}
                      onClick={() => handleSelectClient(cliente)}
                      className="p-2.5 hover:bg-indigo-50 cursor-pointer transition text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {cliente.nombre_agente_completo}
                        </span>
                        {walletNum > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-purple-100 text-purple-800 border-purple-200 font-semibold px-1.5 py-0 flex items-center gap-1 shrink-0"
                          >
                            <Wallet className="h-2.5 w-2.5 text-purple-700" />
                            Wallet: ${walletNum.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>RFC/ID: {cliente.id_agente?.slice(0, 8)}...</span>
                        <span>•</span>
                        {tieneCredito ? (
                          <span className="text-emerald-700 font-medium">
                            Crédito: <strong>${creditoNum.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</strong>
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin Crédito</span>
                        )}
                        <span>•</span>
                        <span className={walletNum > 0 ? "text-purple-700 font-medium" : "text-slate-400"}>
                          Wallet: ${walletNum.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Badge informativa del cliente seleccionado */}
            {selectedClient && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Crédito Disponible:</span>
                    <strong className="text-slate-900 font-semibold text-xs">
                      ${Number(selectedClient.saldo || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })} MXN
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Saldo a Favor (Wallet):</span>
                    <strong className="text-purple-700 font-bold text-xs flex items-center gap-1">
                      <Wallet className="h-3 w-3 text-purple-600 inline" />
                      ${Number(selectedClient.wallet || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })} MXN
                    </strong>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-slate-400 text-[11px] block">Modalidad:</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 font-medium ${
                        Number(selectedClient.tiene_credito_consolidado) === 1
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}
                    >
                      {Number(selectedClient.tiene_credito_consolidado) === 1
                        ? "Línea de Crédito"
                        : "Prepago / Wallet"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selector de Viajero Principal */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Viajero Principal <span className="text-red-500">*</span>
            </label>
            {loadingViajeros ? (
              <div className="h-9 flex items-center gap-2 px-3 border border-slate-200 rounded-md text-xs text-slate-400 bg-slate-50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cargando viajeros del cliente...
              </div>
            ) : !selectedClient ? (
              <div className="h-9 flex items-center px-3 border border-dashed border-slate-200 rounded-md text-xs text-slate-400 bg-slate-50">
                Selecciona primero un cliente para ver sus viajeros
              </div>
            ) : (!Array.isArray(viajeros) || viajeros.length === 0) ? (
              <div className="p-2.5 border border-amber-200 rounded-md text-xs text-amber-800 bg-amber-50 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                  No hay viajeros registrados para este cliente.
                </div>
                <div className="text-[11px] text-amber-700">
                  Se requiere registrar al menos un viajero para este cliente en el catálogo antes de poder reservar.
                </div>
              </div>
            ) : (
              <select
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedViajero?.id_viajero || ""}
                onChange={(e) => {
                  const safeList = Array.isArray(viajeros) ? viajeros : [];
                  const v = safeList.find((item) => item.id_viajero === e.target.value);
                  setSelectedViajero(v || null);
                }}
              >
                {(Array.isArray(viajeros) ? viajeros : []).map((v) => (
                  <option key={v.id_viajero} value={v.id_viajero}>
                    {v.nombre_completo || "Viajero"}{" "}
                    {v.correo ? `(${v.correo})` : ""}
                  </option>
                ))}
              </select>
            )}

            {selectedViajero && (
              <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600">
                Viajero activo:{" "}
                <strong className="text-slate-900">
                  {selectedViajero.nombre_completo || "Viajero"}
                </strong>
                {selectedViajero.correo && ` • ${selectedViajero.correo}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* SECCIÓN 2: FORMULARIO DE BÚSQUEDA DE HOTELES */}
      {/* ============================================================ */}
      <Card className="shadow-sm border border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-base font-semibold text-slate-800">
              2. Parámetros de Búsqueda de Hoteles Nemo
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Selector de Destino */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Destino
                </label>
                {!useCustomDestination ? (
                  <select
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                  >
                    {POPULAR_DESTINATIONS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="Código de destino Nemo (ej. 5718)"
                    value={customDestination}
                    onChange={(e) => setCustomDestination(e.target.value)}
                    className="h-9 text-sm"
                  />
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setUseCustomDestination(!useCustomDestination)}
                    className="text-[11px] text-indigo-600 hover:underline pt-0.5"
                  >
                    {useCustomDestination
                      ? "Ver destinos predeterminados"
                      : "Ingresar código manual"}
                  </button>
                </div>
              </div>

              {/* Check-in */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Check-In
                </label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>

              {/* Check-out */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Check-Out
                </label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-600">Adultos:</span>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="h-8 px-2 text-xs border border-slate-200 rounded bg-white"
                >
                  <option value={1}>1 Adulto</option>
                  <option value={2}>2 Adultos</option>
                  <option value={3}>3 Adultos</option>
                  <option value={4}>4 Adultos</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9 text-sm px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consultando tarifas en vivo...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Buscar Hoteles en Nemo
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alerta de Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Error al consultar el proveedor</div>
            <div className="text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECCIÓN 3: RESULTADOS Y TARIFAS */}
      {/* ============================================================ */}
      {hasSearched && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Hoteles */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
              Hoteles Disponibles ({hotels.length})
            </div>

            {hotels.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500 text-sm">
                No se encontraron hoteles disponibles para estas fechas o destino.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {hotels.map((hotel) => {
                  const isSelected = selectedHotel?.hotelCode === hotel.hotelCode;
                  const lowestRate =
                    hotel.rates && hotel.rates.length > 0
                      ? Math.min(...hotel.rates.map((r) => r.amount))
                      : null;

                  return (
                    <div
                      key={hotel.hotelCode}
                      onClick={() => setSelectedHotel(hotel)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition text-left ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm text-slate-900 leading-tight">
                          {hotel.hotelName}
                        </div>
                        {hotel.rating > 0 && (
                          <div className="flex items-center text-amber-500 text-xs gap-0.5 flex-shrink-0">
                            <Star className="h-3 w-3 fill-amber-400" />
                            <span>{hotel.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {hotel.address?.city || "Sin ciudad"},{" "}
                          {hotel.address?.countryCode || ""}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {hotel.rates?.length || 0} tarifas
                        </span>
                        {lowestRate != null && (
                          <span className="font-bold text-slate-900">
                            Desde ${lowestRate.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detalle y Tarifas del Hotel Seleccionado */}
          <div className="lg:col-span-2">
            {selectedHotel ? (
              <Card className="shadow-sm border border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        {selectedHotel.hotelName}
                      </CardTitle>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {selectedHotel.address?.street
                          ? `${selectedHotel.address.street}, `
                          : ""}
                        {selectedHotel.address?.city},{" "}
                        {selectedHotel.address?.countryCode}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs w-fit">
                      Código Nemo: {selectedHotel.hotelCode}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Tarifas Disponibles en Vivo
                    </h4>

                    <div className="space-y-3">
                      {selectedHotel.rates?.map((rate) => (
                        <div
                          key={rate.tripProductId}
                          className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <BedDouble className="h-4 w-4 text-slate-500" />
                              <span className="font-semibold text-sm text-slate-800">
                                {rate.roomRates[0]?.roomType || "Habitación Estándar"}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {rate.roomRates[0]?.boardDescription || "Solo Alojamiento"}
                              </Badge>
                            </div>

                            <p className="text-xs text-slate-500">
                              {rate.cancellationPolicy.refundable ? (
                                <span className="text-emerald-600 font-medium">
                                  ✓ Reembolsable
                                  {rate.cancellationPolicy.deadline
                                    ? ` hasta ${rate.cancellationPolicy.deadline.slice(0, 10)}`
                                    : ""}
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium">
                                  Tarifa no reembolsable
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0">
                            <div className="text-left md:text-right">
                              <div className="text-xs text-slate-400">Total estancia</div>
                              <div className="text-lg font-bold text-slate-900">
                                {rate.currency} ${rate.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                              </div>
                            </div>

                            {showSelectButton && (
                              <Button
                                size="sm"
                                onClick={() => handleRateSelect(selectedHotel, rate)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                Seleccionar para Reserva
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>Información para Operaciones:</strong> Al seleccionar una tarifa se asegurará que el hotel esté dado de alta como inactivo en MIA y se creará la reserva vinculada a Nemo como intermediario.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
                Selecciona un hotel de la lista para ver sus tarifas y detalles
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE CONFIRMACIÓN Y CREACIÓN DE RESERVA */}
      {/* ============================================================ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Confirmar Reservación en MIA (Proveedor Nemo)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Verifica los detalles del viaje y selecciona el método de cobro autorizado para el cliente.
            </DialogDescription>
          </DialogHeader>

          {reservationSuccessData ? (
            /* VISTA DE ÉXITO */
            <div className="py-6 space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ¡Reservación Creada Exitosamente en MIA!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  El hotel externo fue registrado y la reserva quedó asociada con Nemo como intermediario.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Booking:</span>
                  <strong className="text-slate-900">{reservationSuccessData.data?.id_booking}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Servicio:</span>
                  <strong className="text-slate-900">{reservationSuccessData.data?.id_servicio}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Hospedaje:</span>
                  <strong className="text-slate-900">{reservationSuccessData.data?.id_hospedaje}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Método de Cobro:</span>
                  <strong className="text-slate-900">
                    {paymentMethod === "credito" ? "Crédito MIA" : "Saldo a Favor / Wallet"}
                  </strong>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-500">Total Facturado/Cobrado:</span>
                  <strong className="text-emerald-700 text-sm">
                    ${Number(reservationSuccessData.data?.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </strong>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setModalOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            /* VISTA DEL FORMULARIO DE COBRO */
            <div className="space-y-4 py-2 text-xs">
              {/* Alerta de Error si ocurre */}
              {reservationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Error al crear la reserva:</span>
                    <p className="mt-0.5">{reservationError}</p>
                  </div>
                </div>
              )}

              {/* Resumen de la Reserva */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-semibold text-slate-800 text-sm">
                  {reservationContext?.hotel.hotelName}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Habitación & Régimen:</span>
                    <span className="font-medium text-slate-800">
                      {reservationContext?.rate.roomRates[0]?.roomType || "Estándar"} (
                      {reservationContext?.rate.roomRates[0]?.boardDescription || "Solo Alojamiento"})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Fechas & Estancia:</span>
                    <span className="font-medium text-slate-800">
                      {checkIn} al {checkOut}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cliente (Agente):</span>
                    <span className="font-medium text-slate-800">
                      {selectedClient?.nombre_agente_completo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Viajero Principal:</span>
                    <span className="font-medium text-slate-800">
                      {selectedViajero?.nombre_completo || "Viajero Principal"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Costo Base Proveedor (Nemo):</span>
                  <span className="font-semibold text-slate-700">
                    {reservationContext?.rate.currency} $
                    {costoProveedor.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Definición de Tarifa de Venta y Margen de Ganancia */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    Definición de Tarifa y Margen de Venta (MIA)
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Costo Nemo: <strong>${costoProveedor.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Margen / Markup */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Margen de Ganancia (% Markup):
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        value={markupPercentage}
                        onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-semibold bg-white"
                      />
                      <div className="flex gap-1">
                        {[10, 15, 20, 25].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleMarkupChange(pct)}
                            className={`px-1.5 py-1 text-[10px] rounded border ${
                              markupPercentage === pct
                                ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            +{pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Precio Final de Venta al Cliente */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Precio de Venta al Cliente (Cobro): <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">$</span>
                      <Input
                        type="number"
                        step="1"
                        value={precioVenta}
                        onChange={(e) => handlePrecioVentaChange(parseFloat(e.target.value) || 0)}
                        className="h-8 pl-6 text-xs font-bold text-indigo-950 border-indigo-300 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen de Ganancia */}
                <div className="flex items-center justify-between pt-1 border-t border-indigo-100 text-[11px]">
                  <span className="text-slate-600 font-medium">
                    Ganancia estimada para MIA:
                  </span>
                  {precioVenta >= costoProveedor ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
                      +${(precioVenta - costoProveedor).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN ({markupPercentage}%)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs">
                      ⚠️ Venta bajo costo: -${(costoProveedor - precioVenta).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </Badge>
                  )}
                </div>
              </div>

              {/* Selector de Método de Cobro */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  Selecciona la Forma de Cobro al Cliente ({reservationContext?.rate.currency} ${precioVenta.toLocaleString("es-MX", { minimumFractionDigits: 2 })}):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Opción 1: Crédito */}
                  <div
                    onClick={() => {
                      if (Number(selectedClient?.tiene_credito_consolidado) === 1) {
                        handlePaymentMethodChange("credito");
                      }
                    }}
                    className={`p-3 rounded-lg border transition flex items-start gap-2.5 ${
                      Number(selectedClient?.tiene_credito_consolidado) !== 1
                        ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-100"
                        : paymentMethod === "credito"
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm cursor-pointer"
                        : "border-slate-200 hover:border-slate-300 cursor-pointer"
                    }`}
                  >
                    <CreditCard
                      className={`h-4 w-4 mt-0.5 ${
                        paymentMethod === "credito"
                          ? "text-indigo-600"
                          : "text-slate-400"
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        Pago a Crédito
                        {Number(selectedClient?.tiene_credito_consolidado) !== 1 && (
                          <span className="text-[10px] text-amber-600 font-normal">(Sin línea)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Saldo disponible:{" "}
                        <strong className="text-slate-700">
                          $
                          {Number(selectedClient?.saldo || 0).toLocaleString(
                            "es-MX",
                            { minimumFractionDigits: 2 }
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Opción 2: Saldo a Favor / Wallet */}
                  <div
                    onClick={() => handlePaymentMethodChange("wallet")}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                      paymentMethod === "wallet"
                        ? "border-purple-600 bg-purple-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Wallet
                      className={`h-4 w-4 mt-0.5 ${
                        paymentMethod === "wallet"
                          ? "text-purple-600"
                          : "text-slate-400"
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        Saldo a Favor / Wallet
                        <Badge variant="outline" className="text-[10px] py-0 bg-purple-50 text-purple-700 border-purple-200">
                          Wallet
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Wallet disponible:{" "}
                        <strong className="text-purple-700 font-bold">
                          $
                          {Number(selectedClient?.wallet || 0).toLocaleString(
                            "es-MX",
                            { minimumFractionDigits: 2 }
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalle según método de pago */}
              {paymentMethod === "credito" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                  {Number(selectedClient?.tiene_credito_consolidado) !== 1 ? (
                    <div className="text-amber-700 flex items-center gap-1.5 font-medium text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      Este cliente no tiene una línea de crédito consolidada autorizada. Por favor utiliza Saldo a Favor / Wallet.
                    </div>
                  ) : Number(selectedClient?.saldo || 0) < precioVenta ? (
                    <div className="text-amber-700 flex items-center gap-1.5 font-medium text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      Saldo de crédito insuficiente para cubrir el precio de venta de esta reserva ($
                      {Number(selectedClient?.saldo || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      disponible vs. ${precioVenta.toLocaleString("es-MX", { minimumFractionDigits: 2 })} requerido).
                    </div>
                  ) : (
                    <div className="text-slate-600 text-xs">
                      ✓ El cliente cuenta con crédito suficiente. El monto de venta de $
                      {precioVenta.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      se descontará automáticamente de su saldo de crédito en MIA.
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "wallet" && (
                <div className="space-y-3 p-3.5 bg-purple-50/40 border border-purple-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
                    <div>
                      <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                        <Wallet className="h-4 w-4 text-purple-600" />
                        Saldos a Favor / Wallet del Cliente
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Total acumulado disponible:{" "}
                        <strong className="text-purple-800">
                          $
                          {agentSaldos
                            .reduce((sum, s) => sum + Number(s.saldo || 0), 0)
                            .toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
                          MXN
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => autoCoverWithSaldos(agentSaldos, precioVenta)}
                        className="h-7 text-xs bg-white text-purple-700 border-purple-200 hover:bg-purple-100/50"
                      >
                        Auto-cubrir total
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={clearAllSaldos}
                        className="h-7 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>

                  {/* Estado de cobertura */}
                  <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-white rounded border border-purple-100">
                    <span className="text-slate-600 font-medium">Total aplicado de Wallet:</span>
                    <div className="flex items-center gap-2">
                      <strong
                        className={`text-sm font-bold ${
                          totalSaldosAplicados >= precioVenta
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        ${totalSaldosAplicados.toFixed(2)} / ${precioVenta.toFixed(2)} MXN
                      </strong>
                      {totalSaldosAplicados >= precioVenta ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] py-0">
                          Cubierto 100%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] py-0">
                          Faltan ${(precioVenta - totalSaldosAplicados).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {loadingSaldos ? (
                    <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      Consultando saldos a favor del cliente...
                    </div>
                  ) : agentSaldos.length === 0 ? (
                    <div className="py-3 px-3 bg-white border border-dashed border-amber-300 rounded-md text-center text-xs text-amber-800">
                      Este cliente no tiene ningún saldo a favor activo registrado en el sistema.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {agentSaldos.map((saldo) => {
                        const currentApplied = appliedSaldos[saldo.id_saldos] || 0;
                        const available = Number(saldo.saldo || 0);

                        return (
                          <div
                            key={saldo.id_saldos}
                            className={`p-2 rounded border transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              currentApplied > 0
                                ? "bg-white border-purple-300 shadow-sm"
                                : "bg-white/80 border-slate-200"
                            }`}
                          >
                            <div className="truncate flex-1">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <span className="text-purple-700">#{saldo.id_saldos}</span>
                                <span>-</span>
                                <span className="uppercase">{saldo.metodo_pago}</span>
                                {saldo.concepto && (
                                  <span className="text-slate-500 font-normal truncate max-w-xs">
                                    ({saldo.concepto})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Disponible:{" "}
                                <strong className="text-slate-700">
                                  ${available.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {saldo.currency}
                                </strong>
                                {saldo.fecha_pago && (
                                  <span className="ml-2 text-slate-400">
                                    • {saldo.fecha_pago.slice(0, 10)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const alreadyCoveredWithoutThis = totalSaldosAplicados - currentApplied;
                                  const stillNeeded = Math.max(0, precioVenta - alreadyCoveredWithoutThis);
                                  const toApply = Math.min(available, stillNeeded);
                                  setAppliedSaldos((prev) => ({
                                    ...prev,
                                    [saldo.id_saldos]: parseFloat(toApply.toFixed(2)),
                                  }));
                                }}
                                className="text-[10px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-1 rounded"
                                title="Aplicar lo necesario de este saldo"
                              >
                                Usar saldo
                              </button>
                              <span className="text-[11px] text-slate-500">Monto:</span>
                              <div className="relative">
                                <span className="absolute left-2 top-1 text-[11px] font-medium text-slate-400">$</span>
                                <Input
                                  type="number"
                                  min={0}
                                  max={available}
                                  step="any"
                                  value={currentApplied === 0 ? "" : currentApplied}
                                  placeholder="0.00"
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setAppliedSaldos((prev) => ({
                                      ...prev,
                                      [saldo.id_saldos]: Math.min(val, available),
                                    }));
                                  }}
                                  className="w-24 h-7 pl-5 pr-1 text-xs text-right font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Comentarios Internos */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Comentarios / Notas internas de la reserva (opcional):
                </label>
                <Input
                  placeholder="Ej. Solicitado por WhatsApp para reunión urgente..."
                  value={reservationComments}
                  onChange={(e) => setReservationComments(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={submittingReservation}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmReservation}
                  disabled={
                    submittingReservation ||
                    precioVenta <= 0 ||
                    (paymentMethod === "credito" &&
                      (Number(selectedClient?.saldo || 0) < precioVenta ||
                        Number(selectedClient?.tiene_credito_consolidado) !== 1)) ||
                    (paymentMethod === "wallet" &&
                      totalSaldosAplicados < precioVenta)
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-8 text-xs"
                >
                  {submittingReservation ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creando reserva en MIA...
                    </>
                  ) : (
                    "Confirmar y Crear Reserva en MIA"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
