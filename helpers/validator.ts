export const isSomeNull = (
  objeto: Record<string, any>,
  excluir: string[] = []
) =>
  Object.entries(objeto)
    .filter(([key]) => !excluir.includes(key))
    .map(([key, value]) => (typeof value == "string" ? value.trim() : value))
    .some((item) => !item);
