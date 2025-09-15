"use client";
import { useEffect, useState } from "react";

/**
 * Selecciona el set de columnas según el ancho de pantalla.
 * Breakpoints: xs <640, sm ≥640, md ≥768, lg ≥1024, xl ≥1280
 */
export function useResponsiveColumns(opts: {
  xs: string[];
  sm?: string[];
  md?: string[];
  lg?: string[];
  xl?: string[];
}) {
  const [cols, setCols] = useState<string[]>(opts.xs);

  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      if (w >= 1280 && opts.xl) return setCols(opts.xl);
      if (w >= 1024 && opts.lg) return setCols(opts.lg);
      if (w >= 768 && opts.md) return setCols(opts.md);
      if (w >= 640 && opts.sm) return setCols(opts.sm);
      return setCols(opts.xs);
    };
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, [opts.xs, opts.sm, opts.md, opts.lg, opts.xl]);

  return cols;
}
