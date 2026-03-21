import { HttpClient } from "../core/http";
import {
  EnzanAlert,
  EnzanBurnResponse,
  EnzanGPUPricing,
  EnzanGPUPricingMutationResponse,
  EnzanGPUPricingUpsertRequest,
  EnzanLLMPricing,
  EnzanLLMPricingMutationResponse,
  EnzanLLMPricingUpsertRequest,
  EnzanModelCategoryBreakdown,
  EnzanModelCostRequest,
  EnzanModelCostResponse,
  EnzanOptimizeRequest,
  EnzanOptimizeResponse,
  EnzanRecommendationType,
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

function mapModelCostCategory(row: Record<string, unknown>): EnzanModelCategoryBreakdown {
  const category =
    row.category === "simple" || row.category === "moderate" || row.category === "complex"
      ? row.category
      : "moderate";
  return {
    category,
    queries: asNumber(row.queries),
    promptTokens: asNumber(row.promptTokens ?? row.prompt_tokens),
    outputTokens: asNumber(row.outputTokens ?? row.output_tokens),
    costUsd: asNumber(row.costUsd ?? row.cost_usd),
    percentage: asNumber(row.percentage),
    avgCostPerQuery: asNumber(row.avgCostPerQuery ?? row.avg_cost_per_query),
  };
}

function mapLLMPricing(row: Record<string, unknown>): EnzanLLMPricing {
  return {
    provider: typeof row.provider === "string" ? row.provider : "",
    model: typeof row.model === "string" ? row.model : "",
    displayName: typeof (row.displayName ?? row.display_name) === "string" ? String(row.displayName ?? row.display_name) : "",
    inputCostPer1KTokensUsd: asNumber(row.inputCostPer1KTokensUsd ?? row.input_cost_per_1k_tokens_usd),
    outputCostPer1KTokensUsd: asNumber(row.outputCostPer1KTokensUsd ?? row.output_cost_per_1k_tokens_usd),
    currency: typeof row.currency === "string" ? row.currency : "USD",
    active: typeof row.active === "boolean" ? row.active : true,
  };
}

function mapGPUPricing(row: Record<string, unknown>): EnzanGPUPricing {
  return {
    provider: typeof row.provider === "string" ? row.provider : "",
    gpuType: typeof (row.gpuType ?? row.gpu_type) === "string" ? String(row.gpuType ?? row.gpu_type) : "",
    displayName: typeof (row.displayName ?? row.display_name) === "string" ? String(row.displayName ?? row.display_name) : "",
    hourlyRateUsd: asNumber(row.hourlyRateUsd ?? row.hourly_rate_usd),
    currency: typeof row.currency === "string" ? row.currency : "USD",
    active: typeof row.active === "boolean" ? row.active : true,
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

  /** Get model-level API cost analytics */
  async costsByModel(req: EnzanModelCostRequest): Promise<EnzanModelCostResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/costs/by-model", req);
    const rawRows = Array.isArray(raw.rows) ? (raw.rows as Record<string, unknown>[]) : [];
    const rawTotal = (raw.total ?? {}) as Record<string, unknown>;

    return {
      window: typeof raw.window === "string" ? raw.window : req.window,
      startTime: typeof raw.startTime === "string" ? raw.startTime : "",
      endTime: typeof raw.endTime === "string" ? raw.endTime : "",
      rows: rawRows.map((row) => ({
        model: typeof row.model === "string" ? row.model : "unknown",
        queries: asNumber(row.queries),
        promptTokens: asNumber(row.promptTokens ?? row.prompt_tokens),
        outputTokens: asNumber(row.outputTokens ?? row.output_tokens),
        costUsd: asNumber(row.costUsd ?? row.cost_usd),
        percentage: asNumber(row.percentage),
        avgCostPerQuery: asNumber(row.avgCostPerQuery ?? row.avg_cost_per_query),
        categories: Array.isArray(row.categories)
          ? (row.categories as Record<string, unknown>[]).map(mapModelCostCategory)
          : undefined,
      })),
      total: {
        queries: asNumber(rawTotal.queries),
        promptTokens: asNumber(rawTotal.promptTokens ?? rawTotal.prompt_tokens),
        outputTokens: asNumber(rawTotal.outputTokens ?? rawTotal.output_tokens),
        costUsd: asNumber(rawTotal.costUsd ?? rawTotal.cost_usd),
      },
    };
  }

  /** List configured LLM pricing */
  async listModelPricing(): Promise<EnzanLLMPricing[]> {
    const raw = await this.http.get<Record<string, unknown>>("/v1/enzan/pricing/models");
    const rawRows = Array.isArray(raw.models) ? (raw.models as Record<string, unknown>[]) : [];
    return rawRows.map(mapLLMPricing);
  }

  /** Upsert one LLM pricing entry */
  async upsertModelPricing(req: EnzanLLMPricingUpsertRequest): Promise<EnzanLLMPricingMutationResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/pricing/models", {
      provider: req.provider,
      model: req.model,
      display_name: req.displayName,
      input_cost_per_1k_tokens_usd: req.inputCostPer1KTokensUsd,
      output_cost_per_1k_tokens_usd: req.outputCostPer1KTokensUsd,
      currency: req.currency,
      active: req.active,
    });
    return {
      status: typeof raw.status === "string" ? raw.status : "upserted",
      pricing: mapLLMPricing((raw.pricing ?? {}) as Record<string, unknown>),
    };
  }

  /** List configured GPU pricing */
  async listGPUPricing(): Promise<EnzanGPUPricing[]> {
    const raw = await this.http.get<Record<string, unknown>>("/v1/enzan/pricing/gpus");
    const rawRows = Array.isArray(raw.gpus) ? (raw.gpus as Record<string, unknown>[]) : [];
    return rawRows.map(mapGPUPricing);
  }

  /** Upsert one GPU pricing entry */
  async upsertGPUPricing(req: EnzanGPUPricingUpsertRequest): Promise<EnzanGPUPricingMutationResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/pricing/gpus", {
      provider: req.provider,
      gpu_type: req.gpuType,
      display_name: req.displayName,
      hourly_rate_usd: req.hourlyRateUsd,
      currency: req.currency,
      active: req.active,
    });
    return {
      status: typeof raw.status === "string" ? raw.status : "upserted",
      pricing: mapGPUPricing((raw.pricing ?? {}) as Record<string, unknown>),
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

  /** Get optimization recommendations */
  async optimize(req: EnzanOptimizeRequest = {}): Promise<EnzanOptimizeResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/optimize", {
      window: req.window ?? "30d",
    });
    const rawRecs = Array.isArray(raw.recommendations)
      ? (raw.recommendations as Record<string, unknown>[])
      : [];
    return {
      window: typeof raw.window === "string" ? raw.window : (req.window ?? "30d"),
      startTime: typeof raw.startTime === "string" ? raw.startTime : "",
      endTime: typeof raw.endTime === "string" ? raw.endTime : "",
      efficiencyScore: asNumber(raw.efficiencyScore),
      monthlySpend: asNumber(raw.monthlySpend),
      potentialSavings: asNumber(raw.potentialSavings),
      recommendations: rawRecs.map((r) => ({
        type: (typeof r.type === "string" ? r.type : "model_downgrade") as EnzanRecommendationType,
        title: typeof r.title === "string" ? r.title : "",
        description: typeof r.description === "string" ? r.description : "",
        estimatedSavings: asNumber(r.estimatedSavings ?? r.estimated_savings),
        confidence: asNumber(r.confidence),
        suggestion: typeof r.suggestion === "string" ? r.suggestion : "",
      })),
    };
  }
}
