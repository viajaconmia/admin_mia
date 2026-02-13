"use client";

import React, { useEffect, useReducer, useState, useMemo, useRef } from "react";
import {
  CreditCard,
  FileText,
  Send,
  Download,
  QrCode,
  File,
  Link,
  ArrowLeftRight,
  Ticket,
  X,
} from "lucide-react";
import {
  generateSecureQRPaymentPDF,
  generateSecureToken,
  type QRPaymentData,
} from "@/lib/qr-generator";
import { Button } from "@/components/ui/button";
import {
  CheckboxInput,
  DateInput,
  DropdownValues,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "../../atom/Input";
import ReservationDetails from "./ReservationDetails";
import { useFetchCards, useFetchTitulares } from "@/hooks/useFetchCard";
import { paymentReducer, getInitialState } from "./reducer";
import { fetchCreateSolicitud } from "@/services/pago_proveedor";
import { Reserva, type ReservaHandle } from "./cupon";
import { BookingAll } from "@/services/BookingService";
import { updateRoom } from "@/lib/utils";

type PaymentStatus =
  | "pagada"
  | "enviada_para_cobro"
  | "pago_tdc"
  | "pendiente"
  | "spei_solicitado"
  | "cupon_enviado";

function computePaymentStatus(opts: {
  paymentType: "prepaid" | "credit";
  paymentMethod?: "transfer" | "card" | "link";
  useQR?: "qr" | "code";
}): PaymentStatus {
  const { paymentType, paymentMethod, useQR } = opts;

  if (paymentType === "credit") return "cupon_enviado";

  if (paymentMethod === "link") return "pagada";
  if (paymentMethod === "transfer") return "spei_solicitado";
  if (paymentMethod === "card") {
    if (useQR === "qr") return "enviada_para_cobro";
    return "pago_tdc"; // code/archivo
  }

  return "pendiente";
}

/** ===== Calendario de pagos ===== */
type PaymentScheduleRow = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number | ""; // permite vacío mientras escriben
};

function safeUUID() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function to2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const PaymentModal = ({ reservation }: { reservation: BookingAll | null }) => {
  const reservaRef = useRef<ReservaHandle>(null);

  const { data, fetchData } = useFetchCards();
  const { data: titularesData, fetchTitulares } = useFetchTitulares();

  const [isReservaOpen, setIsReservaOpen] = useState(false);

  const [state, dispatch] = useReducer(paymentReducer, reservation, getInitialState);

  const {
    hasFavorBalance,
    error,
    isSecureCode,
    favorBalance,
    paymentType,
    paymentMethod,
    date,
    selectedCard,
    useQR,
    comments,
    emails,
    cargo,
    document,
  } = state;

  const [commentsCxp, setCommentsCxp] = useState<string>("");
  const [selectedTitularId, setSelectedTitularId] = useState<string>("");

  if (!reservation) return null;

  // =========================================================
  // ✅ Markup: costo_total (costo proveedor) vs total (vendido)
  // =========================================================
  const costoProveedor = Number((reservation as any).costo_total) || 0; // lo que te costó
  const totalVendido = Number((reservation as any).total) || 0;         // por lo que lo vendiste

  const balanceToApply = parseFloat(String(favorBalance ?? "")) || 0;

  // ✅ monto a pagar al proveedor: costo - saldo a favor
  const monto_a_pagar = to2(Math.max(0, costoProveedor - balanceToApply));

  const todayISO = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  /** ====== Calendario (solo card/link) ====== */
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleRow[]>(() => [
    {
      id: safeUUID(),
      date: (date as string) || todayISO,
      amount: monto_a_pagar || 0,
    },
  ]);

  // Si cambia el monto (saldo a favor, etc) y el schedule tiene 1 fila, lo sincronizamos
  useEffect(() => {
    setPaymentSchedule((rows) => {
      if (rows.length !== 1) return rows;
      return [
        {
          ...rows[0],
          date: rows[0].date || (date as string) || todayISO,
          amount: monto_a_pagar,
        },
      ];
    });
  }, [monto_a_pagar, date, todayISO]);

  const scheduleTotal = useMemo(() => {
    return to2(
      paymentSchedule.reduce((acc, r) => {
        const n = r.amount === "" ? 0 : Number(r.amount);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0)
    );
  }, [paymentSchedule]);

  const shouldShowSchedule =
    paymentType === "prepaid" && (paymentMethod === "card" || paymentMethod === "link");

  const addScheduleRow = () => {
    setPaymentSchedule((rows) => [...rows, { id: safeUUID(), date: "", amount: "" }]);
  };

  const removeScheduleRow = (id: string) => {
    setPaymentSchedule((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)));
  };

  const updateScheduleRow = (id: string, patch: Partial<PaymentScheduleRow>, rowIndex?: number) => {
    setPaymentSchedule((rows) =>
      rows.map((r, idx) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if (rowIndex === 0 && typeof patch.date === "string") {
          dispatch({ type: "SET_FIELD", field: "date", payload: patch.date });
        }
        return next;
      })
    );
  };

  const validateAndBuildSchedulePayload = () => {
    const normalized = paymentSchedule.map((r) => ({
      fecha_pago: (r.date || "").trim(),
      monto: r.amount === "" ? NaN : Number(r.amount),
    }));

    if (normalized.some((r) => !r.fecha_pago)) {
      throw new Error("Falta capturar la fecha en una o más filas del calendario de pagos.");
    }
    if (normalized.some((r) => !Number.isFinite(r.monto) || r.monto <= 0)) {
      throw new Error("Todos los montos del calendario de pagos deben ser mayores a 0.");
    }

    const sum = to2(normalized.reduce((acc, r) => acc + (r.monto || 0), 0));
    if (Math.abs(sum - monto_a_pagar) > 0.01) {
      throw new Error(
        `La suma del calendario de pagos (${sum.toFixed(
          2
        )}) debe ser igual al monto a pagar (${monto_a_pagar.toFixed(2)}).`
      );
    }

    return normalized;
  };

  /** ===== Tarjetas ===== */
  const creditCards = Array.isArray(data)
    ? data.map((card: any) => ({
        ...card,
        name: `${card.alias} -**** **** **** ${card.ultimos_4}`,
        type: card.banco_emisor,
      }))
    : [];

  const currentSelectedCard = creditCards.find((card: any) => String(card.id) === String(selectedCard));

  const selectFiles = creditCards.map((card: any) => ({
    label: card.nombre_titular,
    value: card.url_identificacion,
    item: card,
  }));

  useEffect(() => {
    fetchData();
    fetchTitulares();
  }, [fetchData, fetchTitulares]);

  /** ===== Titulares ===== */
  const currentTitular = Array.isArray(titularesData)
    ? titularesData.find((t: any) => String(t.idTitular) === String(selectedTitularId))
    : null;

  const mappedReservation = useMemo(() => {
    if (!reservation) return null;
    return {
      codigo_confirmacion: reservation.codigo_confirmacion ?? "SIN-CODIGO",
      huesped: (reservation as any).viajero ?? "",
      hotel: (reservation as any).proveedor ?? "",
      direccion: "",
      acompañantes: "",
      incluye_desayuno: 0,
      check_in: reservation.check_in ?? "",
      check_out: reservation.check_out ?? "",
      room: (reservation as any).tipo_cuarto_vuelo ?? "",
      comentarios: (reservation as any).comments ?? "",
    };
  }, [reservation]);

  const handleDownloadCoupon = async () => {
    await reservaRef.current?.download();
  };

  const handleSendCoupon = async () => {
    try {
      if (!emails) throw new Error("Agrega al menos un correo.");
      const list = emails.split(",").map((e) => e.trim()).filter(Boolean);
      if (list.length === 0) throw new Error("Formato de correos inválido.");

      const blob = await reservaRef.current?.getPdfBlob();
      if (!blob) throw new Error("No se pudo generar el PDF.");

      const fd = new FormData();
      fd.append("emails", JSON.stringify(list));
      fd.append("subject", `Cupón de reservación ${mappedReservation?.codigo_confirmacion ?? ""}`);
      fd.append("message", comments || "Adjuntamos su cupón de reservación en PDF.");
      fd.append(
        "file",
        new File([blob], `cupon-${mappedReservation?.codigo_confirmacion ?? "reserva"}.pdf`, {
          type: "application/pdf",
        })
      );

      const resp = await fetch("/api/send-coupon", { method: "POST", body: fd });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || "Error al enviar el correo.");
      }

      alert("Cupón enviado correctamente.");
    } catch (err: any) {
      alert(err?.message || "Error al enviar el cupón.");
      console.error(err);
    }
  };

  const generatePaymentPDF = async () => {
    // ✅ genera PDF tanto para qr como para code (archivo)
    if (!document) throw new Error("Falta seleccionar el documento que aparecerá");
    if (!currentSelectedCard) throw new Error("Falta seleccionar tarjeta");
    if (!useQR) throw new Error("Selecciona si es Con QR o En archivo");

    const secureToken = generateSecureToken(
      reservation.codigo_confirmacion.replaceAll("-", "."),
      monto_a_pagar,
      currentSelectedCard.id,
      isSecureCode
    );

    const qrData: QRPaymentData = {
      isSecureCode,
      cargo,
      type: useQR, // "qr" | "code"
      secureToken,
      logoUrl: "https://luiscastaneda-tos.github.io/log/files/nokt.png",
      empresa: {
        codigoPostal: "11570",
        direccion:
          "Presidente Masaryk #29, Interior P-4, CDMX, colonia: Chapultepec Morales, Alcaldía: Miguel Hidalgo",
        nombre: "noktos",
        razonSocial: "Noktos Alianza S.A. de C.V.",
        rfc: "NAL190807BU2",
      },
      bancoEmisor: currentSelectedCard.banco_emisor,
      fechaExpiracion: currentSelectedCard.fecha_vencimiento,
      nombreTarjeta: currentSelectedCard.nombre_titular,
      numeroTarjeta: currentSelectedCard.numero_completo,
      documento: document,
      cvv: currentSelectedCard.cvv,
      reservations: [
        {
          checkIn: reservation.check_in.split("T")[0],
          checkOut: reservation.check_out.split("T")[0],
          reservacionId: reservation.codigo_confirmacion,
          monto: costoProveedor, // ✅ el costo proveedor tiene más sentido aquí
          nombre: (reservation as any).viajero,
          tipoHabitacion: updateRoom((reservation as any).tipo_cuarto_vuelo),
        },
      ],
      codigoDocumento: "xxxx",
      currency: "MXN",
    };

    const pdf = await generateSecureQRPaymentPDF(qrData);
    pdf.save(`pago-proveedor-${reservation.codigo_confirmacion}.pdf`);
  };

  const handlePayment = async () => {
    try {
      const derivedStatus: PaymentStatus = computePaymentStatus({
        paymentType,
        paymentMethod,
        useQR,
      });

      dispatch({ type: "SET_FIELD", field: "paymentStatus", payload: derivedStatus });

      let paymentSchedulePayload: Array<{ fecha_pago: string; monto: number }> | undefined;
      let effectiveDate = (date as string) || todayISO;

      if (paymentType === "prepaid") {
        if (paymentMethod === "card" || paymentMethod === "link") {
          paymentSchedulePayload = validateAndBuildSchedulePayload();
          effectiveDate = paymentSchedulePayload[0]?.fecha_pago || effectiveDate;
        } else if (paymentMethod === "transfer") {
          if (!effectiveDate) throw new Error("Selecciona la fecha de pago.");
          paymentSchedulePayload = [{ fecha_pago: effectiveDate, monto: monto_a_pagar }];
        }
      }

      // ----- Crédito -----
      // ----- Crédito -----
if (paymentType === "credit") {
  if (!reservation) throw new Error("No hay reservación.");

  // Si quieres obligar comentarios o correos en crédito, valida aquí.
  // Ejemplo: if (!comments) throw new Error("Agrega comentarios.");

  // OJO: derivedStatus ya será "cupon_enviado" por computePaymentStatus()
  fetchCreateSolicitud(
    {
      date: effectiveDate,
      comments,
      comments_cxp: commentsCxp,
      paymentMethod: "transfer", // o null; depende de tu backend.
      paymentType: "credit",
      monto_a_pagar, // si en crédito NO quieres monto, puedes mandar 0 o el costoProveedor; depende tu regla.
      id_hospedaje: reservation.id_booking,
      paymentStatus: derivedStatus,
      paymentSchedule: undefined, // crédito no usa schedule normalmente
      usuario_creador: (reservation as any).usuario_creador,

      // si tu backend espera estos campos aunque sea crédito:
      selectedCard: null,
      idTitular: null,
      titular: "",
      identificacion: "",
    },
    (response: any) => {
      // si tu servicio manda mensaje
      if (response?.message) alert(response.message);
    }
  );

  dispatch({ type: "SET_FIELD", field: "error", payload: "" });
  return;
}


      // ----- Prepago -----
      if (paymentType === "prepaid") {
        if (
          !reservation ||
          ((paymentMethod === "card" || paymentMethod === "link") && !currentSelectedCard) ||
          (paymentMethod === "card" && !useQR)
        ) {
          throw new Error(
            "Hay un error en la reservación, en la tarjeta o en la forma de mandar los datos, verifica que los datos estén completos."
          );
        }

        if (paymentMethod === "link" && !selectedTitularId) {
          throw new Error("Selecciona el titular para generar el link.");
        }

        if (paymentMethod === "link" || paymentMethod === "card") {
          fetchCreateSolicitud(
            {
              selectedCard,
              date: effectiveDate,
              comments,
              comments_cxp: commentsCxp,
              paymentMethod,
              paymentType,
              monto_a_pagar,
              id_hospedaje: reservation.id_booking,
              paymentStatus: derivedStatus,
              paymentSchedule: paymentSchedulePayload,
              usuario_creador: (reservation as any).usuario_creador,

              idTitular: paymentMethod === "link" ? Number(selectedTitularId) : null,
              titular: paymentMethod === "link" ? currentTitular?.Titular ?? "" : "",
              identificacion: paymentMethod === "link" ? currentTitular?.identificacion ?? "" : "",
            },
            (_response: any) => {}
          );

          // ✅ ARREGLO: generar PDF tanto para QR como para Archivo
          // (si quieres solo cuando es tarjeta, lo limitamos a paymentMethod === "card")
          if (paymentMethod === "card") {
            await generatePaymentPDF();
          }
        } else if (paymentMethod === "transfer") {
          fetchCreateSolicitud(
            {
              date: effectiveDate,
              comments,
              comments_cxp: commentsCxp,
              paymentMethod,
              paymentType,
              monto_a_pagar,
              id_hospedaje: reservation.id_booking,
              paymentStatus: derivedStatus,
              paymentSchedule: paymentSchedulePayload,
              usuario_creador: (reservation as any).usuario_creador,
            },
            (response: any) => {
              alert(response.message);
            }
          );
        }
      }

      dispatch({ type: "SET_FIELD", field: "error", payload: "" });
    } catch (err: any) {
      dispatch({ type: "SET_FIELD", field: "error", payload: err?.message || "Error" });
    }
  };

  const handleConfirmCredit = async () => {
    // ✅ botón dedicado para crédito (usa la misma lógica handlePayment)
    await handlePayment();
  };

  return (
    <div className="max-w-[85vw] w-screen p-2 pt-0 max-h-[90vh] grid grid-cols-2">
      <div
        className={`top-0 col-span-2 z-10 p-4 rounded-md border border-red-300 bg-red-50 text-red-700 shadow-md flex items-start gap-3 transform transition-all duration-300 ease-out ${
          error ? "opacity-100 scale-100 sticky" : "opacity-0 scale-10 pointer-events-none absolute"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 0114.14 0M4.93 19.07a10 10 0 010-14.14M19.07 19.07a10 10 0 000-14.14" />
        </svg>
        <p className="text-sm font-medium">{error}</p>
      </div>

      {/* ===== LEFT ===== */}
      <div className="px-4 border-r">
        <ReservationDetails reservation={reservation} />

      </div>

      {/* ===== RIGHT ===== */}
      <div className="space-y-2 p-4">
        <h2 className="text-lg font-semibold">Forma de Pago</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={paymentType === "prepaid" ? "default" : "outline"}
              onClick={() => dispatch({ type: "SET_FIELD", field: "paymentType", payload: "prepaid" })}
              className="h-10"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Prepago
            </Button>

            <Button
              variant={paymentType === "credit" ? "default" : "outline"}
              onClick={() => dispatch({ type: "SET_FIELD", field: "paymentType", payload: "credit" })}
              className="h-10"
            >
              <FileText className="mr-2 h-5 w-5" />
              Crédito
            </Button>
          </div>
        </div>

        {/* ===== PREPAGO ===== */}
        {paymentType === "prepaid" && (
          <div className="space-y-4">
            <h5 className="text-sm font-semibold">Método de Pago</h5>

            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={paymentMethod === "transfer" ? "default" : "outline"}
                onClick={() => {
                  dispatch({ type: "SET_FIELD", field: "paymentMethod", payload: "transfer" });
                  setSelectedTitularId("");
                }}
              >
                <ArrowLeftRight className="w-3 h-3 mr-2" />
                Transferencia
              </Button>

              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => {
                  dispatch({ type: "SET_FIELD", field: "paymentMethod", payload: "card" });
                  setSelectedTitularId("");
                }}
              >
                <CreditCard className="w-3 h-3 mr-2" />
                Tarjeta
              </Button>

              <Button
                variant={paymentMethod === "link" ? "default" : "outline"}
                onClick={() => {
                  dispatch({ type: "SET_FIELD", field: "paymentMethod", payload: "link" });
                  setSelectedTitularId("");
                }}
              >
                <Link className="w-3 h-3 mr-2" />
                Link
              </Button>
            </div>

            {paymentMethod === "card" && (
              <>
                <div>
                  <h5 className="text-sm font-semibold">Datos de Pago</h5>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Button
                      variant={useQR === "qr" ? "default" : "outline"}
                      onClick={() => dispatch({ type: "SET_FIELD", field: "useQR", payload: "qr" })}
                      size="sm"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Con QR
                    </Button>

                    <Button
                      variant={useQR === "code" ? "default" : "outline"}
                      onClick={() => dispatch({ type: "SET_FIELD", field: "useQR", payload: "code" })}
                      size="sm"
                    >
                      <File className="mr-2 h-4 w-4" />
                      En archivo
                    </Button>
                  </div>
                </div>

                <CheckboxInput
                  label={"Mostrar cvv"}
                  checked={isSecureCode}
                  onChange={(value) => dispatch({ type: "SET_FIELD", field: "isSecureCode", payload: value })}
                />

                <DropdownValues
                  label="Documento"
                  value={document}
                  onChange={(value: { value: string; label: string; item: any } | null) => {
                    if (!value) return;
                    dispatch({ type: "SET_FIELD", field: "document", payload: value.value });
                  }}
                  options={selectFiles}
                />

                <TextInput
                  onChange={(value) => dispatch({ type: "SET_FIELD", field: "cargo", payload: value })}
                  value={cargo || ""}
                  label="Tipo de cargo"
                  placeholder="RENTA HABITACIÓN..."
                />
              </>
            )}

            {(paymentMethod === "card" || paymentMethod === "link") && (
              <div className="space-y-4">
                <DropdownValues
                  onChange={(value: any) => {
                    dispatch({ type: "SET_FIELD", field: "selectedCard", payload: value?.item?.id ?? "" });
                  }}
                  value={selectedCard || ""}
                  options={creditCards.map((item: any) => ({ value: item.id, label: item.name, item }))}
                  label="Seleccionar tarjeta"
                />
              </div>
            )}

            {paymentMethod === "link" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Seleccionar titular</label>

                <select
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTitularId}
                  onChange={(e) => setSelectedTitularId(e.target.value)}
                >
                  <option value="">-- Selecciona un titular --</option>
                  {Array.isArray(titularesData) &&
                    titularesData.map((t: any) => (
                      <option key={t.idTitular} value={String(t.idTitular)}>
                        {t.Titular}
                      </option>
                    ))}
                </select>

                {currentTitular?.identificacion && (
                  <a href={currentTitular.identificacion} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                    Ver identificación del titular
                  </a>
                )}
              </div>
            )}

            <TextAreaInput
              onChange={(value) => dispatch({ type: "SET_FIELD", field: "comments", payload: value })}
              placeholder="Agregar comentarios sobre el pago..."
              value={comments || ""}
              label="Comentarios"
            />

            <TextAreaInput
              onChange={(value) => setCommentsCxp(value)}
              placeholder="Agregar comentarios para CXP..."
              value={commentsCxp}
              label="Comentarios CXP"
            />

            <Button onClick={handlePayment} className="w-full bg-blue-600 hover:bg-blue-700">
              Confirmar pago
            </Button>
          </div>
        )}

        {/* ===== CRÉDITO ===== */}
        {paymentType === "credit" && (
          <div className="space-y-2">
            <TextAreaInput
              onChange={(value) => dispatch({ type: "SET_FIELD", field: "emails", payload: value })}
              placeholder="correo1@ejemplo.com, correo2@ejemplo.com"
              value={emails || ""}
              label="Correos Electronicos (separados por comas)"
            />

            <div className="grid grid-cols-3 gap-4">
              <Button onClick={handleDownloadCoupon} variant="outline" className="bg-green-50 border-green-200">
                <Download className="mr-2 h-4 w-4" />
                Descargar Cupón
              </Button>

              <Button
                onClick={() => setIsReservaOpen(true)}
                disabled={!mappedReservation}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                title={!mappedReservation ? "No hay datos de reservación aún" : "Abrir cupón / resumen"}
              >
                <Ticket className="mr-2 h-4 w-4" />
                Ver Cupón / Resumen
              </Button>

              <Button onClick={handleSendCoupon} className="bg-blue-600 hover:bg-blue-700">
                <Send className="mr-2 h-4 w-4" />
                Enviar Cupón (PDF)
              </Button>
            </div>

            <TextAreaInput
              onChange={(value) => dispatch({ type: "SET_FIELD", field: "comments", payload: value })}
              placeholder="Comentarios sobre el crédito..."
              value={comments || ""}
              label="Comentarios"
            />

            <TextAreaInput
              onChange={(value) => setCommentsCxp(value)}
              placeholder="Comentarios para CXP..."
              value={commentsCxp}
              label="Comentarios CXP"
            />

            {/* ✅ BOTÓN QUE FALTABA PARA CRÉDITO */}
            <Button onClick={handleConfirmCredit} className="w-full bg-blue-600 hover:bg-blue-700">
              Confirmar crédito
            </Button>

            <Reserva isOpen={isReservaOpen} onClose={() => setIsReservaOpen(false)} reservation={mappedReservation} />
          </div>
        )}
      </div>

      {/* Instancia oculta SOLO para generar/descargar/enviar el PDF */}
      <Reserva ref={reservaRef} isOpen={false} onClose={() => {}} reservation={mappedReservation} mountHidden />
    </div>
  );
};
