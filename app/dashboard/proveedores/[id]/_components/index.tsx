import Button from "@/components/atom/Button";
import { TextAreaInput, TextInput } from "@/components/atom/Input";
import { separarByEspacios } from "@/lib/utils";
import { DatosFiscales, ProveedorCuenta } from "@/services/ProveedoresService";
import { Plus, ReceiptText, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ModalCrearDatosFiscalesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (datos: DatosFiscales) => void;
  id_proveedor: number;
  selectedFiscal: DatosFiscales | null;
}

export const ModalCrearDatosFiscales = ({
  isOpen,
  onClose,
  onSave,
  id_proveedor,
  selectedFiscal,
}: ModalCrearDatosFiscalesProps) => {
  const [formData, setFormData] = useState<Partial<DatosFiscales>>({
    rfc: "",
    alias: "",
    razon_social: "",
  });

  const handleChange = (field: keyof DatosFiscales, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (!formData.rfc || !formData.razon_social) {
      alert("rfc y razon social es obligatorio");
      return;
    }
    onSave({ ...formData, id_proveedor } as DatosFiscales);
  };

  useEffect(() => {
    if (selectedFiscal) {
      setFormData(selectedFiscal); // Si recibimos datos, los ponemos en el form
    } else {
      setFormData({
        rfc: "",
        alias: "",
        razon_social: "",
      });
    }
  }, [selectedFiscal, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header con estilo más limpio */}
        <div className="p-5 border-b flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ReceiptText size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Nueva Información Fiscal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <TextInput
                label="Razon social"
                value={formData.razon_social || ""}
                onChange={(v) => handleChange("razon_social", v)}
                placeholder="Ej: NOKTOS SA de CV"
              />
            </div>
            <div className="col-span-1">
              <TextInput
                label="rfc *"
                value={formData.rfc || ""}
                onChange={(v) => handleChange("rfc", v)}
                placeholder="XAXX010101000"
              />
            </div>
            <div className="col-span-1">
              <TextInput
                label="Alias del registro"
                value={formData.alias || ""}
                onChange={(v) => handleChange("alias", v)}
                placeholder="Ej: Cuenta Principal"
              />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} icon={Plus} size="sm">
            Guardar Información
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ModalCrearCuentasProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (datos: ProveedorCuenta) => void;
  id_proveedor: number;
  selectedCuenta: ProveedorCuenta | null;
}

export const ModalCuentasCRUD = ({
  isOpen,
  onClose,
  onSave,
  id_proveedor,
  selectedCuenta,
}: ModalCrearCuentasProps) => {
  const [formData, setFormData] = useState<Partial<ProveedorCuenta>>({
    banco: "",
    comentarios: "",
    alias: "",
    cuenta: "",
    titular: "",
  });

  const handleChange = (field: keyof ProveedorCuenta, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (!formData.cuenta || !formData.titular || !formData.banco) {
      alert(
        "El numero de cuenta, el titular y el banco son obligatorios es obligatorio"
      );
      return;
    }
    onSave({ ...formData, id_proveedor } as ProveedorCuenta);
  };

  useEffect(() => {
    if (selectedCuenta) {
      setFormData(selectedCuenta); // Si recibimos datos, los ponemos en el form
    } else {
      setFormData({
        banco: "",
        comentarios: "",
        alias: "",
        cuenta: "",
        titular: "",
      });
    }
  }, [selectedCuenta, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header con estilo más limpio */}
        <div className="p-5 border-b flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ReceiptText size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Nueva Cuenta</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <TextInput
                label="Número de cuenta"
                value={separarByEspacios(formData.cuenta || "", 4)}
                onChange={(v) => {
                  handleChange("cuenta", separarByEspacios(v, 4));
                }}
                placeholder="4242 4242 4242 4242"
              />
            </div>
            <TextInput
              label="Banco"
              value={formData.banco || ""}
              onChange={(v) => handleChange("banco", v)}
              placeholder="BBVA..."
            />
            <TextInput
              label="Alias del registro"
              value={formData.alias || ""}
              onChange={(v) => handleChange("alias", v)}
              placeholder="Ej: Cuenta Principal"
            />
            <TextInput
              label="Titular"
              value={formData.titular || ""}
              onChange={(v) => handleChange("titular", v)}
              placeholder="Ernesto Bravo"
            />
            <TextAreaInput
              label="Comentarios"
              className="md:col-span-3"
              value={formData.comentarios || ""}
              onChange={(v) => handleChange("comentarios", v)}
            />
          </div>
        </div>
        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} icon={Plus} size="sm">
            Guardar Información
          </Button>
        </div>
      </div>
    </div>
  );
};
