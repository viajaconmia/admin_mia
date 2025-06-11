import { useState } from "react";
import { CreditCard, FileText, Send, Download, QrCode } from "lucide-react";
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
} from "../atom/Input";
import { Solicitud } from "@/types";

interface PaymentModalProps {
  reservation: Solicitud | null;
}

export const PaymentModal = ({ reservation }: PaymentModalProps) => {
  const [hasFavorBalance, setHasFavorBalance] = useState(false);
  const [favorBalance, setFavorBalance] = useState("");
  const [paymentType, setPaymentType] = useState<"prepaid" | "credit" | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "card" | "">(
    ""
  );
  const [date, setDate] = useState(reservation.check_in.split("T")[0]);
  const [selectedCard, setSelectedCard] = useState("");
  const [useQR, setUseQR] = useState<"qr" | "code" | "">("");
  const [comments, setComments] = useState("");
  const [emails, setEmails] = useState("");

  if (!reservation) return null;

  const reservationTotal = Number(reservation.costo_total) || 0;
  const balanceToApply = parseFloat(favorBalance) || 0;
  const amountToPay = reservationTotal - balanceToApply || 0;

  const creditCards = [
    { id: "1", name: "BBVA Empresarial ****1234", type: "Visa" },
    { id: "2", name: "Santander Corporativa ****5678", type: "Mastercard" },
    { id: "3", name: "Banorte Business ****9012", type: "Visa" },
  ];

  const handlePayment = async () => {
    if (paymentType === "credit") {
      // Credit payment logic
      console.log("Processing credit payment");
    } else if (paymentType === "prepaid" && useQR === "qr") {
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
      Math.round(Math.random() * 999999),
      amountToPay,
      selectedCard
    );

    const qrData: QRPaymentData = {
      reservationId: Math.round(Math.random() * 999999),
      amount: amountToPay,
      currency: "MXN",
      hotelName: reservation.hotel,
      clientName: "Cliente Corporativo",
      cardType: selectedCard,
      secureToken: secureToken,
    };

    try {
      // 3. Llama a una utilidad externa para crear el PDF y lo descarga
      const pdf = await generateSecureQRPaymentPDF(qrData);
      pdf.save(
        `pago-qr-reservacion-${reservation.codigo_reservacion_hotel}.pdf`
      );
    } catch (error) {
      console.error("Error generating QR PDF:", error);
    }
  };

  const handleSendCoupon = () => {
    console.log("Enviando cupón por email:", emails);
  };

  return (
    <div className="max-w-[85vw] w-screen p-2 pt-0 max-h-[90vh] grid grid-cols-2">
      <div className="space-y-4 border-r p-4">
        <h2 className="text-lg font-semibold">Detalles de la reservación</h2>
        {/* Información de la Reserva */}
        <div className="p-2 rounded-md border bg-blue-50 border-blue-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-600">Reserva</p>
              <p className="text-base font-semibold text-slate-800">
                #{reservation.codigo_reservacion_hotel || ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Hotel</p>
              <p className="text-base font-semibold text-slate-800">
                {reservation.hotel || ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Viajero</p>
              <p className="text-base font-semibold text-slate-800">
                {reservation.nombre_viajero_completo || ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Total Reserva</p>
              <p className="text-lg font-bold text-blue-700">
                ${reservation.costo_total || ""}
              </p>
            </div>
          </div>
        </div>

        {/* Saldo a Favor */}
        <div className="space-y-4">
          <CheckboxInput
            checked={hasFavorBalance}
            onChange={(checked) => setHasFavorBalance(checked === true)}
            label="✅ Tiene Saldo a Favor"
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

      <div className="space-y-4 p-4">
        {/* Forma de Pago */}
        <h2 className="text-lg font-semibold">Forma de Pago</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={paymentType === "prepaid" ? "default" : "outline"}
              onClick={() => setPaymentType("prepaid")}
              className="h-12"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Prepago
            </Button>
            <Button
              variant={paymentType === "credit" ? "default" : "outline"}
              onClick={() => setPaymentType("credit")}
              className="h-12"
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
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={paymentMethod === "transfer" ? "default" : "outline"}
                onClick={() => setPaymentMethod("transfer")}
              >
                🏦 Transferencia
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
              >
                💳 Tarjeta
              </Button>
            </div>

            {paymentMethod === "card" && (
              <div className="space-y-4">
                <div>
                  <DropdownValues
                    onChange={(value) => {
                      setSelectedCard(value.value);
                    }}
                    value={selectedCard}
                    options={creditCards.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    label="Seleccionar tarjeta"
                  />
                </div>

                <div>
                  <h5 className="text-sm font-semibold">Tipo de Pago</h5>
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
                      🔢 Código QR
                    </Button>
                  </div>
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
