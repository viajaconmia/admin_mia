"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface CreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    type: "agente" | "empresa";
    id: string;
    name: string;
    credit: number;
  } | null;
  onSave: (credit: number) => void;
}

export function CreditDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: CreditDialogProps) {
  const [hasCredit, setHasCredit] = useState(
    item?.credit ? item.credit > 0 : false
  );
  const [creditAmount, setCreditAmount] = useState(item?.credit || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(hasCredit ? creditAmount : 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Crédito</DialogTitle>
          <DialogDescription>
            {item?.type === "agente"
              ? "Configurar crédito consolidado del agente"
              : "Configurar crédito de la empresa"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={item?.name}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hasCredit" className="text-right">
                Tiene Crédito
              </Label>
              <div className="col-span-3">
                <Switch
                  id="hasCredit"
                  checked={hasCredit}
                  onCheckedChange={setHasCredit}
                />
              </div>
            </div>
            {hasCredit && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credit" className="text-right">
                  Monto
                </Label>
                <Input
                  id="credit"
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
