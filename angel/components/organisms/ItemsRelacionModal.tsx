"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/organism/Modal";
import {
  facturasService,
  ItemPendienteFacturar,
} from "@/angel/services/facturas";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { Check } from "lucide-react";
import { fmtMoney } from "@/angel/lib/format/number";
import { ResumenSaldoFactura } from "../molecules/ResumenSaldoFactura";

type Props = {
  id_relacion: string;
  onConfirm: (items: ItemPendienteFacturar[]) => void;
  onClose: () => void;
  saldo?: number | string;
};

export function ItemsRelacionModal({
  id_relacion,
  onConfirm,
  onClose,
  saldo,
}: Props) {
  const [items, setItems] = useState<ItemPendienteFacturar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [montosAsignados, setMontosAsignados] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    facturasService
      .getItemsPendientesFacturar(id_relacion)
      .then(({ data }) => setItems(data ?? []))
      .catch((err) => setError(err.message || "Error al cargar items"))
      .finally(() => setLoading(false));
  }, [id_relacion]);

  const montoSeleccionado = useMemo(
    () =>
      items
        .filter((i) => seleccionados.has(i.id_item))
        .reduce(
          (sum, i) =>
            sum + Number(montosAsignados[i.id_item] ?? i.monto_por_facturar),
          0,
        ),
    [items, seleccionados, montosAsignados],
  );

  // restante disponible en esta reserva según lo que se ha marcado en el modal
  const restante = saldo != null ? Number(saldo) - montoSeleccionado : null;

  const toggleItem = (id_item: string, monto_default: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id_item) ? next.delete(id_item) : next.add(id_item);
      return next;
    });
    setMontosAsignados((prev) => {
      if (prev[id_item] != null) return prev;
      const capped =
        restante != null
          ? Math.min(Math.max(restante, 0), Number(monto_default)).toFixed(2)
          : monto_default;
      return { ...prev, [id_item]: capped };
    });
  };

  const toggleTodos = () => {
    if (seleccionados.size === items.length) {
      setSeleccionados(new Set());
      return;
    }
    setSeleccionados(new Set(items.map((i) => i.id_item)));
    setMontosAsignados((prev) => {
      const next = { ...prev };
      let restanteVirtual = saldo != null ? Number(saldo) : null;
      items.forEach((i) => {
        if (next[i.id_item] == null) {
          next[i.id_item] =
            restanteVirtual != null
              ? Math.min(
                  Math.max(restanteVirtual, 0),
                  Number(i.monto_por_facturar),
                ).toFixed(2)
              : i.monto_por_facturar;
        }
        if (restanteVirtual != null) {
          restanteVirtual -= Number(next[i.id_item]);
        }
      });
      return next;
    });
  };

  const handleMontoChange = (id_item: string, value: string) =>
    setMontosAsignados((prev) => ({ ...prev, [id_item]: value }));

  const handleConfirm = () => {
    const itemsSeleccionados = items
      .filter((i) => seleccionados.has(i.id_item))
      .map((i) => ({
        ...i,
        monto_asignar: montosAsignados[i.id_item] ?? i.monto_por_facturar,
      }));
    onConfirm(itemsSeleccionados);
    onClose();
  };

  const todosSeleccionados =
    items.length > 0 && seleccionados.size === items.length;

  return createPortal(
    <Modal onClose={onClose} title="Seleccionar items parciales">
      <div className="p-4 w-[90vw] max-w-2xl space-y-4">
        <ResumenSaldoFactura
          saldo={saldo ?? null}
          seleccionado={montoSeleccionado}
          labelSaldo="Disponible para esta reserva"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-gray-400">
            No hay items pendientes de facturar.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader /> Cargando items...
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="overflow-auto border border-gray-200 rounded-lg max-h-80">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                        checked={todosSeleccionados}
                        onChange={toggleTodos}
                      />
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      A asignar
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      ID Item
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Total
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Por facturar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => {
                    const checked = seleccionados.has(item.id_item);
                    return (
                      <tr
                        key={item.id_item}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          toggleItem(item.id_item, item.monto_por_facturar)
                        }
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                            checked={checked}
                            onChange={() =>
                              toggleItem(item.id_item, item.monto_por_facturar)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td
                          className="px-4 py-2 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="number"
                            min={0}
                            max={Number(item.monto_por_facturar)}
                            step={0.01}
                            disabled={!checked}
                            value={
                              montosAsignados[item.id_item] ??
                              item.monto_por_facturar
                            }
                            onChange={(e) =>
                              handleMontoChange(item.id_item, e.target.value)
                            }
                            className={`w-28 text-right border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                              checked
                                ? "border-blue-300 bg-white text-gray-900"
                                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                            }`}
                          />
                        </td>
                        <td className="px-4 py-2 font-mono text-gray-700 whitespace-nowrap">
                          {item.id_item.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 whitespace-nowrap">
                          {fmtMoney(item.total)}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <span
                            className={
                              Number(item.monto_por_facturar) > 0
                                ? "font-semibold text-amber-600"
                                : "text-gray-400"
                            }
                          >
                            {fmtMoney(item.monto_por_facturar)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                {seleccionados.size} de {items.length} seleccionados
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  icon={Check}
                  onClick={handleConfirm}
                  disabled={seleccionados.size === 0}
                >
                  Confirmar selección
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>,
    document.body,
  );
}
