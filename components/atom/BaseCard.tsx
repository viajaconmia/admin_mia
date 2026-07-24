import React, { forwardRef } from "react";

type CardColor =
  | "orange"
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "yellow"
  | "sky";

type CardProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
  children: React.ReactNode;
  color?: CardColor;
  bodyGapClassName?: string;
};

const styles: Record<CardColor, string> = {
  orange: "border bg-orange-50 border-orange-100 text-orange-700",
  blue: "border bg-blue-50 border-blue-100 text-blue-700",
  green: "border bg-green-50 border-green-100 text-green-700",
  red: "border bg-red-50 border-red-100 text-red-700",
  purple: "border bg-purple-50 border-purple-100 text-purple-700",
  yellow: "border bg-yellow-50 border-yellow-100 text-yellow-700",
  sky: "border bg-sky-50 border-sky-100 text-sky-700",
};

const BaseCard = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      title,
      subtitle,
      badge,
      footer,
      children,
      className,
      contentClassName,
      color,
      bodyGapClassName = "mt-6",
      ...props
    },
    ref,
  ) => {
    const hasHeader = Boolean(title || subtitle || badge);

    return (
      <div
        ref={ref}
        className={`rounded-lg shadow-sm transition-all hover:shadow-lg ${
          color ? styles[color] : "bg-white border border-slate-200"
        } ${className ?? ""}`}
        {...props}
      >
        <div className={`p-6 ${contentClassName ?? ""}`}>
          {hasHeader && (
            <div className="flex items-start justify-between">
              <div>
                {title}
                {subtitle}
              </div>

              {badge}
            </div>
          )}

          <div className={hasHeader ? bodyGapClassName : ""}>{children}</div>

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    );
  },
);

BaseCard.displayName = "BaseCard";

export default BaseCard;
