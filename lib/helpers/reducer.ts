export function setDeep<T>(obj: T, path: string, value: unknown): T {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  const newObj: any = structuredClone(obj);

  let current = newObj;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key]) {
        current[key] = isNaN(Number(keys[index + 1])) ? {} : [];
      }
      current = current[key];
    }
  });

  return newObj;
}

export function mapOptions<T extends any>(
  list: T[] | string[],
  propiedad?: keyof T,
): { name: string; content: T | string }[] {
  return list.map((item: T | string) => ({
    name: String(
      propiedad && typeof item === "object" ? (item as T)[propiedad] : item,
    ),
    content: item,
  }));
}
export function mapValueComboBox<T extends any>(
  value: T | string,
  propiedad?: keyof T,
): { name: string; content: T | string | null } {
  return typeof value == "string"
    ? {
        name: value,
        content: value,
      }
    : !!value && !!value[propiedad]
      ? {
          name: value[propiedad] as string,
          content: value,
        }
      : {
          name: "",
          content: null,
        };
}
