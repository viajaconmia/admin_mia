import { ReporteHospedajeAgentes } from "@/angel/components/organisms/ReporteHospedajeAgentes";

export default function ReporteHospedajePage() {
  return (
    <div className="w-full p-4">
      <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-4">
        Reporte de hospedaje
      </h1>
      <ReporteHospedajeAgentes />
    </div>
  );
}
