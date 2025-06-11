"use client";

import { useEffect, useState } from "react";
// import { useParams } from "wouter";
import {
  Shield,
  CreditCard,
  Calendar,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { validateSecureToken } from "@/lib/qr-generator";

interface CardData {
  number: string;
  expiryDate: string;
  cvv: string;
  holderName: string;
  type: string;
}

const CARD_DATABASE: Record<string, CardData> = {
  "1": {
    number: "4532 1598 7643 2108",
    expiryDate: "12/27",
    cvv: "435",
    holderName: "BBVA EMPRESARIAL",
    type: "Visa Empresarial",
  },
  "2": {
    number: "5421 6789 4532 1098",
    expiryDate: "08/28",
    cvv: "821",
    holderName: "SANTANDER CORPORATIVA",
    type: "Mastercard Corporativa",
  },
  "3": {
    number: "4716 3487 9521 6543",
    expiryDate: "03/29",
    cvv: "647",
    holderName: "BANORTE BUSINESS",
    type: "Visa Business",
  },
  visa_corporate: {
    number: "4532 1598 7643 2108",
    expiryDate: "12/27",
    cvv: "435",
    holderName: "BBVA EMPRESARIAL",
    type: "Visa Empresarial",
  },
  mastercard_business: {
    number: "5421 6789 4532 1098",
    expiryDate: "08/28",
    cvv: "821",
    holderName: "SANTANDER CORPORATIVA",
    type: "Mastercard Corporativa",
  },
  amex_corporate: {
    number: "4716 3487 9521 6543",
    expiryDate: "03/29",
    cvv: "647",
    holderName: "BANORTE BUSINESS",
    type: "Visa Business",
  },
};

export default function SecurePayment({ params }) {
  console.log(params);
  const { token } = params;
  const [isValid, setIsValid] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [showCardData, setShowCardData] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  useEffect(() => {
    if (token) {
      const validation = validateSecureToken(token);
      if (validation.valid && validation.data) {
        const timeSinceGeneration = Date.now() - validation.data.timestamp;
        const maxValidTime = 30 * 60 * 1000; // 30 minutes

        if (timeSinceGeneration < maxValidTime) {
          setIsValid(true);
          setPaymentData(validation.data);

          // Get card data based on the card ID from token
          const cardKey = validation.data.cardType || "1";
          setCardData(CARD_DATABASE[cardKey] || CARD_DATABASE["1"]);

          // Set remaining time
          const remaining = Math.max(
            0,
            Math.floor((maxValidTime - timeSinceGeneration) / 1000)
          );
          setTimeRemaining(remaining);
        }
      }
    }
  }, [token]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isValid || !paymentData || !cardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-red-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-red-600 mb-4">
            El código QR no es válido o ha expirado. Por favor, solicite un
            nuevo código de pago.
          </p>
          <Button
            variant="outline"
            onClick={() => window.close()}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Cerrar Ventana
          </Button>
        </Card>
      </div>
    );
  }

  if (timeRemaining === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-red-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            Código Expirado
          </h1>
          <p className="text-red-600 mb-4">
            Este código QR ha expirado por seguridad. Solicite un nuevo código
            para continuar.
          </p>
          <Button
            variant="outline"
            onClick={() => window.close()}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Cerrar Ventana
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6 p-6 border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Pago Seguro</h1>
              <p className="text-sm text-slate-600">
                Datos de tarjeta protegidos
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                Este código expira en:{" "}
                <span className="font-bold">{formatTime(timeRemaining)}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Details */}
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Detalles del Pago
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Reservación ID</p>
              <p className="font-semibold">{paymentData.reservationId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Monto a Cobrar</p>
              <p className="font-semibold text-2xl text-green-600">
                ${paymentData.amount.toFixed(2)} MXN
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instrucciones:</strong> Use los datos de tarjeta mostrados
              abajo para procesar este pago exacto en su terminal de cobro.
            </p>
          </div>
        </Card>

        {/* Card Data Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Datos de la Tarjeta
            </h2>
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>

          {!showCardData ? (
            <div className="text-center py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                <Lock className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-blue-800 font-medium mb-2">
                  Datos Protegidos
                </p>
                <p className="text-sm text-blue-600">
                  Los datos de la tarjeta están cifrados por seguridad. Haga
                  clic en "Mostrar Datos" para revelarlos.
                </p>
              </div>
              <Button
                onClick={() => setShowCardData(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Shield className="mr-2 h-4 w-4" />
                Mostrar Datos de Tarjeta
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-600">
                    Tipo de Tarjeta
                  </p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {cardData.type}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      NÚMERO DE TARJETA
                    </p>
                    <p className="text-lg font-mono font-bold text-slate-800 tracking-wider">
                      {cardData.number}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        FECHA DE VENCIMIENTO
                      </p>
                      <p className="text-lg font-mono font-bold text-slate-800">
                        {cardData.expiryDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">CÓDIGO CVV</p>
                      <p className="text-lg font-mono font-bold text-slate-800">
                        {cardData.cvv}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">TITULAR</p>
                    <p className="text-base font-semibold text-slate-800">
                      {cardData.holderName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">
                  Instrucciones para el Terminal de Cobro:
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>
                    • <strong>Número de tarjeta:</strong> Ingrese exactamente
                    como se muestra
                  </li>
                  <li>
                    • <strong>Fecha de vencimiento:</strong>{" "}
                    {cardData.expiryDate} (MM/AA)
                  </li>
                  <li>
                    • <strong>Código CVV:</strong> {cardData.cvv}
                  </li>
                  <li>
                    • <strong>Monto exacto:</strong> $
                    {paymentData.amount.toFixed(2)} MXN
                  </li>
                  <li>
                    • <strong>Titular:</strong> {cardData.holderName}
                  </li>
                  <li>• Procese como pago presencial o telefónico</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Importante:</strong> Esta información expira en{" "}
                  {formatTime(timeRemaining)}. Si necesita más tiempo, solicite
                  un nuevo código QR.
                </p>
              </div>

              <Button
                onClick={() => setShowCardData(false)}
                variant="outline"
                className="w-full"
              >
                Ocultar Datos
              </Button>
            </div>
          )}
        </Card>

        {/* Security Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            🔒 Conexión segura • Los datos se eliminarán automáticamente al
            cerrar
          </p>
        </div>
      </div>
    </div>
  );
}
