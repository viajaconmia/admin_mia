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
