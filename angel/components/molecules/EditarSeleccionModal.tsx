"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { TextInput, TextAreaInput, Dropdown } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import type { ProgresoLote } from "@/angel/hooks/useProcesoEnLote";

export type CampoEdicion =
  | { key: string; label: string; type: "texto" }
  | { key: string; label: string; type: "textarea"; rows?: number }
  | { key: string; label: string; type: "select"; options: string[] };

interface EditarSeleccionModalProps {
  open: boolean;
  onClose: () => void;
  count: number;
  campos: CampoEdicion[];
  onConfirmar: (valores: Record<string, string>) => void;
  loading?: boolean;
  /** Si viene presente, pinta una barra "Guardando X/Y..." en vez de solo el texto de loading. */
  progreso?: ProgresoLote;
}

export const EditarSeleccionModal = ({
  open,
  onClose,
  count,
  campos,
  onConfirmar,
  loading = false,
  progreso,
}: EditarSeleccionModalProps) => {
  const [valores, setValores] = useState<Record<string, string>>({});

  const set = (key: string, value: string) =>
    setValores((prev) => ({ ...prev, [key]: value }));

  const handleConfirmar = () => {
    const rellenos = Object.fromEntries(
      Object.entries(valores).filter(([, v]) => v.trim() !== ""),
    );
    onConfirmar(rellenos);
  };

  const handleClose = () => {
    setValores({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar selección</DialogTitle>
          <DialogDescription>
            Sobreescribirá los campos que modifiques en{" "}
            <span className="font-semibold text-gray-900">
              {count} {count === 1 ? "solicitud" : "solicitudes"}
            </span>
            . Los campos vacíos no se modificarán.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {campos.map((campo) => {
            const value = valores[campo.key] ?? "";

            if (campo.type === "textarea")
              return (
                <TextAreaInput
                  key={campo.key}
                  label={campo.label}
                  value={value}
                  rows={campo.rows ?? 3}
                  onChange={(v) => set(campo.key, v)}
                  disabled={loading}
                />
              );

            if (campo.type === "select")
              return (
                <Dropdown
                  key={campo.key}
                  label={campo.label}
                  value={value}
                  options={campo.options}
                  onChange={(v) => set(campo.key, v)}
                  disabled={loading}
                />
              );

            return (
              <TextInput
                key={campo.key}
                label={campo.label}
                value={value}
                onChange={(v) => set(campo.key, v)}
                disabled={loading}
              />
            );
          })}
        </div>

        {progreso && (
          <div className="flex items-center gap-3 text-sm">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-gray-600">
              Guardando {progreso.actual}/{progreso.total}...
            </span>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirmar} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
