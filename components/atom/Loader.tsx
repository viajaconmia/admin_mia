import React from "react";

// Definimos las props que nuestro componente Loader puede aceptar
interface LoaderProps {
  size?: number; // Tamaño del spinner en píxeles
  color?: string; // Color del spinner
  thickness?: number; // Grosor del spinner en píxeles
  text?: string; // Texto opcional para mostrar debajo del spinner
  className?: string; // Para clases CSS adicionales si se necesitan
  style?: React.CSSProperties; // Para estilos inline adicionales
}

export const Loader: React.FC<LoaderProps> = ({
  size = 40, // Valor por defecto para el tamaño
  color = "#007bff", // Color azul por defecto (Bootstrap primary)
  thickness = 4, // Grosor por defecto
  text,
  className = "",
  style = {},
}) => {
  // Estilos para el contenedor principal del loader (spinner + texto)
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ...style, // Permite fusionar estilos pasados como prop
  };

  // Estilos para el spinner
  const spinnerStyle: React.CSSProperties = {
    border: `${thickness}px solid rgba(0, 0, 0, 0.1)`, // Borde ligero
    borderTopColor: color, // Borde superior con el color principal
    borderRadius: "50%",
    width: `${size}px`,
    height: `${size}px`,
    animation: "spin 1s linear infinite",
  };

  // Estilos para el texto opcional
  const textStyle: React.CSSProperties = {
    marginTop: "10px",
    fontSize: "0.9rem",
    color: "#333", // Un color de texto genérico
  };

  return (
    <div
      style={containerStyle}
      className={`loader-container ${className}`}
      role="status"
      aria-live="polite"
    >
      <div style={spinnerStyle} className="loader-spinner">
        <span className="visually-hidden">Cargando...</span>{" "}
        {/* Para accesibilidad */}
      </div>
      {text && (
        <div style={textStyle} className="loader-text">
          {text}
        </div>
      )}

      {/* Keyframes para la animación del spinner (se inyectan en el <style> del head) */}
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            padding: 0;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
          }
        `}
      </style>
    </div>
  );
};
