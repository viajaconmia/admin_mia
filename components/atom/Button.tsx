import React, { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { Link } from "wouter";

// Define la interfaz base para las propiedades comunes a ambos tipos
interface CommonInteractiveElementProps {
  /**
   * Define el estilo visual del elemento.
   * 'primary': Elemento principal con el color blue-600.
   * 'secondary': Elemento secundario con un fondo gris claro.
   * 'ghost': Elemento transparente con texto blue-700 y borde transparente.
   */
  variant?: "primary" | "secondary" | "ghost" | "warning";
  size?: "sm" | "md" | "lg" | "full";
  /**
   * Contenido del elemento (texto, otros elementos, etc.).
   */
  children?: React.ReactNode;
  /**
   * Un elemento React (como un componente de icono SVG) para mostrar junto al texto.
   */
  icon?: React.ElementType;
  /**
   * Clases adicionales de Tailwind CSS para personalizar el elemento.
   */
  className?: string;
  /**
   * Indica si el elemento está deshabilitado.
   */
  disabled?: boolean;
}

// Interfaz para cuando el componente es un <button>
type ButtonPropsWithoutChildren = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>;

interface InteractiveElementAsButtonProps
  extends CommonInteractiveElementProps,
    ButtonPropsWithoutChildren {
  as?: "button"; // Indica explícitamente que será un botón HTML
  href?: never; // No debe tener href si es un botón
}

// Interfaz para cuando el componente es un <Link> de Wouter
interface InteractiveElementAsLinkProps
  extends CommonInteractiveElementProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  as: "link"; // Indica explícitamente que será un enlace de Wouter
  href: string; // Requiere href si es un enlace
}

// Union de tipos para permitir ambos casos
type InteractiveElementProps =
  | InteractiveElementAsButtonProps
  | InteractiveElementAsLinkProps;

/**
 * Componente interactivo reutilizable con estilos primario, secundario y ghost.
 * Puede renderizarse como un botón HTML o un Link de Wouter.
 * Soporta la adición de íconos y es totalmente responsivo con Tailwind CSS.
 */
const InteractiveElement: React.FC<InteractiveElementProps> = ({
  variant = "primary", // Valor por defecto para el estilo
  children,
  className = "",
  size = "md",
  disabled,
  as = "button", // Por defecto, será un botón HTML
  href,
  ...rest
}) => {
  // Clases base para todos los elementos interactivos
  const baseClasses = `
    flex items-center justify-center rounded-md
    font-normal
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    whitespace-nowrap
    ${
      disabled &&
      "opacity-70 cursor-not-allowed hover:bg-gray-50 hover:text-gray-600 text-gray-500"
    }
  `;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-4 py-2", // ya es tu base
    lg: "text-base px-6 py-3",
    full: "w-full text-base px-6 py-3",
  };

  // Clases específicas para cada variante
  const variantClasses = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:bg-blue-900
      active:bg-blue-800
      border border-transparent
    `,
    secondary: `
      bg-gray-200 text-gray-800
      hover:bg-gray-300
      focus:bg-gray-500
      active:bg-gray-400
      border border-transparent
    `,
    ghost: `
      bg-transparent text-blue-700
      hover:bg-blue-50 hover:text-blue-700
      focus:bg-blue-100 focus:text-blue-800
      border border-transparent
      active:bg-blue-200
      active:text-blue-800
    `,
    warning: `
      bg-red-600 text-gray-50
      hover:bg-red-700
      focus:bg-red-900
      border border-transparent
      active:bg-red-800
      active:text-gray-50
    `,
  };

  const combinedClasses = `${baseClasses} ${
    disabled ? "" : variantClasses[variant]
  } ${sizeClasses[size]} ${className} `;

  // Contenido interno (ícono y texto)
  const content = (
    <>
      {rest.icon && (
        <span className={`${rest.icon && children && "mr-2"}`}>
          {<rest.icon className="w-4 h-4" />}
        </span>
      )}
      {children}
    </>
  );

  if (as === "link") {
    // Si 'as' es 'link', renderiza como un Link de Wouter
    return (
      <Link
        href={disabled ? "#" : (href as string)} // Si está deshabilitado, lo hacemos que no navegue
        className={combinedClasses}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault(); // Previene la navegación si está deshabilitado
          }
          // Si hay un onClick en `rest` (del AnchorHTMLAttributes), llámalo
          if (rest.onClick && !disabled) {
            (rest.onClick as React.MouseEventHandler<HTMLAnchorElement>)(e);
          }
        }}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} // Asegura que se pasen las props correctas
      >
        {content}
      </Link>
    );
  }

  // Por defecto, o si 'as' es 'button', renderiza como un botón HTML
  return (
    <button
      className={`${combinedClasses} `}
      disabled={disabled}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} // Asegura que se pasen las props correctas
    >
      {content}
    </button>
  );
};

export default InteractiveElement;
