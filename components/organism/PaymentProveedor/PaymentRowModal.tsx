import Button from "@/components/atom/Button";
import {
  CheckboxInput,
  DateInput,
  DropdownValues,
  TextInput,
} from "@/components/atom/Input";
import NumberInput from "@/components/NumberInput";
import Modal from "@/components/organism/Modal";
import { useState } from "react";
import { FileArchive, QrCode } from "lucide-react";

import { PaymentScheduleRow } from "./types";
import { CreditCardInfo } from "@/types";
import { TitularInfo } from "@/hooks/useFetchCard";
// Props que recibe

type Props = {
  row: PaymentScheduleRow;
  creditCards: CreditCardInfo[];
  titularesData: TitularInfo[];
  paymentMethod: "card" | "link";
  onSave: (updated: PaymentScheduleRow) => void;
  onClose: () => void;
};

export default function PaymentRowModal({
  row,
  creditCards,
  titularesData,
  paymentMethod,
  onSave,
  onClose,
}: Props) {
  const [formData, setFormData] = useState(row);
  return (
    <Modal onClose={onClose} title="Datos de pago">
      <div className="max-h-[70vh] overflow-y-auto">
        <div className="flex flex-col gap-6 p-3">
          {paymentMethod === "card" && (
            <div className="flex flex-col gap-6">
              <label className="text-sm text-gray-900 font-medium">
                Selecciona como mostrar datos de tarjeta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={formData.useQR === "qr" ? "primary" : "secondary"}
                  icon={QrCode}
                  onClick={() => setFormData({ ...formData, useQR: "qr" })}
                >
                  Con QR
                </Button>

                <Button
                  variant={formData.useQR === "code" ? "primary" : "secondary"}
                  icon={FileArchive}
                  onClick={() => setFormData({ ...formData, useQR: "code" })}
                >
                  En archivo
                </Button>
              </div>
              <div className="flex flex-col md:flex-row items-end gap-4 ">
                <div className="flex-1 w-full">
                  <TextInput
                    label="Tipo de cargo"
                    value={formData.cargo}
                    onChange={(value) =>
                      setFormData({ ...formData, cargo: value })
                    }
                  />
                </div>

                <div className="w-full md:w-auto pb-2">
                  <CheckboxInput
                    label="Mostrar CVV"
                    checked={formData.isSecureCode}
                    onChange={(checked) =>
                      setFormData({ ...formData, isSecureCode: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <hr className="border-gray-300 my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateInput
              label="Ingresa la fecha"
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
            ></DateInput>
            {/* Para la hora */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Para seleccionar la tarjeta */}
            <DropdownValues
              label={"Selecciona una tarjeta"}
              value={formData.referencia_pago}
              onChange={(option) =>
                setFormData({
                  ...formData,
                  referencia_pago: option?.value ?? "",
                })
              }
              options={creditCards
                .filter((c) => c.activa === true)
                .map((c) => ({
                  value: c.id,
                  label: `${c.alias} -**** **** **** ${c.ultimos_4}`,
                  item: c,
                }))}
            ></DropdownValues>

            <DropdownValues
              label={"Titular"}
              value={formData.idTitular}
              onChange={(option) =>
                setFormData({
                  ...formData,
                  idTitular: option?.value ?? "",
                  document: option?.item?.identificacion ?? "",
                })
              }
              options={titularesData.map((t: any) => ({
                value: String(t.idTitular),
                label: t.Titular,
                item: t,
              }))}
            ></DropdownValues>
          </div>

          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <NumberInput
                label="Ingresa el monto"
                value={formData.amount}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    amount: value === "" ? "" : Number(value),
                  })
                }
              />
            </div>

            <Button
              variant="primary"
              onClick={() => {
                onSave(formData);
              }}
              className="w-full md:w-auto"
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
