"use client";

import Modal from "../Modal";
import Form from "@/components/molecule/Form";
import FormField from "@/components/molecule/FormField";
import { FormProvider, useFormContext } from "@/context/FormContext";
import { useState } from "react";
import Button from "@/components/atom/Button";

interface CotizadorExternoProps {
  onClose: () => void;
}

interface CotizadorData {
  costoHotel: string;
  porcentaje: string;
  monedaMXN: string;
  monedaNOK: string;
}

function CotizadorForm() {
  const { values, reset } = useFormContext<CotizadorData>();
  const [resultado, setResultado] = useState(0);
  const handleSubmit = () => {
    const r =
      Number(values.costoHotel) / ((100 - Number(values.porcentaje)) * 0.01);
    setResultado(r);

    console.log(values);

    // Aquí después haces tu fetch
    // fetch("/api/cotizador", ...)
  };

  return (
    <div>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="flex flex-col gap-4">
          <FormField name="costoHotel" label="Costo hotel" type="number" />

          <FormField name="porcentaje" label="Porcentaje" type="number" />

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="md">
              {" "}
              Calcular
            </Button>
            <Button type="submit" variant="primary" size="md">
              {" "}
              Limpiar
            </Button>
          </div>
        </div>
      </Form>
      {resultado != 0 && <label>resultado en MXN: {resultado}</label>}
    </div>
  );
}

export default function CotizadorExterno({ onClose }: CotizadorExternoProps) {
  return (
    <Modal onClose={onClose}>
      <FormProvider
        initialValues={{
          costoHotel: "",
          porcentaje: "",
          monedaMXN: "",
          monedaNOK: "",
        }}
      >
        <CotizadorForm />
      </FormProvider>
    </Modal>
  );
}
