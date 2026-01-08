"use client";

import Button from "@/components/atom/Button";
import { useNotification } from "@/context/useNotificacion";
import { subirArchivoAS3Seguro } from "@/lib/utils";
import { useState } from "react";
import Modal from "../organism/Modal";
import { CheckCircle2, X } from "lucide-react";

/**
 * Componente de entrada de archivo para cargar archivos PDF a Amazon S3
 *
 * @component
 * @description
 * Proporciona un campo de entrada de archivo que valida que el usuario solo pueda seleccionar archivos PDF.
 * Muestra un modal de confirmación antes de subir el archivo a S3 y notifica al usuario sobre el resultado
 * de la operación (éxito o error).
 *
 * @param {Object} props - Props del componente
 * @param {Function} props.setUrl - Callback que recibe la URL del archivo subido a S3 o null si se cancela
 * @returns {JSX.Element} Elemento del componente con input de archivo y modal de confirmación
 *
 * @example
 * ```tsx
 * const [documentUrl, setDocumentUrl] = useState<string | null>(null);
 *
 * return (
 *   <InputToS3
 *     setUrl={(url) => {
 *       setDocumentUrl(url);
 *       console.log("Archivo subido a:", url);
 *     }}
 *   />
 * );
 * ```
 *
 * @throws {Error} Cuando la carga a S3 falla, muestra una notificación con el mensaje de error
 *
 * @remarks
 * - Solo acepta archivos PDF (validación por tipo MIME)
 * - Requiere el hook `useNotification` para mostrar mensajes al usuario
 * - Requiere la función `subirArchivoAS3Seguro` para subir a S3
 * - Muestra un modal de confirmación antes de procesar la carga
 */
export const InputToS3 = ({
  setUrl,
}: {
  setUrl: (url: string | null) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const { showNotification } = useNotification();

  const onCancel = () => {
    setShowModal(false);
  };

  const onConfirm = async () => {
    try {
      const url = await subirArchivoAS3Seguro(file);
      setShowModal(false);
      setUrl(url);
    } catch (error) {
      showNotification("error", error.message || "error subiendo el archivo");
    }
  };

  return (
    <>
      <input
        type="file"
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors
        file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5
        file:text-sm file:font-medium file:text-gray-900
        hover:file:bg-gray-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60"
        onChange={(e) => {
          const current = e.target.files?.[0] || null;
          if (!current) {
            setUrl(null);
            return;
          }
          if (!["text/pdf", "application/pdf"].includes(current.type)) {
            alert("Por favor, sube solo archivos PDF");
            e.target.value = "";
            setFile(null);
            return;
          }
          setFile(current);
          setShowModal(true);
        }}
      />
      {showModal && (
        <Modal
          onClose={onCancel}
          title={`¿Estas seguro que quieres subir este archivo?`}
        >
          <div className="flex gap-8 justify-center items-center">
            <Button onClick={onConfirm} icon={CheckCircle2}>
              Confirmar
            </Button>
            <Button onClick={onCancel} variant="warning" icon={X}>
              Cancelar
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};
