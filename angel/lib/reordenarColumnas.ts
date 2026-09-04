/**
 * TableCore infiere columnas y su orden con Object.keys(fila) — reconstruye cada
 * fila con las keys insertadas en el orden pedido para controlar el orden de
 * renderizado sin tocar TableCore. Las keys de la fila que no estén en `orden`
 * se agregan al final (para no perder columnas nuevas que el schema agregue después).
 */
export function reordenarColumnas<T extends Record<string, unknown>>(
  registros: T[],
  orden: string[],
): T[] {
  if (!orden.length) return registros;

  return registros.map((fila) => {
    const reordenada: Record<string, unknown> = {};

    orden.forEach((key) => {
      if (key in fila) reordenada[key] = fila[key];
    });

    Object.keys(fila).forEach((key) => {
      if (!(key in reordenada)) reordenada[key] = fila[key];
    });

    return reordenada as T;
  });
}
