"use client";
import { useEffect, useState } from "react";
import { UploadCloud, FileCheck, FileText } from "lucide-react";
import { Modal } from "@/angel/components/molecules/Modal";
import { dispersionService } from "@/angel/services/dispersion";
import { subirArchivoAS3Seguro } from "@/lib/utils";
import { TextInput } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import { useAlert } from "@/context/useAlert";

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_SIZE = 10 * 1024 * 1024;

const validarArchivo = (file: File): string | null => {
  const nombre = file.name.toLowerCase();
  const extensionValida = ALLOWED_EXTENSIONS.some((ext) =>
    nombre.endsWith(ext),
  );
  if (!extensionValida) {
    return `El archivo "${file.name}" debe ser PDF o imagen (PNG, JPG, JPEG, WEBP).`;
  }
  if (file.size > MAX_SIZE) {
    return "El archivo es demasiado grande. Máximo 10MB.";
  }
  return null;
};

interface SubirComprobanteDispersionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ids: number[];
  totalMonto?: number;
}

export const SubirComprobanteDispersionModal = ({
  open,
  onClose,
  onSuccess,
  ids,
  totalMonto,
}: SubirComprobanteDispersionModalProps) => {
  const { success } = useAlert();
  const [file, setFile] = useState<File | null>(null);
  const [concepto, setConcepto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const esImagen = file
    ? IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    : false;

  const resetInterno = () => {
    setFile(null);
    setConcepto("");
    setFormError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetInterno();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    const error = validarArchivo(selected);
    if (error) {
      setFormError(error);
      setFile(null);
      return;
    }
    setFormError(null);
    setFile(selected);
  };

  const handleSubmit = () => {
    if (!file) {
      setFormError("Selecciona un archivo de comprobante.");
      return;
    }
    setFormError(null);
    setSubmitting(true);

    subirArchivoAS3Seguro(file)
      .then((url_pdf) =>
        dispersionService.pagar({
          ids_dispersion: ids,
          url_pdf,
          concepto: concepto.trim() || undefined,
        }),
      )
      .then(() => {
        success("Comprobante subido correctamente.");
        resetInterno();
        onSuccess();
      })
      .catch((err) =>
        setFormError(err.message || "Error al subir el comprobante."),
      )
      .finally(() => setSubmitting(false));
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Subir comprobante"
      description={`${ids.length} dispersión${ids.length !== 1 ? "es" : ""}${
        totalMonto != null ? ` · Total: $${totalMonto.toFixed(2)}` : ""
      }`}
      className="max-w-md"
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Subiendo..." : "Subir comprobante"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-900 font-medium mb-1">
            Archivo del comprobante
          </p>
          <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
            {file ? (
              <FileCheck className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <UploadCloud className="w-5 h-5 text-gray-400 shrink-0" />
            )}
            <span className="text-sm text-gray-600 truncate">
              {file ? file.name : "PDF o imagen, máximo 10MB"}
            </span>
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && previewUrl && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
              {esImagen ? (
                <img
                  src={previewUrl}
                  alt="Vista previa del comprobante"
                  className="max-h-64 w-full rounded-md object-contain"
                />
              ) : (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  Ver &quot;{file.name}&quot;
                </a>
              )}
            </div>
          )}
        </div>

        <TextInput
          label="Concepto (opcional)"
          value={concepto}
          onChange={setConcepto}
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </div>
    </Modal>
  );
};
