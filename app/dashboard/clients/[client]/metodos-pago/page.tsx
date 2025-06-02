"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Edit,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import { fetchPaymentMethods } from "@/hooks/useFetch";

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

const CheckOutForm = ({ setSuccess, setTrigger, cliente }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState("");
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    const id_agente = cliente;
    const cardElement = elements.getElement(CardElement);
    //crear metodo de pago
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });
    console.log("Se creo payment method");
    if (error) {
      setMessage(error.message);
    } else {
      const response = await fetch(
        `https://miaback.vercel.app/v1/stripe/save-payment-method`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...AUTH,
          },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
            id_agente: id_agente,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessage(data.message || "Metodo de pago guardado");
        setSuccess(false);
        setTrigger((prev) => prev + 1);
      } else {
        setMessage("Ocurrio un error");
      }
    }
  };

  return (
    <div className="flex flex-col w-full px-4">
      <h2 className="font-semibold text-lg text-[#10244c] mb-5">
        Ingresa los detalles de tu tarjeta de credito
      </h2>
      <form onSubmit={handleSubmit}>
        <CardElement options={cardStyle} />
        <button
          type="submit"
          disabled={!stripe}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full mt-5"
        >
          <CreditCard className="w-4 h-4" />
          <span className="font-medium">Agregar tarjeta</span>
        </button>
        <button
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full mt-5"
          onClick={() => setSuccess(false)}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Volver</span>
        </button>
      </form>
      {message && (
        <div className="h-auto p-3 bg-red-300 border-4 mt-5 rounded-xl">
          <p className="text-base text-center">{message}</p>
        </div>
      )}
    </div>
  );
};

const API_KEY =
  "nkt-U9TdZU63UENrblg1WI9I1Ln9NcGrOyaCANcpoS2PJT3BlbkFJ1KW2NIGUYF87cuvgUF3Q976fv4fPrnWQroZf0RzXTZTA942H3AMTKFKJHV6cTi8c6dd6tybUD65fybhPJT3BlbkFJ1KW2NIGPrnWQroZf0RzXTZTA942H3AMTKFy15whckAGSSRSTDvsvfHsrtbXhdrT";
const AUTH = {
  "x-api-key": API_KEY,
};

const cardStyle = {
  style: {
    base: {
      color: "#32325d",
      fontSize: "18px",
      fontFamily: "Arial, sans-serif",
      "::placeholder": {
        color: "#aab7c4",
      },
      backgroundColor: "#f8f8f8",
      padding: "30px",
      borderRadius: "5px",
    },
    invalid: {
      color: "#fa755a",
    },
  },
  hidePostalCode: true, // Oculta el campo de código postal
  hideIcon: false, // Oculta el ícono de Stripe (opcional)
  disabled: false, // Si quieres deshabilitar la edición
  disableLink: true, 
};

const stripePromise = loadStripe(
  "pk_test_51R1WOrQttaqZirA7uXoQzqBjIsogB3hbIMWzIimqVnmMR0ZdSGhtl9icQpUkqHhIrWDjvRj2vjV71FEHTcbZjMre005S8gHlDD"
);

const Page = () => {
  const { client } = useParams();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchPaymentMethods(
        Array.isArray(client) ? client[0] : client
      );
      console.log("Payment methods data:", data);
      setPaymentMethods(data);
    };
    fetchData();
  }, [trigger]);
  // Loading state
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
  //     </div>
  //   );
  // }
  // const fetchData = async () => {
  //   const data = await fetchPaymentMethods(client);
  //   console.log("Payment methods data:", data);
  //   setPaymentMethods(data);
  // };

  const handleDeleteMethod = async (id: string) => {
    console.log("Delete payment method:", id);
    const id_agente = client;
    const response = await fetch(
      `https://miaback.vercel.app/v1/stripe/delete-payment-method`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
        body: JSON.stringify({
          paymentMethodId: id,
          id_agente: id_agente,
        }),
      }
    );

    const datos = await response.json();
    if (datos.success) {
      setMessage(datos.message || "Metodo de pago eliminado");
      setTrigger((prev) => prev + 1);
    } else {
      setMessage("Ocurrio un error");
    }
  };
  const handleAddMethod = () => {
    setShowAddPaymentForm(true);
  };

  return (
    <div className="h-fit bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Metodos de pago
          </h1>
        </div>
        {showAddPaymentForm ? (
          <Elements stripe={stripePromise}>
            <CheckOutForm
              setSuccess={setShowAddPaymentForm}
              setTrigger={setTrigger}
              cliente={client}
              onCancel={() => setShowAddPaymentForm(false)}
            />
          </Elements>
        ) : (
          <div className="w-full bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Metodos de pago
            </h3>

            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <CreditCard className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="text-gray-500">
                  No se han guardado metodos de pago
                </p>
                <ul className="space-y-3 mb-6">
                  <li
                    onClick={handleAddMethod}
                    className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="text-gray-600" size={20} />
                      <p className="font-medium text-gray-800">
                        Agregar nuevo metodo de pago
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <ul className="space-y-3 mb-6">
                  {paymentMethods.length > 0 &&
                    paymentMethods.map((method) => (
                      <li
                        key={method.id}
                        className={
                          "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100"
                        }
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className={"text-gray-600"} size={20} />
                          <div>
                            <p className="font-medium text-gray-800">
                              {method.card.brand.toUpperCase()} ••••{" "}
                              {method.card.last4}
                            </p>
                            <p className="text-sm text-gray-500">
                              Vence {method.card.exp_month}/
                              {method.card.exp_year}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* {selectedMethod === method.id && (
                              <CheckCircle2
                                className="text-blue-600"
                                size={20}
                              />
                            )} */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMethod(method.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                            aria-label="Delete payment method"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </li>
                    ))}
                  <li
                    onClick={handleAddMethod}
                    className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="text-gray-600" size={20} />
                      <p className="font-medium text-gray-800">
                        Agregar nuevo metodo de pago
                      </p>
                    </div>
                  </li>
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
