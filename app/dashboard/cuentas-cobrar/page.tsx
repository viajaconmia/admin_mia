'use client';
import { API_KEY, URL } from "@/lib/constants";
import { Table4 } from "@/components/organism/Table4";
import React, { useState, useEffect, useMemo } from "react";
import { formatNumberWithCommas } from "@/helpers/utils";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types";
import { PagarModalComponent } from "@/components/template/pagar_saldo"; // Import the modal

//formato de fechas
const formatDate = (dateString: string | Date | null): string => {
  if (!dateString || dateString === "0000-00-00") return 'N/A';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const CuentasPorCobrar = () => {
  const [facturas, setFacturas] = useState<any[]>([]); // Guardar las facturas obtenidas
  const [facturasarray, setFacturasarray] = useState<any[]>([]); // Facturas seleccionadas
  const [facturaData, setFacturaData] = useState<any>(null);
  const [filteredFacturas, setFilteredFacturas] = useState<any[]>([]); // Facturas filtradas
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TypeFilters>({});
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [selectedFacturas, setSelectedFacturas] = useState<Set<string>>(new Set()); // Facturas seleccionadas
  const [monto, setMonto] = useState(0); // Estado del monto

  const handleClosePagarModal = () => {
    setShowPagarModal(false);
  };

  // Función para determinar si una fila puede ser seleccionada
  const canSelectRow = (row: any) => {
    const saldo = parseFloat(row.saldo);
    const total = parseFloat(row.total);
    return (saldo <= total || saldo === null) && row.estado !== 'pagada';
  };

  //función para asignar pagos a las facturas seleccionadas
  const handlePagos = () => {
    const facturasSeleccionadas = facturas.filter(factura => selectedFacturas.has(factura.id_factura));

    if (facturasSeleccionadas.length > 0) {
      // Prepara los datos para el modal
      const datosFacturas = facturasSeleccionadas.map(factura => ({
        monto: factura.total,
        saldo: factura.saldo, // Agregar el saldo actual
        facturaSeleccionada: factura,
        id_agente: factura.id_agente,
        agente: factura.nombre_agente,
      }));

      setFacturaData(datosFacturas); // Enviar todas las facturas al modal
      setShowPagarModal(true); // Mostrar el modal
    }
  };


  // Función para manejar la acción Editar
  const handleEditar = (id: string) => {
    console.log(`Editar factura con ID: ${id}`);
    // Aquí puedes agregar la lógica para editar
  };

  // Función para manejar la acción Eliminar
  const handleEliminar = (id: string) => {
    console.log(`Eliminar factura con ID: ${id}`);
    // Aquí puedes agregar la lógica para eliminar
  };

  const handleSelectFactura = (id: string, idAgente: string) => {
    setSelectedFacturas((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }

      const facturasDelMismoAgente = facturas.filter(f => newSelected.has(f.id_factura));
      if (facturasDelMismoAgente.every(f => f.id_agente === idAgente)) {
        return newSelected;
      } else {
        newSelected.delete(id);
        return new Set(newSelected);
      }
    });
  };

  // Función para aplicar filtros
  const handleFilter = (newFilters: TypeFilters) => {
    setFilters(newFilters);
  };

  // Aplicar filtros y búsqueda
  useEffect(() => {
    let result = [...facturas];

    // Aplicar búsqueda
    if (searchTerm) {
      result = result.filter(factura =>
        factura.id_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.rfc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.nombre_agente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.uuid_factura?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros
    if (filters.estado) {
      result = result.filter(factura =>
        factura.estado?.toLowerCase() === filters.estado?.toLowerCase()
      );
    }

    if (filters.id_factura) {
      result = result.filter(factura =>
        factura.id_factura?.toLowerCase().includes(filters.id_factura?.toLowerCase())
      );
    }

    if (filters.rfc) {
      result = result.filter(factura =>
        factura.rfc?.toLowerCase().includes(filters.rfc?.toLowerCase())
      );
    }

    if (filters.nombre_agente) {
      result = result.filter(factura =>
        factura.nombre_agente?.toLowerCase().includes(filters.nombre_agente?.toLowerCase())
      );
    }

    if (filters.estatusFactura) {
      result = result.filter(factura =>
        factura.estado?.toLowerCase() === filters.estatusFactura?.toLowerCase()
      );
    }

    if (filters.fecha_creacion) {
      result = result.filter(factura => {
        const fechaFactura = new Date(factura.created_at).toISOString().split('T')[0];
        const fechaFiltro = new Date(filters.fecha_creacion!).toISOString().split('T')[0];
        return fechaFactura === fechaFiltro;
      });
    }

    if (filters.fecha_pago) {
      result = result.filter(factura => {
        // Aquí necesitas ajustar según la propiedad correcta de fecha de pago
        const fechaPago = factura.fecha_pago ? new Date(factura.fecha_pago).toISOString().split('T')[0] : null;
        const fechaFiltro = new Date(filters.fecha_pago!).toISOString().split('T')[0];
        return fechaPago === fechaFiltro;
      });
    }

    // Filtro por saldo
    if (filters.startCantidad !== undefined && filters.startCantidad !== null) {
      result = result.filter(factura =>
        parseFloat(factura.saldo) >= filters.startCantidad!
      );
    }

    if (filters.endCantidad !== undefined && filters.endCantidad !== null) {
      result = result.filter(factura =>
        parseFloat(factura.saldo) <= filters.endCantidad!
      );
    }

    setFilteredFacturas(result);
  }, [facturas, searchTerm, filters]);

  const renderers = {
    id_factura: ({ value }: { value: string }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{value}</span>
    ),
    fecha_emision: ({ value }: { value: string | Date | null }) => (
      <div className="whitespace-nowrap text-sm text-gray-600">{formatDate(value)}</div>
    ),
    estado: ({ value }: { value: string }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${value === 'Confirmada' ? 'bg-green-100 text-green-800' :
        value === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
        {value}
      </span>
    ),
    total: ({ value }: { value: string }) => (
      <span className="font-bold text-blue-600">${formatNumberWithCommas(parseFloat(value))}</span>
    ),
    subtotal: ({ value }: { value: string }) => (
      <span className="font-medium text-gray-700">${formatNumberWithCommas(parseFloat(value))}</span>
    ),
    impuestos: ({ value }: { value: string }) => (
      <span className="font-medium text-red-600">${formatNumberWithCommas(parseFloat(value))}</span>
    ),
    saldo: ({ value }: { value: string }) => {
      const saldoNumero = parseFloat(value);
      return (
        <span className={`font-bold ${saldoNumero > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ${formatNumberWithCommas(saldoNumero)}
        </span>
      );
    },
    created_at: ({ value }: { value: string | Date | null }) => (
      <div className="whitespace-nowrap text-sm text-gray-600">{formatDate(value)}</div>
    ),
    updated_at: ({ value }: { value: string | Date | null }) => (
      <div className="whitespace-nowrap text-sm text-gray-600">{formatDate(value)}</div>
    ),
    rfc: ({ value }: { value: string }) => (
      <span className="font-mono text-sm">{value}</span>
    ),
    uuid_factura: ({ value }: { value: string }) => (
      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{value}</span>
    ),
    rfc_emisor: ({ value }: { value: string }) => (
      <span className="font-mono text-sm">{value}</span>
    ),
    url_pdf: ({ value }: { value: string }) => (
      value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
          Ver PDF
        </a>
      ) : (
        <span className="text-gray-400 text-sm">N/A</span>
      )
    ),
    url_xml: ({ value }: { value: string }) => (
      value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
          Ver XML
        </a>
      ) : (
        <span className="text-gray-400 text-sm">N/A</span>
      )
    ),
    nombre_agente: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-800">{value}</span>
    ),
    fecha_vencimiento: ({ value }: { value: string | Date | null }) => {
      const today = new Date();
      const fechaVencimiento = new Date(value);

      // Verificar si la fecha es válida
      if (isNaN(fechaVencimiento.getTime())) return 'N/A';

      // Calcular la diferencia en días
      const diferenciaDias = Math.floor((fechaVencimiento.getTime() - today.getTime()) / (1000 * 3600 * 24));

      // Mostrar la diferencia
      let status = '';
      let color = '';

      if (diferenciaDias > 0) {
        // Si está vigente
        status = `${diferenciaDias} días restantes`;
        color = 'text-green-600';
      } else if (diferenciaDias < 0) {
        // Si está atrasada
        status = `${Math.abs(diferenciaDias)} días atrasado`;
        color = 'text-red-600';
      } else {
        // Si está vencida hoy
        status = 'Vencida hoy';
        color = 'text-red-600';
      }

      return <span className={`font-medium ${color}`}>{status}</span>;
    },
    acciones: ({ value }: { value: { row: any } }) => {
      const row = value.row;
      const disabled = !canSelectRow(row);
      const isChecked = selectedFacturas.has(row.id_factura);

      return (
        <div className="flex gap-2">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleSelectFactura(row.id_factura, row.id_agente)}
            disabled={disabled}
            className="mr-2"
          />
          <button
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            onClick={handlePagos} // Sin argumentos
            disabled={disabled || selectedFacturas.size === 0}
          >
            Asignar Pago
          </button>
          {/* <button
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            onClick={() => handleEditar(row.id_factura)}
            disabled={disabled}
          >
            Editar
          </button>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            onClick={() => handleEliminar(row.id_factura)}
            disabled={disabled}
          >
            Eliminar
          </button> */}
        </div>
      );
    },
  };

  useEffect(() => {
    const fetchFacturas = async () => {
      const endpoint = `${URL}/mia/factura/getfacturasPagoPendiente`;
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "x-api-key": API_KEY || "",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (Array.isArray(data) && (data[0]?.error || data[1]?.error)) {
          throw new Error("Error al cargar los datos");
        }

        setFacturas(data);
        setFilteredFacturas(data); // Inicialmente mostrar todos los datos
      } catch (error) {
        console.log("Error al cargar los datos en facturas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacturas();
  }, []);

  const rows = useMemo(() => {
    return filteredFacturas.map((r) => {
      return {
        id_factura: r.id_factura,
        fecha_emision: r.fecha_emision,
        estado: r.estado,
        usuario_creador: r.usuario_creador,
        total: r.total,
        saldo: r.saldo,
        created_at: r.created_at,
        updated_at: r.updated_at,
        id_agente: r.id_agente,
        nombre_agente: r.nombre_agente,
        fecha_vencimiento: r.fecha_vencimiento,
        acciones: { row: r }
      };
    });
  }, [filteredFacturas]);

  console.log("pagos rows", rows)

  // Columnas basadas en los datos que realmente llegan - MOVIDO AQUÍ
  const availableColumns = useMemo(() => {
    if (filteredFacturas.length === 0) return [];
    // Obtener todas las keys del primer objeto 
    const allKeys = Object.keys(filteredFacturas[0]);
    // Filtrar solo las columnas que queremos mostrar 
    const columnsToShow = allKeys.filter(key => !['items_asociados', 'reservas_asociadas', 'pagos_asociados'].includes(key));
    // Agregar la columna acciones al final 
    return [...columnsToShow, 'acciones'];
  }, [filteredFacturas]);

  // Definir los filtros disponibles para este componente
  const availableFilters: TypeFilters = {
    id_factura: null,
    estado: null,
    rfc: null,
    nombre_agente: null,
    estatusFactura: null,
    fecha_creacion: null,
    fecha_pago: null,
    startCantidad: null,
    endCantidad: null,
  };

  // MOVER EL CONDICIONAL DE LOADING HASTA EL FINAL
  if (loading) {
    return <h1>Cargando...</h1>;
  }

  return (
    <div className="space-y-4">
      <Filters
        onFilter={handleFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        defaultFilters={availableFilters}
      />

      <div className="text-sm text-gray-600">
        Mostrando {filteredFacturas.length} de {facturas.length} facturas
      </div>

      <Table4
        registros={rows}
        renderers={renderers}
        customColumns={availableColumns}
      />

      {showPagarModal && facturaData && (
        <PagarModalComponent
          onClose={handleClosePagarModal}
          facturaData={facturaData} // Enviar los datos de la factura al modal
          open={showPagarModal}
        />
      )}
    </div>
  );
};

export default CuentasPorCobrar;