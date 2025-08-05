import { Item, Saldo, TypesSaldoWallet } from "@/types/database_tables";
import { ApiResponse, ApiService } from "./ApiService";

export class SaldosService extends ApiService {
  private ENDPOINTS = { GET: { groupByType: "/types", byType: "/type" } };
  static instancia: SaldosService = null;

  constructor() {
    super("/mia/saldo");
  }

  public static getInstance() {
    if (!this.instancia) {
      this.instancia = new SaldosService();
    }
    return this.instancia;
  }

  public obtenerSaldoPorTipo(
    id_agente: string
  ): Promise<ApiResponse<{ metodo_pago: string; saldo: string }[]>> {
    return this.get<{ metodo_pago: string; saldo: string }[]>({
      path: this.formatPath(this.ENDPOINTS.GET.groupByType),
      params: { id_agente },
    });
  }
  public obtenerSaldosDelTipo(
    type: TypesSaldoWallet,
    id_agente: string,
    id_hospedaje: string
  ): Promise<ApiResponse<{ saldos: Saldo[]; item: Item }>> {
    return this.get<{ saldos: Saldo[]; item: Item }>({
      path: this.formatPath(this.ENDPOINTS.GET.byType),
      params: { type, id_agente, id_hospedaje },
    });
  }
}
