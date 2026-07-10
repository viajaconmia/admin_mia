export type PaymentScheduleRow = {
  id: string;
  date: string; // YYYY-MM-DD
  hora: string; // HH:MM
  amount: number | ""; // permite vacío mientras escriben
  referencia_pago: string; // referencia de cada tarjeta
  isSecureCode: boolean;
  idTitular: string;
  useQR: "qr" | "code" | "";
  document: string; // identificacion del titular
  cargo: string; // tipo de cargo
};
