export const getPaymentForm = (
  metodo_pago: string,
  tipo_tarjeta: string | null,
): string => {
  if (metodo_pago === "transferencia") return "03";
  if (metodo_pago === "efectivo") return "01";

  if (metodo_pago === "tarjeta") {
    if (tipo_tarjeta === "credito") return "04";
    if (tipo_tarjeta === "debito") return "28";

    // fallback si no sabes el tipo
    return "99";
  }

  return "99";
};
