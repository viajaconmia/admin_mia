"use client";
import { useState, useEffect, useMemo } from "react";
import { HotelTable, FullHotelData, isHotelComplete } from "./hotel-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HotelDialog } from "./hotel-dialog";
import { AddHotelDialog } from "./addHotelDialog";
import Filters from "@/components/Filters";
import { fetchHotelesFiltro_Avanzado } from "@/services/hoteles";

const defaultFiltersHoteles = {
  nombre: null,
  hay_convenio: null,
  tipo_negociacion: null,
  estado: null,
  sencilla_precio_min: null,
  sencilla_precio_max: null,
  sencilla_costo_min: null,
  sencilla_costo_max: null,
  doble_precio_min: null,
  doble_precio_max: null,
  doble_costo_min: null,
  doble_costo_max: null,
  incluye_desayuno: null,
  acepta_mascotas: null,
  tiene_transportacion: null,
  tipo_pago: null,
  rfc: null,
  razon_social: null,
  tipo_hospedaje: null,
  infoCompleta: null,
  activo: null,
  pais: null,
};

export function HotelContainer() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hotels, setHotels] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(defaultFiltersHoteles);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleFilter = (filters) => {
    setIsLoading(true);
    setIsFilterActive(true);
    setActiveFilters(filters);
    setCurrentPage(1);
    setSortField(null);
    setSortDirection("asc");

    const infoCompletaFilter = filters.infoCompleta;
    const apiFilters = { ...filters };
    delete apiFilters.infoCompleta;

    fetchHotelesFiltro_Avanzado(apiFilters, (data) => {
      const fetchedHotels = data || []
        // Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];

      if (infoCompletaFilter !== null && infoCompletaFilter !== undefined) {
        const filtered = fetchedHotels.filter(
          (hotel) => isHotelComplete(hotel) === infoCompletaFilter
        );
        setHotels(filtered);
      } else {
        setHotels(fetchedHotels);
      }

      setIsLoading(false);
    });
  };

  const handleClearFilters = () => {
    setIsFilterActive(false);
    setActiveFilters(defaultFiltersHoteles);
    setSortField(null);
    setSortDirection("asc");
    setCurrentPage(1);
    handleFilter(defaultFiltersHoteles);
  };

  const sortedHotels = useMemo(() => {
    if (!sortField) return hotels;
    return [...hotels].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [hotels, sortField, sortDirection]);

  const sourceData = sortField ? sortedHotels : hotels;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredData = sourceData.filter(
    (item) =>
      item.nombre?.toUpperCase().includes(searchTerm.toUpperCase()) ||
      item.Ciudad_Zona?.toUpperCase().includes(searchTerm.toUpperCase()) ||
      item.tipo_negociacion?.toUpperCase().includes(searchTerm.toUpperCase()) ||
      item.Estado?.toUpperCase().includes(searchTerm.toUpperCase()) ||
      item.contacto_convenio
        ?.toUpperCase()
        .includes(searchTerm.toUpperCase()) ||
      item.contacto_recepcion
        ?.toUpperCase()
        .includes(searchTerm.toUpperCase()) ||
      item.precio_doble?.includes(searchTerm) ||
      item.precio_sencilla?.includes(searchTerm) ||
      item.costo_sencilla?.includes(searchTerm) ||
      item.costo_doble?.includes(searchTerm)
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentHotels = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleRowClick = (hotel) => {
    setSelectedHotel(hotel);
    setDialogOpen(true);
  };

  const hayFiltrosAplicados = Object.values(activeFilters).some(
    (v) => v !== null
  );

  const exportToCSV = (data, filename = "hoteles.csv") => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((field) => {
            const val = row[field];
            return `"${(val ?? "").toString().replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    handleFilter(defaultFiltersHoteles);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Proveedores
      </h1>
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Gestión de Proveedores</h2>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Filters
                defaultFilters={defaultFiltersHoteles}
                onFilter={handleFilter}
                defaultOpen={false}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
              {/* {isFilterActive && hayFiltrosAplicados && (
                <Button variant="destructive" onClick={handleClearFilters} size="sm">
                  Limpiar filtros
                </Button>
              )} */}
              <Button
                variant="outline"
                onClick={() => exportToCSV(hotels)}
                disabled={hotels.length === 0}
              >
                Exportar CSV
              </Button>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Agregar hotel
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              <p className="ml-3">Cargando hoteles...</p>
            </div>
          ) : (
            <>
              {!isFilterActive ? (
                <div className="text-center py-16">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Utilice el filtro avanzado
                  </h3>
                  <p className="text-gray-500">
                    Seleccione los filtros deseados para ver los hoteles que
                    coincidan con sus criterios.
                  </p>
                </div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-lg font-medium text-gray-500">
                    No se encontraron hoteles con los filtros seleccionados
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="mt-4"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
                <>
                  <HotelTable
                    data={currentHotels}
                    onRowClick={handleRowClick}
                    onSort={(field) => {
                      if (sortField === field) {
                        setSortDirection((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        );
                      } else {
                        setSortField(field);
                        setSortDirection("asc");
                      }
                      setCurrentPage(1);
                    }}
                    sortField={sortField}
                    sortDirection={sortDirection}
                  />
                  <div className="flex justify-center items-center gap-4 mt-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="font-medium text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>
      <HotelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hotel={selectedHotel}
        onSuccess={() => {
          if (isFilterActive) {
            handleFilter(activeFilters);
          }
        }}
      />
      <AddHotelDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          if (isFilterActive) {
            handleFilter(activeFilters);
          }
        }}
      />
    </div>
  );
}
