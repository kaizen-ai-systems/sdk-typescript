import { HttpClient } from "../core/http";
import {
  EnzanAlert,
  EnzanBurnResponse,
  EnzanResource,
  EnzanSummaryRequest,
  EnzanSummaryResponse,
  EnzanSummaryRow,
} from "../types/enzan";

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function mapSummaryRow(row: Record<string, unknown>): EnzanSummaryRow {
  return {
    project: typeof row.project === "string" ? row.project : undefined,
    model: typeof row.model === "string" ? row.model : undefined,
    team: typeof row.team === "string" ? row.team : undefined,
    provider: typeof row.provider === "string" ? row.provider : undefined,
    endpoint: typeof row.endpoint === "string" ? row.endpoint : undefined,
    costUsd: asNumber(row.costUsd ?? row.cost_usd),
    gpuHours: asNumber(row.gpuHours ?? row.gpu_hours),
    requests: asNumber(row.requests),
    tokensIn: asNumber(row.tokensIn ?? row.tokens_in),
    tokensOut: asNumber(row.tokensOut ?? row.tokens_out),
    avgUtilPct:
      typeof (row.avgUtilPct ?? row.avg_util_pct) === "number"
        ? asNumber(row.avgUtilPct ?? row.avg_util_pct)
        : undefined,
  };
}

export class EnzanClient {
  constructor(private http: HttpClient) {}

  /** Get GPU cost summary */
  async summary(req: EnzanSummaryRequest): Promise<EnzanSummaryResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/summary", req);
    const rawTotal = (raw.total ?? {}) as Record<string, unknown>;
    const rawRows = Array.isArray(raw.rows) ? (raw.rows as Record<string, unknown>[]) : [];
    const rawAPICosts = raw.apiCosts as Record<string, unknown> | undefined;

    return {
      window: typeof raw.window === "string" ? raw.window : req.window,
      startTime: typeof raw.startTime === "string" ? raw.startTime : "",
      endTime: typeof raw.endTime === "string" ? raw.endTime : "",
      rows: rawRows.map(mapSummaryRow),
      total: {
        costUsd: asNumber(rawTotal.costUsd ?? rawTotal.cost_usd),
        gpuHours: asNumber(rawTotal.gpuHours ?? rawTotal.gpu_hours),
        requests: asNumber(rawTotal.requests),
        tokensIn: asNumber(rawTotal.tokensIn ?? rawTotal.tokens_in),
        tokensOut: asNumber(rawTotal.tokensOut ?? rawTotal.tokens_out),
      },
      apiCosts: rawAPICosts
        ? {
            totalCostUsd: asNumber(rawAPICosts.totalCostUsd),
            promptTokens: asNumber(rawAPICosts.promptTokens),
            outputTokens: asNumber(rawAPICosts.outputTokens),
            queries: asNumber(rawAPICosts.queries),
          }
        : undefined,
    };
  }

  /** Get current burn rate */
  async burn(): Promise<EnzanBurnResponse> {
    const response = await this.http.get<{ burn_rate_usd_per_hour: number; timestamp: string }>("/v1/enzan/burn");
    return {
      burnRateUsdPerHour: response.burn_rate_usd_per_hour,
      timestamp: response.timestamp,
    };
  }

  /** List GPU resources */
  async listResources(): Promise<EnzanResource[]> {
    return (await this.http.get<{ resources: EnzanResource[] }>("/v1/enzan/resources")).resources;
  }

  /** Register a GPU resource */
  async registerResource(resource: EnzanResource): Promise<{ status: string; id: string }> {
    return this.http.post<{ status: string; id: string }>("/v1/enzan/resources", resource);
  }

  /** List alerts */
  async listAlerts(): Promise<EnzanAlert[]> {
    return (await this.http.get<{ alerts: EnzanAlert[] }>("/v1/enzan/alerts")).alerts;
  }

  /** Create an alert */
  async createAlert(alert: EnzanAlert): Promise<{ status: string; id: string }> {
    return this.http.post<{ status: string; id: string }>("/v1/enzan/alerts", alert);
  }
}
