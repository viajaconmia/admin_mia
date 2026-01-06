// src/components/PaymentModal/paymentReducer.ts
import { BookingAll } from "@/services/BookingService";
import type { Solicitud, Solicitud2 } from "@/types";

// Exportamos el tipo del estado para usarlo en las props de los componentes hijos
export type PaymentState = {
  hasFavorBalance: boolean;
  error: string;
  isSecureCode: boolean;
  favorBalance: string;
  paymentType: "prepaid" | "credit" | "";
  paymentMethod: "transfer" | "card" | "link" | "";
  date: string;
  selectedCard: string;
  useQR: "qr" | "code" | "";
  comments: string;
  emails: string;
  cargo: string;
  document: any;
};

// Exportamos la acción para mantener consistencia
export type Action = {
  type: "SET_FIELD";
  field: keyof PaymentState;
  payload: any;
};

// Exportamos la función que genera el estado inicial
export const getInitialState = (reservation: BookingAll): PaymentState => ({
  hasFavorBalance: false,
  error: "",
  isSecureCode: false,
  favorBalance: "",
  paymentType: "",
  paymentMethod: "",
  date: reservation.check_in.split("T")[0],
  selectedCard: "",
  useQR: "",
  comments: "",
  emails: "",
  cargo: "RENTA HABITACIÓN",
  document: "",
});

// Exportamos la función reductora
export function paymentReducer(
  state: PaymentState,
  action: Action
): PaymentState {
  switch (action.type) {
    case "SET_FIELD":
      return showWarning(state, action);
    default:
      return state;
  }
}

function showWarning(state: PaymentState, action: Action) {
  let response = { ...state, [action.field]: action.payload };
  if (action.field == "paymentType" && action.payload == "credit") {
    response = {
      ...response,
      error:
        "Esta parte aun no esta procesada, todo lo que hagas aqui esta en prueba",
    };
  } else if (action.field == "paymentType" && action.payload != "credit") {
    response = { ...response, error: "" };
  }
  return response;
}
