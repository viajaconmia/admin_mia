export const isSomeNull = (
  objeto: Record<string, any>,
  excluir: string[] = []
) =>
  Object.entries(objeto)
    .filter(([key]) => !excluir.includes(key))
    .map(([key, value]) =>
      typeof value == "string"
        ? value.trim()
        : Array.isArray(value)
        ? value.some((item) => item != null)
        : value
    )
    .some((item) => !item);
