// components/atom/Button.tsx
"use client";

import React, {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  useMemo,
} from "react";
import { Link } from "wouter";

// -----------------------------------------
// Types
// -----------------------------------------
type Variant = "primary" | "secondary" | "ghost" | "warning" | "warning ghost";
type Size = "sm" | "md" | "lg" | "full";

interface CommonInteractiveElementProps {
  /**
   * Define el estilo visual del elemento.
   * 'primary': Elemento principal con el color blue-600.
   * 'secondary': Elemento secundario con un fondo gris claro.
   * 'ghost': Elemento transparente con texto blue-700 y borde transparente.
   * 'warning': rojo
   * 'warning ghost': texto neutro sin estilos (útil para icon-only)
   */
  variant?: Variant;
  size?: Size;

  /** Contenido del elemento */
  children?: React.ReactNode;

  /** Icono a renderizar (ej: lucide-react) */
  icon?: React.ElementType;

  /** Posición del icono */
  iconPosition?: "left" | "right";

  /** Estado loading (deshabilita y muestra spinner) */
  loading?: boolean;

  /** Clases extra */
  className?: string;

  /** Deshabilitado */
  disabled?: boolean;
}

// Button
type ButtonPropsWithoutChildren = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>;

interface InteractiveElementAsButtonProps
  extends CommonInteractiveElementProps, ButtonPropsWithoutChildren {
  as?: "button";
  href?: never;
}

// Link
interface InteractiveElementAsLinkProps
  extends
    CommonInteractiveElementProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  as: "link";
  href: string;
}

// Union
type InteractiveElementProps =
  | InteractiveElementAsButtonProps
  | InteractiveElementAsLinkProps;

// -----------------------------------------
// Helpers
// -----------------------------------------
const cn = (...parts: Array<string | undefined | null | false>) =>
  parts.filter(Boolean).join(" ");

const Spinner: React.FC<{ size?: Size }> = ({ size = "md" }) => {
  const s = size === "sm" ? "w-4 h-4" : "w-4 h-4";
  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-current border-t-transparent animate-spin",
        s,
      )}
      aria-hidden="true"
    />
  );
};

// -----------------------------------------
// Component
// -----------------------------------------
const Button: React.FC<InteractiveElementProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  loading = false,
  as = "button",
  href,
  icon,
  iconPosition = "left",
  ...rest
}) => {
  const isDisabled = !!disabled || !!loading;

  // Base: más “pro”, consistente con tus tablas/modales (rounded-lg, focus ring, shadow sutil, active)
  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2",
    "rounded-lg font-medium",
    "transition-all duration-200 ease-in-out",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "select-none whitespace-nowrap",
    "shadow-sm hover:shadow",
    "active:scale-[0.98]",
  );

  const sizeClasses: Record<Size, string> = {
    sm: "h-6 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
    full: "w-full h-12 px-6 text-base",
  };

  // Variantes con estados coherentes
  const variantClasses: Record<Variant, string> = {
    primary: cn(
      "bg-blue-600 text-white border border-blue-600",
      "hover:bg-blue-700 hover:border-blue-700",
      "focus:ring-blue-200",
      "active:bg-blue-800",
    ),

    secondary: cn(
      "bg-white text-gray-900 border border-gray-200",
      "hover:bg-gray-50",
      "focus:ring-gray-200",
      "active:bg-gray-100",
    ),

    ghost: cn(
      "bg-transparent text-blue-700 border border-transparent",
      "hover:bg-blue-50",
      "focus:ring-blue-200",
      "active:bg-blue-100",
    ),

    warning: cn(
      "bg-red-600 text-white border border-red-600",
      "hover:bg-red-700 hover:border-red-700",
      "focus:ring-red-200",
      "active:bg-red-800",
    ),

    // Útil para icon-only o acciones sin estilos (no ring, no bg)
    "warning ghost": cn(
      "bg-transparent text-gray-700 border border-transparent",
      "hover:bg-transparent",
      "focus:ring-0 focus:ring-offset-0",
      "active:bg-transparent",
    ),
  };

  const disabledClasses = cn(
    "opacity-60 cursor-not-allowed",
    // evita hover/active “raros”
    "hover:shadow-sm active:scale-100",
  );

  const combinedClasses = useMemo(
    () =>
      cn(
        baseClasses,
        sizeClasses[size],
        isDisabled ? disabledClasses : variantClasses[variant],
        className,
      ),
    [
      baseClasses,
      sizeClasses,
      size,
      isDisabled,
      disabledClasses,
      variantClasses,
      variant,
      className,
    ],
  );

  // Icono (si viene)
  const Icon = icon as any;

  const content = (
    <>
      {Icon && iconPosition === "left" && (
        <span className="shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
      )}

      {loading && <Spinner size={size} />}

      {children != null && children !== "" && <span>{children}</span>}

      {Icon && iconPosition === "right" && (
        <span className="shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
      )}
    </>
  );

  // ---------------- Link (wouter) ----------------
  if (as === "link") {
    const linkProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <Link
        href={isDisabled ? "#" : (href as string)}
        className={combinedClasses}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          if (linkProps.onClick) linkProps.onClick(e);
        }}
        {...linkProps}
      >
        {content}
      </Link>
    );
  }

  // ---------------- Button ----------------
  const btnProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={combinedClasses} disabled={isDisabled} {...btnProps}>
      {content}
    </button>
  );
};

export default Button;
