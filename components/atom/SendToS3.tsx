// "use client";

// import Button from "@/components/atom/Button";
// import { useAlert } from "@/context/useAlert";
// import { subirArchivoAS3Seguro } from "@/lib/utils";
// import { useState } from "react";
// import Modal from "../organism/Modal";
// import { CheckCircle2, X } from "lucide-react";

// /**
//  * Componente de entrada de archivo para cargar archivos PDF a Amazon S3
//  *
//  * @component
//  * @description
//  * Proporciona un campo de entrada de archivo que valida que el usuario solo pueda seleccionar archivos PDF.
//  * Muestra un modal de confirmación antes de subir el archivo a S3 y notifica al usuario sobre el resultado
//  * de la operación (éxito o error).
//  *
//  * @param {Object} props - Props del componente
//  * @param {Function} props.setUrl - Callback que recibe la URL del archivo subido a S3 o null si se cancela
//  * @returns {JSX.Element} Elemento del componente con input de archivo y modal de confirmación
//  *
//  * @example
//  * ```tsx
//  * const [documentUrl, setDocumentUrl] = useState<string | null>(null);
//  *
//  * return (
//  *   <InputToS3
//  *     setUrl={(url) => {
//  *       setDocumentUrl(url);
//  *       console.log("Archivo subido a:", url);
//  *     }}
//  *   />
//  * );
//  * ```
//  *
//  * @throws {Error} Cuando la carga a S3 falla, muestra una notificación con el mensaje de error
//  *
//  * @remarks
//  * - Solo acepta archivos PDF (validación por tipo MIME)
//  * - Requiere el hook `useAlert` para mostrar mensajes al usuario
//  * - Requiere la función `subirArchivoAS3Seguro` para subir a S3
//  * - Muestra un modal de confirmación antes de procesar la carga
//  */
// export const InputToS3 = ({
//   setUrl,
// }: {
//   setUrl: (url: string | null) => void;
// }) => {
//   const [file, setFile] = useState<File | null>(null);
//   const [showModal, setShowModal] = useState<boolean>(false);
//   const { showNotification } = useAlert();

//   const onCancel = () => {
//     setShowModal(false);
//   };

//   const onConfirm = async () => {
//     try {
//       const url = await subirArchivoAS3Seguro(file);
//       setShowModal(false);
//       setUrl(url);
//     } catch (error) {
//       showNotification("error", error.message || "error subiendo el archivo");
//     }
//   };

//   return (
//     <>
//       <input
//         type="file"
//         className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors
//         file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5
//         file:text-sm file:font-medium file:text-gray-900
//         hover:file:bg-gray-200
//         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
//         disabled:cursor-not-allowed disabled:opacity-60"
//         onChange={(e) => {
//           const current = e.target.files?.[0] || null;
//           if (!current) {
//             setUrl(null);
//             return;
//           }
//           if (!["text/pdf", "application/pdf"].includes(current.type)) {
//             alert("Por favor, sube solo archivos PDF");
//             e.target.value = "";
//             setFile(null);
//             return;
//           }
//           setFile(current);
//           setShowModal(true);
//         }}
//       />
//       {showModal && (
//         <Modal
//           onClose={onCancel}
//           title={`¿Estas seguro que quieres subir este archivo?`}
//         >
//           <div className="flex gap-8 justify-center items-center">
//             <Button onClick={onConfirm} icon={CheckCircle2}>
//               Confirmar
//             </Button>
//             <Button onClick={onCancel} variant="warning" icon={X}>
//               Cancelar
//             </Button>
//           </div>
//         </Modal>
//       )}
//     </>
//   );
// };

"use client";

import Button from "@/components/atom/Button";
import { useAlert } from "@/context/useAlert";
import { subirArchivoAS3Seguro } from "@/lib/utils";
import { useRef, useState } from "react";
import Modal from "../organism/Modal";
import { CheckCircle2, X } from "lucide-react";

export type TipoArchivoS3 = "pdf" | "image";

const REGLAS: Record<
  TipoArchivoS3,
  { accept: string[]; mimes: string[]; exts: string[]; label: string }
> = {
  pdf: {
    accept: ["application/pdf", ".pdf"],
    mimes: ["application/pdf", "text/pdf"],
    exts: [".pdf"],
    label: "PDF",
  },
  image: {
    accept: [
      "image/png",
      "image/jpeg",
      "image/webp",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
    ],
    mimes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    exts: [".png", ".jpg", ".jpeg", ".webp"],
    label: "imagen (PNG, JPG o WEBP)",
  },
};

export const InputToS3 = ({
  setUrl,
  allow = ["pdf"],
}: {
  setUrl: (url: string | null) => void;
  /** Tipos de archivo permitidos. Por defecto solo PDF. */
  allow?: TipoArchivoS3[];
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const { showNotification } = useAlert();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reglas = allow.map((tipo) => REGLAS[tipo]);
  const accept = reglas.flatMap((r) => r.accept).join(",");
  const etiquetas = reglas.map((r) => r.label).join(" o ");

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
  };

  const esPermitido = (f: File) => {
    const name = (f.name || "").toLowerCase();
    const mime = (f.type || "").toLowerCase();
    return reglas.some(
      (r) => r.mimes.includes(mime) || r.exts.some((ext) => name.endsWith(ext)),
    );
  };

  const onCancel = () => {
    setShowModal(false);
    // si cancelas, no guardamos nada
    // (si quieres limpiar selección al cancelar, descomenta)
    // resetInput();
  };

  const onConfirm = async () => {
    try {
      if (!file) {
        showNotification(
          "error",
          `Selecciona un archivo ${etiquetas} antes de confirmar`,
        );
        return;
      }

      const url = await subirArchivoAS3Seguro(file);
      setShowModal(false);
      setUrl(url);
      // opcional: limpiar el input después de subir
      resetInput();
    } catch (error: any) {
      showNotification("error", error?.message || "Error subiendo el archivo");
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
            resetInput();
            return;
          }

          if (!esPermitido(current)) {
            showNotification(
              "error",
              `Formato no permitido (${current.type || "desconocido"}). Sube un archivo ${etiquetas}.`,
            );
            setUrl(null);
            setShowModal(false);
            resetInput();
            return;
          }

          setFile(current);
          setShowModal(true);
        }}
      />

      {showModal && (
        <Modal
          onClose={onCancel}
          title="¿Estas seguro que quieres subir este archivo?"
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
