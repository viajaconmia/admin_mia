export const isSomeNull = (
  objeto: Record<string, any>,
  excluir: string[] = []
) => {
  const entries = Object.entries(objeto).filter(
    ([key]) => !excluir.includes(key),
  );
  for (const [key, value] of entries) {
    const normalized =
      typeof value === "number"
        ? true
        : typeof value === "string"
          ? value.trim()
          : Array.isArray(value)
            ? value.some((item) => item != null)
            : value;
    if (!normalized) {
      console.warn("[isSomeNull] campo vacío:", key, "→", value);
    }
  }
  return entries
    .map(([, value]) =>
      typeof value === "number"
        ? true
        : typeof value === "string"
          ? value.trim()
          : Array.isArray(value)
            ? value.some((item) => item != null)
            : value,
    )
    .some((item) => !item);
};
