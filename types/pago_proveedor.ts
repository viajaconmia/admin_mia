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
  comments_cxp:any
};

type PrepaidTransferPayment = PaymentBase & {
  paymentType: "prepaid";
  paymentMethod: "transfer";
};

export type PaymentData =
  | CreditPayment
  | PrepaidCardOrLinkPayment
  | PrepaidTransferPayment;
