import { PaymentScheduleRow } from "./types";
import BaseCard from "@/components/atom/BaseCard";
import Button from "@/components/atom/Button";
import { CreditCardInfo } from "@/types";
import { TitularInfo } from "@/hooks/useFetchCard";
import { formatDate, formatNumberWithCommas } from "@/helpers/formater";
import {
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  FileArchive,
  Pencil,
  QrCode,
  Tag,
  Trash2,
} from "lucide-react";

type Props = {
  row: PaymentScheduleRow;
  card?: CreditCardInfo;
  titular?: TitularInfo;
  paymentMethod?: "transfer" | "card" | "link";
  onEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function PaymentRowCard({
  row,
  card,
  titular,
  paymentMethod,
  onEdit,
  onRemove,
  canRemove,
}: Props) {
  const showCardExtras = paymentMethod !== "link";
  return (
    <BaseCard
      subtitle={
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(row.date)}</span>
        </div>
      }
      badge={
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          ${formatNumberWithCommas(row.amount)}
        </span>
      }
      footer={
        <>
          <hr className="my-2 border-slate-200"></hr>
          <div className="w-full flex justify-between items-center">
            <p className="text-sm text-slate-500 flex gap-2 items-center">
              <CreditCard className="w-4 h-4" />
              •••• {card?.ultimos_4 ?? "----"}
            </p>

            <div className=" flex gap-2 justify-end p-2">
              <Button
                size="sm"
                onClick={onEdit}
                icon={Pencil}
                aria-label="Editar pago"
              ></Button>

              <Button
                variant="warning"
                size="sm"
                onClick={onRemove}
                icon={Trash2}
                disabled={!canRemove}
                aria-label="Eliminar pago"
              ></Button>
            </div>
          </div>
        </>
      }
    >
      <div className="space-y-1">
        <h2 className="font-semibold text-slate-900">
          {titular?.Titular ?? card?.nombre_titular ?? "Sin titular"}
        </h2>
        {showCardExtras && row.cargo && (
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Tag className="w-3 h-3" />
            {row.cargo}
          </p>
        )}
        {showCardExtras && (
          <p className="flex items-center gap-1 text-xs text-slate-500">
            {row.useQR === "qr" ? (
              <QrCode className="w-3 h-3" />
            ) : (
              <FileArchive className="w-3 h-3" />
            )}
            {row.useQR === "qr"
              ? "Con QR"
              : row.useQR === "code"
                ? "En archivo"
                : "Sin definir (QR/archivo)"}
          </p>
        )}
        {showCardExtras && (
          <p className="flex items-center gap-1 text-xs text-slate-500">
            {row.isSecureCode ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
            {row.isSecureCode ? "Muestra CVV" : "No muestra CVV"}
          </p>
        )}
      </div>
    </BaseCard>
  );
}
