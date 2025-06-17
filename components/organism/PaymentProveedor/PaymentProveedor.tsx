import { useEffect, useState } from "react";
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
import { CreditCardInfo, Solicitud } from "@/types";
import { updateRoom } from "@/lib/utils";
import ReservationDetails from "./ReservationDetails";
import { useFetchCards } from "@/hooks/useFetchCard";

export const PaymentModal = ({
  reservation,
}: {
  reservation: Solicitud | null;
}) => {
  const { data, fetchData } = useFetchCards();
  const [hasFavorBalance, setHasFavorBalance] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSecureCode, setIsSecureCode] = useState(false);
  const [favorBalance, setFavorBalance] = useState("");
  const [paymentType, setPaymentType] = useState<"prepaid" | "credit" | "">("");
  const [paymentMethod, setPaymentMethod] = useState<
    "transfer" | "card" | "link" | ""
  >("");
  const [date, setDate] = useState(reservation.check_in.split("T")[0]);
  const [selectedCard, setSelectedCard] = useState<CreditCardInfo | null>(null);
  const [useQR, setUseQR] = useState<"qr" | "code" | "">("");
  const [comments, setComments] = useState("");
  const [emails, setEmails] = useState("");
  const [cargo, setCargo] = useState("RENTA HABITACIÓN");

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

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayment = async () => {
    if ((paymentMethod == "card" || paymentMethod == "link") && !selectedCard) {
      setError("Falta escoger la tarjeta");
    } else {
      setError("");
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

    console.log("Procesando pago:", {
      reservation: reservation.codigo_reservacion_hotel,
      amountToPay,
      paymentType,
      paymentMethod,
      selectedCard,
      useQR,
      comments,
      date,
    });
  };

  // Versión Nueva
  const generateQRPaymentPDF = async () => {
    if (!reservation || !selectedCard) return;

    // 1. Genera un token de seguridad
    const secureToken = generateSecureToken(
      reservation.codigo_reservacion_hotel.replaceAll("-", "."),
      amountToPay,
      selectedCard.id,
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
      bancoEmisor: selectedCard.banco_emisor,
      fechaExpiracion: selectedCard.fecha_vencimiento, //Cambiar por los datos de la tarjeta en un futuro
      nombreTarjeta: selectedCard.nombre_titular,
      numeroTarjeta: selectedCard.numero_completo,
      cvv: selectedCard.cvv,
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
            onChange={(checked) => setHasFavorBalance(checked === true)}
            label="Tiene saldo a favor"
          />

          {hasFavorBalance && (
            <>
              <NumberInput
                onChange={(value) => setFavorBalance(value)}
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
            onChange={(value) => setDate(value)}
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
              onClick={() => setPaymentType("prepaid")}
              className="h-10"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Prepago
            </Button>
            <Button
              variant={paymentType === "credit" ? "default" : "outline"}
              onClick={() => setPaymentType("credit")}
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
                onClick={() => setPaymentMethod("transfer")}
              >
                <ArrowLeftRight className="w-3 h-3 mr-2"></ArrowLeftRight>
                Transferencia
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="w-3 h-3 mr-2"></CreditCard>
                Tarjeta
              </Button>
              <Button
                variant={paymentMethod === "link" ? "default" : "outline"}
                onClick={() => setPaymentMethod("link")}
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
                      onClick={() => setUseQR("qr")}
                      size="sm"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Con QR
                    </Button>
                    <Button
                      variant={useQR === "code" ? "default" : "outline"}
                      onClick={() => setUseQR("code")}
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
                  onChange={(value) => setIsSecureCode(value)}
                ></CheckboxInput>
                <TextInput
                  onChange={(value) => setCargo(value)}
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
                      setSelectedCard(value.item);
                    }}
                    value={selectedCard?.id || ""}
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
              onChange={(value) => setComments(value)}
              placeholder="Agregar comentarios sobre el pago..."
              value={comments || ""}
              label="Comentarios"
            />

            <Button
              onClick={handlePayment}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="mr-2 h-4 w-4" />
              {paymentMethod === "transfer" ? "Solicitar Pago" : "Enviar Pago"}
            </Button>
          </div>
        )}

        {/* Crédito */}
        {paymentType === "credit" && (
          <div className="space-y-2">
            <TextAreaInput
              onChange={(value) => setEmails(value)}
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
              onChange={(value) => setComments(value)}
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
