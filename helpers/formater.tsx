export function capitalizarTexto(texto: string) {
  const palabras = texto.toLowerCase().split(" ");

  const palabrasCapitalizadas = palabras.map((palabra) => {
    if (palabra.length > 0) {
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    }
    return "";
  });

  return palabrasCapitalizadas.join(" ");
}

export function obtenerIniciales(nombreCompleto: string) {
  const palabras = nombreCompleto.trim().split(" ");

  // 2. Extraer las iniciales de las dos primeras palabras.
  let iniciales = "";

  // 3. Obtener la inicial de la primera palabra.
  if (palabras[0] && palabras[0].length > 0) {
    iniciales += palabras[0][0].toUpperCase();
  }

  // 4. Obtener la inicial de la segunda palabra, si existe.
  if (palabras.length > 1 && palabras[1].length > 0) {
    iniciales += palabras[1][0].toUpperCase();
  }

  return iniciales;
}

export function formatNumberWithCommas(
  numberStr: string | number | undefined | null
): string {
  if (numberStr == null) return "";

  const str = typeof numberStr === "number" ? numberStr.toString() : numberStr;

  if (str.trim() === "") return "";

  // Detectar si el número es negativo
  const isNegative = str.startsWith("-");

  // Remover el signo temporalmente para formatear solo el número
  const cleanStr = isNegative ? str.slice(1) : str;

  const parts = cleanStr.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : undefined;

  // Formatear la parte entera
  const reversedInteger = integerPart.split("").reverse().join("");
  let formattedReversedInteger = "";

  for (let i = 0; i < reversedInteger.length; i++) {
    if (i > 0 && i % 3 === 0) {
      formattedReversedInteger += ",";
    }
    formattedReversedInteger += reversedInteger[i];
  }

  const formattedInteger = formattedReversedInteger
    .split("")
    .reverse()
    .join("");

  // Armar el número completo
  const formatted =
    decimalPart !== undefined
      ? `${formattedInteger}.${
          decimalPart.length == 2 ? decimalPart : `${decimalPart}0`
        }`
      : `${formattedInteger}.00`;

  // Volver a agregar el signo negativo si era negativo
  return isNegative ? `-${formatted}` : formatted;
}

export const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("T")[0].split("-");
  const date = new Date(+year, +month - 1, +day);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ✅ Recomendado: usa Intl (respeta es-MX: 1,234,567.89)
export const formatNumber = (
  value: number | string,
  opts: Intl.NumberFormatOptions = {}
) => {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("es-MX", { useGrouping: true, ...opts }).format(
    n
  );
};

export const formatMoneyMXN = (value: number | string) =>
  formatNumber(value, {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ⚠️ Alternativa si quieres COMAS sí o sí (p. ej. formato fijo "###,###.##"):
   Mantiene signo y decimales tal cual.
*/
export const withCommas = (value: number | string) => {
  if (value === null || value === undefined || value === "") return "";
  const s = String(value);
  const neg = s.startsWith("-") ? "-" : "";
  const [intRaw, dec = ""] = s.replace(/[^0-9.\-]/g, "").split(".");
  const int = intRaw.replace("-", "");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${neg}${grouped}.${dec}` : `${neg}${grouped}`;
};

export const redondear = (number: number) => Number(number.toFixed(2));
