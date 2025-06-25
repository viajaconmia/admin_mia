type PaymentBase = {
  date: string;
  paymentType: "credit" | "prepaid";
  monto_a_pagar: number;
  comments?: string;
  id_hospedaje: string;
};

type CreditPayment = PaymentBase & {
  paymentType: "credit";
};

type PrepaidCardOrLinkPayment = PaymentBase & {
  paymentType: "prepaid";
  paymentMethod: "card" | "link";
  selectedCard: any; // puedes cambiar esto por el tipo correcto
};

type PrepaidTransferPayment = PaymentBase & {
  paymentType: "prepaid";
  paymentMethod: "transfer";
};

export type PaymentData =
  | CreditPayment
  | PrepaidCardOrLinkPayment
  | PrepaidTransferPayment;
