import { ReactNode, ComponentType } from "react";

type FieldSetProps = {
  legend: ReactNode;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
};

export function SectionForm({
  legend,
  icon: Icon,
  children,
  className,
}: FieldSetProps) {
  return (
    <div className={`rounded-md p-4 bg-sky-50 w-full ${className || ""}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <Icon className="w-4 h-4 mr-2 text-gray-800" />
        {legend}
      </h3>
      <div className="@container border-t border-gray-200 pt-2 flex-1">
        {children}
      </div>
    </div>
  );
}
