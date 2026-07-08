import React, { forwardRef } from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
  children: React.ReactNode;
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
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg ${className ?? ""}`}
        {...props}
      >
        <div className={`p-6 ${contentClassName ?? ""}`}>
          {(title || subtitle || badge) && (
            <div className="flex items-start justify-between">
              <div>
                {title}
                {subtitle}
              </div>

              {badge}
            </div>
          )}

          <div className={title || subtitle || badge ? "mt-6" : ""}>
            {children}
          </div>

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    );
  },
);

BaseCard.displayName = "BaseCard";

export default BaseCard;
