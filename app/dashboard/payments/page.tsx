'use client';
import React, { useEffect, useState } from 'react';
import { URL, API_KEY } from "@/lib/constants/index";
import { Table4 } from "@/components/organism/Table4";
// Versión de Feather Icons (similares a Lucide)
import { Eye, FileText, FilePlus } from 'lucide-react';
import { format } from "date-fns";
import { Banknote, FileCheck } from "lucide-react";
import { es, se } from "date-fns/locale";
import ModalDetallePago from './_components/detalles_pago';

interface Pago {
  id_pago: string;
  pago_referencia: string;
  pago_concepto: string;
  pago_fecha_pago: string;
  metodo_de_pago: string;
  tipo_tarjeta?: string;
  tipo_de_tarjeta?: string;
  banco?: string;
  banco_tarjeta?: string;
  total: number;
  subtotal: number | null;
  impuestos: number | null;
  pendiente_por_cobrar: number;
  last_digits?: string;
  ult_digits?: number;
  autorizacion_stripe?: string;
  numero_autorizacion?: string;
  is_facturable: number;
  [key: string]: any;
}

const TablaPagosVisualizacion = () => {
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  // Datos de ejemplo estáticos
  const pagos: Pago[] = [
    {
      id_pago: "pag-0213bc77-1328-45d0-b06a-de4d06fdf3dc",
      id_servicio: "ser-9b6f0abe-3bf8-4a53-93a4-57011d37798a",
      monto_a_credito: 0.00,
      id_empresa: "",
      responsable_pago_agente: "",
      pago_fecha_creacion: "0000-00-00",
      pago_por_credito: 0.00,
      pendiente_por_cobrar: 0,
      total: 1513.80,
      subtotal: null,
      impuestos: null,
      created_at: "2025-07-31 11:30:28",
      updated_at: "2025-07-31 11:30:28",
      padre: "",
      pago_concepto: "prueba tarjeta",
      pago_referencia: "",
      pago_fecha_pago: "2025-07-21",
      spei: "",
      pago_monto: 4009,
      banco: "",
      autorizacion_stripe: "ch_3RnRZrA3jkUyZycM1LFNNzZ3",
      last_digits: "97",
      fecha_transaccion: "2025-07-29 11:10:30",
      pago_currency: "MXN",
      metodo_de_pago: "tarjeta",
      tipo_de_tarjeta: "",
      tipo_de_pago: "",
      link_pago: "",
      id_saldo_a_favor: 0,
      agente_pago: "78360a2a-4935-47bd-b2ca-3d1e4d808ccf",
      id_saldos: 97,
      agente_saldo: "78360a2a-4935-47bd-b2ca-3d1e4d808ccf",
      saldo_fecha_creacion: "2025-07-29 11:10:30",
      saldo: 0.00,
      saldo_monto: 1513.80,
      metodo_pago: "tarjeta",
      saldo_fecha_pago: "2025-07-21 00:00:00",
      saldo_concepto: "prueba tarjeta",
      saldo_referencia: "",
      saldo_currency: "MXN",
      tipo_tarjeta: "amex",
      comentario: "",
      link_stripe: "prueba tarjeta",
      is_facturable: 1,
      is_descuento: 0,
      comprobante: "",
      activo: 0,
      ult_digits: 4009,
      numero_autorizacion: "",
      banco_tarjeta: "amex"
    },
    {
      id_pago: "pag-0001",
      id_servicio: "ser-0001",
      monto_a_credito: 0.00,
      id_empresa: "emp-001",
      responsable_pago_agente: "Juan Pérez",
      pago_fecha_creacion: "2025-08-01",
      pago_por_credito: 0.00,
      pendiente_por_cobrar: 0,
      total: 999.99,
      subtotal: 862.06,
      impuestos: 137.93,
      created_at: "2025-08-01 10:00:00",
      updated_at: "2025-08-01 10:00:00",
      padre: "",
      pago_concepto: "Pago mensual",
      pago_referencia: "REF-0001",
      pago_fecha_pago: "2025-07-31",
      spei: "",
      pago_monto: 999.99,
      banco: "BBVA",
      autorizacion_stripe: "ch_0001",
      last_digits: "1234",
      fecha_transaccion: "2025-07-31 09:45:00",
      pago_currency: "MXN",
      metodo_de_pago: "tarjeta",
      tipo_de_tarjeta: "visa",
      tipo_de_pago: "único",
      link_pago: "",
      id_saldo_a_favor: 0,
      agente_pago: "agente-001",
      id_saldos: 101,
      agente_saldo: "agente-001",
      saldo_fecha_creacion: "2025-07-31 09:45:00",
      saldo: 0.00,
      saldo_monto: 999.99,
      metodo_pago: "tarjeta",
      saldo_fecha_pago: "2025-07-31 09:45:00",
      saldo_concepto: "Pago mensual",
      saldo_referencia: "REF-0001",
      saldo_currency: "MXN",
      tipo_tarjeta: "visa",
      comentario: "Pagado en tiempo",
      link_stripe: "",
      is_facturable: 1,
      is_descuento: 0,
      comprobante: "",
      activo: 1,
      ult_digits: 1234,
      numero_autorizacion: "AUTH-0001",
      banco_tarjeta: "BBVA"
    },
    {
      id_pago: "pag-0002",
      id_servicio: "ser-0002",
      monto_a_credito: 150.00,
      id_empresa: "emp-002",
      responsable_pago_agente: "Ana Ruiz",
      pago_fecha_creacion: "2025-08-01",
      pago_por_credito: 150.00,
      pendiente_por_cobrar: 0,
      total: 1150.00,
      subtotal: 1000.00,
      impuestos: 150.00,
      created_at: "2025-08-01 10:30:00",
      updated_at: "2025-08-01 10:30:00",
      padre: "",
      pago_concepto: "Plan anual",
      pago_referencia: "REF-0002",
      pago_fecha_pago: "2025-07-30",
      spei: "SP123456",
      pago_monto: 1150.00,
      banco: "Santander",
      autorizacion_stripe: "ch_0002",
      last_digits: "5678",
      fecha_transaccion: "2025-07-30 11:00:00",
      pago_currency: "MXN",
      metodo_de_pago: "spei",
      tipo_de_tarjeta: "",
      tipo_de_pago: "anual",
      link_pago: "",
      id_saldo_a_favor: 0,
      agente_pago: "agente-002",
      id_saldos: 102,
      agente_saldo: "agente-002",
      saldo_fecha_creacion: "2025-07-30 11:00:00",
      saldo: 0.00,
      saldo_monto: 1150.00,
      metodo_pago: "spei",
      saldo_fecha_pago: "2025-07-30 11:00:00",
      saldo_concepto: "Plan anual",
      saldo_referencia: "REF-0002",
      saldo_currency: "MXN",
      tipo_tarjeta: "",
      comentario: "",
      link_stripe: "",
      is_facturable: 1,
      is_descuento: 0,
      comprobante: "",
      activo: 1,
      ult_digits: null,
      numero_autorizacion: "",
      banco_tarjeta: "Santander"
    },
    {
      id_pago: "pag-0003",
      id_servicio: "ser-0003",
      monto_a_credito: 0.00,
      id_empresa: "emp-003",
      responsable_pago_agente: "Luis Martínez",
      pago_fecha_creacion: "2025-08-01",
      pago_por_credito: 0.00,
      pendiente_por_cobrar: 1,
      total: 2000.00,
      subtotal: 1724.14,
      impuestos: 275.86,
      created_at: "2025-08-01 11:00:00",
      updated_at: "2025-08-01 11:00:00",
      padre: "",
      pago_concepto: "Pago pendiente",
      pago_referencia: "REF-0003",
      pago_fecha_pago: null,
      spei: "",
      pago_monto: 0.00,
      banco: "",
      autorizacion_stripe: "",
      last_digits: "",
      fecha_transaccion: null,
      pago_currency: "MXN",
      metodo_de_pago: "",
      tipo_de_tarjeta: "",
      tipo_de_pago: "pendiente",
      link_pago: "",
      id_saldo_a_favor: 0,
      agente_pago: "agente-003",
      id_saldos: 103,
      agente_saldo: "agente-003",
      saldo_fecha_creacion: null,
      saldo: 0.00,
      saldo_monto: 2000.00,
      metodo_pago: "",
      saldo_fecha_pago: null,
      saldo_concepto: "Pago pendiente",
      saldo_referencia: "REF-0003",
      saldo_currency: "MXN",
      tipo_tarjeta: "",
      comentario: "Aún no pagado",
      link_stripe: "",
      is_facturable: 0,
      is_descuento: 0,
      comprobante: "",
      activo: 1,
      ult_digits: null,
      numero_autorizacion: "",
      banco_tarjeta: ""
    },
    {
      id_pago: "pag-0004",
      id_servicio: "ser-0004",
      monto_a_credito: 300.00,
      id_empresa: "emp-004",
      responsable_pago_agente: "María López",
      pago_fecha_creacion: "2025-08-01",
      pago_por_credito: 300.00,
      pendiente_por_cobrar: 0,
      total: 1300.00,
      subtotal: 1120.69,
      impuestos: 179.31,
      created_at: "2025-08-01 11:30:00",
      updated_at: "2025-08-01 11:30:00",
      padre: "",
      pago_concepto: "Servicio premium",
      pago_referencia: "REF-0004",
      pago_fecha_pago: "2025-07-30",
      spei: "",
      pago_monto: 1300.00,
      banco: "HSBC",
      autorizacion_stripe: "ch_0004",
      last_digits: "9988",
      fecha_transaccion: "2025-07-30 12:00:00",
      pago_currency: "MXN",
      metodo_de_pago: "tarjeta",
      tipo_de_tarjeta: "mastercard",
      tipo_de_pago: "único",
      link_pago: "",
      id_saldo_a_favor: 0,
      agente_pago: "agente-004",
      id_saldos: 104,
      agente_saldo: "agente-004",
      saldo_fecha_creacion: "2025-07-30 12:00:00",
      saldo: 0.00,
      saldo_monto: 1300.00,
      metodo_pago: "tarjeta",
      saldo_fecha_pago: "2025-07-30 12:00:00",
      saldo_concepto: "Servicio premium",
      saldo_referencia: "REF-0004",
      saldo_currency: "MXN",
      tipo_tarjeta: "mastercard",
      comentario: "",
      link_stripe: "",
      is_facturable: 1,
      is_descuento: 0,
      comprobante: "",
      activo: 1,
      ult_digits: 9988,
      numero_autorizacion: "AUTH-0004",
      banco_tarjeta: "HSBC"
    }
  ];

  const formatDate = (dateString: string | null): string => {
    if (!dateString || dateString === "0000-00-00") return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  const montoPagado = pagos.reduce((acc, pago) => acc + (pago.total || 0), 0);
  const montoFacturado = 2000;

  console.log("Monto pagado:", montoPagado);
  console.log("Monto facturada:", montoFacturado);


  const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const formatIdItem = (id: string): string => {
    if (!id) return '';
    return id.length > 4 ? `...${id.slice(-4)}` : id;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const tableData = pagos.map(pago => ({
    // Campos principales
    id_pago: pago.id_pago,
    id_servicio: pago.id_servicio || pago.id_pago,
    monto_a_credito: pago.monto_a_credito || 0,
    id_empresa: pago.id_empresa,
    responsable_pago_agente: pago.responsable_pago_agente,
    pago_fecha_creacion: pago.pago_fecha_creacion,
    pago_por_credito: pago.pago_por_credito || 0,
    pendiente_por_cobrar: pago.pendiente_por_cobrar,
    total: pago.total,
    subtotal: pago.subtotal,
    impuestos: pago.impuestos,
    created_at: pago.created_at,
    updated_at: pago.updated_at,
    padre: pago.padre,
    pago_concepto: pago.pago_concepto,
    pago_referencia: pago.pago_referencia || 'N/A',
    pago_fecha_pago: pago.pago_fecha_pago,
    spei: pago.spei,
    pago_monto: pago.pago_monto,
    banco: pago.banco || pago.banco_tarjeta || 'N/A',
    last_digits: pago.last_digits || pago.ult_digits || 'N/A',
    fecha_transaccion: pago.fecha_transaccion,
    pago_currency: pago.pago_currency,
    tipo_de_tarjeta: pago.tipo_de_tarjeta || pago.tipo_tarjeta || 'N/A',
    tipo_de_pago: pago.tipo_de_pago,
    id_saldo_a_favor: pago.id_saldo_a_favor,
    agente_pago: pago.agente_pago,
    id_saldos: pago.id_saldos,
    agente_saldo: pago.agente_saldo,
    saldo_fecha_creacion: pago.saldo_fecha_creacion,
    saldo: pago.saldo,
    saldo_monto: pago.saldo_monto,
    metodo_pago: pago.metodo_pago || pago.metodo_de_pago,
    saldo_fecha_pago: pago.saldo_fecha_pago,
    saldo_concepto: pago.saldo_concepto,
    saldo_referencia: pago.saldo_referencia,
    saldo_currency: pago.saldo_currency,
    comentario: pago.comentario,
    link_stripe: pago.autorizacion_stripe,
    is_facturable: pago.is_facturable,
    is_descuento: pago.is_descuento,
    comprobante: pago.comprobante,
    activo: pago.activo,
    ult_digits: pago.ult_digits || pago.last_digits || 'N/A',
    numero_autorizacion: pago.numero_autorizacion || pago.autorizacion_stripe || 'N/A',
    banco_tarjeta: pago.banco_tarjeta || pago.banco || 'N/A',
    acciones: { row: pago },
    item: pago
  }));

  const renderers = {
    // IDs y referencias
    id_pago: ({ value }: { value: string; item: any }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {formatIdItem(value) || ''}
      </span>
    ),
    id_servicio: ({ value }: { value: string; item: any }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {formatIdItem(value) || ''}
      </span>
    ),
    id_empresa: ({ value }: { value: string; item: any }) => (
      <span className="font-mono text-gray-700">
        {formatIdItem(value) || ''}
      </span>
    ),
    pago_referencia: ({ value }: { value: string; item: any }) => (
      <span className="font-medium">
        {value || ''}
      </span>
    ),

    // Montos y valores numéricos
    monto_a_credito: ({ value }: { value: number; item: any }) => (
      <span className="font-medium text-green-600">
        {formatCurrency(value)}
      </span>
    ),
    pago_por_credito: ({ value }: { value: number; item: any }) => (
      <span className="font-medium text-green-600">
        {formatCurrency(value)}
      </span>
    ),
    total: ({ value }: { value: number; item: any }) => (
      <span className="font-bold text-blue-600">
        {formatCurrency(value)}
      </span>
    ),
    subtotal: ({ value }: { value: number | null; item: any }) => (
      <span className="text-gray-700">
        {value ? formatCurrency(value) : ''}
      </span>
    ),
    impuestos: ({ value }: { value: number | null; item: any }) => (
      <span className="text-gray-700">
        {value ? formatCurrency(value) : ''}
      </span>
    ),
    pago_monto: ({ value }: { value: number; item: any }) => (
      <span className="font-medium text-purple-600">
        {formatCurrency(value)}
      </span>
    ),
    saldo: ({ value }: { value: number; item: any }) => (
      <span className={`font-medium ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {formatCurrency(value)}
      </span>
    ),
    saldo_monto: ({ value }: { value: number; item: any }) => (
      <span className="font-medium">
        {formatCurrency(value)}
      </span>
    ),

    // Fechas
    pago_fecha_creacion: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;

      const date = new Date(value);
      if (!isValidDate(date)) {
        console.error('', value);
        return <div className="text-gray-400 italic"></div>;
      }

      return (
        <div className="whitespace-nowrap text-sm text-gray-600">
          {format(date, "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    pago_fecha_pago: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-sm text-gray-600">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    created_at: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-xs text-gray-500">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    updated_at: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-xs text-gray-500">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    fecha_transaccion: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-sm text-gray-600">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    saldo_fecha_creacion: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-sm text-gray-600">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },
    saldo_fecha_pago: ({ value }: { value: Date | string | null }) => {
      if (!value) return <div className="text-gray-400 italic"></div>;
      return (
        <div className="whitespace-nowrap text-sm text-gray-600">
          {format(new Date(value), "dd 'de' MMMM yyyy", { locale: es })}
        </div>
      );
    },

    // Textos y conceptos
    pago_concepto: ({ value }: { value: string; item: any }) => (
      <span className="font-medium text-gray-800">
        {value || ''}
      </span>
    ),
    saldo_concepto: ({ value }: { value: string; item: any }) => (
      <span className="font-medium text-gray-800">
        {value || ''}
      </span>
    ),
    comentario: ({ value }: { value: string; item: any }) => (
      <span className="text-gray-600 italic">
        {value || ''}
      </span>
    ),
    responsable_pago_agente: ({ value }: { value: string; item: any }) => (
      <span className="font-medium">
        {value || ''}
      </span>
    ),

    // Métodos de pago
    metodo_pago: ({ value }: { value: string; item: any }) => (
      <span className="capitalize bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
        {value || ''}
      </span>
    ),
    tipo_de_tarjeta: ({ value }: { value: string; item: any }) => (
      <span className="capitalize">
        {value || ''}
      </span>
    ),
    tipo_de_pago: ({ value }: { value: string; item: any }) => (
      <span className="capitalize">
        {value || ''}
      </span>
    ),

    // Información bancaria
    banco: ({ value }: { value: string; item: any }) => (
      <span className="font-medium">
        {value || ''}
      </span>
    ),
    banco_tarjeta: ({ value }: { value: string; item: any }) => (
      <span className="font-medium">
        {value || ''}
      </span>
    ),
    last_digits: ({ value }: { value: string | number; item: any }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {value || ''}
      </span>
    ),
    ult_digits: ({ value }: { value: string | number; item: any }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {value || ''}
      </span>
    ),
    numero_autorizacion: ({ value }: { value: string; item: any }) => (
      <span className="font-mono text-sm">
        {value || ''}
      </span>
    ),
    // Estados y booleanos
    pendiente_por_cobrar: ({ value }: { value: number; item: any }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${value === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
        {value === 0 ? 'Pagado' : 'Pendiente'}
      </span>
    ),
    is_facturable: ({ value }: { value: number; item: any }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${value === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
        {value === 1 ? 'Sí' : 'No'}
      </span>
    ),
    is_descuento: ({ value }: { value: number; item: any }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${value === 1 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
        {value === 1 ? 'Sí' : 'No'}
      </span>
    ),
    activo: ({ value }: { value: number; item: any }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${value === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {value === 1 ? 'Activo' : 'Inactivo'}
      </span>
    ),

    // Enlaces y documentos
    link_pago: ({ value }: { value: string; item: any }) => (
      value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        </a>
      ) : (
        <span className="text-gray-400"></span>
      )
    ),
    link_stripe: ({ value }: { value: string; item: any }) => (
      value ? (
        <span className="font-mono text-xs">
          {value ? `${value.substring(0, 8)}...` : 'N/A'}
        </span>
      ) : (
        <span className="text-gray-400"></span>
      )
    ),
    comprobante: ({ value }: { value: string; item: any }) => (
      value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
          Descargar
        </a>
      ) : (
        <span className="text-gray-400"></span>
      )
    ),

    // Acciones
    acciones: ({ value, item }: { value: { row: any }; item: any }) => (
      <div className="flex gap-2">
        <button
          className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 flex items-center gap-1"
          onClick={() => { setPagoSeleccionado(item), console.log("facturas", item) }}
        >
          <Eye className="w-4 h-4" />
          <span>Detalles</span>
        </button>
        <button
          className="px-3 py-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200 flex items-center gap-1"
          onClick={() => console.log("facturas", item)}
        >
          <FileText className="w-4 h-4" />
          <span>Facturas</span>
        </button>
        <button
          className="px-3 py-1.5 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-200 flex items-center gap-1"
          onClick={() => console.log("facturar", item)}
        >
          <FilePlus className="w-4 h-4" />
          <span>Facturar</span>
        </button>
      </div>
    )
  };

  return (

    <div className="bg-white rounded-lg p-6 w-full shadow-xl">
      <h2 className="text-xl font-bold mb-4">Registro de Pagos</h2>

      {/* Sección de resumen de montos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Monto Pagado */}
        <div className="flex items-center gap-4 bg-white border border-blue-200 rounded-xl p-4 shadow-sm ring-1 ring-blue-100 hover:shadow-md transition">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-700">Monto Pagado</h3>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(montoPagado)}</p>
          </div>
        </div>

        {/* Monto Facturado */}
        <div className="flex items-center gap-4 bg-white border border-green-200 rounded-xl p-4 shadow-sm ring-1 ring-green-100 hover:shadow-md transition">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-700">Monto Facturado</h3>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(montoFacturado)}</p>
            <p className="text-sm mt-1">
              <span className="text-gray-600">Restante: </span>
              <span className={`font-semibold ${montoPagado - montoFacturado >= 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(montoPagado - montoFacturado)}
              </span>
            </p>
          </div>
        </div>
      </div>


      {/* Tabla de registros */}
      <Table4
        registros={tableData}
        renderers={renderers}
      />
      {/* Modal de detalles */}
      <ModalDetallePago
        pago={pagoSeleccionado}
        onClose={() => setPagoSeleccionado(null)}
      />
    </div>
  );
};

export default TablaPagosVisualizacion;