// src/components/PaymentModal/paymentReducer.ts
import type { Solicitud } from "@/types";

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
};

// Exportamos la acción para mantener consistencia
export type Action = {
  type: "SET_FIELD";
  field: keyof PaymentState;
  payload: any;
};

// Exportamos la función que genera el estado inicial
export const getInitialState = (reservation: Solicitud): PaymentState => ({
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
});

// Exportamos la función reductora
export function paymentReducer(
  state: PaymentState,
  action: Action
): PaymentState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.payload };
    default:
      return state;
  }
}
