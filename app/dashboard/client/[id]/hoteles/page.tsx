"use client";
import Button from "@/components/atom/Button";
import { FormAgregarHotel } from "@/components/organism/FormAgregarHotel";
import { TableHotelesPermitidos } from "@/components/tables/HotelesPermitidosTable";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function PageHoteles() {
  const [section, setSection] = useState<"hoteles" | "agregar">("hoteles");
  return (
    <section>
      <main>
        <div className="flex justify-end">
          <Button
            size="sm"
            icon={section === "hoteles" ? Plus : X}
            onClick={() =>
              setSection(section === "hoteles" ? "agregar" : "hoteles")
            }
          >
            {section === "hoteles" ? "Agregar hotel" : "Cancelar"}
          </Button>
        </div>
        {section === "hoteles" && <TableHotelesPermitidos />}
        {section === "agregar" && <FormAgregarHotel />}
      </main>
    </section>
  );
}
