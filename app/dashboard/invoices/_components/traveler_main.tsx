"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TravelerTable } from "../_components/traveler_table";
import { TravelerFilters } from "../_components/traveler_filters";
import Filters from "@/components/Filters";
import { TravelerDialog } from "../_components/traveler_dialog";
import { Factura } from "@/types/_types";
import { fetchFacturas } from "@/services/facturas";
const defaultFiltersFacturas = {
  estatusFactura: null
}
export function TravelersPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(defaultFiltersFacturas);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filteredFacturas, setFilteredFacturas] = useState<Factura[]>([]); // Nuevo estado

  const handleFilter = (filters) => {
    setIsLoading(true);
    setIsFilterActive(true);
    setActiveFilters(filters);
    setSortField(null);
    setSortDirection("asc");
    handleFetchFacturas(filters);
  };

  const handleFetchFacturas = (filters) => {
    fetchFacturas(filters, (data) => {
      console.log(data)
      setFilteredFacturas(data); // Actualiza el estado con las facturas filtradas
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (isFilterActive) {
      handleFetchFacturas(defaultFiltersFacturas);
    }
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Facturas
      </h1>
      <Card>
        <div className="p-6 space-y-4">
          <Filters
            defaultFilters={defaultFiltersFacturas}
            onFilter={handleFilter}
            defaultOpen={false}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
          <TravelerTable facturas={filteredFacturas} /> {/* Usa el estado filtrado */}
        </div>
      </Card>

      {/* <TravelerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      /> */}
    </div>
  );
}
