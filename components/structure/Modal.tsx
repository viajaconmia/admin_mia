"use client";
import React, { ReactNode, useEffect } from "react";

interface ModalProps {
  onClose: () => void;
  title?: string;
  children: ReactNode;
  subtitle?: string;
}

const Modal: React.FC<ModalProps> = ({
  onClose,
  title,
  children,
  subtitle,
}) => {
  useEffect(() => {
    // Función para agregar la clase al body
    const addBodyClass = () => {
      document.body.classList.add("modal-open-no-scroll");
    };

    // Función para remover la clase del body
    const removeBodyClass = () => {
      document.body.classList.remove("modal-open-no-scroll");
    };

    // Aplicar o remover la clase basado en el estado 'isOpen'
    addBodyClass();

    // Limpieza: se ejecuta cuando el componente se desmonta o antes de que el efecto se ejecute de nuevo
    return () => {
      removeBodyClass(); // Asegúrate de remover la clase si el modal se desmonta estando abierto
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fondo oscuro */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      {/* Contenido del modal */}
      <div
        className="relative bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-fit max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cerrar */}
        <button
          type="button"
          className="absolute right-2 top-2 p-2 text-lg font-bold"
          aria-label="Cerrar"
          onClick={onClose}
        >
          ×
        </button>
        <div className="p-4 space-y-2">
          {title && (
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          <div className="w-full max-h-[600px] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
