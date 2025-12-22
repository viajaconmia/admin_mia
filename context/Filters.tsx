"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

type FiltersContextType = {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
};

const FilterContext = createContext<FiltersContextType>({
  search: "",
  setSearch: null,
});

export function HotelProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState<string>("");

  const value: FiltersContextType = {
    search,
    setSearch,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FiltersContextType {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un HotelProvider");
  }
  return context;
}
