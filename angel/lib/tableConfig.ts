export type ColumnConfig = {
  id: string;
  nombre: string;
  orden: string[];
  ocultas: string[];
  creado_en: string;
};

const storageKey = (tableKey: string) => `mia:table-config:${tableKey}`;
const activoKey = (tableKey: string) => `mia:table-config-activo:${tableKey}`;

export function leerConfigs(tableKey: string): ColumnConfig[] {
  try {
    const raw = localStorage.getItem(storageKey(tableKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function guardarConfig(
  tableKey: string,
  nombre: string,
  orden: string[],
  ocultas: string[],
): ColumnConfig {
  const config: ColumnConfig = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nombre,
    orden,
    ocultas,
    creado_en: new Date().toISOString(),
  };

  try {
    const configs = leerConfigs(tableKey);
    localStorage.setItem(
      storageKey(tableKey),
      JSON.stringify([...configs, config]),
    );
  } catch {
    // localStorage no disponible (ej. modo privado) — la config queda solo en memoria
  }

  return config;
}

export function eliminarConfig(tableKey: string, id: string): void {
  try {
    const configs = leerConfigs(tableKey).filter((c) => c.id !== id);
    localStorage.setItem(storageKey(tableKey), JSON.stringify(configs));
  } catch {
    // no-op
  }
}

export function leerConfigActiva(tableKey: string): string | null {
  try {
    return localStorage.getItem(activoKey(tableKey));
  } catch {
    return null;
  }
}

export function guardarConfigActiva(tableKey: string, id: string | null): void {
  try {
    if (id) localStorage.setItem(activoKey(tableKey), id);
    else localStorage.removeItem(activoKey(tableKey));
  } catch {
    // no-op
  }
}
