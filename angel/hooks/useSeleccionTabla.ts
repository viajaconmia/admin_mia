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

  return {
    seleccionados: Array.from(seleccionados),
    toggleFila,
    toggleTodos,
    limpiar,
    estaSeleccionado,
  };
}
