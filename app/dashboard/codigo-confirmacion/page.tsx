"use client";

import React, { useEffect, useState } from "react";
import Filters from "@/components/Filters";
import { fetchOtp } from "@/services/solicitudes";
import { Table } from "@/components/Table";
import { TypeFilters, Solicitud } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

interface Otp {
  id: number;
  email: string;
  otp: number;
}

function App() {
  const [allOtp, setAllOtp] = useState<Otp[]>([]);
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>({});
  const { hasAccess } = usePermiso();

  hasAccess(PERMISOS.VISTAS.CONFIRMATION_CODE);

  let formatedSolicitudes = allOtp
    .filter((item) => item.email.toUpperCase().includes(searchTerm))
    .map((item) => ({
      id: item.id,
      email: item.email.toLowerCase(),
      codigo_confirmacion: item.otp,
    }));

  let componentes = {
    id: ({ value }: { value: null | string }) => (
      <span className="font-semibold text-sm">{value}</span>
    ),
  };

  const handleFetchSolicitudes = () => {
    setLoading(true);
    fetchOtp((data) => {
      setAllOtp(data.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchSolicitudes();
  }, []);

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Codigo de confirmación
      </h1>
      <div className="max-w-7xl mx-auto bg-white p-4 rounded-lg shadow">
        <div>
          <Filters
            defaultFilters={filters}
            onFilter={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {/* Reservations Table */}
        <div className="overflow-hidden0">
          {loading ? (
            <Loader></Loader>
          ) : (
            <Table
              registros={formatedSolicitudes}
              renderers={componentes}
              defaultSort={defaultSort}
            ></Table>
          )}
        </div>
      </div>
    </div>
  );
}

const defaultSort = {
  key: "id",
  sort: true,
};

export default App;
