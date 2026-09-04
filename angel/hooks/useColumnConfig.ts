import { useEffect, useState } from "react";
import {
  ColumnConfig,
  eliminarConfig,
  guardarConfig,
  leerConfigActiva,
  leerConfigs,
  guardarConfigActiva,
} from "@/angel/lib/tableConfig";

export function useColumnConfig(tableKey: string, columnasDefault: string[]) {
  const [orden, setOrden] = useState<string[]>(columnasDefault);
  const [ocultas, setOcultas] = useState<string[]>([]);
  const [configs, setConfigs] = useState<ColumnConfig[]>([]);
  const [activoId, setActivoId] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedConfigs = leerConfigs(tableKey);
    setConfigs(savedConfigs);

    const activo = leerConfigActiva(tableKey);
    const config = activo ? savedConfigs.find((c) => c.id === activo) : null;
    if (config) {
      setOrden(config.orden);
      setOcultas(config.ocultas);
      setActivoId(config.id);
    }
  }, [tableKey]);

  const guardar = (nombre: string) => {
    const config = guardarConfig(tableKey, nombre, orden, ocultas);
    setConfigs((prev) => [...prev, config]);
    setActivoId(config.id);
    guardarConfigActiva(tableKey, config.id);
  };

  const aplicar = (id: string) => {
    const config = configs.find((c) => c.id === id);
    if (!config) return;
    setOrden(config.orden);
    setOcultas(config.ocultas);
    setActivoId(config.id);
    guardarConfigActiva(tableKey, config.id);
  };

  const eliminar = (id: string) => {
    eliminarConfig(tableKey, id);
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    if (activoId === id) {
      setActivoId(null);
      guardarConfigActiva(tableKey, null);
    }
  };

  const restaurarDefault = () => {
    setOrden(columnasDefault);
    setOcultas([]);
    setActivoId(null);
    guardarConfigActiva(tableKey, null);
  };

  const moverColumna = (key: string, direccion: "up" | "down") => {
    setOrden((prev) => {
      const idx = prev.indexOf(key);
      const nuevoIdx = direccion === "up" ? idx - 1 : idx + 1;
      if (idx === -1 || nuevoIdx < 0 || nuevoIdx >= prev.length) return prev;
      const copia = [...prev];
      [copia[idx], copia[nuevoIdx]] = [copia[nuevoIdx], copia[idx]];
      return copia;
    });
    setActivoId(null);
  };

  const toggleOculta = (key: string) => {
    setOcultas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    setActivoId(null);
  };

  return {
    orden,
    ocultas,
    configs,
    activoId,
    guardar,
    aplicar,
    eliminar,
    restaurarDefault,
    moverColumna,
    toggleOculta,
  };
}
