"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, RotateCcw } from "lucide-react";
import { Modal } from "@/angel/components/molecules/Modal";
import Button from "@/components/atom/Button";
import { TextInput } from "@/components/atom/Input";
import type { ColumnConfig } from "@/angel/lib/tableConfig";

export type ColumnaDisponible = { key: string; label: string };

interface ColumnConfigPanelProps {
  open: boolean;
  onClose: () => void;
  /** Catálogo completo de columnas (key + label legible), no necesariamente en orden */
  columnas: ColumnaDisponible[];
  orden: string[];
  ocultas: string[];
  onMover: (key: string, direccion: "up" | "down") => void;
  onToggleOculta: (key: string) => void;
  configs: ColumnConfig[];
  activoId: string | null;
  onGuardar: (nombre: string) => void;
  onAplicar: (id: string) => void;
  onEliminar: (id: string) => void;
  onRestaurarDefault: () => void;
}

export const ColumnConfigPanel = ({
  open,
  onClose,
  columnas,
  orden,
  ocultas,
  onMover,
  onToggleOculta,
  configs,
  activoId,
  onGuardar,
  onAplicar,
  onEliminar,
  onRestaurarDefault,
}: ColumnConfigPanelProps) => {
  const [nombreNuevo, setNombreNuevo] = useState("");

  const labelDe = (key: string) =>
    columnas.find((c) => c.key === key)?.label ?? key;

  const handleGuardar = () => {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    onGuardar(nombre);
    setNombreNuevo("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar columnas"
      description="Elige qué columnas mostrar y en qué orden. Puedes guardar varias configuraciones con nombre."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col divide-y divide-gray-100 border rounded-lg overflow-hidden">
          {orden.map((key, index) => {
            const oculta = ocultas.includes(key);
            return (
              <div key={key} className="flex items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  checked={!oculta}
                  onChange={() => onToggleOculta(key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={`flex-1 text-sm ${oculta ? "text-gray-400" : "text-gray-800"}`}
                >
                  {labelDe(key)}
                </span>
                <button
                  type="button"
                  onClick={() => onMover(key, "up")}
                  disabled={index === 0}
                  className="text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500"
                  aria-label="Mover arriba"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMover(key, "down")}
                  disabled={index === orden.length - 1}
                  className="text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500"
                  aria-label="Mover abajo"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={onRestaurarDefault}
          className="self-start"
        >
          Restaurar por defecto
        </Button>

        <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
          <span className="text-sm font-semibold text-gray-700">
            Configuraciones guardadas
          </span>

          {configs.length === 0 && (
            <span className="text-xs text-gray-400">
              Aún no tienes ninguna guardada.
            </span>
          )}

          {configs.map((config) => (
            <div key={config.id} className="flex items-center gap-2">
              <span
                className={`flex-1 text-sm ${
                  activoId === config.id
                    ? "font-semibold text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {config.nombre}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAplicar(config.id)}
                disabled={activoId === config.id}
              >
                Aplicar
              </Button>
              <Button
                variant="warning ghost"
                size="sm"
                icon={Trash2}
                onClick={() => onEliminar(config.id)}
                aria-label={`Eliminar ${config.nombre}`}
              />
            </div>
          ))}

          <div className="flex items-end gap-2 pt-2">
            <TextInput
              label="Nombre de la configuración"
              value={nombreNuevo}
              onChange={setNombreNuevo}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleGuardar}
              disabled={!nombreNuevo.trim()}
            >
              Guardar como nueva
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
