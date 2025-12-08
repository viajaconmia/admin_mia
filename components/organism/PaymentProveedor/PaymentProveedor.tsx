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
import { Solicitud, Solicitud2 } from "@/types";
import { updateRoom } from "@/lib/utils";
import ReservationDetails from "./ReservationDetails";
import { useFetchCards } from "@/hooks/useFetchCard";
import { paymentReducer, getInitialState } from "./reducer";
import { Card } from "@/components/ui/card";
import { fetchCreateSolicitud } from "@/services/pago_proveedor";
import { Reserva, type ReservaHandle } from "./cupon";

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
  useQR?: "qr" | "code"; // en tu UI: "Con QR" => "qr", "En archivo" => "code"
}): PaymentStatus {
  const { paymentType, paymentMethod, useQR } = opts;

  // Crédito -> cupón enviado
  if (paymentType === "credit") return "cupon enviado";

  // Prepago:
  if (paymentMethod === "link") return "pagada";
  if (paymentMethod === "transfer") return "spei solicitado";
  if (paymentMethod === "card") {
    // Con QR -> enviada para cobro
    if (useQR === "qr") return "enviada para cobro";
    // Pago con tarjeta (sin QR / en archivo) -> pago tdc
    return "pago tdc";
  }

  // Fallback seguro
  return "pendiente";
}

export const PaymentModal = ({ reservation }: { reservation: Solicitud2 | null; }) => {

  const reservaRef = useRef<ReservaHandle>(null);
  const { data, fetchData } = useFetchCards();
  const [isReservaOpen, setIsReservaOpen] = useState(false);
  const [state, dispatch] = useReducer(
    paymentReducer,
    reservation,
    getInitialState
  );

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
    paymentStatus, // 'pagado' | 'enviado' (string)
  } = state;


  if (!reservation) return null;

  const reservationTotal = Number(reservation.costo_total) || 0;
  const balanceToApply = parseFloat(favorBalance) || 0;
  const monto_a_pagar = reservationTotal - balanceToApply || 0;

  const creditCards = Array.isArray(data)
    ? data.map((card) => ({
      ...card,
      name: `${card.alias} -**** **** **** ${card.ultimos_4}`,
      type: card.banco_emisor,
    }))
    : [];

  const currentSelectedCard = creditCards.find(
    (card) => card.id === selectedCard
  );
  const selectFiles = creditCards.map((card) => ({
    label: card.nombre_titular,
    value: card.url_identificacion,
    item: card,
  }));

  useEffect(() => {
    fetchData();
  }, []);

  // const handlePayment = async () => {
  //   try {
  //     //Crea el de credito
  //     if (paymentType === "credit") {
  //       console.log({
  //         date,
  //         paymentType,
  //         monto_a_pagar,
  //         comments,
  //         id_hospedaje: reservation.id_hospedaje,
  //       });
  //     }
  //     //Maneja los de prepago
  //     if (paymentType === "prepaid") {
  //       //Maneja los errores
  //       if (
  //         !reservation ||
  //         ((paymentMethod == "card" || paymentMethod == "link") &&
  //           !currentSelectedCard) ||
  //         (paymentMethod == "card" && !useQR)
  //       ) {
  //         throw new Error(
  //           "Hay un error en la reservación, en la tarjeta o en la forma de mandar los datos, verifica que los datos esten completos"
  //         );
  //       }

  //       if (paymentMethod == "link" || paymentMethod == "card") {
  //         // 👇 Incluimos paymentStatus en el payload
  //         fetchCreateSolicitud(
  //           {
  //             selectedCard,
  //             date,
  //             comments,
  //             paymentMethod,
  //             paymentType,
  //             monto_a_pagar,
  //             id_hospedaje: reservation.id_hospedaje,
  //             paymentStatus,
  //           },
  //           (response) => { }
  //         );
  //         if (paymentMethod == "card") {
  //           await generateQRPaymentPDF();
  //         }
  //       } else if (paymentMethod == "transfer") {
  //         const obj = {
  //           date,
  //           comments,
  //           paymentMethod,
  //           paymentType,
  //           monto_a_pagar,
  //           id_hospedaje: reservation.id_hospedaje,
  //           paymentStatus, // <-- opcional también en transferencia
  //         };
  //         fetchCreateSolicitud(obj, (response) => {
  //           alert(response.message);
  //         });
  //       }
  //     }

  //     dispatch({ type: "SET_FIELD", field: "error", payload: "" });
  //   } catch (error: any) {
  //     dispatch({
  //       type: "SET_FIELD",
  //       field: "error",
  //       payload: error.message,
  //     });
  //   }
  // };

  // ====== Descargar cupón desde botón externo ======

  const handleDownloadCoupon = async () => {
    await reservaRef.current?.download();
  };

  const handleSendCoupon = async () => {
    try {
      if (!emails) throw new Error("Agrega al menos un correo.");
      const list = emails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      if (list.length === 0) throw new Error("Formato de correos inválido.");

      const blob = await reservaRef.current?.getPdfBlob();
      if (!blob) throw new Error("No se pudo generar el PDF.");

      // ⬇️ arma el payload como tu backend lo necesite
      const fd = new FormData();
      fd.append("emails", JSON.stringify(list));
      fd.append("subject", `Cupón de reservación ${mappedReservation?.codigo_confirmacion ?? ""}`);
      fd.append("message", comments || "Adjuntamos su cupón de reservación en PDF.");
      fd.append("file", new File([blob], `cupon-${mappedReservation?.codigo_confirmacion ?? "reserva"}.pdf`, { type: "application/pdf" }));

      // TODO: cambia la URL a tu endpoint real
      const resp = await fetch("/api/send-coupon", {
        method: "POST",
        body: fd,
      });

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

  const handlePayment = async () => {
    try {
      // Derivamos el status según lo elegido
      const derivedStatus: PaymentStatus = computePaymentStatus({
        paymentType,
        paymentMethod,
        useQR,
      });

      // (Opcional) reflejar en el estado para que el UI muestre el status actual
      dispatch({
        type: "SET_FIELD",
        field: "paymentStatus",
        payload: derivedStatus,
      });

      // ----- Crédito -----
      if (paymentType === "credit") {
        console.log({
          date,
          paymentType,
          monto_a_pagar,
          comments,
          id_hospedaje: reservation.id_hospedaje,
          paymentStatus: derivedStatus, // "cupon enviado"
        });
        // Aquí podrías disparar tu lógica de cupón (descargar/enviar)
        return;
      }

      // ----- Prepago -----
      if (paymentType === "prepaid") {
        // Validaciones
        if (
          !reservation ||
          ((paymentMethod === "card" || paymentMethod === "link") &&
            !currentSelectedCard) ||
          (paymentMethod === "card" && !useQR)
        ) {
          throw new Error(
            "Hay un error en la reservación, en la tarjeta o en la forma de mandar los datos, verifica que los datos esten completos"
          );
        }

        if (paymentMethod === "link" || paymentMethod === "card") {
          // Enviamos paymentStatus ya derivado
          fetchCreateSolicitud(
            {
              selectedCard,
              date,
              comments,
              paymentMethod,
              paymentType,
              monto_a_pagar,
              id_hospedaje: reservation.id_hospedaje,
              paymentStatus: derivedStatus,
            },
            (response) => { }
          );

          if (paymentMethod === "card" && useQR === "qr") {
            // Solo generamos QR si fue "Con QR"
            await generateQRPaymentPDF();
          }
        } else if (paymentMethod === "transfer") {
          const obj = {
            date,
            comments,
            paymentMethod,
            paymentType,
            monto_a_pagar,
            id_hospedaje: reservation.id_hospedaje,
            paymentStatus: derivedStatus, // "spei solicitado"
          };
          fetchCreateSolicitud(obj, (response) => {
            alert(response.message);
          });
        }
      }

      dispatch({ type: "SET_FIELD", field: "error", payload: "" });
    } catch (error: any) {
      dispatch({
        type: "SET_FIELD",
        field: "error",
        payload: error.message,
      });
    }
  };

  const generateQRPaymentPDF = async () => {
    if (!document) {
      throw new Error("Falta seleccionar el documento que aparecera");
    }
    const secureToken = generateSecureToken(
      reservation.codigo_reservacion_hotel.replaceAll("-", "."),
      monto_a_pagar,
      currentSelectedCard.id,
      isSecureCode
    );

    const qrData: QRPaymentData = {
      isSecureCode,
      cargo,
      type: useQR,
      secureToken: secureToken,
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
          reservacionId: reservation.codigo_reservacion_hotel,
          monto: Number(reservation.costo_total),
          nombre: reservation.nombre_viajero_reservacion,
          tipoHabitacion: updateRoom(reservation.tipo_cuarto),
        },
      ],
      codigoDocumento: "xxxx",
      currency: "MXN",
    };

    try {
      const pdf = await generateSecureQRPaymentPDF(qrData);
      pdf.save(`pago-proveedor-${reservation.codigo_reservacion_hotel}.pdf`);
    } catch (error) {
      console.error("Error generating QR PDF:", error);
    }
  };

  const mappedReservation = useMemo(() => {
    if (!reservation) return null;
    return {
      // Campos que usa tu UI de Reserva:
      codigo_confirmacion: reservation.codigo_reservacion_hotel ?? "SIN-CODIGO",
      huesped: reservation.nombre_viajero_reservacion ?? "",
      hotel: reservation.hotel ?? reservation.nombre_hotel ?? "",
      direccion: reservation.direccion ?? "",
      acompañantes: reservation.acompanantes ?? reservation.acompañantes ?? "",
      incluye_desayuno: reservation.incluye_desayuno ?? 0,
      check_in: reservation.check_in ?? "",
      check_out: reservation.check_out ?? "",
      room: reservation.tipo_cuarto ?? "",
      comentarios: reservation.comentarios ?? "",
      // Si tienes más campos visuales en Reserva, añádelos aquí.
    };
  }, [reservation]);

  console.log("reservas que trae", reservation)
  console.log("mqpeado que trae", mappedReservation)


  return (
    <div className="max-w-[85vw] w-screen p-2 pt-0 max-h-[90vh] grid grid-cols-2">
      <div
        className={`top-0 col-span-2 z-10 p-4 rounded-md border border-red-300 bg-red-50 text-red-700 shadow-md flex items-start gap-3 transform transition-all duration-300 ease-out ${error
          ? "opacity-100 scale-100 sticky"
          : "opacity-0 scale-10 pointer-events-none absolute"
          }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mt-0.5 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 0114.14 0M4.93 19.07a10 10 0 010-14.14M19.07 19.07a10 10 0 000-14.14"
          />
        </svg>
        <p className="text-sm font-medium">{error}</p>
      </div>

      <div className="px-4 border-r">
        <ReservationDetails reservation={reservation} />

        {/* Saldo a Favor */}
        <div className="space-y-2">
          <CheckboxInput
            checked={hasFavorBalance}
            onChange={(checked) =>
              dispatch({
                type: "SET_FIELD",
                field: "hasFavorBalance",
                payload: checked === true,
              })
            }
            label="Tiene saldo a favor"
          />

          {hasFavorBalance && (
            <>
              <NumberInput
                onChange={(value) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "favorBalance",
                    payload: value,
                  })
                }
                value={Number(favorBalance) || null}
                label="Monto Saldo a Favor a Aplicar"
                placeholder="0.00"
              />
              <div className="p-4 bg-green-50 border rounded-md border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 text-sm">
                    Monto a Pagar al Proveedor:
                  </span>
                  <span className="text-xl font-bold text-green-700">
                    ${monto_a_pagar.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
          <DateInput
            label="Fecha de pago"
            value={date}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", field: "date", payload: value })
            }
          />
        </div>
      </div>

      <div className="space-y-2 p-4">
        {/* Forma de Pago */}
        <h2 className="text-lg font-semibold">Forma de Pago</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={paymentType === "prepaid" ? "default" : "outline"}
              onClick={() =>
                dispatch({
                  type: "SET_FIELD",
                  field: "paymentType",
                  payload: "prepaid",
                })
              }
              className="h-10"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Prepago
            </Button>
            <Button
              variant={paymentType === "credit" ? "default" : "outline"}
              onClick={() =>
                dispatch({
                  type: "SET_FIELD",
                  field: "paymentType",
                  payload: "credit",
                })
              }
              className="h-10"
            >
              <FileText className="mr-2 h-5 w-5" />
              Crédito
            </Button>
          </div>
        </div>

        {/* Prepago */}
        {paymentType === "prepaid" && (
          <div className="space-y-4">
            <h5 className="text-sm font-semibold">Método de Pago</h5>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={paymentMethod === "transfer" ? "default" : "outline"}
                onClick={() =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "paymentMethod",
                    payload: "transfer",
                  })
                }
              >
                <ArrowLeftRight className="w-3 h-3 mr-2" />
                Transferencia
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "paymentMethod",
                    payload: "card",
                  })
                }
              >
                <CreditCard className="w-3 h-3 mr-2"></CreditCard>
                Tarjeta
              </Button>
              <Button
                variant={paymentMethod === "link" ? "default" : "outline"}
                onClick={() =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "paymentMethod",
                    payload: "link",
                  })
                }
              >
                <Link className="w-3 h-3 mr-2"></Link>
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
                      onClick={() =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "useQR",
                          payload: "qr",
                        })
                      }
                      size="sm"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Con QR
                    </Button>
                    <Button
                      variant={useQR === "code" ? "default" : "outline"}
                      onClick={() =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "useQR",
                          payload: "code",
                        })
                      }
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
                  onChange={(value) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "isSecureCode",
                      payload: value,
                    })
                  }
                />
                <DropdownValues
                  label="Documento"
                  value={document}
                  onChange={(
                    value: { value: string; label: string; item: any } | null
                  ) => {
                    dispatch({
                      type: "SET_FIELD",
                      field: "document",
                      payload: value.value,
                    });
                  }}
                  options={selectFiles}
                />
                <TextInput
                  onChange={(value) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "cargo",
                      payload: value,
                    })
                  }
                  value={cargo || ""}
                  label="Tipo de cargo"
                  placeholder="RENTA HABITACIÓN..."
                />
              </>
            )}
            {(paymentMethod === "card" || paymentMethod === "link") && (
              <div className="space-y-4">
                <div>
                  <DropdownValues
                    onChange={(value) => {
                      // Al seleccionar una tarjeta, guardamos solo el ID
                      dispatch({
                        type: "SET_FIELD",
                        field: "selectedCard",
                        payload: value.item.id,
                      });
                    }}
                    value={selectedCard || ""} // Usamos el ID para el valor
                    options={creditCards.map((item) => ({
                      value: item.id,
                      label: item.name,
                      item: item,
                    }))}
                    label="Seleccionar tarjeta"
                  />
                </div>
              </div>
            )}

            <TextAreaInput
              onChange={(value) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "comments",
                  payload: value,
                })
              }
              placeholder="Agregar comentarios sobre el pago..."
              value={comments || ""}
              label="Comentarios"
            />

            <Button
              onClick={handlePayment}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Confirmar pago
            </Button>
          </div>
        )}

        {/* Crédito */}
        {paymentType === "credit" && (
          <div className="space-y-2">
            <TextAreaInput
              onChange={(value) =>
                dispatch({ type: "SET_FIELD", field: "emails", payload: value })
              }
              placeholder="correo1@ejemplo.com, correo2@ejemplo.com"
              value={emails || ""}
              label="Correos Electronicos (separados por comas)"
            />

            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={handleDownloadCoupon}
                variant="outline"
                className="bg-green-50 border-green-200"
              >
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
              <Button
                onClick={handleSendCoupon}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar Cupón (PDF)
              </Button>
            </div>

            <TextAreaInput
              onChange={(value) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "comments",
                  payload: value,
                })
              }
              placeholder="Comentarios sobre el crédito..."
              value={comments || ""}
              label="Comentarios"
            />
            <Reserva
              isOpen={isReservaOpen}
              onClose={() => setIsReservaOpen(false)}
              reservation={mappedReservation}  // <-- aquí va el objeto directo
            />
          </div>
        )}
      </div>

      {/* Instancia oculta SOLO para generar/descargar/enviar el PDF */}
      <Reserva
        ref={reservaRef}
        isOpen={false}
        onClose={() => { }}
        reservation={mappedReservation}
        mountHidden
      />
    </div>

  );

};
