export const fmtMoney = (v: string | number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(v ?? 0),
  );

/**
 * Quita el 0 a la izquierda al escribir (ej. "0" + "5" => "05" => "5").
 * Un `number` de JS nunca tiene ceros a la izquierda en su string (siempre
 * es "1", nunca "01") — el cero de más solo existe en el string que arma el
 * input mientras escribes, así que esto debe aplicarse en el onChange sobre
 * ese string, no sobre el valor ya convertido a número.
 * No toca el 0 de decimales (ej. "0.5" se queda igual). Si no viene nada, manda "0".
 */
export const quitarCeroIzquierdo = (value: string): string => {
  if (!value) return "0";
  const limpio = value.replace(/^0+(?=\d)/, "");
  return limpio === "" ? "0" : limpio;
};
