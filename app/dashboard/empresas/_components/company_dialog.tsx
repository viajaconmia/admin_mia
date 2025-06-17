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
import { API_KEY } from "@/lib/constants";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDialog({ open, onOpenChange }: CompanyDialogProps) {
  const [formData, setFormData] = useState({
    razon_social: "",
    rfc: "",
    nombre_comercial: "",
    direccion: "",
    direccion_fiscal: "",
    codigo_postal_fiscal: "",
    regimen_fiscal: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log(formData);
      const response = await fetch(
        "https://miaback.vercel.app/v1/mia/empresas",
        {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify(formData),
        }
      );
      const json = await response.json();
      console.log(json);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating company:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Empresa</DialogTitle>
          <DialogDescription>
            Ingresa los datos de la nueva empresa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="razon_social" className="text-right">
                Razón Social
              </Label>
              <Input
                id="razon_social"
                value={formData.razon_social}
                onChange={(e) =>
                  setFormData({ ...formData, razon_social: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rfc" className="text-right">
                RFC
              </Label>
              <Input
                id="rfc"
                value={formData.rfc}
                onChange={(e) =>
                  setFormData({ ...formData, rfc: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre_comercial" className="text-right">
                Nombre Comercial
              </Label>
              <Input
                id="nombre_comercial"
                value={formData.nombre_comercial}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_comercial: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="direccion" className="text-right">
                Dirección
              </Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="direccion_fiscal" className="text-right">
                Dirección Fiscal
              </Label>
              <Input
                id="direccion_fiscal"
                value={formData.direccion_fiscal}
                onChange={(e) =>
                  setFormData({ ...formData, direccion_fiscal: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codigo_postal_fiscal" className="text-right">
                Código Postal
              </Label>
              <Input
                id="codigo_postal_fiscal"
                value={formData.codigo_postal_fiscal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    codigo_postal_fiscal: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="regimen_fiscal" className="text-right">
                Régimen Fiscal
              </Label>
              <Input
                id="regimen_fiscal"
                value={formData.regimen_fiscal}
                onChange={(e) =>
                  setFormData({ ...formData, regimen_fiscal: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Crear Empresa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
