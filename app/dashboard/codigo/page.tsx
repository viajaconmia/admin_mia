"use client";

import React, { useEffect, useState } from "react";
import Filters from "@/components/Filters";
import { fetchOtp } from "@/services/solicitudes";
import { Table } from "@/components/Table";
import { TypeFilters, Solicitud } from "@/types";
import { Loader } from "@/components/atom/Loader";

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

  let formatedSolicitudes = allOtp
    .filter((item) =>
      item.email.toUpperCase().includes(searchTerm.toUpperCase())
    )
    .map((item) => ({
      id: item.id,
      email: item.email,
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
  sort: false,
};

export default App;
