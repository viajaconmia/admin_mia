// src/lib/constants.ts
import type { CreditCardInfo } from "@/types";

// Tipos de pago para evitar errores de tipeo
export const PAYMENT_TYPE = {
  PREPAID: "prepaid",
  CREDIT: "credit",
} as const;

export const PAYMENT_METHOD = {
  TRANSFER: "transfer",
  CARD: "card",
  LINK: "link",
} as const;

export const USE_QR_TYPE = {
  QR: "qr",
  CODE: "code",
} as const;

// DATOS DE PRUEBA POR EL MOMENTO, SE CAMBIARAN A LOS NUEVOS DATOS CON TARJETAS
export const CREDIT_CARDS: CreditCardInfo[] = [
  { id: "1", name: "BBVA Empresarial ****1234", type: "Visa" },
  { id: "2", name: "Santander Corporativa ****5678", type: "Mastercard" },
  { id: "3", name: "Banorte Business ****9012", type: "Visa" },
];

// ESTOS DATOS SI SE QUEDAN
export const COMPANY_DATA = {
  codigoPostal: "11570",
  direccion:
    "Presidente Masaryk #29, Interior P-4, CDMX, colonia: Chapultepec Morales, Alcaldía: Miguel Hidalgo",
  nombre: "noktos",
  razonSocial: "Noktos Alianza S.A. de C.V.",
  rfc: "NAL190807BU2",
  logoUrl: "https://luiscastaneda-tos.github.io/log/files/nokt.png",
};
