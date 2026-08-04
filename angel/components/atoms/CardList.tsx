"use client";
import { type ReactNode } from "react";
import { EmptyState } from "./EmptyState";

interface CardListProps<T extends Record<string, unknown>> {
  registros: T[];
  renderCard: (item: T, index: number) => ReactNode;
  rowClassName?: (item: T) => string;
  maxHeight?: string;
}

export const CardList = <T extends Record<string, unknown>>({
  registros,
  renderCard,
  rowClassName,
  maxHeight = "28rem",
}: CardListProps<T>) => {
  if (!registros.length) return <EmptyState />;

  return (
    <div
      className="overflow-y-auto flex flex-col gap-2 w-full"
      style={{ maxHeight }}
    >
      {registros.map((item, index) => (
        <div key={index} className={rowClassName?.(item) ?? ""}>
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  );
};
