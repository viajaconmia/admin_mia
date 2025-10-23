'use client';
import React from 'react';
import { X } from 'lucide-react';
import { URL, HEADERS_API } from "@/lib/constants";
import { Table4 } from "@/components/organism/Table4";

type Registro = { [key: string]: any };

interface ModalFacturasAsociadasProps {
  id_agente?: string;
  raw_id?: string;
  onClose: () => void;
}

const moneda = (v: any) => {
  const n = Number(v);
  if (Number.isFinite(n)) return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  return v ?? '';
};

const fecha = (v: any) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v || '';
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const ModalFacturasAsociadas: React.FC<ModalFacturasAsociadasProps> = ({
  id_agente,
  raw_id,
  onClose,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [facturas, setFacturas] = React.useState<Registro[]>([]);

  // Renderers para Table4 (fechas/moneda/links)
  const renderers = {
    fecha_emision: ({ value }: { value: any }) => <span>{fecha(value)}</span>,
    created_at: ({ value }: { value: any }) => <span>{fecha(value)}</span>,
    updated_at: ({ value }: { value: any }) => <span>{fecha(value)}</span>,
    total: ({ value }: { value: any }) => <span className="font-semibold text-blue-700">{moneda(value)}</span>,
    subtotal: ({ value }: { value: any }) => <span>{moneda(value)}</span>,
    impuestos: ({ value }: { value: any }) => <span>{moneda(value)}</span>,
    saldo: ({ value }: { value: any }) => <span className={Number(value) === 0 ? 'text-green-700 font-medium' : ''}>{moneda(value)}</span>,
    url_pdf: ({ value }: { value: string }) =>
      value ? <a className="text-blue-600 underline text-xs" href={value} target="_blank" rel="noreferrer">PDF</a> : <span className="text-gray-400 text-xs">—</span>,
    url_xml: ({ value }: { value: string }) =>
      value ? <a className="text-blue-600 underline text-xs" href={value} target="_blank" rel="noreferrer">XML</a> : <span className="text-gray-400 text-xs">—</span>,
  } as const;

  React.useEffect(() => {
    const fetchDetalles = async () => {
      if (!id_agente || !raw_id) {
        setError("Faltan parámetros para consultar (id_agente/raw_id).");
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const url = `${URL}/mia/pagos/getDetallesConexion?id_agente=${encodeURIComponent(id_agente)}&id_raw=${encodeURIComponent(raw_id)}`;
        const resp = await fetch(url, { method: 'GET', headers: HEADERS_API });
        if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);

        const json = await resp.json();
        // Estructura esperada: { message, data: { facturas: [...], reservas: [...] } }
        const data = json?.data || {};
        const _facturas: any[] = Array.isArray(data.facturas) ? data.facturas : [];

        // Normaliza facturas para Table4
        const facturasRows: Registro[] = _facturas.map(f => ({
          id_factura: f.id_factura,
          fecha_emision: f.fecha_emision,
          estado: f.estado,
          rfc: f.rfc,
          rfc_emisor: f.rfc_emisor,
          total: f.total,
          subtotal: f.subtotal,
          impuestos: f.impuestos,
          saldo: f.saldo,
          uuid_factura: f.uuid_factura,
          url_pdf: f.url_pdf,
          url_xml: f.url_xml,
          created_at: f.created_at,
          updated_at: f.updated_at,
          item: f, // conserva el objeto original por si luego quieres expandedRenderer
        }));

        setFacturas(facturasRows);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? 'Error al obtener los detalles.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetalles();
  }, [id_agente, raw_id]);

  // Columnas visibles por defecto (sin acciones)
  const columnasFacturas = [
    "id_factura",
    "fecha_emision",
    "estado",
    "rfc",
    "total",
    "subtotal",
    "impuestos",
    "saldo",
    "uuid_factura",
    "url_pdf",
    "url_xml",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Facturas asociadas
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 min-h-0">
          {loading && (
            <div className="w-full text-center text-gray-600 py-10">Cargando…</div>
          )}

          {!loading && error && (
            <div className="w-full text-center text-red-600 py-6">{error}</div>
          )}

          {!loading && !error && (
            facturas.length === 0 ? (
              <div className="w-full text-center text-gray-600 py-10">
                No hay facturas asociadas.
              </div>
            ) : (
              <div className="h-[65vh]">
                <Table4
                  registros={facturas}
                  renderers={renderers as any}
                  leyenda={`Facturas encontradas: ${facturas.length}`}
                  maxHeight="60vh"
                  customColumns={columnasFacturas}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalFacturasAsociadas;
