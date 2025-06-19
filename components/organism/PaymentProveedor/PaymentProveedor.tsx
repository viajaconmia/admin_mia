import { useEffect, useReducer } from "react"; // Importamos useReducer
import {
  CreditCard,
  FileText,
  Send,
  Download,
  QrCode,
  File,
  Link,
  ArrowLeftRight,
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
import { Solicitud } from "@/types";
import { updateRoom } from "@/lib/utils";
import ReservationDetails from "./ReservationDetails";
import { useFetchCards } from "@/hooks/useFetchCard";
import { paymentReducer, getInitialState } from "./reducer"; // Asegúrate de que la ruta sea correcta

export const PaymentModal = ({
  reservation,
}: {
  reservation: Solicitud | null;
}) => {
  const { data, fetchData } = useFetchCards();

  // 1. Inicializamos el estado con useReducer y la función getInitialState
  const [state, dispatch] = useReducer(
    paymentReducer,
    reservation,
    getInitialState
  );

  // Desestructuramos el estado para un acceso más fácil
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
  } = state;

  if (!reservation) return null;

  const reservationTotal = Number(reservation.costo_total) || 0;
  const balanceToApply = parseFloat(favorBalance) || 0;
  const amountToPay = reservationTotal - balanceToApply || 0;

  const creditCards = Array.isArray(data)
    ? data.map((card) => ({
        ...card,
        name: `${card.alias} -**** **** **** ${card.ultimos_4}`,
        type: card.banco_emisor,
      }))
    : [];

  // Encuentra la tarjeta seleccionada de la lista de tarjetas cargadas
  const currentSelectedCard = creditCards.find(
    (card) => card.id === selectedCard
  );

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayment = async () => {
    if ((paymentMethod == "card" || paymentMethod == "link") && !selectedCard) {
      // Usamos dispatch para actualizar el error
      dispatch({
        type: "SET_FIELD",
        field: "error",
        payload: "Falta escoger la tarjeta",
      });
    } else {
      dispatch({ type: "SET_FIELD", field: "error", payload: "" });
    }
    if (paymentType === "credit") {
      // Credit payment logic
      console.log("Processing credit payment");
    } else if (
      paymentType === "prepaid" &&
      (useQR === "qr" || useQR === "code")
    ) {
      // Generate QR PDF for secure payment
      await generateQRPaymentPDF();
    }

    console.log("Procesando pago: y vemos", {
      reservation: reservation.codigo_reservacion_hotel,
      amountToPay,
      paymentType,
      paymentMethod,
      selectedCard: currentSelectedCard, // Pasamos el objeto de la tarjeta
      useQR,
      comments,
      date,
    });
  };

  const generateQRPaymentPDF = async () => {
    if (!reservation || !currentSelectedCard) return; // Usamos currentSelectedCard

    // 1. Genera un token de seguridad
    const secureToken = generateSecureToken(
      reservation.codigo_reservacion_hotel.replaceAll("-", "."),
      amountToPay,
      currentSelectedCard.id, // Usamos el ID del objeto de la tarjeta
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
      cvv: currentSelectedCard.cvv,
      reservations: [
        {
          checkIn: reservation.check_in.split("T")[0],
          checkOut: reservation.check_out.split("T")[0],
          reservacionId: reservation.codigo_reservacion_hotel,
          monto: Number(reservation.costo_total),
          nombre: reservation.nombre_viajero_completo,
          tipoHabitacion: updateRoom(reservation.room),
        },
      ],
      codigoDocumento: "xxxx",
      currency: "MXN",
    };

    try {
      // 3. Llama a una utilidad externa para crear el PDF y lo descarga
      const pdf = await generateSecureQRPaymentPDF(qrData);
      pdf.save(`pago-proveedor-${reservation.codigo_reservacion_hotel}.pdf`);
    } catch (error) {
      console.error("Error generating QR PDF:", error);
    }
  };

  const handleSendCoupon = () => {
    console.log("Enviando cupón por email:", emails);
  };

  return (
    <div className="max-w-[85vw] w-screen p-2 pt-0 max-h-[90vh] grid grid-cols-2">
      {error && (
        <div className="col-span-2 text-red-500 text-sm p-4 border rounded-md border-red-300 bg-red-100">
          <p>{error}</p>
        </div>
      )}
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
                    ${amountToPay.toFixed(2)}
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
                <ArrowLeftRight className="w-3 h-3 mr-2"></ArrowLeftRight>
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
                ></CheckboxInput>
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

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="bg-green-50 border-green-200"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Cupón
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
          </div>
        )}
      </div>
    </div>
  );
};
