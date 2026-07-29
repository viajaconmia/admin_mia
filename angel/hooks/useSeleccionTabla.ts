import { useState } from "react";

export function useSeleccionTabla<T>(getId: (item: T) => string) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const toggleFila = (id: string) =>
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleTodos = (items: T[]) =>
    setSeleccionados((prev) =>
      prev.size === items.length
        ? new Set()
        : new Set(items.map(getId)),
    );

  const limpiar = () => setSeleccionados(new Set());

  const estaSeleccionado = (id: string) => seleccionados.has(id);

  const seleccionarVarios = (ids: string[]) =>
    setSeleccionados((prev) => new Set([...prev, ...ids]));

  const deseleccionarVarios = (ids: string[]) =>
    setSeleccionados((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

  return {
    seleccionados: Array.from(seleccionados),
    toggleFila,
    toggleTodos,
    limpiar,
    estaSeleccionado,
    seleccionarVarios,
    deseleccionarVarios,
  };
}
