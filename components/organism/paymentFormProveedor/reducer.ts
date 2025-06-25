// src/components/PaymentModal/paymentReducer.ts
import type { Solicitud } from "@/types";

// Exportamos el tipo del estado para usarlo en las props de los componentes hijos
export type PaymentState = {
  monto_pago: number;
  fecha_pago: string;
  monto_facturado: number;
  fecha_facturado: string;
  UUID: string;
};

// Exportamos la acción para mantener consistencia
export type Action = {
  type: "SET_FIELD";
  field: keyof PaymentState;
  payload: any;
};

// Exportamos la función que genera el estado inicial
export const getInitialState = (reservation: Solicitud): PaymentState => ({
  monto_pago: 0,
  fecha_pago: "",
  monto_facturado: 0,
  fecha_facturado: "",
  UUID: "",
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
