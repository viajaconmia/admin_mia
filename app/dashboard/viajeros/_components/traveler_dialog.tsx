"use client";

import { API_KEY } from "../../../constants/constantes";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Company } from "../../../_types/index";

interface TravelerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresas: Company[];
}

export function TravelerDialog({
  open,
  onOpenChange,
  empresas,
}: TravelerDialogProps) {
  const [formData, setFormData] = useState({
    id_empresa: "",
    primer_nombre: "",
    segundo_nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo: "",
    fecha_nacimiento: "",
    genero: "",
    telefono: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://mianoktos.vercel.app/v1/mia/viajeros",
        {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            ...formData,
            telefono: parseInt(formData.telefono),
          }),
        }
      );
      const json = await response.json();
      console.log(json);

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating traveler:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Viajero</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo viajero.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id_empresa" className="text-right">
                Empresa
              </Label>
              <Select
                value={formData.id_empresa}
                onValueChange={(value) =>
                  setFormData({ ...formData, id_empresa: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.length > 0 &&
                    empresas.map((empresa) => (
                      <SelectItem
                        key={empresa.id_empresa}
                        value={empresa.id_empresa}
                      >
                        {empresa.nombre_comercial}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="primer_nombre" className="text-right">
                Primer Nombre
              </Label>
              <Input
                id="primer_nombre"
                value={formData.primer_nombre}
                onChange={(e) =>
                  setFormData({ ...formData, primer_nombre: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="segundo_nombre" className="text-right">
                Segundo Nombre
              </Label>
              <Input
                id="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={(e) =>
                  setFormData({ ...formData, segundo_nombre: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apellido_paterno" className="text-right">
                Apellido Paterno
              </Label>
              <Input
                id="apellido_paterno"
                value={formData.apellido_paterno}
                onChange={(e) =>
                  setFormData({ ...formData, apellido_paterno: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apellido_materno" className="text-right">
                Apellido Materno
              </Label>
              <Input
                id="apellido_materno"
                value={formData.apellido_materno}
                onChange={(e) =>
                  setFormData({ ...formData, apellido_materno: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="correo" className="text-right">
                Correo
              </Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) =>
                  setFormData({ ...formData, correo: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha_nacimiento" className="text-right">
                Fecha de Nacimiento
              </Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_nacimiento: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="genero" className="text-right">
                Género
              </Label>
              <Select
                value={formData.genero}
                onValueChange={(value) =>
                  setFormData({ ...formData, genero: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">Masculino</SelectItem>
                  <SelectItem value="f">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">
                Teléfono
              </Label>
              <Input
                id="telefono"
                type="number"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Crear Viajero</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
