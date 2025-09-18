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
  // Si el valor es undefined o null, retornar cadena vacía
  if (numberStr == null) return "";

  // Convertir a string si es un número
  const str = typeof numberStr === "number" ? numberStr.toString() : numberStr;

  // Si la cadena está vacía, retornar cadena vacía
  if (str.trim() === "") return "";
  // 1. Separar la parte entera de la parte decimal
  const parts = str.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : undefined;

  // 2. Formatear la parte entera
  // Invertimos la parte entera para facilitar la inserción de comas cada tres dígitos desde la derecha
  const reversedInteger = integerPart.split("").reverse().join("");
  let formattedReversedInteger = "";

  for (let i = 0; i < reversedInteger.length; i++) {
    if (i > 0 && i % 3 === 0) {
      formattedReversedInteger += ",";
    }
    formattedReversedInteger += reversedInteger[i];
  }

  // Volvemos a invertir la parte entera formateada para obtener el orden correcto
  const formattedInteger = formattedReversedInteger
    .split("")
    .reverse()
    .join("");

  // 3. Unir la parte entera formateada con la parte decimal (si existe)
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  } else {
    return formattedInteger;
  }
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
