// components/atom/CheckIcon.tsx

"use client";

import React from "react";

type CheckIconSize = "sm" | "md" | "lg" | "xl";

interface CheckIconProps {
  size?: CheckIconSize;
  text?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
}

const sizeClasses: Record<CheckIconSize, string> = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const CheckIcon: React.FC<CheckIconProps> = ({
  size = "md",
  text,
  active = false,
  onClick,
  className = "",
  textClassName = "",
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) {
          onClick?.();
        }
      }}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2
        transition-opacity
        ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
      `}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`
          shrink-0
          ${sizeClasses[size]}
          ${active ? "text-green-500" : "text-gray-300"}
          ${className}
        `}
        aria-hidden="true"
      >
        <path
          d="M15 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {active && (
          <path
            d="M7.5 11.5L11 15l9-10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {text && (
        <span
          className={`
            text-sm font-medium
            ${active ? "text-gray-800" : "text-gray-500"}
            ${textClassName}
          `}
        >
          {text}
        </span>
      )}
    </button>
  );
};

export default CheckIcon;
